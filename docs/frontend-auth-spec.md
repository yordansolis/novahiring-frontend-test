# NovaHiring — Frontend Auth Spec

> Companion to `frontend-specs.md`. Read this before implementing any protected screen.
> Base URL: `http://localhost:8000/api/v1`

---

## Overview

The system has **three auth levels** and **two login flows**:

| Actor | How they log in | What they get | How they use it |
|-------|----------------|---------------|-----------------|
| Admin / Recruiter | `POST /auth/admin/login` with username + password | `api_key` | `X-API-Key: {api_key}` header on every admin request |
| Candidate (APTO) | `POST /auth/candidate/login` with username + password | `token` (Bearer) | `Authorization: Bearer {token}` header on interview requests |
| Candidate (CV upload) | **No login** | Nothing | `POST /candidates/upload` is fully public — no header needed |

> **Dev mode shortcut:** if `API_KEY_ADMIN` is empty in `.env`, the backend bypasses all admin auth automatically. You can skip the login screen during early development.

---

## Public endpoint — CV Upload

This endpoint requires **no authentication**. It is the starting point of the candidate journey.

```
POST /api/v1/candidates/upload
Content-Type: multipart/form-data   ← browser sets this automatically when using FormData
```

| Field | Type | Required |
|-------|------|----------|
| `job_id` | string (form field) | ✅ |
| `nombre` | string (form field) | ✅ |
| `email` | string (form field) | ✅ |
| `cv_file` | file (.pdf or .md) | ✅ |

**Response `201`:**
```typescript
{ candidate_id: string, status: "received", passed_ko: boolean }
```

**Key errors:**
| HTTP | `error` | Meaning |
|------|---------|---------|
| `409` | `applications_closed` | 5-candidate cap reached — position is closed |
| `409` | `duplicate_applicant` | Same email already applied to this job |
| `409` | `duplicate_cv` | Same CV content (SHA256) already registered |
| `400` | `unsupported_file_type` | Not `.pdf` or `.md` |
| `422` | `cv_unreadable` | File has no readable text |
| `404` | `job_not_found` | Invalid `job_id` |

> Full screen spec with UI details in **Screen 0** below.

---

## Auth endpoints

### `POST /auth/admin/login`

**Purpose:** Recruiter logs in with username + password, receives the API key to use from that point on.

**Auth required:** None (public endpoint)

#### Request
```typescript
{
  username: string   // e.g. "admin"
  password: string   // e.g. "admin123"
}
```

#### Response `200`
```typescript
{
  api_key: string     // e.g. "a636936b82f8fbdf7f60c9ae903f0ead..."
  token_type: "api-key"
}
```

#### Error responses
| HTTP | Condition | `detail` |
|------|-----------|----------|
| `401` | Wrong username or password | `"Invalid credentials"` |
| `503` | Admin not yet configured (no `create_admin.py` run) | `"API_KEY_ADMIN not configured"` |

