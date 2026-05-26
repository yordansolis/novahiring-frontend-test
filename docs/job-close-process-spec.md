# Spec: Cierre del proceso de selección

**Dirigido a:** Dev frontend  
**Fecha:** 2026-05-24  
**Endpoint principal:** `POST /api/v1/jobs/{job_id}/close`

---

## ¿Qué hace este endpoint?

El reclutador puede cerrar el proceso de selección **en cualquier momento**, aunque no todos los candidatos hayan completado su entrevista. Al llamarlo:

1. El sistema identifica al **ganador automáticamente** — el candidato APTO con el mayor score entre los que sí terminaron su entrevista.
2. Las sesiones activas del resto se ponen en `expired`.
3. Los candidatos que nunca abrieron la entrevista quedan en `pending` (sin cambio).
4. Se envían notificaciones simuladas: ganador recibe aviso de selección, el resto de APTOS recibe rechazo.
5. El job queda con `status = "closed"`.

> **Regla clave:** Solo entran en la selección del ganador los candidatos que tienen una entrevista con `status = "completed"`. Si nadie la completó, `winner_candidate_id` es `null` y el proceso se cierra igual.

---

## Flujo visual

```
Reclutador pulsa "Cerrar proceso"
         │
         ▼
POST /api/v1/jobs/{job_id}/close
         │
         ├─── ¿Algún candidato completó la entrevista?
         │         SÍ → el de mayor score = GANADOR
         │         NO → winner = null, proceso igual se cierra
         │
         ├─── Sesiones activas → status: "expired"
         ├─── Candidatos sin sesión → sin cambio (pending)
         │
         ├─── Notificación al ganador (si existe)
         ├─── Notificación de rechazo al resto de APTOS
         │
         └─── Job → status: "closed"
```

---

## Escenario típico: 1 de 3 completó

Tienes 3 candidatos APTOS:

| Candidato | Estado entrevista | Score |
|-----------|-------------------|-------|
| Sofía Delgado | `completed` | 4.84 |
| Carlos Rivas | `active` (en curso) | — |
| Elena Martínez | `pending` (nunca abrió) | — |

El reclutador pulsa cerrar proceso.

**Resultado:**
- Sofía → **GANADORA** (única con entrevista completada)
- Carlos → sesión pasa a `expired`
- Elena → sigue como `pending` (sin sesión que cambiar)

---

## Request

```http
POST /api/v1/jobs/job-clinica-salud-valencia-001/close
X-API-Key: {API_KEY_ADMIN}
```

No lleva body. Solo el header de autenticación admin.

---

## Response — proceso cerrado con ganador

```json
HTTP 200 OK

{
  "job_id": "job-clinica-salud-valencia-001",
  "status": "closed",
  "winner_candidate_id": "cand-13-sofia-delgado",
  "winner_nombre": "Sofía Delgado",
  "winner_score": "4.84",
  "sessions_expired": 1,
  "notifications_sent": 3
}
```

| Campo | Qué significa |
|-------|--------------|
| `status` | Siempre `"closed"` si fue exitoso |
| `winner_candidate_id` | ID del candidato ganador; `null` si nadie completó |
| `winner_nombre` | Nombre del ganador; `null` si no hay ganador |
| `winner_score` | Score ponderado del ganador (string con 2 decimales); `null` si no hay ganador |
| `sessions_expired` | Cuántas sesiones activas se pusieron en `expired` |
| `notifications_sent` | Total de notificaciones enviadas (ganador + rechazos) |

---

## Response — nadie completó la entrevista

Si el reclutador cierra el proceso y ningún candidato terminó su entrevista:

```json
HTTP 200 OK

{
  "job_id": "job-clinica-salud-valencia-001",
  "status": "closed",
  "winner_candidate_id": null,
  "winner_nombre": null,
  "winner_score": null,
  "sessions_expired": 2,
  "notifications_sent": 0
}
```

El proceso se cierra igual. Sin ganador, sin notificaciones.

---

## Errores posibles

### Job ya estaba cerrado

```json
HTTP 409 Conflict

{
  "detail": {
    "error": "already_closed"
  }
}
```

### Job no existe

```json
HTTP 404 Not Found

{
  "detail": "Job not found"
}
```

### Sin autenticación admin

```json
HTTP 403 Forbidden

{
  "detail": "Invalid API key"
}
```

---

## ¿Cuándo mostrar el botón de cerrar?

Antes de cerrar, puedes llamar `GET /api/v1/jobs/{job_id}/audit` para saber si el proceso está listo para cerrar. El campo `ready_to_close` te lo indica:

```json
GET /api/v1/jobs/job-clinica-salud-valencia-001/audit
X-API-Key: {API_KEY_ADMIN}
```

```json
{
  "job_id": "job-clinica-salud-valencia-001",
  "title": "Desarrollador Full-Stack — Clínica Salud Valencia",
  "status": "active",
  "ready_to_close": true,
  "deadline_passed": false,
  "total_apto": 3,
  "total_completed_interviews": 1,
  "winner_candidate_id": null,
  "winner_nombre": null,
  "all_candidates": [
    {
      "candidate_id": "cand-13-sofia-delgado",
      "nombre": "Sofía Delgado",
      "email": "sofia@example.com",
      "passed_ko": true,
      "interview_status": "completed",
      "interview_score": "4.84",
      "rank": 1,
      "account_activated": true,
      "invitation_sent": true,
      "notifications_sent": ["interview_invitation"],
      "is_winner": false,
      "session_id": "abc-123"
    },
    {
      "candidate_id": "cand-12-carlos-rivas",
      "nombre": "Carlos Rivas",
      "email": "carlos@example.com",
      "passed_ko": true,
      "interview_status": "active",
      "interview_score": null,
      "rank": null,
      "account_activated": true,
      "invitation_sent": true,
      "notifications_sent": ["interview_invitation"],
      "is_winner": false,
      "session_id": "def-456"
    },
    {
      "candidate_id": "cand-11-elena-martinez",
      "nombre": "Elena Martínez",
      "email": "elena@example.com",
      "passed_ko": true,
      "interview_status": "pending",
      "interview_score": null,
      "rank": null,
      "account_activated": false,
      "invitation_sent": true,
      "notifications_sent": ["interview_invitation"],
      "is_winner": false,
      "session_id": null
    }
  ]
}
```

### Lógica del botón "Cerrar proceso"

```
ready_to_close = true   → mostrar botón habilitado
ready_to_close = false  → mostrar botón deshabilitado (o tooltip "Espera a que todos completen")
status = "closed"       → no mostrar botón, mostrar estado cerrado + ganador
```

`ready_to_close` es `true` si se cumple cualquiera de estas condiciones:
- El deadline de entrevistas ya pasó
- Todos los APTOS completaron su entrevista
- El job ya está cerrado

---

## Estados de entrevista que puede tener un candidato

| `interview_status` | Significado |
|--------------------|-------------|
| `pending` | Nunca abrió la entrevista |
| `active` | Está en curso (abrió pero no terminó) |
| `completed` | Terminó todas las 8 preguntas — **puede ser ganador** |
| `abandoned` | El candidato la cerró a mitad |
| `expired` | El proceso se cerró antes de que terminara |

Solo los `completed` entran en la selección del ganador.

---

## Flujo recomendado en la UI

```
1. GET /audit         → mostrar tabla de candidatos con su estado actual
2. Evaluar ready_to_close
3. Si true → habilitar botón "Cerrar proceso"
4. Usuario confirma → POST /close
5. Mostrar resultado: ganador + cuántas sesiones expiradas
6. Redirigir a vista de job cerrado (status = "closed")
```
