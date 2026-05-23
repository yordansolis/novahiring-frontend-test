# NovaHiring — Candidate API Spec

> Complete reference for all endpoints a candidate can call, from CV upload to interview completion.
> Base URL: `http://localhost:8000/api/v1`
> Companion docs: `frontend-auth-spec.md` · `specs-admin.md`

---

## Candidate journey overview

```
1. Upload CV (public, no auth)
        │
        ├── passed_ko: false → Flow ends. No credentials ever generated.
        └── passed_ko: true  → Wait for admin to evaluate batch
                                       │
                              [Backend: on 5th CV → AI evaluation]
                              [If APTO → login credentials generated]
                              [Admin sends username + password manually]
                                       │
2. Login with credentials (public)
        │
        └── 200 → Bearer token saved
                       │
3. Start interview session (Bearer)
        │
        └── session_id + welcome + first question
                       │
4. Send answers, receive follow-ups (Bearer)
        │
        └── Repeat until all 8 dimensions answered
                       │
5. Session completes → weighted score + evaluation result returned
```

---

## Auth levels for candidates

| Step | Auth header | Notes |
|------|------------|-------|
| CV upload | None | Fully public endpoint |
| Login | None | Public — returns the Bearer token |
| Interview endpoints | `Authorization: Bearer {token}` | Token from login; 7-day TTL |

---

## Endpoint 1 — Upload CV

**No authentication required.**

```
POST /api/v1/candidates/upload
Content-Type: multipart/form-data
```

### Form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `job_id` | string | ✅ | ID of the job opening to apply to |
| `nombre` | string | ✅ | Full name of the candidate |
| `email` | string (email) | ✅ | Used to receive credentials later |
| `cv_file` | file | ✅ | `.pdf` or `.md` only |

### Response `201`

```typescript
{
  candidate_id: string
  status: "received"
  passed_ko: boolean   // true = passed initial filter; false = rejected
}
```

### What `passed_ko` means for the UI

| Value | Message to show |
|-------|----------------|
| `true` | "Tu CV fue recibido y pasaste el filtro inicial. Recibirás tus credenciales si eres seleccionado/a." |
| `false` | "Tu CV fue recibido. Lamentablemente no cumples los requisitos mínimos para este puesto." |

### Error responses

| HTTP | `error` field | Message to show |
|------|--------------|----------------|
| `409` | `applications_closed` | "Esta posición ya no acepta más candidatos." |
| `409` | `duplicate_applicant` | "Ya existe una candidatura con este email para este puesto." |
| `409` | `duplicate_cv` | "Este CV ya fue registrado anteriormente." |
| `400` | `unsupported_file_type` | "Solo se aceptan archivos .pdf o .md." |
| `422` | `cv_unreadable` | "No se pudo leer el archivo. Usa un PDF con texto o un .md." |
| `404` | `job_not_found` | "El puesto indicado no existe." |

### Frontend example

```typescript
const form = new FormData()
form.append("job_id", "job-clinica-salud-valencia-001")
form.append("nombre", "Sofía Delgado")
form.append("email", "sofia@example.com")
form.append("cv_file", fileInput.files[0])

// Do NOT set Content-Type — browser sets it with the boundary automatically
const res = await fetch(`${BASE_URL}/candidates/upload`, {
  method: "POST",
  body: form,
})

if (res.status === 409) {
  const { error } = await res.json()
  // handle: applications_closed | duplicate_applicant | duplicate_cv
}
if (!res.ok) {
  // handle other errors
}

const { candidate_id, passed_ko } = await res.json()
// Show result message based on passed_ko
```

---

## Endpoint 2 — Candidate login

**No authentication required.**

```
POST /api/v1/auth/candidate/login
Content-Type: application/json
```

Credentials are generated automatically when a candidate is declared **APTO** and sent by the admin through an external channel (email, WhatsApp, etc.).

### Request body

```typescript
{
  username: string   // e.g. "sofia.delgado.3a1f"
  password: string   // e.g. "Xk7mPq2Nrt"
}
```

