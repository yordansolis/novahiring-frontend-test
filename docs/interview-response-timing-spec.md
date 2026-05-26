# Interview Chatbot — Response Timing Spec

> **Scope:** `POST /api/v1/interviews/sessions/{session_id}/message`  
> This document explains why all responses from the interview endpoint take between **1.5 and 10+ seconds**, how to handle that window correctly, and what UX patterns to apply.

---

## Why responses always take time

There are two types of assistant responses, but **the frontend cannot tell them apart** — both arrive through the same endpoint, same JSON shape, same HTTP status. The backend deliberately delays scripted responses to match the natural latency of LLM responses.

| Response type | Who generates it | Latency before delay | Latency after delay |
|---|---|---|---|
| **LLM response** | Anthropic / OpenAI | 1–8 s (network + model) | unchanged |
| **Scripted response** | Python code, instant | < 50 ms | **1.5–3.5 s** (random) |

### When does each type fire?

**Scripted responses** (always delayed by the backend):
- Candidate says "quiero corregir" / "me equivoqué" → correction acknowledgment
- Candidate says "no tengo experiencia" → acceptance and advance
- Candidate gives a one-word answer ("sí", "no sé") → prompt for more detail
- Candidate asks for clarification → brief clarification answer
- Candidate gives a **second answer** to any dimension → force-complete with "Gracias, lo tomo en cuenta para esta parte."
- Detected prompt injection → safe redirect message
- Frustration language without abandonment → empathetic reply

**LLM responses** (natural latency):
- First substantive answer to a dimension (LLM evaluates and decides if complete or asks follow-up)
- Abandonment ("quiero abandonar") — LLM writes the farewell

---

## What the frontend receives

```json
POST /api/v1/interviews/sessions/{session_id}/message
Content-Type: application/json
Authorization: Bearer {candidate_token}

{ "content": "Trabajé con WhatsApp Business API en un proyecto de e-commerce..." }
```

**Success response (200):**

```json
{
  "message_saved": true,
  "session_status": "active",
  "assistant_response": "Gracias, lo tomo en cuenta para esta parte.",
  "next_question": {
    "dimension_id": "D2",
    "dimension_name": "Cumplimiento RGPD/LOPDGDD datos sanitarios",
    "question_text": "¿Cómo has manejado la protección de datos sanitarios...",
    "question_number": 2,
    "total_questions": 8
  },
  "evaluation_result": null
}
```

**When the last dimension completes (200):**

```json
{
  "message_saved": true,
  "session_status": "completed",
  "assistant_response": "Gracias, lo tomo en cuenta para esta parte.",
  "next_question": null,
  "evaluation_result": {
    "session_id": "...",
    "evaluation_id": "...",
    "weighted_score": "4.74",
    "normalized_score": "4.74",
    "resultado": "APTO",
    "dimension_scores": [...]
  }
}
```

### Field reference

| Field | Type | Meaning |
|---|---|---|
| `message_saved` | `true` always | User message was persisted |
| `session_status` | `"active"` \| `"completed"` \| `"abandoned"` | Session state after this turn |
| `assistant_response` | `string` | The acknowledgment/follow-up text to show the candidate |
| `next_question` | object \| `null` | Next question to display; `null` when session ends |
| `evaluation_result` | object \| `null` | Final scores; only present when `session_status = "completed"` |

---

## How the frontend must handle the wait

### Rule 1 — Show a typing indicator immediately

As soon as the candidate submits a message, show a "typing..." or "thinking..." bubble **before** the HTTP response arrives. The response will take at minimum 1.5 s.

```
[Candidate]: Trabajé con WhatsApp Business API en un proyecto...
[Assistant]: ●●●   ← show this as soon as the request is sent
```

Do **not** wait for the HTTP response before showing any feedback. The request can take 1.5–10 s.

### Rule 2 — Do not set a short timeout

The endpoint can take up to ~10 s on slow LLM turns. Use a timeout of at least **30 seconds** on the HTTP client.

```js
// ✅ correct
fetch(url, { signal: AbortSignal.timeout(30_000) })

// ❌ wrong — will abort valid slow LLM responses
fetch(url, { signal: AbortSignal.timeout(5_000) })
```

