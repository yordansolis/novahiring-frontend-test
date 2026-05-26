# NovaHiring — Selección de Ganador de Entrevista y Auditoría del Reclutador

> Referencia completa de los nuevos endpoints para controlar el proceso de selección post-entrevista.
> Base URL: `http://localhost:8000/api/v1`
> Auth admin: `X-API-Key: {api_key}`

---

## Resumen del flujo

```
CV subido × 5  →  Evaluación AI  →  Invitaciones enviadas (deadline = ahora + 7 días)
                                          │
                              Candidatos hacen entrevista chatbot
                                          │
                              Reclutador monitorea vía /audit
                                          │
              ┌───────────────────────────┴───────────────────────────┐
              │  todos completaron                deadline expiró      │
              └───────────────────────────┬───────────────────────────┘
                                          ▼
                               POST /jobs/{id}/close
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  │                       │                       │
             GANADOR notificado    RECHAZADOS notificados    Sesiones activas
             (notification_type=  (notification_type=        → expired
              "winner")            "rejection")
```

---

## 1. Auditoría del proceso — `GET /jobs/{job_id}/audit`

**Auth:** Admin (`X-API-Key`)

Vista completa del estado del proceso: todos los candidatos, su progreso en la entrevista, notificaciones enviadas y si el proceso está listo para cerrarse.

### Request

```
GET /api/v1/jobs/{job_id}/audit
X-API-Key: {api_key}
```

### Response `200`

```typescript
{
  job_id:                  string
  title:                   string
  status:                  "active" | "closed"
  interview_deadline:      string | null   // ISO 8601, e.g. "2026-05-30T21:00:00+00:00"
  deadline_passed:         boolean
  closed_at:               string | null   // ISO 8601
  winner_candidate_id:     string | null
  winner_nombre:           string | null
  ready_to_close:          boolean         // true cuando: todos completaron O deadline pasó O ya cerrado
  total_apto:              number          // candidatos que pasaron el KO del CV
  total_completed_interviews: number
  all_candidates: [
    {
      candidate_id:        string
      nombre:              string
      email:               string | null
      passed_ko:           boolean         // true = APTO de CV, false = DESCARTADO
      interview_status:    "pending" | "active" | "completed" | "abandoned" | "expired"
      interview_score:     string | null   // e.g. "4.84" — solo si passed_ko=true
      rank:                number | null   // 1=ganador, null si no completó o DESCARTADO
      account_activated:   boolean         // true si el candidato ya inició al menos 1 sesión
      invitation_sent:     boolean
      notifications_sent:  string[]        // e.g. ["interview_invitation", "winner"]
      is_winner:           boolean
      session_id:          string | null   // para navegar al chat
    }
  ]
}
```

### Significado de `interview_status`

| Valor | Significado |
|-------|-------------|
| `"pending"` | Nunca inició la entrevista (no tiene sesión) |
| `"active"` | Sesión en curso (respondiendo preguntas) |
| `"completed"` | Completó las 8 dimensiones y fue evaluado |
| `"abandoned"` | Abandonó o el reclutador interrumpió |
| `"expired"` | El proceso se cerró con la sesión aún abierta |

### Significado de `notifications_sent`

| Valor | Cuándo se envía |
|-------|-----------------|
| `"interview_invitation"` | Automáticamente al ser evaluado APTO por CV |
| `"winner"` | Al cerrar el proceso — solo al ganador |
| `"rejection"` | Al cerrar el proceso — al resto de APTO |

### Cuándo mostrar el botón "Cerrar proceso"

```typescript
// Habilitar el botón cuando:
const canClose = audit.ready_to_close && audit.status !== "closed"

// ready_to_close = true si:
// - audit.deadline_passed === true, O
// - audit.total_completed_interviews === audit.total_apto, O
// - audit.status === "closed" (ya cerrado)
```

### Error responses

| HTTP | Condición |
|------|-----------|
| `404` | Job no encontrado |
| `403` | API key inválida |

---

## 2. Cerrar el proceso — `POST /jobs/{job_id}/close`