### Response `200`

```typescript
{
  token: string          // UUID — use as Bearer token for all interview endpoints
  token_type: "bearer"
  candidate_id: string   // store for reference
  job_id: string         // store for reference
}
```

### Error responses

| HTTP | Condition | Message to show |
|------|-----------|----------------|
| `401` | Wrong username or password | "Credenciales incorrectas. Revisa los datos que te enviaron." |

### Frontend example

```typescript
const res = await fetch(`${BASE_URL}/auth/candidate/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
})

if (res.status === 401) {
  // show "Credenciales incorrectas"
  return
}

const { token, candidate_id, job_id } = await res.json()

// Save to localStorage — used in all interview requests
localStorage.setItem("nova_candidate_token", token)
localStorage.setItem("nova_candidate_id", candidate_id)
localStorage.setItem("nova_candidate_job_id", job_id)

// Redirect to /interview
```

---

## Helper — Authenticated fetch for interview endpoints

All interview endpoints below require this header:

```
Authorization: Bearer {token}
```

Use a shared helper to avoid repeating it:

```typescript
const BASE_URL = "http://localhost:8000/api/v1"

async function candidateFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("nova_candidate_token") ?? ""
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (res.status === 401) {
    // Token expired or invalid → clear and redirect to login
    localStorage.removeItem("nova_candidate_token")
    localStorage.removeItem("nova_candidate_id")
    localStorage.removeItem("nova_candidate_job_id")
    window.location.href = "/login/candidate"
  }
  return res
}
```

---

## Endpoint 3 — Start interview session

```
POST /api/v1/interviews/sessions
Authorization: Bearer {token}
Content-Type: application/json
```

Creates a new interview session. The Bearer token already carries `candidate_id` and `job_id` — the request body can be empty.

### Request body

```typescript
// Optional — required only when NOT using a Bearer token (dev/legacy mode)
{
  candidate_id?: string
  job_id?: string
}
```

When using a Bearer token, send an empty body or omit it entirely.

### Response `201`

```typescript
{
  session_id: string        // save this — needed for all subsequent calls

  status: "active"

  message: {
    role: "assistant"
    content: string         // welcome message text
    sequence_number: number
  }

  next_question: {
    dimension_id: string    // e.g. "D1"
    dimension_name: string  // e.g. "Integrations"
    question_text: string   // the question to display
    question_number: number // 1
    total_questions: number // 8
  }
}
```

### Error responses

| HTTP | `error` field | Meaning |
|------|--------------|---------|
| `422` | `candidate_not_eligible` | Candidate did not pass KO — cannot interview |
| `409` | `session_already_exists` | An active session already exists; `session_id` is included in the response |
| `422` | `missing_fields` | No Bearer token and body is missing `candidate_id` or `job_id` |

### Frontend example

```typescript
const res = await candidateFetch("/interviews/sessions", {
  method: "POST",
  body: JSON.stringify({}),
})

if (res.status === 409) {
  const { session_id } = await res.json()
  // Resume existing session — navigate to /interview/{session_id}
  return
}
if (res.status === 422) {
  const { error } = await res.json()
  // "candidate_not_eligible" → show "No estás habilitado para la entrevista"
  return
}

const { session_id, message, next_question } = await res.json()

// Save session_id to use in subsequent calls
localStorage.setItem("nova_session_id", session_id)

