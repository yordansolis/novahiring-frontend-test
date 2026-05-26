# Sistema de Emails con Celery + Brevo — Guía Completa

> **Para quién es este documento:** Para cualquier desarrollador que quiera entender cómo funciona el sistema de emails en NovaHiring, por qué está construido así y cómo monitorearlo. No necesitas experiencia previa con Celery.

---

## ¿Qué problema resuelve esto?

Antes de esta implementación, cuando el reclutador cerraba un proceso de selección, el sistema simplemente **imprimía en la consola** algo como:

```
[SIMULATED EMAIL] WINNER To: sofia@email.com | Candidate: Sofía Delgado | Job: job-123
```

Nadie recibía ningún correo real. Esto era útil para desarrollo, pero en producción los candidatos necesitan ser notificados de verdad.

Ahora el sistema:
1. **Envía emails reales** a través de Brevo (antes llamado Sendinblue) via SMTP
2. Lo hace de forma **asíncrona** (sin bloquear la API) usando Celery
3. **Reintenta automáticamente** si el envío falla (hasta 3 veces)
4. **Registra el estado** de cada envío en la base de datos para que puedas saber si llegó o falló

---

## Arquitectura del flujo

```
Reclutador llama a
POST /api/v1/jobs/{job_id}/close
          │
          ▼
  FastAPI selecciona al ganador
  y prepara las notificaciones
          │
          ├──► Guarda registro en BD (delivery_status = "queued")
          │
          └──► Encola tarea en Redis
               "envía este email"
                      │
                      ▼ (segundos después, en otro proceso)
               Worker de Celery
               recibe la tarea
                      │
                      ├──► Conecta al servidor SMTP de Brevo
                      ├──► Envía el email HTML
                      └──► Actualiza BD:
                           ✅ delivery_status = "sent"
                           ❌ delivery_status = "failed" (tras 3 intentos)
```

**¿Por qué Redis en el medio?** Porque si el envío de email tardara 5 segundos, la API devolvería la respuesta HTTP al reclutador 5 segundos después. Con Celery, la API responde **al instante** y el email se envía en segundo plano.

---

## Archivos creados / modificados

### Archivos nuevos

#### `celery_app.py` — El motor de Celery
```
nova-hiring/
└── celery_app.py   ← aquí vive la configuración central
```

Crea la instancia de Celery y la conecta a Redis (que ya usábamos para sesiones):

```python
app = Celery(
    "nova_hiring",
    broker=settings.REDIS_URL,    # Redis como cola de tareas
    backend=settings.REDIS_URL,   # Redis para guardar resultados
    include=["tasks.email_tasks"],
)
```

- **broker**: donde Celery pone las tareas pendientes
- **backend**: donde Celery guarda el resultado de cada tarea
- Ambos usan el mismo Redis que ya tiene el proyecto

---

#### `services/email_service.py` — El que realmente envía el email

Usa la librería estándar de Python (`smtplib`) para conectarse a Brevo y enviar emails HTML.

```
nova-hiring/
└── services/
    └── email_service.py   ← funciones puras, sin estado
```

Tiene dos funciones públicas:

| Función | Para quién | Asunto del email |
|---------|-----------|------------------|
| `send_winner_email(email, nombre, puesto, puntuación)` | Candidato ganador | "¡Enhorabuena! Has sido seleccionado/a para {puesto}" |
| `send_rejection_email(email, nombre, puesto)` | Candidatos APTO no ganadores | "Actualización sobre tu candidatura para {puesto}" |

Ambas conectan al servidor SMTP, envían el HTML y lanzan una excepción si algo falla (que Celery captura para reintentar).

---

#### `tasks/email_tasks.py` — Las tareas de Celery

```
nova-hiring/
└── tasks/
    ├── __init__.py
    └── email_tasks.py
```

Define las dos tareas que Celery ejecuta en segundo plano:

```python
@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_winner_email_task(self, to_email, candidate_name, job_title, score, notification_id):
    try:
        email_service.send_winner_email(to_email, candidate_name, job_title, score)
        # Actualiza BD: delivery_status = "sent"
        asyncio.run(_update_notification(notification_id, "sent"))
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            # Actualiza BD: delivery_status = "failed"
            asyncio.run(_update_notification(notification_id, "failed", str(exc)))
        raise self.retry(exc=exc)  # Reintenta después de 60 segundos
```

**¿Por qué `asyncio.run()`?** Celery ejecuta tareas de forma sincrónica (bloqueante), pero nuestra base de datos usa SQLAlchemy asíncrono. `asyncio.run()` crea un mini event loop justo para esa operación y lo cierra. Es el puente entre el mundo síncrono de Celery y el asíncrono de FastAPI.

---

#### `api/notifications.py` — Endpoints de monitoreo

```
nova-hiring/
└── api/
    └── notifications.py
```

Dos endpoints solo para admins:

| Endpoint | Qué hace |
|----------|----------|
| `GET /api/v1/notifications/{job_id}` | Lista todos los emails de ese proceso con su estado |
| `GET /api/v1/notifications/health/email` | Verifica si el servidor SMTP responde |

---

### Archivos modificados

#### `models/ops.py` — 3 columnas nuevas en `candidate_notifications`

```python
# Antes: solo guardaba que se intentó enviar
notification_type: "winner" | "rejection" | "interview_invitation"
sent_at: datetime

# Ahora: también guarda el resultado real
delivery_status: "queued" | "sent" | "failed"   ← estado actual
delivery_error: str | None                       ← mensaje de error si falló
delivered_at: datetime | None                    ← cuándo llegó
```

#### `services/notification_service.py` — Ya no simula, encola

```python
# Antes
logger.info("[SIMULATED EMAIL] WINNER To: %s", email)

# Ahora
notif = CandidateNotification(..., delivery_status="queued")
self._db.add(notif)
await self._db.flush()  # ← obtiene el ID antes de encolar
send_winner_email_task.delay(email, nombre, puesto, score, notif.id)
logger.info("[EMAIL QUEUED] WINNER To: %s | NotifID: %s", email, notif.id)
```

#### `config.py` — Variables de entorno para SMTP

```python
SMTP_HOST: str = "smtp-relay.brevo.com"
SMTP_PORT: int = 587
SMTP_USERNAME: str = ""
SMTP_PASSWORD: str = ""
SMTP_FROM_EMAIL: str = ""
SMTP_FROM_NAME: str = "NovaHiring"
```

#### `api/jobs.py` — Pasa el título del puesto a las notificaciones

Se movió `_get_winner_score()` antes de las notificaciones para poder incluir la puntuación en el email del ganador, y se pasa `job.title` a ambas funciones de notificación.

---

## Variables de entorno requeridas

Agrega esto a tu archivo `.env`:

```env
# ===================================
# CONFIGURACIÓN DE EMAIL (Brevo SMTP)
# ===================================
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=tu_usuario@smtp-brevo.com
SMTP_PASSWORD=tu_password_smtp
SMTP_FROM_EMAIL=tu_email@dominio.com
SMTP_FROM_NAME=NovaHiring
```

> **¿Dónde consigo estas credenciales?**
> En tu cuenta de Brevo: `Settings → SMTP & API → SMTP tab`. El `SMTP_USERNAME` termina en `@smtp-brevo.com` y el password empieza por `xsmtpsib-...`.

---

## Cómo arrancar el sistema completo

Necesitas **tres procesos corriendo al mismo tiempo**. Abre tres terminales:

**Terminal 1 — Infraestructura (PostgreSQL + Redis)**
```bash
docker compose up -d
```

**Terminal 2 — API de FastAPI**
```bash
make start-dev
# o: uv run fastapi dev main.py
```

**Terminal 3 — Worker de Celery (el que envía los emails)**
```bash
make worker
# o: uv run celery -A celery_app worker --loglevel=info
```

> Si el worker de Celery no está corriendo, las tareas se acumulan en Redis y se ejecutarán cuando lo arranques. Los emails no se pierden.

---

## Cómo probar que funciona