### Rule 3 — Disable the input while waiting

Lock the text input and the send button from the moment the user submits until the response arrives and is displayed. The backend also enforces this via a Redis lock (409 `session_busy` if a second request arrives before the first finishes), but the frontend should prevent the attempt at all.

```
[input disabled] [send button disabled] while request is pending
```

### Rule 4 — Display `assistant_response` first, then `next_question`

When the dimension is complete, the response contains both an acknowledgment text and the next question. Show them **as two separate bubbles** in order:

```
[Assistant]: Gracias, lo tomo en cuenta para esta parte.

[Assistant]: Pregunta 2 de 8 — Cumplimiento RGPD/LOPDGDD datos sanitarios:
             ¿Cómo has manejado la protección de datos sanitarios...
```

If you collapse both into one bubble, the user sees a very long message and loses the sense of progression. The `assistant_response` is the closing of the previous dimension; the `next_question` content is the opening of the next.

### Rule 5 — Handle `session_status: "completed"` specially

When `evaluation_result` is present, the interview is over. Do not re-enable the input. Instead, transition to a results/thank-you screen.

```
session_status === "completed"
  → hide input area
  → show: "Entrevista completada. Gracias por tu tiempo."
  → optionally show a summary card (resultado, weighted_score)
```

### Rule 6 — Handle `session_status: "abandoned"` gracefully

If the candidate typed an abandonment phrase ("quiero abandonar", "prefiero no continuar"), the backend closes the session. The response will have `session_status: "abandoned"` and a farewell message in `assistant_response`.

```
session_status === "abandoned"
  → hide input area
  → show assistant_response ("Entendido, cerramos la sesión...")
  → show a "Volver al inicio" button
```

---

## Error responses to handle

| HTTP status | `error` code | What it means | What to show |
|---|---|---|---|
| `409` | `session_busy` | A previous message is still processing | "Espera un momento, procesando tu respuesta anterior…" — do not let user resend |
| `410` | `session_closed` | Session already completed/abandoned | Redirect to end screen |
| `404` | `session_not_found` | Invalid session ID | Redirect to login |
| `401` / `403` | — | Token expired or missing | Redirect to candidate login |
| `5xx` | — | Server error | "Algo salió mal, intenta de nuevo en unos segundos" |

---

## Recommended state machine for the chat UI

```
IDLE
  │  user types and submits
  ▼
SENDING
  │  show typing indicator, disable input
  │  HTTP request in flight (1.5–10 s)
  ▼
RECEIVED  ──── session_status = "abandoned" ──→  END_ABANDONED
  │
  ├── next_question != null  ──────────────────→  IDLE (new question displayed)
  │
  └── next_question == null
        │
        └── evaluation_result != null  ─────────→  END_COMPLETED

SENDING ──── HTTP error ──────────────────────────→  IDLE (show error toast, re-enable input)
SENDING ──── 409 session_busy ────────────────────→  IDLE (show "espera" message, re-enable input after 2 s)
```

---

## Things NOT to do

| Anti-pattern | Why it breaks |
|---|---|
| Show the response immediately on submit (optimistic UI) | The backend may return a follow-up question, not an advance — you can't know in advance |
| Abort the request after 5 s and show an error | Valid slow LLM responses take up to 10 s |
| Re-enable input before the response arrives | User will send a second message → 409 `session_busy` |
| Merge `assistant_response` and `next_question.question_text` into one bubble | Loses the visual separation between dimension close and dimension open |
| Treat a scripted response differently from an LLM response | The payload is identical; the frontend has no way to know which type it is |

---

## Quick implementation checklist

- [ ] Show typing indicator on submit (before response)
- [ ] HTTP timeout ≥ 30 s
- [ ] Disable input + send button while request is in flight
- [ ] On success: render `assistant_response` as bubble #1
- [ ] If `next_question != null`: render question text as bubble #2, update progress indicator
- [ ] If `session_status === "completed"`: hide input, show results screen
- [ ] If `session_status === "abandoned"`: hide input, show farewell + exit button
- [ ] Handle `409 session_busy`: toast + re-enable input after brief pause
- [ ] Handle `410 session_closed`: redirect to end screen
- [ ] Handle network/5xx: toast error, re-enable input so user can retry
