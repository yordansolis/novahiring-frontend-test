# NovaHiring — Admin Backend Spec

> Complete reference for everything an admin (recruiter / platform operator) can do via the API.
> Base URL: `http://localhost:8000/api/v1`
> Auth header for all admin endpoints: `X-API-Key: {api_key}`

---

## Auth overview

| Level | Header | Obtained via |
|-------|--------|-------------|
| Admin | `X-API-Key: {api_key}` | `POST /auth/admin/login` |
| Dev bypass | _(none)_ | Leave `API_KEY_ADMIN` empty in `.env` |

> If `API_KEY_ADMIN` is empty in `.env`, admin auth is bypassed automatically — useful during local development and testing.

---

## 1. Admin login

### `POST /auth/admin/login`

**Auth required:** None (public endpoint)

Validate username + password and receive the API key to include in all subsequent admin requests.

#### Request
```typescript
{
  username: string   // "admin"
  password: string   // "admin123"
}
```

#### Response `200`
```typescript
{
  api_key: string      // hex string — store in localStorage
  token_type: "api-key"
}
```

#### Error responses
| HTTP | Condition | `detail` |
|------|-----------|----------|
| `401` | Wrong credentials | `"Invalid credentials"` |
| `503` | `create_admin.py` was never run | `"API_KEY_ADMIN not configured — run create_admin.py first"` |

#### Notes
- The `api_key` returned is the value of `API_KEY_ADMIN` in `.env`.
- Admin credentials are set once via `uv run python create_admin.py` (or `create_admin.py admin mypassword`).
- Store as `localStorage.setItem("nova_admin_api_key", api_key)`.

---

## 2. Candidate management

### 2.1 List candidates for a job

### `GET /candidates/{job_id}`

**Auth required:** Admin (`X-API-Key`)

Returns all candidates for a job opening, ordered by upload time. Includes KO result, evaluation score, and login credentials for APTO candidates.

#### Path parameter
| Param | Type | Description |
|-------|------|-------------|
| `job_id` | string | e.g. `job-clinica-salud-valencia-001` |

#### Response `200`
```typescript
CandidateListItem[] = {
  candidate_id: string           // internal UUID
  nombre: string                 // full name submitted with CV
  email: string | null           // email submitted with CV
  passed_ko: boolean | null      // null = not yet evaluated
  resultado: "APTO" | "DESCARTADO" | null   // null = not yet evaluated
  weighted_score: string | null  // e.g. "4.84" — null if not evaluated or DESCARTADO
  login_username: string | null  // only for APTO candidates
  login_password: string | null  // only for APTO candidates
}
```

#### Error responses
| HTTP | `error` | Meaning |
|------|---------|---------|
| `404` | `job_not_found` | Invalid `job_id` |

#### Admin responsibilities
- Copy `login_username` + `login_password` for each APTO candidate and send them manually (email, WhatsApp, etc.).
- These credentials expire after **7 days** from first use (token TTL in Redis).

---

### 2.2 Trigger AI evaluation manually

### `POST /candidates/{job_id}/evaluate`

**Auth required:** Admin (`X-API-Key`)

Manually triggers the CV evaluation pipeline for any candidates that have not yet been evaluated. Idempotent — safe to call multiple times.

> **Note:** Evaluation also fires automatically when the 5th CV is uploaded (no admin action needed). Use this endpoint for edge cases — e.g., when the automatic trigger failed, or for jobs that already had candidates from before the evaluator existed.

#### Path parameter
| Param | Type | Description |
|-------|------|-------------|
| `job_id` | string | e.g. `job-clinica-salud-valencia-001` |

#### Response `200`
```typescript
{
  job_id: string
  queued_candidates: number    // count of candidates without an evaluation at call time
  status: "evaluation_started"
}
```

#### What this does internally
1. Finds all candidates for the job that have no `Evaluation` row yet and have CV text.
2. For each unevaluated candidate:
   - Re-runs KO check using stored `profile_json`.
   - If **DESCARTADO** → creates `Evaluation(passed_ko=False)`.
   - If **APTO** → calls AI `cv_dimension_evaluator` for each of 8 dimensions, runs `Scorer`, creates `Evaluation` + `DimensionScoreRecord` rows, triggers `NotificationService`.
3. `NotificationService` generates UUID Bearer token, stores it in Redis (7-day TTL), creates `CandidateInvitation` in DB, logs simulated email to stdout.

#### Error responses
| HTTP | `error` | Meaning |
|------|---------|---------|
| `404` | `job_not_found` | Invalid `job_id` |

---

## 3. Job information