// Display welcome message, then show the first question
showWelcome(message.content)
showQuestion(next_question)
```

---

## Endpoint 4 — Send a message (chat turn)

```
POST /api/v1/interviews/sessions/{session_id}/message
Authorization: Bearer {token}
Content-Type: application/json
```

The main endpoint of the interview. The candidate answers the current question; the backend processes the answer through the dialogue manager and responds with either a follow-up or the next dimension's question.

### Path parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | From `POST /sessions` response |

### Request body

```typescript
{
  content: string   // The candidate's answer text (1–10,000 characters)
}
```

### Response `200`

```typescript
{
  message_saved: true

  session_status: "active" | "completed" | "abandoned"

  // null if the session just completed (evaluation is in evaluation_result instead)
  next_question: {
    dimension_id: string
    dimension_name: string
    question_text: string   // may be a follow-up or the next dimension's question
    question_number: number
    total_questions: number // 8
  } | null

  // null while the interview is in progress; populated when session_status === "completed"
  evaluation_result: {
    session_id: string
    evaluation_id: string
    weighted_score: string      // e.g. "4.84"
    normalized_score: string    // e.g. "4.84"
    resultado: "APTO" | "DESCARTADO"
    dimension_scores: [
      {
        dimension_id: string    // "D1" … "D8"
        score: string           // "1" … "5"
        peso: number
        justificacion: string
        evidencia: string
      }
    ]
  } | null
}
```

### Error responses

| HTTP | `error` field | Meaning |
|------|--------------|---------|
| `404` | `session_not_found` | Invalid `session_id` |
| `410` | `session_closed` | Session already completed, abandoned, or expired |
| `409` | `session_busy` | Another request is already being processed — retry shortly |

### How the backend decides what to respond

The dialogue manager classifies the candidate's answer into one of several intents and responds accordingly. The frontend always gets one `next_question` back (or `null` when done) — you don't need to know the intent, but this table helps you understand the flow:

| Candidate says / does | What happens | `next_question` |
|-----------------------|-------------|-----------------|
| Answers relevantly | Follow-up question (up to 3 turns per dimension) | Same dimension |
| Answers vaguely | Targeted follow-up to get more detail | Same dimension |
| "No lo sé" / "I don't know" | Acknowledged with empathy, dimension skipped | Next dimension |
| Asks for clarification | Brief answer + re-asks the same question | Same dimension |
| Asks to correct previous answer | Clears dimension, re-asks from start | Same dimension |
| Abandons / "quiero salir" | Session closed gracefully | `null` |
| Off-topic (1st time) | Explains what is needed, prompts again | Same dimension |
| Off-topic (2nd time) | Accepts "no experience", advances | Next dimension |
| 3 turns on same dimension | Auto-advances regardless of quality | Next dimension |

### Session ends when `session_status === "completed"`

When the candidate answers all 8 dimensions, the backend runs the AI evaluation pipeline and returns the final result in `evaluation_result`. At this point `next_question` is `null`.

### Frontend example

```typescript
async function sendAnswer(sessionId: string, content: string) {
  const res = await candidateFetch(`/interviews/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })

  if (res.status === 409) {
    const { error } = await res.json()
    if (error === "session_busy") {
      // Show "Procesando tu respuesta..." and retry after 2-3 seconds
      return
    }
  }
  if (res.status === 410) {
    // Session already closed — show completion screen
    return
  }
  if (!res.ok) {
    // Unexpected error
    return
  }

  const { session_status, next_question, evaluation_result } = await res.json()

  if (session_status === "completed" && evaluation_result) {
    // Interview finished — show result screen
    showResult(evaluation_result)
    return
  }

  if (session_status === "abandoned") {
    // Candidate chose to leave — show goodbye screen
    showAbandoned()
    return
  }

  if (next_question) {
    // Show the next question (may be a follow-up or a new dimension)
    showQuestion(next_question)
  }
}
```

---

## Endpoint 5 — List candidate sessions

```
GET /api/v1/interviews/sessions
Authorization: Bearer {token}
```

Returns all interview sessions for the authenticated candidate, ordered newest first. Use this to recover a lost `session_id` or to show the candidate their history (active, completed, abandoned).

### Response `200`

```typescript
{
  sessions: [
    {
      session_id: string
      job_id: string
      status: "active" | "completed" | "abandoned" | "expired"
      current_question_index: number   // 0-based (0–7)
      total_questions: number          // always 8
      created_at: string               // ISO 8601 timestamp
    }
  ]
  total: number
}
```

### Error responses

| HTTP | `error` field | Meaning |
|------|--------------|---------|
| `401` | `unauthorized` | No Bearer token provided |

### Frontend example

```typescript
// Recover session_id on page load when localStorage is empty
async function recoverSession() {
  const res = await candidateFetch("/interviews/sessions")
  if (!res.ok) return null

  const { sessions } = await res.json()
  const active = sessions.find((s: any) => s.status === "active")
  if (active) {
    localStorage.setItem("nova_session_id", active.session_id)
    return active.session_id
  }
  return null
}

// Show all past sessions (history view)
async function loadSessionHistory() {
  const res = await candidateFetch("/interviews/sessions")
  const { sessions } = await res.json()
  // sessions[0] is the most recent
  return sessions
}
```

---

## Endpoint 6 — Get session details (load history + result)

```
GET /api/v1/interviews/sessions/{session_id}
Authorization: Bearer {token}
```

Returns the full message history, current progress, and — when the session is `completed` — the final evaluation result. Use this to restore the chat UI on page reload, and to show the result screen without needing the original `POST /message` response.

### Path parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | From `POST /sessions` or `GET /sessions` |

### Response `200`

```typescript
{
  session_id: string
  job_id: string
  candidate_id: string
  status: "active" | "completed" | "abandoned" | "expired"
  current_question_index: number  // 0-based index of the current dimension (0–7)
  total_questions: number         // always 8
  messages: [
    {
      role: "assistant" | "user"
      content: string
      sequence_number: number     // chronological order, starting at 1
    }
  ]
  // null unless status === "completed"
  evaluation_result: {
    session_id: string
    evaluation_id: string
    weighted_score: string
    normalized_score: string
    resultado: "APTO" | "DESCARTADO"
    dimension_scores: [
      {
        dimension_id: string
        score: string
        peso: number
        justificacion: string
        evidencia: string
      }
    ]
  } | null
}
```

### Error responses

| HTTP | `error` field | Meaning |
|------|--------------|---------|
| `404` | `session_not_found` | Invalid `session_id` |

### Frontend example

```typescript
// Called on page load to restore state — handles all statuses
async function loadSession(sessionId: string) {
  const res = await candidateFetch(`/interviews/sessions/${sessionId}`)

  if (res.status === 404) {
    // Session not found — redirect to start
    return
  }

  const { status, current_question_index, total_questions, messages, evaluation_result } = await res.json()

  if (status === "completed" && evaluation_result) {
    // Restore result screen without needing the original POST /message response
    showResult(evaluation_result)
    return
  }

  if (status === "abandoned" || status === "expired") {
    showEndScreen(status)
    return
  }

  // Render the full message history in order
  for (const msg of messages) {
    renderChatBubble(msg.role, msg.content)
  }

  // Show progress indicator
  showProgress(current_question_index + 1, total_questions)
}
```

---

## Endpoint 7 — Interrupt session

```
POST /api/v1/interviews/sessions/{session_id}/interrupt
Authorization: Bearer {token}
```

Signals the backend to stop an in-progress evaluation pipeline (e.g., if the candidate wants to cancel while the AI is scoring). This sets an interrupt flag that the backend checks between AI calls.

**This does NOT close the session** — it only signals the pipeline to stop. The session remains `active` until explicitly abandoned via the message endpoint.

### Path parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | From `POST /sessions` response |

### Response `200`

```typescript
{
  status: "interrupted"
  session_id: string
}
```

### Error responses

| HTTP | `error` field | Meaning |
|------|--------------|---------|
| `404` | `session_not_found` | Invalid `session_id` |

### Frontend example

```typescript
// Useful during the "Evaluando..." loading state — show a "Cancelar" button
async function interruptSession(sessionId: string) {
  const res = await candidateFetch(`/interviews/sessions/${sessionId}/interrupt`, {
    method: "POST",
  })
  // { status: "interrupted" } — no action needed beyond hiding the loader
}
```

---

## Full candidate flow with code

```typescript
// 1. Upload CV (public, before any credentials exist)
const uploadRes = await fetch(`${BASE_URL}/candidates/upload`, {
  method: "POST",
  body: buildFormData({ job_id, nombre, email, cv_file }),
})
const { passed_ko } = await uploadRes.json()
// passed_ko: true → wait for credentials; passed_ko: false → flow ends

// 2. Login after receiving credentials from admin
const loginRes = await fetch(`${BASE_URL}/auth/candidate/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
})
const { token, candidate_id, job_id } = await loginRes.json()
localStorage.setItem("nova_candidate_token", token)
localStorage.setItem("nova_candidate_id", candidate_id)
localStorage.setItem("nova_candidate_job_id", job_id)