**Auth:** Admin (`X-API-Key`)

Cierra formalmente el proceso de selección:
- Selecciona el ganador (APTO con mayor `weighted_score` entre entrevistas completadas)
- Envía notificación al ganador
- Envía notificación de rechazo al resto de candidatos APTO
- Marca como `expired` las sesiones que estaban activas
- Si nadie completó la entrevista, cierra el proceso sin ganador (`winner_candidate_id: null`)

> **No requiere body.** La selección del ganador es 100% Python — no llama a IA.

### Request

```
POST /api/v1/jobs/{job_id}/close
X-API-Key: {api_key}
```

### Response `200`

```typescript
{
  job_id:                string
  status:                "closed"
  winner_candidate_id:   string | null   // null si nadie completó la entrevista
  winner_nombre:         string | null
  winner_score:          string | null   // e.g. "4.84"
  sessions_expired:      number          // sesiones que estaban activas al cerrar
  notifications_sent:    number          // winner + rejections enviados
}
```

### Error responses

| HTTP | Condición | `detail` |
|------|-----------|----------|
| `404` | Job no encontrado | `"Job not found"` |
| `409` | Ya fue cerrado | `{"error": "already_closed"}` |
| `403` | API key inválida | — |

### Lógica del ganador

```
Entre candidatos APTO que tienen ChatSession.status = "completed":
  → Ordenar por weighted_score DESC
  → El primero = ganador

Si 0 candidatos completaron:
  → winner_candidate_id = null
  → Se envían rechazos a todos los APTO igualmente
```

---

## 3. Ver chats de candidatos — `GET /interviews/admin/sessions`

**Auth:** Admin (`X-API-Key`)

Lista todas las sesiones de entrevista. Útil para el reclutador cuando quiere revisar transcripciones antes de cerrar el proceso o verificar si un candidato mintió.

### Request

```
GET /api/v1/interviews/admin/sessions?job_id={job_id}
X-API-Key: {api_key}
```

| Query param | Tipo | Descripción |
|-------------|------|-------------|
| `job_id` | `string` (opcional) | Filtrar por vacante. Si se omite, retorna todas. |

### Response `200`

```typescript
{
  sessions: [
    {
      session_id:             string
      candidate_id:           string | null
      candidate_nombre:       string | null
      job_id:                 string | null
      status:                 "active" | "completed" | "abandoned" | "expired"
      current_question_index: number         // 0-7, dimensión actual
      total_questions:        number         // siempre 8
      weighted_score:         string | null  // score final si completó
      created_at:             string | null  // ISO 8601
      updated_at:             string | null  // ISO 8601
    }
  ],
  total: number
}
```

---

## 4. Ver transcripción completa de una sesión — `GET /interviews/sessions/{session_id}`

**Auth:** Admin (`X-API-Key`) — funciona también con Bearer token del candidato

Retorna el historial completo de mensajes de una sesión específica. Usar el `session_id` obtenido del endpoint anterior o del audit.

### Request

```
GET /api/v1/interviews/sessions/{session_id}
X-API-Key: {api_key}
```

### Response `200`

```typescript
{
  session_id:             string
  job_id:                 string | null
  candidate_id:           string | null
  status:                 string
  current_question_index: number
  total_questions:        number
  messages: [
    {
      role:            "assistant" | "user"
      content:         string          // texto del mensaje
      sequence_number: number          // orden cronológico
    }
  ],
  evaluation_result: {                 // solo si status = "completed"
    session_id:        string
    evaluation_id:     string
    weighted_score:    string
    normalized_score:  string
    resultado:         "APTO"
    dimension_scores: [
      {
        dimension_id:  string          // "D1"–"D8"
        score:         string          // "1"–"5"
        peso:          number
        justificacion: string
        evidencia:     string
      }
    ]
  } | null,
  context_summary: object | null       // estado interno de la máquina de estados
}
```

---

## 5. Flujo de pantallas sugerido para el reclutador

### Pantalla: Panel de Vacante