All four endpoints below require Admin auth (`X-API-Key`).

### 3.1 Get job offer text

### `GET /jobs/{job_id}/offer`

Returns the job description as formatted text.

#### Response `200`
```typescript
{
  job_id: string
  title: string        // e.g. "Desarrollador freelance — Clínica Salud Valencia"
  offer_text: string   // Markdown-formatted job description
}
```

#### Error responses
| HTTP | Meaning |
|------|---------|
| `404` | Job not found |

---

### 3.2 Get job profile (KO criteria + scorecard)

### `GET /jobs/{job_id}/profile`

Returns the structured evaluation criteria that define this job: eliminatory KO criteria and the weighted scorecard.

#### Response `200`
```typescript
{
  required_skills: string[]        // tech skills listed as required
  ko_criteria: {
    id: string                     // "KO1", "KO2", "KO3"
    descripcion: string            // e.g. "No experience with WhatsApp Business API"
    razon: string                  // why it's eliminatory
    is_eliminatory: boolean        // always true in practice
  }[]
  scorecard: {
    id: string                     // "D1" … "D8"
    nombre: string                 // e.g. "Integraciones técnicas"
    peso: number                   // 1–3
    rubricas: {
      "1": string                  // description for score 1
      "2": string
      "3": string
      "4": string
      "5": string                  // description for score 5
    }
  }[]
  total_weight: number             // sum of all weights (19 for the reference case)
}
```

#### Error responses
| HTTP | Meaning |
|------|---------|
| `404` | Job not found |

---

### 3.3 Get candidate ranking

### `GET /jobs/{job_id}/ranking`

Returns all evaluated candidates sorted by result: APTO candidates first (highest score first), then DESCARTADO.

#### Response `200`
```typescript
{
  candidates: {
    candidate_id: string
    resultado: "APTO" | "DESCARTADO"
    passed_ko: boolean
    weighted_score: string | null   // e.g. "4.84" — null for DESCARTADO
    // additional fields from Evaluation.to_summary()
  }[]
}
```

#### Notes
- Candidates with no `Evaluation` row do not appear in this response.
- To see all candidates (including unnevaluated), use `GET /candidates/{job_id}`.

---

### 3.4 Get AI-generated narrative report

### `GET /jobs/{job_id}/report`

Returns the full AI-generated ranking report in Markdown format. Includes narrative justification per candidate and a final recommendation.

#### Response `200`
- Content-Type: `text/markdown; charset=utf-8`
- Body: full Markdown string (render with a Markdown component)

#### Notes
- Generated on demand by `ReportWriter` using the `narrative_report_writer` prompt.
- Every call generates a fresh report (not cached).
- If no candidates have been evaluated yet, the report will state that no data is available.

---

## 4. Health check

### `GET /health`

**Auth required:** None (public endpoint)

Check that the API is reachable.

#### Response `200`
```typescript
{
  status: "ok"
}
```

> **Note:** The current implementation only checks that FastAPI is running. DB and Redis health checks are planned for Phase 9.

---

## 5. Admin-accessible interview endpoints

The interview endpoints are primarily candidate-facing (Bearer token), but an admin can also access them using `X-API-Key` for operational purposes (monitoring, testing, interrupting stuck sessions).

### 5.1 Start an interview session (admin/dev)

### `POST /interviews/sessions`

**Auth:** `X-API-Key` or `Authorization: Bearer {candidate_token}`

When using X-API-Key, a request body is required:
```typescript
{
  job_id: string
  candidate_id: string
}
```

Response and error codes: see `frontend-specs.md` Screen 7.

---

### 5.2 Interrupt an in-progress session

### `POST /interviews/sessions/{session_id}/interrupt`

**Auth:** `X-API-Key` or `Authorization: Bearer {candidate_token}`

Sets an interrupt flag in Redis. The AI evaluation pipeline checks this flag between dimension evaluations and aborts if set.

#### Response `200`
```typescript
{
  status: "interrupted"
  session_id: string
}
```

#### When to use
- A candidate reports the interview is stuck or they want to restart.
- A background evaluation is running too long and needs to be aborted.

---

### 5.3 Read a session's message history

### `GET /interviews/sessions/{session_id}`

**Auth:** `X-API-Key` or `Authorization: Bearer {candidate_token}`

Returns the full conversation transcript and current state.

#### Response `200`
```typescript
{
  session_id: string
  job_id: string | null
  candidate_id: string | null
  status: "active" | "completed" | "abandoned" | "expired"
  current_question_index: number   // 0-based dimension index
  total_questions: number          // always 8
  messages: {
    role: "assistant" | "user"
    content: string
    sequence_number: number
  }[]
}
```