// 3. Start interview — or recover active session if session_id is missing
let session_id = localStorage.getItem("nova_session_id")

if (!session_id) {
  // Try to recover an existing active session (e.g. user cleared localStorage)
  const listRes = await candidateFetch("/interviews/sessions")
  if (listRes.ok) {
    const { sessions } = await listRes.json()
    const active = sessions.find((s: any) => s.status === "active")
    if (active) {
      session_id = active.session_id
      localStorage.setItem("nova_session_id", session_id)
    }
  }
}

if (!session_id) {
  // No active session — start a new one
  const sessionRes = await candidateFetch("/interviews/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  })
  if (sessionRes.status === 409) {
    // Race: another tab created it — pull session_id from error body
    const { session_id: existing } = await sessionRes.json()
    session_id = existing
  } else {
    const { session_id: newId, message, next_question } = await sessionRes.json()
    session_id = newId
    showWelcome(message.content)
    showQuestion(next_question)
  }
  localStorage.setItem("nova_session_id", session_id)
}

// 4. Send each answer in a loop until session_status === "completed"
while (true) {
  const answer = await getUserInput()   // your UI method to get candidate's typed text
  const msgRes = await candidateFetch(`/interviews/sessions/${session_id}/message`, {
    method: "POST",
    body: JSON.stringify({ content: answer }),
  })

  if (msgRes.status === 409) {
    // session_busy — another request is processing; show spinner and retry
    await delay(2500)
    continue
  }

  const { session_status, next_question, evaluation_result } = await msgRes.json()

  if (session_status === "completed") {
    // Save result to localStorage so the result screen survives a reload
    localStorage.setItem("nova_eval_result", JSON.stringify(evaluation_result))
    showResult(evaluation_result)
    break
  }
  if (session_status === "abandoned") {
    showGoodbye()
    break
  }
  if (next_question) {
    displayQuestion(next_question)
  }
}

// 5. On any page reload — restore full state from API
async function onPageLoad() {
  const session_id = localStorage.getItem("nova_session_id")
  if (!session_id) return startFlow()

  const res = await candidateFetch(`/interviews/sessions/${session_id}`)
  if (res.status === 404) return startFlow()

  const { status, messages, current_question_index, total_questions, evaluation_result } = await res.json()

  if (status === "completed") {
    // evaluation_result is always populated here — no need for localStorage fallback
    showResult(evaluation_result)
    return
  }
  if (status === "abandoned" || status === "expired") {
    showEndScreen(status)
    return
  }

  // Restore chat history and resume from the current question
  for (const msg of messages) {
    renderChatBubble(msg.role, msg.content)
  }
  showProgress(current_question_index + 1, total_questions)
}

// 6. Show the candidate's session history (history page)
async function loadSessionHistory() {
  const res = await candidateFetch("/interviews/sessions")
  if (!res.ok) return []

  const { sessions } = await res.json()
  // sessions is ordered newest first: active → completed → abandoned → expired
  return sessions
}
```

---

## Session status reference

| Status | Meaning | What to show |
|--------|---------|-------------|
| `active` | Interview in progress | Chat UI with question |
| `completed` | All 8 dimensions answered and scored | Results screen |
| `abandoned` | Candidate chose to leave | Goodbye message |
| `expired` | Session timed out | "Tu sesión ha expirado" + link to restart |

---

## Interview progress indicators

Use `current_question_index` from `GET /sessions/{id}` and `question_number` from `next_question` to build a progress bar:

```typescript
// Example: "Pregunta 3 de 8"
const label = `Pregunta ${next_question.question_number} de ${next_question.total_questions}`

// Percentage for a progress bar
const progress = (next_question.question_number / next_question.total_questions) * 100
```

The 8 interview dimensions for the reference job (Clínica Salud Valencia):

| # | Dimension ID | Name | Weight |
|---|-------------|------|--------|
| 1 | D1 | Integrations | ×3 |
| 2 | D2 | RGPD/LOPDGDD | ×3 |
| 3 | D3 | Autonomy | ×3 |
| 4 | D4 | Build-vs-buy | ×3 |
| 5 | D5 | Delivery | ×2 |
| 6 | D6 | Communication | ×2 |
| 7 | D7 | Health sector | ×2 |
| 8 | D8 | Stack | ×1 |

---

## Error handling summary

| Scenario | HTTP | Action |
|----------|------|--------|
| Token expired / invalid | `401` | Clear localStorage → redirect to `/login/candidate` |
| `GET /sessions` without Bearer token | `401` `unauthorized` | Redirect to login |
| Session not found | `404` | Redirect to `/interview` start |
| Session already closed | `410` | Show end screen based on `status` field |
| Session busy (concurrent request) | `409` `session_busy` | Show "Procesando..." and retry after 2–3 s |
| Duplicate active session | `409` `session_already_exists` | Resume existing session using returned `session_id` |
| Candidate not eligible for interview | `422` `candidate_not_eligible` | "No estás habilitado para la entrevista" |

---

## localStorage keys reference

```typescript
const CANDIDATE_TOKEN = "nova_candidate_token"   // Bearer token
const CANDIDATE_ID    = "nova_candidate_id"      // for display purposes
const CANDIDATE_JOB   = "nova_candidate_job_id"  // for display purposes
const SESSION_ID      = "nova_session_id"        // active interview session

// Clear all on logout
function logoutCandidate() {
  [CANDIDATE_TOKEN, CANDIDATE_ID, CANDIDATE_JOB, SESSION_ID].forEach(k =>
    localStorage.removeItem(k)
  )
  window.location.href = "/login/candidate"
}
```

---

## Quick test with curl

```bash
# 1. Start the server
make start-dev

# 2. Upload a CV (public)
curl -s -X POST http://localhost:8000/api/v1/candidates/upload \
  -F "job_id=job-clinica-salud-valencia-001" \
  -F "nombre=Sofía Delgado" \
  -F "email=sofia@example.com" \
  -F "cv_file=@docs/cv-20-06-2026/cv-13-sofia-delgado.md" | jq .

# 3. Get APTO credentials from admin
ADMIN_KEY=$(curl -s -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.api_key')

curl -s "http://localhost:8000/api/v1/candidates/job-clinica-salud-valencia-001" \
  -H "X-API-Key: $ADMIN_KEY" | jq '.[] | select(.resultado=="APTO") | {nombre,login_username,login_password}'

# 4. Candidate login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/candidate/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sofia.delgado.3a1f","password":"Xk7mPq2Nrt"}' | jq -r '.token')

# 5. List all sessions for this candidate (recover session_id, see history)
curl -s "http://localhost:8000/api/v1/interviews/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq '{total, sessions: [.sessions[] | {session_id, status, current_question_index, created_at}]}'

# 6. Start interview session (or recover active one from step 5)
SESSION=$(curl -s -X POST http://localhost:8000/api/v1/interviews/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.session_id')

# 7. Send an answer
curl -s -X POST "http://localhost:8000/api/v1/interviews/sessions/$SESSION/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Tengo experiencia integrando la API de WhatsApp Business de Meta en proyectos de salud..."}' | jq .

# 8. Get session details — includes evaluation_result when status=completed
curl -s "http://localhost:8000/api/v1/interviews/sessions/$SESSION" \
  -H "Authorization: Bearer $TOKEN" | jq '{status, current_question_index, message_count: (.messages | length), evaluation_result}'
```