```
┌─────────────────────────────────────────────────────────────────┐
│ Desarrollador Full-Stack — Clínica Salud Valencia               │
│ Estado: ACTIVO  │  Deadline: 30/05/2026  │  Faltan: 5 días     │
│                                                                   │
│  3 APTOS  │  2 completaron entrevista  │  1 pendiente            │
│                                                                   │
│  [Ver Audit Completo]              [Cerrar Proceso] (disabled)  │
└─────────────────────────────────────────────────────────────────┘
```

El botón **"Cerrar Proceso"** se habilita cuando `ready_to_close = true`.

---

### Pantalla: Audit — tabla de candidatos

Columnas sugeridas para la tabla:

| # | Candidato | Estado entrevista | Score | Cuenta activa | Notificaciones | Acciones |
|---|-----------|------------------|-------|--------------|----------------|---------|
| 1 | Sofía Delgado | ✅ Completada (4.84) | 4.84 | ✅ | Invitación, Ganadora | Ver chat |
| 2 | Carlos Rivas | ✅ Completada (4.74) | 4.74 | ✅ | Invitación, Rechazo | Ver chat |
| 3 | Elena Martínez | ⏳ Pendiente | — | ❌ | Invitación | — |
| — | Jhordan Solis | ❌ DESCARTADO | — | — | — | — |

Colores de estado:
- `completed` → verde
- `active` → amarillo parpadeante
- `pending` → gris
- `abandoned` / `expired` → rojo suave
- `DESCARTADO` → tachado / gris oscuro

---

### Pantalla: Transcripción del chat

Abrir al hacer clic en "Ver chat" → llamar a `GET /interviews/sessions/{session_id}`.

Layout sugerido:
```
┌─────────────────────────────────────────────────���────┐
│ Chat — Sofía Delgado  │  Completada  │  Score: 4.84  │
├──────────────────────────────────────────────────────┤
│ [D1] ¿Qué experiencia tienes con WhatsApp API?       │  ← assistant
│                                                       │
│   "Implementé el envío de notificaciones de          │
│    citas médicas usando la API oficial de Meta..."   │  ← user
│                                                       │
│ [D1] Entendido, lo tomamos en cuenta. Pasamos a...   │  ← assistant
│                                                       │
│ [D2] ¿Cómo has aplicado RGPD en proyectos...?       │  ← assistant
│  …                                                    │
├──────────────────────────────────────────────────────┤
│ EVALUACIÓN FINAL                                      │
│ D1 Integraciones ×3 → 5/5  │ D2 RGPD ×3 → 5/5      │
│ D3 Autonomía ×3 → 5/5      │ D4 Build/Buy ×3 → 4/5  │
│ …                                                     │
│ Score total: 4.84 / 5                                 │
└──────────────────────────────────────────────────────┘
```

---

## 6. Estados del job y transiciones

```
"active"  →  POST /close  →  "closed"
```

Un job `"closed"` no puede volver a `"active"`. El botón "Cerrar Proceso" debe desaparecer o quedar disabled cuando `status === "closed"`.

---

## 7. Deadline y cierre automático

El deadline se setea **automáticamente** cuando se envían las primeras invitaciones (al evaluar el 5to CV).

**Valor por defecto: `1 día`** (configurable en `.env`):

```env
INTERVIEW_DEADLINE_DAYS=1
```

| Escenario | Comportamiento |
|-----------|---------------|
| Se sube el 5to CV → se evalúan candidatos → se envían invitaciones | `interview_deadline = ahora + 1 día` |
| Todos responden antes del deadline | `ready_to_close = true` (por `all_apto_completed`) |
| Expira el deadline sin que todos respondan | `ready_to_close = true` (por `deadline_passed`) |
| El reclutador llama a `POST /close` | Se selecciona ganador **solo entre los que completaron**; los demás reciben rechazo |

El sistema **no cierra el proceso solo** — es el reclutador quien llama a `POST /close` cuando lo considere oportuno. El audit le muestra `deadline_passed: true` y `ready_to_close: true` como señal de que puede proceder.

---

## 8. Asociación entrevista ↔ CV