---

## 6. Admin workflow — complete sequence

This is the end-to-end flow as the admin experiences it:

```
1. LOG IN
   POST /auth/admin/login {username, password}
   → save api_key to localStorage

2. WAIT FOR CANDIDATES
   (candidates upload CVs at the public POST /candidates/upload endpoint)
   → evaluation fires automatically on the 5th upload

3. CHECK CANDIDATE LIST
   GET /candidates/{job_id}
   → see who passed KO, who was evaluated, and what score they got
   → for APTO candidates: copy login_username + login_password
   → manually send credentials to candidate (outside the platform)

4. REVIEW JOB DETAILS (optional)
   GET /jobs/{job_id}/profile      → KO criteria + scorecard rubrics
   GET /jobs/{job_id}/offer        → job description text

5. TRIGGER EVALUATION MANUALLY (if needed)
   POST /candidates/{job_id}/evaluate
   → only needed if auto-trigger failed or job has fewer than 5 candidates

6. VIEW RANKING
   GET /jobs/{job_id}/ranking
   → sorted list: APTO first (highest score), DESCARTADO last

7. VIEW NARRATIVE REPORT
   GET /jobs/{job_id}/report
   → full Markdown report with per-candidate justification + final recommendation
   → render as Markdown, offer print/export

8. MONITOR INTERVIEW (optional)
   GET /interviews/sessions/{session_id}     → read session transcript
   POST /interviews/sessions/{id}/interrupt  → abort stuck session
```

---

## 7. Full endpoint map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/admin/login` | Public | Admin login — returns api_key |
| `GET` | `/candidates/{job_id}` | Admin | List all candidates + scores + APTO credentials |
| `POST` | `/candidates/{job_id}/evaluate` | Admin | Manually trigger AI evaluation |
| `GET` | `/jobs/{job_id}/offer` | Admin | Job description text (Markdown) |
| `GET` | `/jobs/{job_id}/profile` | Admin | KO criteria + scorecard |
| `GET` | `/jobs/{job_id}/ranking` | Admin | Evaluated candidates sorted by score |
| `GET` | `/jobs/{job_id}/report` | Admin | AI-generated narrative report (Markdown) |
| `POST` | `/interviews/sessions` | Admin or Bearer | Start interview session |
| `GET` | `/interviews/sessions/{id}` | Admin or Bearer | Read session transcript |
| `POST` | `/interviews/sessions/{id}/interrupt` | Admin or Bearer | Abort in-progress evaluation |
| `GET` | `/health` | Public | API liveness check |

---

## 8. Error handling reference

| HTTP | Condition | Admin response |
|------|-----------|----------------|
| `401` | Wrong username/password at login | Show "Usuario o contraseña incorrectos" on login form |
| `401` | Expired or invalid api_key on any request | Clear localStorage, redirect to `/login/admin` |
| `403` | api_key present but not recognized | Clear localStorage, redirect to `/login/admin` |
| `404` | `job_not_found` | Show "Puesto no encontrado" |
| `503` | Admin not configured | Show "El servidor no está configurado. Ejecuta create_admin.py" |

---

## 9. Key constraints the admin must know

| Constraint | Detail |
|------------|--------|
| **5-candidate cap** | Each job accepts at most 5 CVs. After 5, `POST /upload` returns `409 applications_closed`. No override exists — by design. |
| **Auto-evaluation on 5th upload** | No admin action needed for the happy path. Evaluation runs in a background task the moment the 5th CV arrives. |
| **Manual evaluation is idempotent** | `POST /candidates/{job_id}/evaluate` skips candidates that already have an `Evaluation` row. Safe to call repeatedly. |
| **Credentials sent manually** | The platform does not email candidates. The admin sees `login_username` + `login_password` in `GET /candidates/{job_id}` and sends them through their own channel. |
| **Token TTL = 7 days** | Candidate Bearer tokens expire 7 days after creation. If a candidate loses access, the admin cannot renew the token via API — only by re-running `seed.py` or directly via the DB in the current MVP. |
| **Report is always fresh** | `GET /jobs/{job_id}/report` calls the AI on every request. No caching. Latency is ~5–15 seconds depending on provider. |
| **AI scores are validated** | All AI dimension scores (1–5) are validated by Python before being saved. If validation fails after 2 retries, the endpoint returns a 500. The admin should re-trigger evaluation if this happens. |
| **Dev bypass** | If `API_KEY_ADMIN` is empty in `.env`, all admin auth is bypassed. Never deploy with an empty key. |
