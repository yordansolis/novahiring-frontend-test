# NovaHiring — Spec: Credenciales de acceso del candidato

> Este documento explica de extremo a extremo cómo el reclutador obtiene y muestra las credenciales (`login_username` / `login_password`) de los candidatos APTO, y cómo el candidato las usa para entrar a la entrevista.
>
> Complementa: `frontend-auth-spec.md` (flujo de auth) y `specs-admin.md` (endpoints admin).

---

## ¿De dónde vienen las credenciales?

El backend genera automáticamente un usuario y contraseña únicos para cada candidato declarado **APTO** durante la evaluación de CVs.

```
5º CV sube → evaluación batch en background
  └─ candidato pasa KOs + score calculado
       └─ NotificationService.send_interview_invitation()
            ├─ genera login_username   ← formato: "nombre.apellido.XXXX"
            ├─ genera login_password   ← 10 chars alfanuméricos aleatorios
            ├─ guarda CandidateInvitation en DB
            └─ loguea en consola: [SIMULATED EMAIL] Login: xxx / yyy
```

El sistema **no envía emails reales**. El reclutador ve las credenciales en la API y las comunica al candidato por fuera (email, WhatsApp, etc.).

---

## Endpoint que expone las credenciales

### `GET /api/v1/candidates/{job_id}`

**Auth:** `X-API-Key: {api_key}` (admin)

**Response:**
```typescript
CandidateListItem[] = {
  candidate_id: string
  nombre: string
  email: string | null
  passed_ko: boolean | null
  resultado: "APTO" | "DESCARTADO" | null
  weighted_score: string | null      // ej. "4.84" — null si DESCARTADO o no evaluado
  login_username: string | null      // solo APTO — ej. "sofia.delgado.3a1f"
  login_password: string | null      // solo APTO — ej. "Xk7mPq2Nrt"
}
```

- `login_username` y `login_password` son **`null`** para candidatos DESCARTADO o no evaluados.
- Aparecen en **todos** los candidatos APTO, siempre que se hayan evaluado.

### Ejemplo de llamada (fetch)
```typescript
const res = await fetch(`${BASE_URL}/candidates/${jobId}`, {
  headers: { "X-API-Key": localStorage.getItem("nova_admin_api_key") ?? "" },
})
const candidates: CandidateListItem[] = await res.json()
```

---

## Cómo pintarlo en el dashboard del admin

### Dónde vive en la UI

Este panel va **dentro de la tabla de candidatos** (Screen 1 del dashboard). No es una pantalla separada.

### Layout sugerido por fila

```
┌──────────────────────────────────────────────────────────────────┐
│  Nombre              │ KO     │ Resultado  │ Score    │ Acción   │
├──────────────────────┼────────┼────────────┼──────────┼──────────┤
│  Sofía Delgado       │ PASA   │ APTA ✓     │ 4.84 / 5 │ [Ver]    │
│    ▼ Credenciales de acceso                                       │
│       Usuario:    sofia.delgado.3a1f   [📋 Copiar]               │
│       Contraseña: Xk7mPq2Nrt          [📋 Copiar]               │
├──────────────────────┼────────┼────────────┼──────────┼──────────┤
│  Miguel Torres       │ FALLA  │ DESCARTADO │   —      │ [Ver]    │
│    (sin credenciales)                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Reglas de visibilidad

| Condición | Mostrar credenciales |
|-----------|---------------------|
| `resultado === "APTO"` y `login_username !== null` | ✅ Sí |
| `resultado === "DESCARTADO"` | ❌ No |
| `resultado === null` (pendiente) | ❌ No |

---

## Código del componente (React + TypeScript)

### Componente `CredencialesPanel`

```tsx
// components/CredencialesPanel.tsx

interface Props {
  username: string
  password: string
}

export function CredencialesPanel({ username, password }: Props) {
  function copiar(texto: string) {
    navigator.clipboard.writeText(texto)
    // Opcional: mostrar toast "Copiado!"
  }

  return (
    <div className="credenciales-panel">
      <span className="label">Credenciales de acceso</span>
      <div className="campo">
        <span className="campo-label">Usuario:</span>
        <code>{username}</code>
        <button onClick={() => copiar(username)}>📋 Copiar</button>
      </div>
      <div className="campo">
        <span className="campo-label">Contraseña:</span>
        <code>{password}</code>
        <button onClick={() => copiar(password)}>📋 Copiar</button>
      </div>
    </div>
  )
}
```

### Integración en la fila de candidato

```tsx
// Dentro del componente de fila de candidato
{candidate.resultado === "APTO" && candidate.login_username && candidate.login_password && (
  <CredencialesPanel
    username={candidate.login_username}
    password={candidate.login_password}
  />
)}
```

### Con toggle expandible (opcional)

```tsx
// Si prefieres colapsar las credenciales por defecto
const [visible, setVisible] = useState(false)

{candidate.resultado === "APTO" && candidate.login_username && (
  <>
    <button onClick={() => setVisible(!visible)}>
      {visible ? "▲" : "▼"} Credenciales de acceso
    </button>
    {visible && (
      <CredencialesPanel
        username={candidate.login_username!}
        password={candidate.login_password!}
      />
    )}
  </>
)}
```

---

## Flujo completo desde la perspectiva del admin

```
1. Admin hace GET /candidates/{job_id}
   └─ recibe lista con login_username + login_password para candidatos APTO

