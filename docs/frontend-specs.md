# NovaHiring — Frontend Specs

> Reference: all screens map 1-to-1 with existing backend endpoints.
> Base URL: `http://localhost:8000/api/v1`

---

## Auth levels

| Level | Header | Used by |
|-------|--------|---------|
| Public | _(none)_ | CV upload page |
| Admin | `X-API-Key: {API_KEY_ADMIN}` | All recruiter screens |
| Candidate | `Authorization: Bearer {token}` | Interview chatbot |

In dev mode (keys empty in `.env`) auth is bypassed on all endpoints.

---

## Screen 1 — Home / Recruiter Dashboard

**Route:** `/dashboard` or `/jobs/:job_id`
**Auth:** Admin

### Purpose
Main view for the recruiter. Shows all candidates for a job with their KO status and score, sorted by ranking.

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/candidates/{job_id}` | Full candidate list with status + score |
| `GET` | `/jobs/{job_id}/ranking` | Ranking sorted: APTO first, then DESCARTADO |
| `POST` | `/candidates/{job_id}/evaluate` | Trigger AI evaluation for unevaluated candidates |

### UI elements
- **Job header**: job title, job_id, budget/deadline from discovery data
- **Candidate table**:
  - Columns: `Nombre` | `KO` (badge) | `Resultado` (badge) | `Score` | `Actions`
  - KO badge: green `PASA` / red `FALLA`
  - Resultado badge: green `APTO` / red `DESCARTADO` / gray `Pendiente`
  - Score: shown as `4.84 / 5` or `—` if not yet evaluated
  - Actions: "Ver detalle" → Screen 4
- **"Disparar evaluación"** button: calls `POST /candidates/{job_id}/evaluate`
  - Disabled if no unevaluated candidates exist
  - Shows `queued_candidates` count from response
- **Navigation links**: to Job Profile (Screen 3), Offer (Screen 5), Report (Screen 6)

### Response shapes used
```typescript
// GET /candidates/{job_id}
CandidateListItem[] = {
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean | null
  resultado: "APTO" | "DESCARTADO" | null
  weighted_score: string | null  // e.g. "4.84"
}

// POST /candidates/{job_id}/evaluate
{
  job_id: string
  queued_candidates: number
  status: "evaluation_started"
}
```

### Error handling
- `404` job not found → "No se encontró el puesto"

---

## Screen 2 — CV Upload

**Route:** `/upload` or `/jobs/:job_id/apply`
**Auth:** Public (no header needed)

### Purpose
Candidate-facing form to submit a CV for a job opening.

### Endpoint
`POST /candidates/upload` — `multipart/form-data`

### Form fields
| Field | Type | Validation |
|-------|------|------------|
| `job_id` | hidden or text | required |
| `nombre` | text | required |
| `email` | email | required |
| `cv_file` | file | required, `.pdf` or `.md` only |

### UI elements
- File drag-and-drop area with format hint: "Solo archivos .pdf o .md"
- Submit button: "Enviar candidatura"
- Result state after submit:
  - `201 passed_ko: true` → "Tu CV fue recibido. Pasaste el filtro inicial."
  - `201 passed_ko: false` → "Tu CV fue recibido. No cumples los requisitos mínimos."
  - Error states below

### Error states
| HTTP | `error` code | Message shown |
|------|-------------|---------------|
| `409` | `applications_closed` | "Esta posición ya no acepta más candidatos." |
| `409` | `duplicate_cv` | "Este CV ya fue enviado anteriormente." |
| `400` | `unsupported_file_type` | "Solo se aceptan archivos .pdf o .md." |
| `400` | `cv_unreadable` | "No se pudo leer el archivo. Usa un PDF con texto o un .md." |
| `404` | `job_not_found` | "Puesto no encontrado." |

---

## Screen 3 — Perfil del Puesto

**Route:** `/jobs/:job_id/profile`
**Auth:** Admin

### Purpose
Shows the KO criteria and scorecard dimensions that define the job requirements.

### Endpoint
`GET /jobs/{job_id}/profile`

### Response shape
```typescript
{
  required_skills: string[]
  ko_criteria: {
    id: string         // "KO1", "KO2", "KO3"
    descripcion: string
    razon: string
    is_eliminatory: boolean
  }[]
  scorecard: {
    id: string         // "D1" … "D8"
    nombre: string
    peso: number       // 1–3
    rubricas: {
      "1": string
      "2": string
      "3": string
      "4": string
      "5": string
    }
  }[]
  total_weight: number  // 19
}
```

### UI elements
- **KO section**: red-bordered cards for each KO criterion; label "ELIMINATORIO"
- **Scorecard table**:
  - Columns: `ID` | `Dimensión` | `Peso` | `Rúbricas`
  - Rúbricas expandable (accordion): shows text for score 1, 3, 5
  - Weight shown as `×3`, `×2`, `×1` badges
- **Skills requeridas**: tag list

---

## Screen 4 — Detalle del Candidato

**Route:** `/jobs/:job_id/candidates/:candidate_id`
**Auth:** Admin

### Purpose
Full evaluation detail for one candidate — KO check results, dimension scores, justifications, and evidence from their CV.

### Data source
This screen assembles data from:
- Candidate row from `GET /candidates/{job_id}` (already loaded in dashboard)
- Job profile from `GET /jobs/{job_id}/profile` (rubric text per dimension)
- Evaluation detail (dimension scores + justification) — returned inside the ranking/candidates list

### UI elements
- **Header card**: nombre, email, resultado badge, score final
- **KO check table**:
  - Columns: `ID` | `Criterio` | `Resultado` | `Evidencia`
  - If ANY KO = FALLA → show red alert; hide dimension scores section
- **Scorecard breakdown** (only shown if passed_ko = true):
  - Per dimension: score badge (1–5) | nombre | peso | justificación | evidencia quote
  - Summary bar: weighted score formula displayed
- **Score total**: `Σ(score × peso) / 19 = X.XX / 5`

---

## Screen 5 — Oferta de Trabajo

**Route:** `/jobs/:job_id/offer`
**Auth:** Admin

### Purpose
Renders the job description text.

### Endpoint
`GET /jobs/{job_id}/offer`

### Response shape
```typescript
{
  job_id: string
  title: string
  offer_text: string  // markdown
}
```

### UI elements
- Page title: `title` field
- Body: `offer_text` rendered as Markdown
- Back link to dashboard

---

## Screen 6 — Informe Final

**Route:** `/jobs/:job_id/report`
**Auth:** Admin

### Purpose
AI-generated narrative ranking report with full justification per candidate.

### Endpoint
`GET /jobs/{job_id}/report` → returns `text/markdown`

### UI elements
- Full-width Markdown renderer
- Print/export button (browser print dialog)
- Back link to dashboard

---

## Screen 7 — Chatbot de Entrevista

**Route:** `/interview/:session_id` or `/interview` (starts new session)
**Auth:** Bearer token (`Authorization: Bearer {token}`)

### Purpose
Candidate-facing interview. 8-dimension conversational evaluation driven by the AI dialogue conductor.

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/interviews/sessions` | Create new session (returns session_id + D1 question) |
| `POST` | `/interviews/sessions/{id}/message` | Send answer, receive next question or result |
| `GET` | `/interviews/sessions/{id}` | Load session history + current state |
| `POST` | `/interviews/sessions/{id}/interrupt` | Abort in-progress AI evaluation |

