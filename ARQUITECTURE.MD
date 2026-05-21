🏗️ Estructura Frontend Modular Recomendada
nova-hiring-frontend/
├── src/
│   ├── api/              ← Clientes HTTP para tu backend FastAPI
│   ├── components/       ← Componentes UI reutilizables (botones, formularios, tarjetas)
│   ├── features/         ← Módulos por funcionalidad (auth, jobs, candidates, interviews)
│   ├── hooks/            ← Custom hooks React (useAuth, useInterview, useCandidates)
│   ├── layouts/          ← Layouts de página (AdminLayout, PublicLayout)
│   ├── stores/           ← Estado global (Zustand/Redux) - auth, interviews, candidates
│   ├── utils/            ← Utilidades puras (formatters, validators, constants)
│   ├── types/            ← Tipos TypeScript (coincidentes con contracts.py)
│   ├── routes/           ← Definición de rutas (React Router)
│   └── App.tsx           ← Montaje de rutas y provisión de stores
│
├── public/
│   └── index.html
│
├── package.json
├── tsconfig.json
├── vite.config.ts        ← Vite (rápido, moderno)
└── README.md


🔗 Mapeo Frontend 
| Backend (nova-hiring/) | Frontend (src/features/) | Descripción                                  |
| ---------------------- | ------------------------ | -------------------------------------------- |
| api/auth.py            | features/auth/           | Login, validación de tokens Bearer/X-API-Key |
| api/jobs.py            | features/jobs/           | CRUD de ofertas, ranking, reportes (admin)   |
| api/candidates.py      | features/candidates/     | Upload CV, evaluación, screening KO          |
| api/interviews.py      | features/interviews/     | Sesiones de entrevista, mensajes, interrupt  |
| contracts.py           | types/                   | Tipos TypeScript generados desde Pydantic    |
| services/ai_client.py  | features/interviews/ai/  | UI para diálogo con LLM (dimensiones)        |


🧱 Ejemplo de Módulo Modular (features/interviews/)
features/interviews/
├── components/
│   ├── InterviewSession.tsx      ← Componente principal de sesión
│   ├── MessageBubble.tsx         ← Mensaje candidato/entrevistador
│   ├── DimensionScoreCard.tsx    ← Tarjeta de puntuación por dimensión
│   └── InterruptButton.tsx       ← Botón para interrumpir (Redis flag)
│
├── hooks/
│   ├── useInterviewSession.ts    ← Conecta con WebSocket/REST + interrupt
│   └── useDialogueManager.ts     ← Maneja estado del diálogo por dimensión
│
├── services/
│   └── interviewApi.ts           ← Llamadas a POST /sessions, /message, GET /sessions
│
├── types.ts                      ← InterviewSession, Message, DimensionScore
└── index.ts                      ← Exporta todo el módulo