### Cómo está relacionado en la base de datos

```
candidates (1 fila por candidato)
  ├── id                ← hilo conector de todo
  ├── cv_text           ← el CV original subido
  ├── profile_json      ← keywords extraídos del CV para KO screening
  └── passed_ko         ← resultado del KO de CV (True/False)

evaluations (puede tener 2 filas por candidato APTO)
  ├── [eval CV]        created_at: T0  │ weighted_score: 4.58  │ source: CV
  └── [eval entrevista] created_at: T1  │ weighted_score: 4.84  │ source: entrevista
                         ↑ esta es la "latest" → la que usa /audit y /report

chat_sessions (1 por entrevista)
  └── candidate_id  ←─ mismo id que en candidates y evaluations
```

El `candidate_id` es el hilo que une todo: **CV → evaluación CV → invitación → sesión de entrevista → evaluación de entrevista → ganador**.

### Scores: CV vs entrevista

Actualmente la tabla `evaluations` guarda ambas evaluaciones para el mismo candidato, distinguidas únicamente por `created_at`. El sistema **siempre usa la más reciente** (que es la de entrevista si ya la completó).

> **Limitación conocida:** no existe un campo `source: "cv" | "interview"` en `Evaluation`. Si en el futuro se quiere mostrar ambos scores en paralelo (para detectar candidatos inconsistentes entre CV y entrevista), habría que agregar ese campo y una nueva migración.

### Cómo el reclutador puede comparar CV vs entrevista hoy

Usando los endpoints existentes:

```
GET /candidates/{job_id}/ranking
  → cv_text + weighted_score (score de entrevista si ya la hizo, de CV si no)

GET /interviews/sessions/{session_id}
  → transcripción completa + scores por dimensión de la entrevista

GET /jobs/{job_id}/report
  → reporte Markdown con ranking + justificación por dimensión
```

Para ver el **score de CV original** antes de que el candidato hiciera la entrevista, habría que consultar directamente todas las `evaluations` ordenadas por `created_at ASC` — la primera es siempre el CV.

### Tabla de comparación sugerida en el frontend

| Candidato | Score CV | Score Entrevista | Δ | Ganador |
|-----------|----------|-----------------|---|---------|
| Sofía Delgado | 4.84 | 4.84 | 0.00 | ✅ |
| Carlos Rivas | 4.74 | 4.74 | 0.00 | — |
| Elena Martínez | 4.58 | — (pendiente) | — | — |

> Esta tabla requeriría que el backend exponga ambos scores por separado. Con el modelo actual se puede construir consultando todas las `evaluations` del candidato ordenadas por fecha — la primera = CV, la última = entrevista.

---

## 9. Selección del ganador — lógica completa

```
Entre candidatos APTO (passed_ko=True) que tienen ChatSession.status="completed":
  1. Tomar la Evaluation más reciente de cada uno (= la de entrevista)
  2. Ordenar por weighted_score DESC
  3. El primero = ganador

Fórmula del score (nunca la IA):
  weighted_score = Σ(score_dimension × peso_dimension) / peso_total
  Ejemplo Sofía: (5×3 + 5×3 + 5×3 + 4×3 + 5×2 + 5×2 + 5×2 + 5×1) / 19 = 4.84

Si 0 candidatos completaron la entrevista:
  winner_candidate_id = null
  Todos los APTO reciben notificación de rechazo igualmente
```

---

## 11. Resumen de endpoints nuevos

| Método | Ruta | Auth | Propósito |
|--------|------|------|-----------|
| `GET` | `/jobs/{id}/audit` | Admin | Estado completo del proceso |
| `POST` | `/jobs/{id}/close` | Admin | Cerrar proceso y seleccionar ganador |
| `GET` | `/interviews/admin/sessions` | Admin | Listar todos los chats por vacante |
| `GET` | `/interviews/sessions/{id}` | Admin o candidato | Ver transcripción completa de un chat |

> Los cuatro endpoints existían o son nuevos en esta versión. Para el contexto completo de los demás endpoints de jobs y candidates ver `specs-admin.md`.