### 1. Verificar la conexión SMTP (sin enviar nada)

```bash
curl -X GET http://localhost:8000/api/v1/notifications/health/email \
  -H "X-API-Key: tu_api_key_admin"
```

Respuesta si todo va bien:
```json
{
  "status": "ok",
  "host": "smtp-relay.brevo.com",
  "port": 587,
  "error": null
}
```

Respuesta si hay un problema:
```json
{
  "status": "error",
  "host": "smtp-relay.brevo.com",
  "port": 587,
  "error": "Connection refused"
}
```

### 2. Cerrar un proceso y disparar los emails

```bash
curl -X POST http://localhost:8000/api/v1/jobs/job-clinica-salud-valencia-001/close \
  -H "X-API-Key: tu_api_key_admin"
```

Respuesta inmediata (los emails ya están en cola):
```json
{
  "job_id": "job-clinica-salud-valencia-001",
  "status": "closed",
  "winner_candidate_id": "cand-13-sofia-delgado",
  "winner_nombre": "Sofía Delgado",
  "winner_score": "4.84",
  "sessions_expired": 0,
  "notifications_sent": 3
}
```

### 3. Consultar el estado de los envíos

```bash
curl http://localhost:8000/api/v1/notifications/job-clinica-salud-valencia-001 \
  -H "X-API-Key: tu_api_key_admin"
```

Respuesta con el estado de cada email:
```json
{
  "job_id": "job-clinica-salud-valencia-001",
  "total": 3,
  "sent": 3,
  "queued": 0,
  "failed": 0,
  "notifications": [
    {
      "notification_id": "uuid-...",
      "candidate_name": "Sofía Delgado",
      "candidate_email": "sofia@email.com",
      "notification_type": "winner",
      "delivery_status": "sent",
      "delivery_error": null,
      "sent_at": "2026-05-24T10:30:00+00:00",
      "delivered_at": "2026-05-24T10:30:02+00:00"
    },
    {
      "notification_id": "uuid-...",
      "candidate_name": "Carlos Rivas",
      "candidate_email": "carlos@email.com",
      "notification_type": "rejection",
      "delivery_status": "sent",
      "delivery_error": null,
      "sent_at": "2026-05-24T10:30:00+00:00",
      "delivered_at": "2026-05-24T10:30:03+00:00"
    }
  ]
}
```

---

## Diagnóstico de problemas

### "Los emails están en `queued` y no pasan a `sent`"

**Causa más probable:** el worker de Celery no está corriendo.

```bash
# ¿Está corriendo?
ps aux | grep celery

# Si no, arráncalo
make worker
```

### "Los emails están en `failed`"

El campo `delivery_error` te dice exactamente qué pasó:

| Error | Causa | Solución |
|-------|-------|----------|
| `Connection refused` | Redis caído | `docker compose up -d` |
| `(535, b'Authentication failed')` | Credenciales SMTP wrongas | Revisa `SMTP_USERNAME` y `SMTP_PASSWORD` en `.env` |
| `[Errno 8] nodename nor servname provided` | No hay DNS / no hay internet | Verifica conexión desde el servidor |
| `SMTPRecipientsRefused` | Email del candidato inválido | Revisar dato en BD |

### "El health check da `ok` pero los emails no llegan"

El health check solo verifica que la conexión TCP funciona. Si los emails no llegan al inbox:
1. Revisa la carpeta de spam del destinatario
2. En el panel de Brevo → `Email Logs` verás si Brevo los procesó
3. Verifica que `SMTP_FROM_EMAIL` sea un dominio autenticado en Brevo (SPF/DKIM)

### Ver los logs del worker en tiempo real

```bash
uv run celery -A celery_app worker --loglevel=debug
```

Verás cada tarea que recibe:
```
[2026-05-24 10:30:01,234: INFO/MainProcess] Task tasks.email_tasks.send_winner_email_task received
[2026-05-24 10:30:03,100: INFO/Worker-1] [EMAIL SENT] To: sofia@email.com
[2026-05-24 10:30:03,200: INFO/MainProcess] Task tasks.email_tasks.send_winner_email_task succeeded
```