2. Admin ve en el dashboard:
   - Sofía Delgado → APTA → usuario: sofia.delgado.3a1f / pass: Xk7mPq2Nrt
   - Carlos Rivas  → APTO → usuario: carlos.rivas.7b2c / pass: mN5pKq8Xrj
   - Elena Martínez → APTA → usuario: elena.martinez.2d9e / pass: vT3hLq6Ynk

3. Admin copia las credenciales (botón [Copiar]) y las envía al candidato
   por WhatsApp, email, u otro canal externo al sistema.

4. Candidato recibe usuario + contraseña y va a /login/candidate
```

---

## Flujo completo desde la perspectiva del candidato

```
Candidato recibe (fuera del sistema): usuario y contraseña
    │
    ▼
POST /api/v1/auth/candidate/login
  Body: { "username": "sofia.delgado.3a1f", "password": "Xk7mPq2Nrt" }
    │
    ├── 200 → { token, token_type: "bearer", candidate_id, job_id }
    │         → guardar token en localStorage
    │         → redirigir a /interview
    │
    └── 401 → "Credenciales incorrectas. Revisa los datos que te enviaron."

    ▼
POST /api/v1/interviews/sessions
  Header: Authorization: Bearer {token}
  Body: vacío (el token ya lleva candidate_id + job_id)
    │
    └── 201 → { session_id, messages: [bienvenida + pregunta D1] }
              → mostrar chatbot de entrevista
```

---

## Login de candidato — código

```typescript
// lib/api.ts

const BASE_URL = "http://localhost:8000/api/v1"

export async function loginCandidato(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (res.status === 401) {
    throw new Error("Credenciales incorrectas. Revisa los datos que te enviaron.")
  }
  if (!res.ok) {
    throw new Error("Error inesperado. Intenta de nuevo.")
  }

  const data = await res.json()
  // Guardar en localStorage para usarlos en la entrevista
  localStorage.setItem("nova_candidate_token", data.token)
  localStorage.setItem("nova_candidate_id", data.candidate_id)
  localStorage.setItem("nova_candidate_job_id", data.job_id)

  return data
}
```

```tsx
// pages/login-candidato.tsx (React / Next.js)

export default function LoginCandidato() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await loginCandidato(username, password)
      window.location.href = "/interview"
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Acceder a tu entrevista</h1>
      <p>Introduce las credenciales que te envió el equipo de selección.</p>

      <label>
        Usuario
        <input value={username} onChange={e => setUsername(e.target.value)} required />
      </label>

      <label>
        Contraseña
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
```

---

## Probar el flujo completo en local (sin frontend)

```bash
# 1. Levantar el servidor
make start-dev

# 2. Login admin
curl -s -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .
# → { "api_key": "abc123...", "token_type": "api-key" }

# 3. Ver candidatos APTO y sus credenciales
curl -s http://localhost:8000/api/v1/candidates/job-clinica-salud-valencia-001 \
  -H "X-API-Key: <api_key>" | jq '.[] | select(.resultado == "APTO") | {nombre, login_username, login_password}'
# → { "nombre": "Sofía Delgado", "login_username": "sofia.delgado.3a1f", "login_password": "Xk7mPq2Nrt" }

# 4. Login candidato con las credenciales obtenidas
curl -s -X POST http://localhost:8000/api/v1/auth/candidate/login \
  -H "Content-Type: application/json" \
  -d '{"username": "sofia.delgado.3a1f", "password": "Xk7mPq2Nrt"}' | jq .
# → { "token": "uuid...", "token_type": "bearer", "candidate_id": "...", "job_id": "..." }

# 5. Iniciar entrevista con el Bearer token
curl -s -X POST http://localhost:8000/api/v1/interviews/sessions \
  -H "Authorization: Bearer <token>" | jq .
# → { "session_id": "...", "messages": [...] }
```

---

## Notas de seguridad para MVP

| Aspecto | Comportamiento actual |
|---------|----------------------|
| Contraseñas en texto plano | `login_password` se guarda sin hash en DB — **aceptable para MVP**, cambiar en producción |
| TTL del token | 7 días desde la creación (no desde el primer login) |
| Sin renovación de token | Si el token expira, no hay endpoint para regenerarlo — solución temporal: re-evaluar o insertar directamente en DB |
| El admin ve la contraseña | Por diseño en MVP — facilita el envío manual; en producción enviar por email real |

---

## Checklist de implementación

- [ ] `GET /candidates/{job_id}` ya devuelve `login_username` y `login_password` — **backend listo**
- [ ] Componente `CredencialesPanel` con botón "Copiar" usando `navigator.clipboard.writeText()`
- [ ] Renderizar `CredencialesPanel` solo si `resultado === "APTO"` y `login_username !== null`
- [ ] Pantalla `/login/candidate` con form + manejo de error 401
- [ ] `POST /auth/candidate/login` → guardar token en `localStorage`
- [ ] Redirección a `/interview` tras login exitoso
- [ ] Guard en ruta `/interview` que verifica `nova_candidate_token` en localStorage
