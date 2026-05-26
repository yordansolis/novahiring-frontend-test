  441  ---
      442
      443 -## 11. Resumen de endpoints nuevos
      443 +## 11. Métricas de progreso — `GET /jobs/{job_id}/metrics`
      444
      445 +**Auth:** Admin (`X-API-Key`)
      446 +
      447 +Muestra en tiempo real cuánto ha avanzado cada candidato APTO en la ent
          +revista de 8 dimensiones, en qué punto abandonó (si fue el caso), y un
          +funnel que agrega el progreso de todos.
      448 +
      449 +> No requiere ningún campo nuevo en la DB — toda la información viene d
          +el `context_summary` JSON que ya guarda la máquina de estados de cada s
          +esión.
      450 +
      451 +### Request
      452 +
      453 +```
      454 +GET /api/v1/jobs/{job_id}/metrics
      455 +X-API-Key: {api_key}
      456 +```
      457 +
      458 +### Response `200`
      459 +
      460 +```typescript
      461 +{
      462 +  job_id:           string
      463 +  total_apto:       number         // candidatos que pasaron KO de CV
      464 +  completion_rate:  string         // e.g. "2/3"
      465 +  status_summary: {
      466 +    pending:    number             // nunca iniciaron sesión
      467 +    active:     number             // sesión en curso ahora mismo
      468 +    completed:  number             // completaron las 8 dimensiones
      469 +    abandoned:  number             // abandonaron a mitad
      470 +    expired:    number             // el proceso cerró con sesión abier
          +ta
      471 +  },
      472 +  funnel: [                        // una entrada por dimensión, D1 → D
          +8
      473 +    {
      474 +      dimension_id:     string     // "D1"
      475 +      dimension_name:   string     // "Integraciones técnicas"
      476 +      reached_count:    number     // cuántos llegaron a esta dimensión
      477 +      completed_count:  number     // cuántos la tienen bloqueada (resp
          +ondida)
      478 +    }
      479 +  ],
      480 +  candidates: [                    // ordenados: completados primero (p
          +or score), luego activos, etc.
      481 +    {
      482 +      candidate_id:             string
      483 +      nombre:                   string
      484 +      interview_status:         "pending"|"active"|"completed"|"abandon
          +ed"|"expired"
      485 +      dimensions_answered:      number        // 0–8
      486 +      dimensions_locked:        string[]      // ["D1","D2","D3"]
      487 +      current_dimension:        string | null // "D4" — en cuál está ah
          +ora
      488 +      abandoned_at_dimension:   string | null // "D5" — en cuál abandon
          +ó
      489 +      session_id:               string | null
      490 +      final_score:              string | null // "4.84" solo si complet
          +ó
      491 +    }
      492 +  ]
      493 +}
      494 +```
      495 +
      496 +### Cómo interpretar cada campo de `candidates`
      497 +
      498 +| Campo | Qué significa |
      499 +|-------|--------------|
      500 +| `dimensions_answered: 3` | Respondió D1, D2, D3 — el agente las tiene
          + bloqueadas |
      501 +| `current_dimension: "D4"` | Está respondiendo D4 en este momento (ses
          +ión activa) |
      502 +| `abandoned_at_dimension: "D5"` | Llegó a D5 pero abandonó sin respond
          +erla |
      503 +| `dimensions_locked: ["D1","D2"]` | Solo D1 y D2 tienen respuesta guar
          +dada en el sistema |
      504 +| `final_score: "4.84"` | Score final ponderado de la entrevista comple
          +ta |
      505 +
      506 +### Qué pasa cuando un candidato abandona
      507 +
      508 +Cuando `interview_status = "abandoned"`:
      509 +- `abandoned_at_dimension` indica en qué dimensión estaba cuando abando
          +nó o fue interrumpido
      510 +- `dimensions_locked` muestra todo lo que sí respondió antes
      511 +- El sistema **no evalúa** candidatos que no completaron — quedan exclu
          +idos de la selección del ganador
      512 +- Si el reclutador cierra el proceso, reciben notificación de rechazo i
          +gualmente
      513 +
      514 +Ejemplo:
      515 +```json
      516 +{
      517 +  "nombre": "Carlos Rivas",
      518 +  "interview_status": "abandoned",
      519 +  "dimensions_answered": 4,
      520 +  "dimensions_locked": ["D1", "D2", "D3", "D4"],
      521 +  "current_dimension": null,
      522 +  "abandoned_at_dimension": "D5",
      523 +  "final_score": null
      524 +}
      525 +```
      526 +→ Carlos respondió 4 de 8 dimensiones. Abandonó al llegar a D5 (Deliver
          +y). No tiene score final y no entra en la selección del ganador.
      527 +
      528 +### Funnel — cómo leerlo
      529 +
      530 +El funnel muestra el "embudo de avance" por dimensión. Con 3 candidatos
          + APTO:
      531 +
      532 +```
      533 +D1 Integraciones     ████████████ 3/3 completaron
      534 +D2 RGPD/LOPDGDD      ████████████ 3/3 completaron
      535 +D3 Autonomía         ████████░░░░ 2/3 completaron (1 abandonó aquí)
      536 +D4 Build-vs-buy      ████████░░░░ 2/3 completaron
      537 +D5 Delivery          ████░░░░░░░░ 1/3 completaron
      538 +D6 Comunicación      ████░░░░░░░░ 1/3 completaron
      539 +D7 Sector salud      ████░░░░░░░░ 1/3 completaron
      540 +D8 Stack técnico     ████░░░░░░░░ 1/3 completaron
      541 +```
      542 +
      543 +`reached_count` vs `completed_count`:
      544 +- `reached_count = 2, completed_count = 1` → 2 llegaron a esa dimensión
          +, pero 1 la está respondiendo ahora (activo) y 1 ya la bloqueó
      545 +
      546 +### Visualización sugerida en el frontend
      547 +
      548 +**Barra de progreso por candidato:**
      549 +```
      550 +Sofía Delgado   ████████████████████████  8/8  ✅ 4.84/5
      551 +Carlos Rivas    ████████████████░░░░░░░░  4/8  🟡 Activo en D5
      552 +Elena Martínez  ████████░░░░░░░░░░░░░░░░  2/8  🔴 Abandonó en D3
      553 +```
      554 +
      555 +**Tabla de estado rápido:**
      556 +| Estado | Count | % |
      557 +|--------|-------|---|
      545 +
      546 +### Visualización sugerida en el frontend
      547 +
      548 +**Barra de progreso por candidato:**
      549 +```
      550 +Sofía Delgado   ████████████████████████  8/8  ✅ 4.84/5
      551 +Carlos Rivas    ████████████████░░░░░░░░  4/8  🟡 Activo en D5
      552 +Elena Martínez  ████████░░░░░░░░░░░░░░░░  2/8  🔴 Abandonó en D3
      553 +```
      554 +
      555 +**Tabla de estado rápido:**
      556 +| Estado | Count | % |
      557 +|--------|-------|---|
      558 +| Completados | 1 | 33% |
      559 +| En progreso | 1 | 33% |
      560 +| Abandonaron | 1 | 33% |
      561 +| Pendientes | 0 | 0% |
      562 +
      563 +---
      564 +
      565 +## 12. Resumen de endpoints nuevos
      566 +
      567  | Método | Ruta | Auth | Propósito |
      568  |--------|------|------|-----------|
      447 -| `GET` | `/jobs/{id}/audit` | Admin | Estado completo del proceso |
      448 -| `POST` | `/jobs/{id}/close` | Admin | Cerrar proceso y seleccionar ganador |
      569 +| `GET` | `/jobs/{id}/audit` | Admin | Estado completo del proceso + `ready_to_close` |
      570 +| `POST` | `/jobs/{id}/close` | Admin | Cerrar proceso, seleccionar ganador, notificar |
      571 +| `GET` | `/jobs/{id}/metrics` | Admin | Progreso en tiempo real: funnel + avance por candidato |
      572  | `GET` | `/interviews/admin/sessions` | Admin | Listar todos los chats por vacante |
      450 -| `GET` | `/interviews/sessions/{id}` | Admin o candidato | Ver transcripción completa de un chat |
      573 +| `GET` | `/interviews/sessions/{id}` | Admin o candidato | Transcripción completa del chat |
      574
      452 -> Los cuatro endpoints existían o son nuevos en esta versión. Para el contexto completo de los demás endpoints de jobs y candidate
          -s ver `specs-admin.md`.
      575 +> Para el contexto completo de los demás endpoints ver `specs-admin.md`.

⏺ Listo. Aquí está el nuevo endpoint GET /api/v1/jobs/{job_id}/metrics:

  ---
  Qué retorna:

  - status_summary — cuántos candidatos están en cada estado (pending / active / completed / abandoned / expired)
  - completion_rate — e.g. "2/3"
  - funnel — para cada dimensión D1→D8: cuántos candidatos la alcanzaron y cuántos la completaron (bloqueada)
  - candidates — por candidato: cuántas dimensiones respondió, cuál está respondiendo ahora, y en cuál abandonó si fue el caso

  Qué pasa con un abandonado:
  - abandoned_at_dimension: "D5" → llegó a D5 pero salió sin responderla
  - dimensions_locked: ["D1","D2","D3","D4"] → solo esas 4 tienen respuesta guardada
  - final_score: null → no entra en la selección del ganador
  - Al cerrar el proceso recibe rechazo igualmente

  Sin migración — todo viene del context_summary JSON que ya guarda la sesión en cada mensaje.