---

## Flujo de reintentos

Si el envío falla (por ejemplo, Brevo está caído 30 segundos):

```
Intento 1 → FALLA
  └─► espera 60 segundos
Intento 2 → FALLA
  └─► espera 60 segundos
Intento 3 → FALLA
  └─► espera 60 segundos
Intento 4 (último) → FALLA
  └─► delivery_status = "failed"
      delivery_error = "mensaje de error"
      → ya no reintenta más
```

Si en algún intento el servidor SMTP responde, el email se envía y `delivery_status = "sent"`.

> Los reintentos se pueden ajustar en `tasks/email_tasks.py`:
> ```python
> @app.task(bind=True, max_retries=3, default_retry_delay=60)
> #                      ↑ número de reintentos    ↑ segundos entre reintentos
> ```

---

## Resumen de endpoints de monitoreo

| Método | URL | Auth | Para qué |
|--------|-----|------|----------|
| `GET` | `/api/v1/notifications/{job_id}` | Admin | Ver estado de todos los emails de un proceso |
| `GET` | `/api/v1/notifications/health/email` | Admin | Verificar si el servidor SMTP está disponible |

---

## Nota para el desarrollador frontend

> Esta sección es solo para ti. El backend ya está construido — tu trabajo es mostrar lo que el backend expone.

---

### Los dos endpoints que vas a usar

```
GET /api/v1/notifications/{job_id}       ← estado de los emails
GET /api/v1/notifications/health/email   ← ¿está el servidor de email vivo?
```

Ambos requieren el header `X-API-Key: {API_KEY_ADMIN}`. Solo el admin los ve — el candidato nunca llama a estos endpoints.

---

### Cuándo llamar a cada uno

**`/health/email`** — llámalo una sola vez cuando el admin abre el panel de cierre de proceso. Si devuelve `"status": "error"`, muestra un banner de advertencia antes de que el admin haga clic en "Cerrar proceso". Así sabe que el email puede no llegar antes de disparar el flujo.

```
┌─────────────────────────────────────────────┐
│ ⚠️  El servidor de email no responde.        │
│    Los emails pueden no enviarse.            │
│    Contacta soporte antes de continuar.      │
└─────────────────────────────────────────────┘
```

**`/notifications/{job_id}`** — llámalo **después** de que el admin ejecute `POST /jobs/{job_id}/close`. Ahí es cuando los emails se encolan. Tienes que hacer **polling** (repetir la llamada cada pocos segundos) porque el worker procesa las tareas en segundo plano y el estado cambia de `queued` → `sent` o `failed` sin que tú lo notes.

---

### Estrategia de polling recomendada

```
POST /jobs/{job_id}/close   ← el admin cierra el proceso
         │
         ▼
GET /notifications/{job_id}  ← llama inmediatamente
         │
    ¿queued > 0?
    ├── SÍ → espera 3 segundos → vuelve a llamar
    └── NO (todos en sent/failed) → detén el polling
```

Ejemplo en pseudocódigo:

```js
async function pollNotifications(jobId) {
  const MAX_ATTEMPTS = 20   // máximo ~60 segundos de polling
  let attempts = 0

  while (attempts < MAX_ATTEMPTS) {
    const data = await fetch(`/api/v1/notifications/${jobId}`, { headers })
    const json = await data.json()

    renderNotificationTable(json.notifications)

    if (json.queued === 0) break   // todos procesados, detener

    await sleep(3000)   // esperar 3 segundos antes del próximo intento
    attempts++
  }
}
```

---

### Qué mostrar para cada `delivery_status`

| Estado | Icono | Texto sugerido | Color |
|--------|-------|----------------|-------|
| `queued` | 🕐 | "Pendiente de envío..." | Gris |
| `sent` | ✅ | "Enviado" | Verde |
| `failed` | ❌ | "Falló el envío" | Rojo |

Cuando el estado es `failed`, muestra también el campo `delivery_error` en un tooltip o sección expandible. El reclutador necesita saber si es un email inválido del candidato o un problema del servidor.