#### Frontend usage
```typescript
const res = await fetch(`${BASE_URL}/auth/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
})
const { api_key } = await res.json()
// Store api_key — see Token Storage section
```

---

### `POST /auth/candidate/login`

**Purpose:** Candidate who received their credentials (via admin) logs in and gets a Bearer token to start the interview.

**Auth required:** None (public endpoint)

#### Request
```typescript
{
  username: string   // e.g. "sofia.delgado.3a1f"
  password: string   // e.g. "Xk7mPq2Nrt"
}
```

#### Response `200`
```typescript
{
  token: string        // UUID — use as Bearer token
  token_type: "bearer"
  candidate_id: string
  job_id: string
}
```

#### Error responses
| HTTP | Condition | `detail` |
|------|-----------|----------|
| `401` | Wrong username or password | `"Invalid credentials"` |

#### Frontend usage
```typescript
const res = await fetch(`${BASE_URL}/auth/candidate/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
})
const { token, candidate_id, job_id } = await res.json()
// Store token — see Token Storage section
```

---

## Where credentials come from

### Admin credentials
Set once when the backend is configured. The dev gets them from whoever ran:
```bash
uv run python create_admin.py
```
Default for this project:
```
Username: admin
Password: admin123
```

### Candidate credentials
Generated automatically when a candidate is declared **APTO** during batch evaluation.
The admin sees them in `GET /candidates/{job_id}` — two new fields per APTO candidate:

```typescript
// GET /api/v1/candidates/{job_id}  (admin endpoint)
CandidateListItem[] = {
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean | null
  resultado: "APTO" | "DESCARTADO" | null
  weighted_score: string | null
  login_username: string | null   // ← null for DESCARTADO candidates
  login_password: string | null   // ← null for DESCARTADO candidates
}
```

The admin copies these and gives them to the candidate (by email, WhatsApp, etc.).
Token TTL: **7 days** from first login (refreshed on each new login).

---

## Token storage

Store tokens in `localStorage` (or `sessionStorage` for higher security).
Use consistent key names across the app:

```typescript
// Keys
const ADMIN_API_KEY  = "nova_admin_api_key"
const CANDIDATE_TOKEN = "nova_candidate_token"
const CANDIDATE_ID   = "nova_candidate_id"
const CANDIDATE_JOB  = "nova_candidate_job_id"

// Save after admin login
localStorage.setItem(ADMIN_API_KEY, api_key)

// Save after candidate login
localStorage.setItem(CANDIDATE_TOKEN, token)
localStorage.setItem(CANDIDATE_ID, candidate_id)
localStorage.setItem(CANDIDATE_JOB, job_id)

// Clear on logout
localStorage.removeItem(ADMIN_API_KEY)
// ...
```

---

## API client helpers

Create two wrapper functions — call these instead of raw `fetch`:

```typescript
const BASE = "http://localhost:8000/api/v1"

// Admin-authenticated request
async function adminFetch(path: string, options: RequestInit = {}) {
  const apiKey = localStorage.getItem("nova_admin_api_key") ?? ""
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...options.headers,
    },
  })
}

// Candidate-authenticated request (Bearer token)
async function candidateFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("nova_candidate_token") ?? ""
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  })
}

// Public request (no auth)
async function publicFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BASE}${path}`, options)
}
```

---

## Route guards

| Route | Guard | Redirect if fails |
|-------|-------|-------------------|
| `/dashboard`, `/jobs/*` | `hasAdminKey()` | `/login/admin` |
| `/interview/*` | `hasCandidateToken()` | `/login/candidate` |
| `/upload` | none | — |
| `/login/*` | none | — |

```typescript
function hasAdminKey(): boolean {
  return !!localStorage.getItem("nova_admin_api_key")
}

function hasCandidateToken(): boolean {
  return !!localStorage.getItem("nova_candidate_token")
}
```

> **Note:** These guards only check local storage — they do NOT validate the key with the server on every navigation. A `401` or `403` from any API call means the key is expired or invalid → redirect to the relevant login screen and clear storage.

---

## Screens to build

### Screen 0 — CV Upload (Candidate entry point)

**Route:** `/upload` or `/jobs/:job_id/apply`
**Auth:** None — fully public, no header required

#### Purpose
First contact point for every candidate. They upload their CV here before any credentials exist.
This is where the auth journey begins — if they pass KO, they will eventually receive login credentials.

#### Endpoint
```
POST /api/v1/candidates/upload
Content-Type: multipart/form-data
```

#### Form fields
| Field | Type | Notes |
|-------|------|-------|
| `job_id` | text (hidden) | ID of the job opening — hardcode or pass via URL param |
| `nombre` | text | Full name of the candidate |
| `email` | email | Used later when admin sends credentials |
| `cv_file` | file | `.pdf` or `.md` only — max recommended 5 MB |

#### Request example
```typescript
const form = new FormData()
form.append("job_id", "job-clinica-salud-valencia-001")
form.append("nombre", "Sofía Delgado")
form.append("email", "sofia@example.com")
form.append("cv_file", fileInput.files[0])

const res = await fetch(`${BASE_URL}/candidates/upload`, {
  method: "POST",
  body: form,
  // Do NOT set Content-Type — browser sets it with boundary automatically
})
```

#### Response `201`
```typescript
{
  candidate_id: string
  status: "received"
  passed_ko: boolean
}
```

#### Result states after submit
| `passed_ko` | Message to show |
|------------|----------------|
| `true` | "Tu CV fue recibido y pasaste el filtro inicial. El equipo lo revisará y te enviaremos las credenciales de acceso si eres seleccionado/a." |
| `false` | "Tu CV fue recibido. Lamentablemente no cumples con los requisitos mínimos para este puesto." |

#### Error states
| HTTP | `error` field | Message to show |
|------|--------------|----------------|
| `409` | `applications_closed` | "Esta posición ya no acepta más candidatos." |
| `409` | `duplicate_applicant` | "Ya existe una candidatura registrada con este email para este puesto." |
| `409` | `duplicate_cv` | "Este CV ya fue registrado anteriormente." |
| `400` | `unsupported_file_type` | "Solo se aceptan archivos .pdf o .md." |
| `422` | `cv_unreadable` | "No se pudo leer el archivo. Usa un PDF con texto o un .md." |
| `404` | `job_not_found` | "El puesto indicado no existe." |

#### UI elements
- File drag-and-drop zone with label: "Arrastra tu CV aquí o haz clic para seleccionar"
- Format hint below: "Solo archivos .pdf o .md"
- Fields: Nombre completo, Email
- "Enviar candidatura" submit button
- Loading state: spinner + "Enviando..."
- Success state (passed_ko true): green check + message above
- Success state (passed_ko false): neutral info card + message above
- Error state: red alert with the relevant message

#### Connection to auth flow
```
passed_ko: true  → candidate waits
                 → admin evaluates (automatic on 5th CV)
                 → if APTO: admin sees login_username + login_password in dashboard
                 → admin sends credentials to candidate (email / WhatsApp)
                 → candidate goes to /login/candidate

passed_ko: false → flow ends here, no credentials ever generated
```

#### UI tip
After a successful `passed_ko: true` submission, show a clear next-step message:

> "Nuestro equipo evaluará tu candidatura junto con las demás. Si eres seleccionado/a, recibirás un usuario y contraseña para acceder a la entrevista. Puedes entrar en **→ /login/candidate** cuando los tengas."

---

### Screen A — Admin Login

**Route:** `/login/admin` (or `/login`)
**Auth:** None

#### UI elements
- Logo / app name header
- Form: `username` (text input) + `password` (password input)
- "Iniciar sesión" submit button
- Error message area

#### Flow
```
Fill form → POST /auth/admin/login
  ├── 200 → save api_key to localStorage → redirect to /dashboard
  ├── 401 → show "Usuario o contraseña incorrectos"
  └── 503 → show "El servidor no está configurado todavía"
```

#### States
| State | UI |
|-------|----|
| Idle | Form enabled, button active |
| Loading | Button shows spinner, form disabled |
| Error 401 | Red alert under form: "Usuario o contraseña incorrectos" |
| Error 503 | Red alert: "El servidor no está configurado" |

---

### Screen B — Candidate Login

**Route:** `/login/candidate`
**Auth:** None

#### Purpose
Candidate received their username + password from the admin and uses them here to start the interview.

#### UI elements
- Title: "Acceder a tu entrevista"
- Short explanation: "Introduce las credenciales que te enviamos para comenzar la entrevista."
- Form: `username` (text input) + `password` (password input)
- "Entrar" submit button
- Link to CV upload: "¿Todavía no has enviado tu CV? → Candidatarse aquí"

#### Flow
```
Fill form → POST /auth/candidate/login
  ├── 200 → save token + candidate_id + job_id → redirect to /interview
  └── 401 → show "Credenciales incorrectas. Comprueba los datos que te enviaron."
```

#### States
| State | UI |
|-------|----|
| Idle | Form enabled, button active |
| Loading | Button shows spinner, form disabled |
| Error 401 | Red alert: "Credenciales incorrectas o expiradas" |

---

### Screen C — Admin: Candidate credentials panel

This is an addition to the existing **Screen 1 (Dashboard)** — not a new standalone screen.

When the admin views the candidate table, APTO candidates now show their login credentials so the admin can copy and send them.

#### New columns / panel on `CandidateListItem`
```typescript
// Only shown for resultado === "APTO"
login_username: string   // e.g. "sofia.delgado.3a1f"
login_password: string   // e.g. "Xk7mPq2Nrt"
```

#### UI suggestion
Inline under each APTO candidate row — a collapsed "Credenciales de acceso" section:
```
┌─────────────────────────────────────────────────┐
│ Sofía Delgado   APTA   4.84/5                   │
│  ▼ Credenciales de acceso a la entrevista        │
│    Usuario:    sofia.delgado.3a1f  [Copiar]      │
│    Contraseña: Xk7mPq2Nrt         [Copiar]      │
└─────────────────────────────────────────────────┘
```
- "Copiar" button calls `navigator.clipboard.writeText()`
- Only visible for `resultado === "APTO"` and `login_username !== null`
- DESCARTADO candidates show neither row (fields are `null`)

---

## Logout

```typescript
function logoutAdmin() {
  localStorage.removeItem("nova_admin_api_key")
  window.location.href = "/login/admin"
}

function logoutCandidate() {
  localStorage.removeItem("nova_candidate_token")
  localStorage.removeItem("nova_candidate_id")
  localStorage.removeItem("nova_candidate_job_id")
  window.location.href = "/login/candidate"
}
```

Trigger logout on any `401` / `403` from a protected API call:

```typescript
async function adminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(...)
  if (res.status === 401 || res.status === 403) {
    logoutAdmin()
    return res
  }
  return res
}
```

---

## Full auth flow diagram

```
ADMIN FLOW
──────────
/login/admin
    │
    ├── POST /auth/admin/login {username, password}
    │         └── 200 → api_key saved to localStorage
    │
    └── Redirect to /dashboard
              │
              ├── All requests use: X-API-Key: {api_key}
              │
              ├── GET /candidates/{job_id}   → see candidates + APTO credentials
              ├── GET /jobs/{job_id}/report  → ranking report
              └── ...


CANDIDATE FLOW
──────────────
/upload  ← Screen 0 (public, no auth, no header)
    │
    ├── POST /candidates/upload  (multipart/form-data)
    │     Fields: job_id · nombre · email · cv_file (.pdf/.md)
    │         │
    │         ├── 409 applications_closed  → "Posición cerrada"
    │         ├── 409 duplicate_applicant  → "Email ya registrado para este puesto"
    │         ├── 409 duplicate_cv         → "CV ya enviado"
    │         ├── 400 unsupported_file_type → "Solo .pdf o .md"
    │         ├── 422 cv_unreadable        → "Archivo sin texto legible"
    │         ├── 201 passed_ko: false    → "No cumples los requisitos"  (flow ends)
    │         └── 201 passed_ko: true     → "Recibirás tus credenciales pronto"
    │                                              │
    │                         [Backend: on 5th CV → batch AI evaluation]
    │                         [If APTO: login_username + login_password generated]
    │                         [Admin sees credentials in GET /candidates/{job_id}]
    │                         [Admin sends credentials to candidate manually]
    │
/login/candidate  ← Screen B
    │
    ├── POST /auth/candidate/login {username, password}
    │         ├── 401 → "Credenciales incorrectas"
    │         └── 200 → token + candidate_id + job_id saved to localStorage
    │
    └── Redirect to /interview  ← Screen 7 (from frontend-specs.md)
              │
              ├── All requests use: Authorization: Bearer {token}
              │
              ├── POST /interviews/sessions          → start interview
              ├── POST /interviews/sessions/{id}/message → send answers
              └── GET  /interviews/sessions/{id}     → load history
```

---

## Error handling reference

| Scenario | HTTP | Behavior |
|----------|------|----------|
| Wrong admin credentials | `401` | Show error on login form, do NOT redirect |
| Wrong candidate credentials | `401` | Show error on login form, do NOT redirect |
| Expired / invalid admin key | `403` | Clear localStorage, redirect to `/login/admin` |
| Expired / invalid candidate token | `401` | Clear localStorage, redirect to `/login/candidate` |
| Admin not configured | `503` on login | Show "Servidor no configurado" message |
| Candidate not APTO (interview attempt) | `422` | Show "No elegible para entrevista" |

---

## Dev shortcuts

In dev mode (`API_KEY_ADMIN=""` in `.env`), admin auth is bypassed by the backend.
You can still build and test the login screen normally, but you don't need real credentials to hit protected endpoints during development.

To test the full login flow locally:
```bash
# 1. Make sure Docker is running and DB is seeded
make start-dev

# 2. Admin login (credentials set by create_admin.py)
curl -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# → {"api_key": "...", "token_type": "api-key"}

# 3. Get APTO candidate credentials from the admin listing
curl http://localhost:8000/api/v1/candidates/job-clinica-salud-valencia-001 \
  -H "X-API-Key: <api_key_from_step_2>"
# → [..., {"nombre": "Sofía Delgado", "login_username": "sofia.delgado.xxxx", "login_password": "...", ...}]

# 4. Candidate login
curl -X POST http://localhost:8000/api/v1/auth/candidate/login \
  -H "Content-Type: application/json" \
  -d '{"username": "sofia.delgado.xxxx", "password": "<from_step_3>"}'
# → {"token": "...", "token_type": "bearer", "candidate_id": "...", "job_id": "..."}
```