### Session creation request
```typescript
// With Bearer token — no body needed
// Fallback (dev/admin key):
{ job_id: string, candidate_id: string }
```

### UI elements

#### Interview view (active session)
- **Progress bar**: "Dimensión 3 de 8 — D3: Autonomía técnica"
- **Question card**: current dimension name + question text
- **Message history**: chat bubbles (assistant = left, user = right)
- **Input area**: textarea + "Enviar" button
  - Disabled while `session_busy` (processing lock held)
  - Shows spinner: "Procesando tu respuesta..."
- **Interrupt button**: visible while processing; calls `POST /sessions/{id}/interrupt`

#### Post-interview result view
Shown when `session_status = "completed"` and `evaluation_result` is present:
- **Resultado badge**: APTO (green) or DESCARTADO (red)
- **Score gauge**: `X.XX / 5`
- **Dimension breakdown table**: D1–D8 | score | justificación
- Message: "Gracias por completar la entrevista. El equipo revisará los resultados."

### Error states
| HTTP | `error` code | Behavior |
|------|-------------|---------|
| `409` | `session_busy` | Disable input, show spinner, retry automatically after 3s |
| `409` | `session_already_exists` | Redirect to existing session using returned `session_id` |
| `410` | `session_closed` | Show result (if completed) or "sesión expirada/abandonada" |
| `422` | `candidate_not_eligible` | "No cumples los requisitos para acceder a la entrevista." |
| `401` | — | "Token inválido o expirado." |

### State machine
```
POST /sessions → active
  ↓
POST /sessions/{id}/message (×N, one per dimension turn)
  ↓ (after 8 dimensions locked)
evaluation_result returned → completed
  or
POST /sessions/{id}/interrupt → abandoned
```

---

## Screen 8 — Health / API Status

**Route:** no dedicated page — used as a global status indicator
**Auth:** Public (no header needed)

### Purpose
Verify that the API and its dependencies (PostgreSQL, Redis) are reachable. Used to show
a live connection indicator in the UI and to gracefully degrade if the backend is down.

### Endpoint
`GET /health`

### Response shape
```typescript
// 200 OK — all systems up
{
  status: "ok"
  db: "ok" | "error"
  redis: "ok" | "error"
}

// 503 Service Unavailable — one or more systems down
{
  status: "error"
  db: "ok" | "error"
  redis: "ok" | "error"
}
```

### UI usage
- **Global status dot** (top-right of nav): green = API reachable, red = unreachable
- **On app load**: call `/health` once; if `503` or network error → show banner
  "El servidor no está disponible. Intenta más tarde."
- **Per-dependency**: if `db: "error"` or `redis: "error"` even with `status: "ok"`,
  show a warning in the admin dashboard: "Problema de infraestructura detectado."

---

## Shared components

| Component | Used in |
|-----------|---------|
| `MarkdownRenderer` | Screen 5, Screen 6 |
| `ResultBadge` (APTO/DESCARTADO/Pendiente) | Screen 1, Screen 4, Screen 7 |
| `KOBadge` (PASA/FALLA) | Screen 1, Screen 4 |
| `ScoreDisplay` (X.XX / 5) | Screen 1, Screen 4, Screen 7 |
| `DimensionScoreCard` | Screen 4, Screen 7 |
| `LoadingSpinner` | Screen 2, Screen 7 |

---

## API client notes

- `Content-Type: application/json` for all JSON bodies
- `multipart/form-data` only for `POST /candidates/upload`
- All error responses follow: `{ error: "error_code", message?: string }`
- `X-Request-ID` header returned in every response (useful for debugging)
- CORS origins configured: `http://localhost:3000`, `http://localhost:8000`