```
┌───────────────────────────────────────────────────────────┐
│ Sofía Delgado    ganador    ✅ Enviado   10:30:02          │
│ Carlos Rivas     rechazo    ✅ Enviado   10:30:03          │
│ Elena Martínez   rechazo    ❌ Falló     Ver detalle ▾     │
│   └─ Authentication failed (535)                          │
└───────────────────────────────────────────────────────────┘
```

---

### El resumen numérico (`total`, `sent`, `queued`, `failed`)

La respuesta incluye contadores listos para usar. No los calcules tú — úsalos directamente:

```json
{
  "total": 3,
  "sent": 2,
  "queued": 0,
  "failed": 1
}
```

Puedes mostrarlos como una barra de progreso o badges:

```
Notificaciones enviadas:  ✅ 2 / 3   ❌ 1 falló
```

---

### Lo que NO tienes que hacer

- **No llames a `/health/email` cada vez que el usuario hace scroll** — es una conexión TCP real al servidor SMTP. Llámalo solo al cargar el panel.
- **No implementes lógica de reintento desde el frontend** — el backend ya reintenta automáticamente (hasta 3 veces con espera exponencial). Si el estado es `failed`, es porque el backend ya agotó todos los intentos. Lo único que puedes hacer es informar al admin.
- **No intentes reconstruir el estado a partir de los logs del worker** — el endpoint `/notifications/{job_id}` ya te da todo lo que necesitas directamente desde la BD.

---

## Limpiar datos de sesión (entorno de desarrollo)

`make clean-sessions` resetea el entorno para una nueva prueba de extremo a extremo. Borra:

| Tabla / recurso | Operación | Qué limpia |
|---|---|---|
| `messages` | DELETE | Todos los mensajes de chat |
| `chat_sessions` | DELETE | Todas las sesiones de entrevista |
| `ai_call_logs` | DELETE | Logs de llamadas al LLM |
| `candidate_notifications` | DELETE | **Todos los registros de notificaciones** — estado `queued`/`sent`/`failed`, tipo ganador/rechazo, `delivery_error` |
| `dimension_scores` | DELETE | Puntuaciones generadas en entrevistas (UUIDs) |
| `evaluations` | DELETE | Evaluaciones generadas en entrevistas (UUIDs) |
| `job_openings` | **UPDATE** | Resetea `status → "active"`, `winner_candidate_id → NULL`, `closed_at → NULL` — **la fila se conserva** |
| Redis `session:*` | DEL | Claves de sesión en caché |

**Lo que se preserva intacto:** filas de `job_openings` y `candidates`, `prompt_versions`, `question_bank`, evaluaciones seeded (`eval-*`).

> Después de `make clean-sessions`, el proceso de selección vuelve al estado inicial: sin ganador, sin notificaciones, sin historial de emails. Puedes volver a ejecutar el flujo completo desde cero.

```bash
# Limpiar todo para una nueva prueba (incluye notificaciones)
make clean-sessions
```

Salida esperada:
```
messages deleted:              12
chat_sessions deleted:         4
ai_call_logs deleted:          48
notifications deleted:         3
dimension_scores deleted:      32
evaluations deleted:           4
job_openings reset:            1
redis session keys:            4
✓ Session data cleared. Seeded reference data preserved.
```

---

## Comandos de referencia rápida

```bash
# Arrancar el worker
make worker

# Limpiar sesiones + notificaciones para nueva prueba
make clean-sessions

# Ver estado de emails de un proceso
curl http://localhost:8000/api/v1/notifications/{job_id} -H "X-API-Key: ..."

# Verificar SMTP
curl http://localhost:8000/api/v1/notifications/health/email -H "X-API-Key: ..."

# Ver logs del worker con detalle
uv run celery -A celery_app worker --loglevel=debug

# Ver tareas activas/pendientes en Redis
uv run celery -A celery_app inspect active
uv run celery -A celery_app inspect reserved

# Migrar la BD (si instalas en un servidor nuevo)
uv run alembic upgrade head
```
