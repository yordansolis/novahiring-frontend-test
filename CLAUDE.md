# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**novahiring-frontend-test** — Frontend for the NovaHiring AI hiring platform. Connects to a FastAPI backend (`nova-hiring/`) that handles auth, jobs, candidates, and AI-driven interview sessions.

## Package Manager

**pnpm is the only allowed package manager. npm and npx are strictly prohibited.**

- Install deps: `pnpm install`
- Add a package: `pnpm add <package>`
- Add dev dep: `pnpm add -D <package>`
- Run scripts: `pnpm <script>`

Never use `npm`, `npx`, or `yarn` in this repo.

## Stack

- **Framework**: Next.js 14 (App Router) `^14.2.15`
- **Language**: TypeScript `^5` — strict mode + `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **React**: `^18.3.1`
- **Styling**: Tailwind CSS `3.4.17` + shadcn/ui
- **Deploy**: Cloudflare Pages via `@cloudflare/next-on-pages` + Wrangler

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm pages:build` — build for Cloudflare Pages (`next-on-pages`)
- `pnpm lint` — run ESLint
- `pnpm type-check` — TypeScript check without emitting

## Design Tokens

Always use these CSS variables — never hardcode color values:

| Token | Role |
|---|---|
| `var(--ds-background-200)` | Backgrounds |
| `var(--ds-gray-1000)` | Text / letras |

## Architecture

Feature-based modular structure under `src/`:

```
src/
├── api/          ← HTTP clients for the FastAPI backend
├── components/   ← Reusable UI primitives (buttons, forms, cards)
├── features/     ← Domain modules (one folder per backend domain)
├── hooks/        ← Shared custom React hooks
├── layouts/      ← Page layouts (AdminLayout, PublicLayout)
├── stores/       ← Global state (Zustand) — auth, interviews, candidates
├── types/        ← TypeScript types mirroring backend contracts.py (Pydantic)
└── utils/        ← Pure utilities (formatters, validators, constants)
```

### Feature → Backend mapping

| `src/features/` | Backend (`nova-hiring/`) | Responsibility |
|---|---|---|
| `auth/` | `api/auth.py` | Login, Bearer / X-API-Key token validation |
| `jobs/` | `api/jobs.py` | Job offer CRUD, ranking, admin reports |
| `candidates/` | `api/candidates.py` | CV upload, evaluation, KO screening |
| `interviews/` | `api/interviews.py` | Interview sessions, messages, interrupt flag |
| `interviews/ai/` | `services/ai_client.py` | LLM dialogue UI (dimension scoring) |

### Feature module structure (example: `features/interviews/`)

Each feature is self-contained:

```
features/interviews/
├── components/       ← InterviewSession, MessageBubble, DimensionScoreCard, InterruptButton
├── hooks/            ← useInterviewSession (WebSocket/REST), useDialogueManager
├── services/         ← interviewApi.ts — POST /sessions, /message, GET /sessions
├── types.ts          ← InterviewSession, Message, DimensionScore
└── index.ts          ← Public exports for the module
```

`src/types/` holds types shared across features, generated from `contracts.py`.

## CI/CD

- **deploy.yml** — triggers on push to `main`: install → `pages:build` → `wrangler pages deploy` → Discord notification
- **discord-notify.yml** — Discord notifications for all pushes and PR lifecycle events

Required GitHub secrets: `NEXT_PUBLIC_BACKEND`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK`.

## Available Skills

| Skill | When to use |
|---|---|
| `senior-frontend` | Component scaffolding, performance optimization, frontend architecture |
| `ui-ux-pro-max` | Design decisions, color palettes, typography, UX guidelines |
| `shadcn-ui-builder` | Building UI with shadcn/ui components |
| `frontend-design` | Polished, production-grade interface work |
| `web-design-guidelines` | Accessibility and design audits |
| `web-perf` | Core Web Vitals and Lighthouse audits |
| `professional-commit-messages` | Writing commit messages |
