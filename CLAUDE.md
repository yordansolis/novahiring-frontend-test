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
- **Styling**: Tailwind CSS `3.4.17` + shadcn/ui (`base-nova` style) — **strictly v3, never v4 syntax**
- **Animation**: Framer Motion `^12` — scroll-based reveals, entrance animations, AnimatePresence
- **Charts**: Recharts `^3.8` + shadcn/ui chart primitives (`src/components/ui/chart.tsx`) — AreaChart, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ChartContainer, ChartTooltip, ChartTooltipContent
- **Headless UI**: `@base-ui/react` — Button, Input, Field primitives
- **Fonts**: Inter + JetBrains Mono via `next/font/google` (variables: `--font-geist`, `--font-geist-mono`)
- **Theme**: `next-themes` `^0.4.6` — system preference detection (`defaultTheme="system"`), `attribute="class"`, no manual toggle
- **Deploy**: Cloudflare Pages via `@cloudflare/next-on-pages` + Wrangler

### Tailwind CSS v3 — forbidden v4 syntax

This project is on **Tailwind CSS 3.4.17**. The following patterns are **Tailwind v4 only** and produce **no CSS output** in v3 — never use them:

| ❌ Tailwind v4 (broken in this project) | ✅ Tailwind v3 (correct) |
|---|---|
| `w-(--sidebar-width)` | `w-[var(--sidebar-width)]` |
| `h-(--some-var)` | `h-[var(--some-var)]` |
| `max-w-(--skeleton-width)` | `max-w-[var(--skeleton-width)]` |
| `calc((--spacing(4)))` inside arbitrary values | `calc(1rem)` or `calc(var(--spacing)*4)` |

If a class using `(--)` syntax generates no visual effect, suspect a v4/v3 mismatch. Always use `[var(--name)]` square-bracket syntax for CSS custom properties in Tailwind v3.

Also apply to `next/image`: always pass the **actual intrinsic pixel dimensions** (`width` / `height`) matching the real image file. Use CSS (`h-7 w-auto`) to control rendered size — never pass dimensions that distort the aspect ratio.

### Config files note

- `next.config.mjs` — Next.js 14 requires `.mjs` or `.js`, **not `.ts`**
- `postcss.config.js` — must use `module.exports = {}` (CommonJS), **not `export default`**
- `.eslintrc.json` — extends `next/core-web-vitals`
- `pnpm-workspace.yaml` — `allowBuilds.unrs-resolver: true` (required for eslint-config-next)

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm pages:build` — build for Cloudflare Pages (`next-on-pages`)
- `pnpm lint` — run ESLint
- `pnpm type-check` — TypeScript check without emitting

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND` | Yes | FastAPI base URL, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_JOB_ID` | Yes | Active job offer ID for the CV upload link, e.g. `job-clinica-salud-valencia-001` |

Set both in `.env.local` for development. In production add them as Cloudflare Pages secrets alongside `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `DISCORD_WEBHOOK`.

## Design Tokens

Always use CSS variables — never hardcode color values. All tokens are defined in `src/app/globals.css` and **automatically switch between light and dark mode**. Light values live in `:root {}`, dark values in `.dark {}`.

### Backgrounds
| Token | Light value | Dark value | Role |
|---|---|---|---|
| `var(--ds-background-100)` | `#ffffff` | `#0a0a0b` | Page background |
| `var(--ds-background-200)` | `#f8f8f9` | `#111113` | Card / section background |
| `var(--ds-background-300)` | `#f0f0f2` | `#18181b` | Raised surface (panels, inputs, code blocks) |

### Text
| Token | Light value | Dark value | Role |
|---|---|---|---|
| `var(--ds-gray-1000)` | `#09090b` | `#fafafa` | Primary text |
| `var(--ds-gray-700)` | `#3f3f46` | `#d4d4d8` | Secondary text |
| `var(--ds-gray-600)` | `#52525b` | `#a1a1aa` | Muted text / descriptions |
| `var(--ds-gray-500)` | `#71717a` | `#71717a` | Placeholder / labels |

### Accents
| Token | Role |
|---|---|
| `var(--ds-accent-blue)` | Interactive elements, links |
| `var(--ds-accent-green)` | APTA, verified, success states |
| `var(--ds-accent-red)` | DESCARTADO, KO failures, errors |
| `var(--ds-accent-amber)` | Processing, in-progress states |

### Borders
| Token / Class | Light value | Dark value | Role |
|---|---|---|---|
| `var(--ds-border)` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Divider lines, separator elements |
| `var(--ds-border-subtle)` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` | Very subtle separators |
| `border-white/[0.14]` | ⚠️ invisible in light mode | Visible | **Admin-only** card borders (admin pages always force dark) |

> **Rule:** `bg-[var(--ds-border)]` (as a background) is fine for thin decorative dividers (1px `h-px` lines). For public-facing cards (landing, upload, login, interview) use `border-[var(--ds-border)]`. For admin-only surfaces, `border-white/[0.14]` is still fine since admin pages run in dark mode only.

### Chart tokens
Recharts color palette — defined in `globals.css` in both `:root {}` and `.dark {}`. Referenced as `var(--chart-N)` inside chart components.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--chart-1` | `#2563eb` | `#3b82f6` | Primary series (blue) |
| `--chart-2` | `#16a34a` | `#22c55e` | Secondary series (green) |
| `--chart-3` | `#d97706` | `#f59e0b` | Tertiary series (amber) |
| `--chart-4` | `#9333ea` | `#a855f7` | Quaternary series (purple) |
| `--chart-5` | `#dc2626` | `#ef4444` | Quinary series (red) |

### shadcn component token bridge
`globals.css` maps shadcn's internal tokens (`--background`, `--foreground`, `--input`, `--ring`, `--primary`, etc.) to the `ds-*` design system in **both** `:root {}` (light) and `.dark {}` (dark) blocks. Do not remove these mappings.

> ⚠️ **Critical:** `tailwind.config.ts` does NOT extend `primary`, `secondary`, `foreground`, etc. This means `bg-primary`, `bg-secondary`, `text-foreground` and similar shadcn Tailwind utilities **produce no CSS output** in this project. Always use DS tokens directly: `bg-[var(--ds-accent-blue)]`, `bg-[var(--ds-background-300)]`, `text-[var(--ds-gray-1000)]`, etc.

### Tailwind custom utilities (mapped in `tailwind.config.ts`)
`bg-ds-bg-100`, `bg-ds-bg-200`, `bg-ds-bg-300`, `text-ds-gray-1000`, etc.
Raw CSS variable syntax also accepted: `bg-[var(--ds-background-200)]`.

### Global CSS utility classes (defined in `globals.css`, outside any `@layer`)

| Class | Purpose |
|---|---|
| `.btn-glow` | Primary CTA button — blue gradient (`#4f93f8→#2563eb`), pulsing blue glow animation (`btn-glow-pulse`, 2.4s). Use with `rounded-full border-0`. |

**`.btn-glow` hover behavior is mode-aware:**
- **Light mode** — deepens to darker blue gradient (`#3b7ef4→#1d4ed8`) + blue shadow. Text stays white.
- **Dark mode** — inverts to light (`#f1f5f9` bg + `#0a0a0b` text), animation paused. Defined under `.dark .btn-glow:hover`.

> These are declared outside `@layer` so they have higher cascade priority than all Tailwind utilities, allowing `:hover` overrides to work reliably with `!important`.

## Architecture

Feature-based modular structure under `src/`:

```
src/
├── app/
│   ├── page.tsx                    ← Homepage (RSC orchestrator)
│   ├── layout.tsx                  ← Root layout (Inter font, dark class, design token body)
│   ├── globals.css                 ← Design token definitions + shadcn bridge + Tailwind directives
│   ├── dashboard/
│   │   └── page.tsx                ← Jobs list view with AdminSidebar shell (auth guard)
│   ├── jobs/
│   │   └── [job_id]/
│   │       ├── layout.tsx          ← Admin shell: auth guard + sidebar (client component)
│   │       ├── page.tsx            ← Candidates list + Evaluar button
│   │       ├── ranking/page.tsx    ← Metrics dashboard: winner hero card, area chart (stock-market style), ranking table
│   │       ├── report/page.tsx     ← AI narrative report (Regenerar + Imprimir)
│   │       ├── profile/page.tsx    ← KO criteria + scorecard rubric grid
│   │       ├── cvs/page.tsx        ← CV audit view — full CV text per candidate, filter by result
│   │       └── audit/page.tsx      ← Process audit: interview status, scores, close process + winner selection
│   ├── login/
│   │   ├── page.tsx                ← redirect("/login/admin")
│   │   ├── admin/page.tsx          ← Screen A — recruiter login
│   │   └── candidate/page.tsx      ← Screen B — candidate login
│   └── upload/
│       └── page.tsx                ← Screen 0 — CV upload (reads ?job_id= from searchParams)
├── components/
│   ├── auth/
│   │   └── AuthPageShell.tsx       ← Shared layout for all auth pages (logo, glow bg, copyright)
│   ├── home/                       ← Homepage section components
│   │   ├── HeroSection.tsx
│   │   ├── LiveSystemPanel.tsx     ← Recruiter dashboard preview
│   │   ├── ProcessSection.tsx
│   │   ├── CandidateTableSection.tsx
│   │   ├── AuditabilitySection.tsx
│   │   ├── CtaFooter.tsx
│   │   └── LoginDropdown.tsx       ← "Acceder ▾" dropdown with Reclutador/Candidato options
│   ├── ui/                         ← shadcn/base-ui + ElevenLabs primitives
│   │   ├── button.tsx
│   │   ├── input.tsx               ← h-11, focus glow box-shadow, transition-all
│   │   ├── label.tsx
│   │   ├── field.tsx               ← Field, FieldGroup, FieldLabel, FieldError, etc.
│   │   ├── separator.tsx
│   │   ├── focus-field.tsx         ← motion.div wrapper — lifts field y:-2 on focus
│   │   ├── password-input.tsx      ← Input + Eye/EyeOff toggle, tabIndex=-1 on button
│   │   ├── bar-visualizer.tsx
│   │   ├── chart.tsx               ← Recharts shadcn wrapper: ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle
│   │   ├── conversation.tsx        ← ElevenLabs: Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton
│   │   ├── message.tsx             ← ElevenLabs: Message (user/assistant layout), MessageContent (contained/flat variants)
│   │   ├── orb.tsx                 ← CSS/Framer Motion animated orb — AgentState: null | "thinking" | "listening" | "talking"
│   │   └── response.tsx            ← ElevenLabs: Response — wraps streamdown for markdown/streaming text rendering
│   ├── admin/
│   │   ├── AdminSidebar.tsx        ← Left sidebar: job list (jobId set) or resumen metrics (jobId undefined)
│   │   └── JobMetricsPanel.tsx     ← Right collapsible panel: candidate pipeline stats per job
│   ├── providers/
│   │   ├── ThemeProvider.tsx       ← next-themes wrapper (attribute="class", defaultTheme="system")
│   │   └── NavigationProgress.tsx  ← Thin 2px blue top bar — fires on internal link click, completes on pathname change
│   └── thegridcn/                  ← TheGridCN components (radar, data-card, hud)
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── AdminLoginForm.tsx       ← Screen A form (401/503 error handling)
│   │   │   ├── CandidateLoginForm.tsx   ← Screen B form (401 error, link to /upload)
│   │   │   └── CvUploadForm.tsx         ← Screen 0 form (drag-drop, 6 error states, passed_ko result)
│   │   ├── services/
│   │   │   └── authApi.ts               ← loginAdmin, loginCandidate, uploadCv
│   │   └── types.ts                     ← Auth TS types + STORAGE_KEYS constants
│   ├── candidates/
│   │   ├── components/
│   │   │   ├── CandidateTable.tsx       ← Table: status badges, credential reveal/copy
│   │   │   └── CvAuditList.tsx          ← Collapsible CV cards with filter pills (Todos/Aptos/Descartados)
│   │   ├── services/
│   │   │   └── candidatesApi.ts         ← getCandidates, getCvAudit, triggerEvaluation
│   │   └── types.ts                     ← CandidateListItem, CvAuditItem, EvaluateResponse
│   └── jobs/
│       ├── components/
│       │   ├── JobProfile.tsx           ← KO cards + 5-col scorecard rubric grid
│       │   ├── JobReport.tsx            ← Pre-formatted AI report renderer
│       │   └── RankingList.tsx          ← Score bars, Apto/Descartado sections
│       ├── services/
│       │   └── jobsApi.ts               ← getJobOffer, getJobProfile, getJobRanking, getJobReport
│       └── types.ts                     ← JobOffer, JobProfile, JobRanking, RankingCandidate, etc.
├── lib/
│   ├── utils.ts                    ← cn() helper
│   ├── api.ts                      ← adminFetch, candidateFetch, publicFetch, logout helpers, guards
│   └── cache.ts                    ← module-level TTL cache — getCached(key, fetcher, opts)
├── api/          ← HTTP clients for the FastAPI backend (future)
├── hooks/        ← Shared custom React hooks (future)
├── layouts/      ← Page layouts (future)
├── stores/       ← Global state — Zustand (future)
├── types/        ← TypeScript types mirroring backend contracts.py (future)
└── utils/        ← Pure utilities (future)
```

### API cache patterns (`src/lib/cache.ts`)

All read API functions go through a module-level TTL cache — a plain `Map` that lives for the browser session, shared across all component instances, zero React overhead.

```typescript
getCached<T>(key: string, fetcher: () => Promise<T>, opts?: { ttl?: number; force?: boolean }): Promise<T>
```

- Default TTL: **45 s** (`DEFAULT_TTL = 45_000`)
- `opts.force = true` bypasses the cache and always fetches — used by manual Actualizar buttons and post-mutation reloads
- Cached functions use a stable key string (e.g. `"jobs"`, `"job-ranking:${jobId}"`)

| Function | TTL | Notes |
|---|---|---|
| `getJobs` | 60 s | Sidebar list |
| `getJobOffer` | 300 s | Rarely changes |
| `getJobProfile` | 300 s | KO criteria / rubric |
| `getJobRanking` | 60 s | Scores can update after evaluation |
| `getJobReport` | 300 s | AI report — expensive to regenerate |
| `getJobAudit` | 45 s | Default TTL |
| `getJobMetrics` | 30 s | Interview progress counts |
| `getCandidates` | 45 s | |
| `getCvAudit` | 60 s | |

**Not cached (mutations / real-time):** `createJob`, `closeJob`, `triggerEvaluation`, `getJobNotifications`, `getEmailHealth`

**Pattern for every page `load` function:**
```tsx
const load = useCallback(async (force = false) => {
  const data = await getSomeData(params.id, force)
  // ...
}, [params.id])

// Mount: load()          → uses cache
// Refresh button: load(true) → bypasses cache
// Post-mutation: load(true)  → bypasses cache
```

### Navigation progress bar (`src/components/providers/NavigationProgress.tsx`)

A thin 2 px blue bar fixed at the top of the viewport — same UX as Google/YouTube/GitHub. Zero external dependencies.

**How it works:**
1. Listens to `click` events with `capture: true` on `document`. If the clicked element (or closest ancestor) is an `<a>` with an internal `href` that differs from the current pathname, it starts filling.
2. Fills 0 → 88% via an 80 ms interval with a decelerating rate (fast early, trickles near the cap).
3. Snaps to 100% and fades out (360 ms) when `usePathname()` returns a new value.

**Key implementation details:**
- `activeRef` prevents re-triggering if a second click fires mid-navigation
- `pointerEvents: none`, `aria-hidden` — zero layout impact and no accessibility noise
- Color: `var(--ds-accent-blue)` with `boxShadow: "0 0 8px 0 var(--ds-accent-blue)"`
- Mounted in `src/app/layout.tsx` as the first child of `<ThemeProvider>`, before `{children}`
- Does not use NProgress, nextjs-toploader, or any external package

**Programmatic trigger — `startProgress()`:**

For form submissions that use `router.push()` (not `<a>` clicks), call `startProgress()` before the push — the bar starts immediately and completes automatically when `usePathname()` detects the route change.

```tsx
import { startProgress } from "@/components/providers/NavigationProgress"

// In handleSubmit, right before router.push():
startProgress()
router.push("/interview")
```

`startProgress()` is a module-level export backed by a ref (`_startFn`) that points to the component's internal `start` function. It is registered on every effect run and cleared on cleanup — safe to call even if the component hasn't mounted yet (no-op in that case).

**Current usages:** `CandidateLoginForm.tsx` (after successful login → `/interview`).

### Theme system

The app uses `next-themes` with `attribute="class"` and `defaultTheme="system"`. `ThemeProvider` wraps `{children}` in `src/app/layout.tsx`. `<html>` has `suppressHydrationWarning` — do not remove it.

**How it works:** `next-themes` injects an inline script into `<head>` before hydration that reads `prefers-color-scheme` (or saved preference) and immediately sets/removes the `dark` class on `<html>`. No flash-of-wrong-theme.

**No manual toggle** — system preference only. Do not add a sun/moon button.

**No `forcedTheme` anywhere** — all routes (including dashboard and `/jobs/*`) respect the system theme. Do not add `useEffect` blocks that force `document.documentElement.classList.add("dark")`.

### Logo pattern — always use dual images

Two logo files exist in `public/`:
| File | Use in |
|---|---|
| `/logo.png` | Dark mode (`1768×340 px`) |
| `/logo-withe.png` | Light mode (`2172×724 px`) |

**Every place a logo appears must use both images with `dark:hidden` / `hidden dark:block`:**

```tsx
{/* Light mode */}
<Image
  src="/logo-withe.png"
  alt="NovaHiring"
  width={2172}
  height={724}
  className="h-10 w-auto dark:hidden"
  priority
/>
{/* Dark mode */}
<Image
  src="/logo.png"
  alt="NovaHiring"
  width={1768}
  height={340}
  className="hidden h-10 w-auto opacity-80 dark:block"
  priority
/>
```

- Pass **actual intrinsic pixel dimensions** per CLAUDE.md rule — use CSS (`h-*`) to control rendered size.
- Never use CSS `filter: brightness(0)` on a single logo image — always use the proper pair.
- Current locations: `AuthPageShell.tsx`, `interview/page.tsx` (×2), `CtaFooter.tsx`, `AdminSidebar.tsx`.

### Feature → Backend mapping

| `src/features/` | Backend (`nova-hiring/`) | Responsibility |
|---|---|---|
| `auth/` | `api/auth.py` | Login, Bearer / X-API-Key token validation, CV upload |
| `jobs/` | `api/jobs.py` | Job offer text, profile, ranking, AI report |
| `candidates/` | `api/candidates.py` | Candidate list, evaluation trigger |
| `interviews/` | `api/interviews.py` | Interview sessions, messages, interrupt flag, admin session transcript |
| `interviews/ai/` | `services/ai_client.py` | LLM dialogue UI (dimension scoring) |

### Auth routes & flows

| Route | Auth | Redirects to |
|---|---|---|
| `/login` | none | `/login/admin` (redirect) |
| `/login/admin` | none | `/dashboard` on success |
| `/login/candidate` | none | `/interview` on success |
| `/upload?job_id=<id>` | none | — (shows passed_ko result) |
| `/dashboard` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]/ranking` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]/report` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]/profile` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]/cvs` | `hasAdminKey()` | `/login/admin` |
| `/jobs/[job_id]/audit` | `hasAdminKey()` | `/login/admin` |
| `/interview/*` | `hasCandidateToken()` | `/login/candidate` |

### Token storage (`src/features/auth/types.ts` — `STORAGE_KEYS`)

| Key | Value stored |
|---|---|
| `nova_admin_api_key` | API key from `POST /auth/admin/login` |
| `nova_candidate_token` | Bearer token from `POST /auth/candidate/login` |
| `nova_candidate_id` | candidate_id from candidate login |
| `nova_candidate_job_id` | job_id from candidate login |
| `nova_candidate_username` | username typed at login — used to personalize the farewell message in `/interview` |

### API helpers (`src/lib/api.ts`)

- `adminFetch(path, options)` — adds `X-API-Key` header; auto-calls `logoutAdmin()` on 401/403
- `candidateFetch(path, options)` — adds `Authorization: Bearer` header; auto-calls `logoutCandidate()` on 401/403
- `publicFetch(path, options)` — no auth header (used by CV upload and login endpoints)
- `hasAdminKey()` / `hasCandidateToken()` — route guard helpers
- `logoutAdmin()` / `logoutCandidate()` — clear localStorage + redirect

### FastAPI error response format

This backend uses FastAPI, which wraps error payloads under `"detail"` — **not** at the top level:

```json
{ "detail": { "error": "session_already_exists", "session_id": "a55ae3f9-..." } }
```

When parsing error responses always look in `body["detail"]` first, then fall back to `body` itself. Never assume a field like `error` or `session_id` is at the root. See `createSession` in `interviewsApi.ts` for the canonical pattern.

### Interview session patterns (`src/app/interview/page.tsx`)

The complete API contract is in `docs/specs-candidate.md`. Key implementation rules:

> ⚠️ **REGLA CRÍTICA — NUNCA fabricar mensajes del AI en el frontend:**
>
> El backend es la única fuente de verdad para los mensajes de la entrevista. **Nunca construyas ni inventes mensajes del assistant usando datos de otro campo** (como `next_question.question_text`).
>
> | Campo | Uso correcto | Uso prohibido |
> |---|---|---|
> | `next_question.question_text` | Metadata para el header (dimensión, progreso) | ❌ Como contenido de un mensaje del assistant |
> | `next_question.dimension_name` | Label del header "Dimensión X" | ❌ Como burbuja de chat |
> | `message` (de `POST /sessions`) | Mostrar directamente como primer mensaje | ✅ |
> | `messages[]` (de `GET /sessions/{id}`) | Reemplazar todo el estado local de mensajes | ✅ |
>
> **Flujo correcto tras `sendMessage`:**
> 1. Añadir el mensaje del usuario optimísticamente (UX inmediata)
> 2. Llamar `pollSession(sid)` → `GET /sessions/{id}` para obtener la respuesta real del AI desde la DB
> 3. Nunca añadir `next_question.question_text` como burbuja de chat
>
> **Si encuentras otro lugar en el frontend que construya mensajes del AI con datos que no vengan directamente de `messages[]` o `message`:** detente, no lo implementes, y pregunta antes de tomar la decisión. Este error causó que el candidato viera respuestas truncadas/duplicadas mientras el admin veía las reales.

- **Response shapes differ per endpoint** — do NOT use a single `InterviewSession` type for all calls:
  - `POST /sessions` → `{ session_id, status, message, next_question }` (one message, one question — no array)
  - `POST /sessions/{id}/message` → `{ session_status, next_question, evaluation_result }` — **no `message` field** — the AI response is only available via `GET /sessions/{id}`
  - `GET /sessions/{id}` → `{ status, current_question_index, messages[] }` (full history, single source of truth)
- **`next_question` is metadata only** — use it for header/progress UI (`dimension_name`, `question_number`). Never render `question_text` as a chat bubble.
- **After `sendMessage`** — always call `pollSession(sid, true, countBeforeUserMsg)` to sync the real AI response from the DB and animate it. Do not construct the AI reply manually.
- **Session ID persistence** — after a successful `createSession`, store the ID under `nova_session_id` in localStorage. On a 409 `session_already_exists`, extract `session_id` from `body.detail.session_id`; if absent, fall back to `localStorage["nova_session_id"]`. Clear this key on logout.
- **`nova_session_id` is NOT in `STORAGE_KEYS`** — it is managed locally within the interview page, not in `src/features/auth/types.ts`.

#### Typing animation (natural response reveal)

New assistant messages are revealed character by character so they feel like the AI is writing in real time.

**`pollSession(sid, animateNew = false, prevMsgCount = 0)`**

| Param | When to pass |
|---|---|
| `animateNew = true` | Always from `handleSend` and session-busy retry |
| `prevMsgCount` | `messages.length` captured in `handleSend` **before** the optimistic user message is added — used to slice out only new assistant messages |
| default (`animateNew = false`) | Session restore in `initSession` — historical messages must never be animated |

**New state / refs:**

| Name | Type | Role |
|---|---|---|
| `typingContent` | `string \| null` | Partial text of the message currently being typed |
| `typingTimerRef` | `ref<Timeout>` | `setTimeout` handle — cleared on interrupt / unmount |
| `typingSeqNumRef` | `ref<number \| null>` | `sequence_number` of the message being typed (used as Framer key for seamless swap) |

**`displayMessages`** — derived before return:
```tsx
const displayMessages: SessionMessage[] =
  typingContent !== null && typingSeqNumRef.current !== null
    ? [...messages, { role: "assistant", content: typingContent, sequence_number: typingSeqNumRef.current }]
    : messages
```
The typing placeholder shares the same `sequence_number` key as the real message. When typing completes, `setTypingContent(null)` + `setMessages(sess.messages)` are batched in one render — React updates the DOM node in place, no exit/enter flash.

**`PageStatus` includes `"typing"`** — `isProcessing` covers `"sending" | "busy" | "typing"` so the input stays locked throughout. TypingDots (`●●●`) only show during `"sending"` and `"busy"` (waiting for HTTP); once the response arrives, typing state takes over and the text starts appearing.

**Sequential messages** — when `GET /sessions/{id}` returns 2 new assistant messages (e.g., acknowledgment + next question), `animateMsgs(idx)` types each one in sequence:
- `TICK_MS = 35ms`, `CHARS_PER_TICK = ⌈len/70⌉` → always ~2.5 s per message regardless of length
- 320 ms pause between messages before starting the next one
- Each completed message is committed via `setMessages(prev => [...prev, msg])` before the next starts

**Never** add a typing animation for session restore, browsing history, or the `ResultScreen` farewell — only live sent messages.

#### Response chime (audio notification)

A soft two-note chime plays once when the bot finishes typing all messages in a turn. Implemented as a module-level `playChime()` function using the **Web Audio API** — zero dependencies, no audio files.

```typescript
function playChime() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    let done = 0
    ;[523.25, 783.99].forEach((freq, i) => {  // C5, G5 — perfect fifth
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      const t = now + i * 0.09
      gain.gain.setValueAtTime(0.07, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.start(t)
      osc.stop(t + 0.45)
      osc.onended = () => { if (++done === 2) void ctx.close() }
    })
  } catch { /* audio not supported — silent fail */ }
}
```

**Trigger point:** called in `animateMsgs()` when `msgIdx >= newAssistantMsgs.length` — i.e., after ALL messages in the batch finish typing, right before `setPageStatus("ready")`. Plays once per turn regardless of how many sequential messages the bot sends.

**Why it works:** The user interaction (pressing Send) unlocks the browser's `AudioContext` autoplay policy before the chime fires. No `AudioContext` is created at component mount — only on demand per chime.

**Never call `playChime()`** during session restore (`initSession`), history browsing, or the farewell message at `pageStatus === "completed"` — only for live sent messages.

#### Result state (candidate view)

**Never show scores, rankings, or D1–D8 dimension data to candidates.** When `pageStatus === "completed"`, the chat UI stays visible (sidebar, header, progress bar, all messages) — the farewell appears **inline at the bottom of the conversation**, not as a full-screen replacement.

**No `ResultScreen` component** — the farewell is rendered directly in the chat view after the `AnimatePresence` message list:

```tsx
{pageStatus === "completed" && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "tween" as const, duration: 0.38, ease: "easeOut" as const }}
  >
    {/* Divider */}
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--ds-border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-gray-500)]">
        Entrevista finalizada
      </span>
      <div className="h-px flex-1 bg-[var(--ds-border)]" />
    </div>
    {/* Farewell as a native assistant message bubble */}
    <Message from="assistant">
      <MessageContent>
        <Response>{`¡Excelente, ${candidateDisplayName}! ...tres días... 🚀`}</Response>
        <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.08] pt-3">
          <BotAvatar state={null} className="size-5" />
          <span>Cordialmente, <span>Agente NovaHiring</span></span>
        </div>
      </MessageContent>
      <BotAvatar state={null} className="size-8 shrink-0" />
    </Message>
  </motion.div>
)}
```

- The input area is hidden (`{pageStatus === "completed" ? null : <div ...>}`) — chat history and sidebar remain visible.
- `candidateDisplayName` is a `useState` lazy-init at the top of `InterviewPage`: reads `nova_candidate_username` from localStorage, takes the first `.`-segment, strips trailing digits, capitalizes. Falls back to `"candidato/a"`. Computed once on mount.
- **`handleSend` when completed**: calls `await pollSession(sid)` (no animation) to fetch the final messages from `GET /sessions/{id}` before setting `pageStatus = "completed"`. Never skip this call — without it the last AI message is missing from the history.
- `EvaluationResult` type and `evaluationResult` state are **removed** — the evaluation data is not consumed in the candidate view.
- The browsing history view (past completed sessions) uses the same pattern — `sessionCompleted` boolean flag, same divider + bubble, **no result card**.
- Same rule applies: **never** add scores or dimension breakdown back to the candidate-facing view.

### Winner selection & process audit (`src/app/jobs/[job_id]/audit/`)

Full spec in `docs/specs-winner-selection-audit.md`. Implementation summary:

#### New API endpoints (all use `adminFetch` — `X-API-Key`)

| Function | Endpoint | File |
|---|---|---|
| `getJobAudit(jobId)` | `GET /jobs/{id}/audit` | `src/features/jobs/services/jobsApi.ts` |
| `closeJob(jobId)` | `POST /jobs/{id}/close` | `src/features/jobs/services/jobsApi.ts` |
| `getAdminSession(sessionId)` | `GET /interviews/sessions/{id}` | `src/features/interviews/services/interviewsApi.ts` |

`closeJob` handles 409 `already_closed` — always parse `body.detail` first per the FastAPI error format rule.

#### New types (`src/features/interviews/types.ts`)

- `JobAuditCandidate` — per-candidate row in the audit response
- `JobAuditResponse` — full `GET /audit` response (status, deadline, candidates[])
- `CloseJobResponse` — `POST /close` response (winner_nombre, winner_score, sessions_expired)
- `AdminSessionDetail` — full session transcript with `messages[]` + `evaluation_result`

#### Audit page patterns

- **"Cerrar proceso de selección" button** — enabled only when `ready_to_close && status !== "closed"`. Uses two-step inline confirmation (no dialog): first click shows `¿Confirmar? / Sí, cerrar / Cancelar` inline. Button is solid `bg-[var(--ds-accent-red)]` when enabled, gray when disabled.
- **Winner row** — green 3px left border via inline `style={{ borderLeft: "3px solid var(--ds-accent-green)" }}` on the first `td` (table-safe — do NOT use absolute-positioned div inside `tr`).
- **Interview status badges** — `completed`→green, `active`→amber+pulse, `pending`→gray, `abandoned`/`expired`→red.
- **Chat transcript** — opens in a `Sheet side="right"` without navigation. Loads `getAdminSession()` on open. Shows message bubbles + D1–D8 evaluation grid if `status === "completed"`.
- **Descartados section** — collapsible (`ChevronDown/Up`), `opacity-50` muted rows, `AnimatePresence` for expand/collapse animation.

#### Audit page — performance patterns

**Why the page felt slow — concurrent request overload:**

On every mount, the page (plus layout + sidebar) fires 5–6 simultaneous API calls to the same backend host. With HTTP/1.1 these queue; with HTTP/2 they still compete for server time. The fix is to sequence non-critical requests AFTER the primary gate resolves.

**`load()` — audit-first, conditionally fire the rest:**

Only `getJobAudit` fires immediately. After it resolves, secondary calls fire based on the job's status:

```tsx
const load = useCallback(async () => {
  setAuditLoading(true)
  setMetricsLoading(true)

  try {
    const auditData = await getJobAudit(params.job_id)
    setAudit(auditData)
    setAuditLoading(false)

    if (auditData.status === "closed") {
      // closed: sessions are terminal — metrics & pre-close health are useless
      setMetricsLoading(false)
    } else {
      // active: fire metrics + email health concurrently AFTER audit renders page
      void getJobMetrics(params.job_id)
        .then(/* build map, setMetricsMap */)
        .catch(() => {})
        .finally(() => { setMetricsLoading(false) })
      void getEmailHealth().then(setEmailHealth).catch(() => {})
    }
  } catch { setError("..."); setAuditLoading(false); setMetricsLoading(false) }
}, [params.job_id])
```

| Job status | API calls on mount (page only) | Notes |
|---|---|---|
| **closed** | 1 (audit) | metrics + health skipped; notifications delayed 1.5s |
| **active** | 1 immediately + 2 after audit resolves | metrics + health fire after page renders |

- Notifications polling for closed jobs is delayed 1.5s so the page settles first.
- `getEmailHealth` is removed from the always-on mount effect — only called for active jobs.
- Refresh button: `disabled={auditLoading}` + `animate-spin` on `auditLoading`.
- `await load()` in `handleClose` still works — resolves when audit reloads.

**`ProgressCell` shimmer during metrics load:**

Pass `metricsLoading` through `CandidateRow` → `ProgressCell`. When `loading && data === undefined`, show 8 animated dots instead of `—`:

```tsx
function ProgressCell({ data, status, loading = false }) {
  if (loading && data === undefined) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-1.5 w-3 animate-pulse rounded-full bg-[var(--ds-background-300)]" />
        ))}
      </div>
    )
  }
  // ... normal render
}
```

**`React.memo` + stable `useCallback` on `CandidateRow`:**

`CandidateRow` is wrapped in `memo()`. Its `onViewChat` handler is `useCallback`-memoized and passed directly (not as an inline arrow) so memo's shallow-equal check actually works. This prevents the entire table from re-rendering on every polling tick or state change unrelated to candidates.

**Session caching — avoid re-fetching open chats:**

```tsx
const sessionCacheRef = useRef<Map<string, AdminSessionDetail>>(new Map())

async function openChat(candidate: JobAuditCandidate) {
  const cached = sessionCacheRef.current.get(candidate.session_id)
  if (cached !== undefined) {
    setSessionDetail(cached)   // instant — no API call
    setSessionLoading(false)
    return
  }
  // ... fetch, then: sessionCacheRef.current.set(id, detail)
}
```

The cache lives for the component lifetime. Re-opening the same session chat is instant. Cache resets automatically on full page reload or navigation away.

**Chat sheet skeleton — conversation-shaped placeholders:**

During `sessionLoading`, show 4 alternating left/right message-shaped skeletons instead of a bare spinner. This occupies the expected space and sets the right expectation:

```tsx
{loading && (
  <div className="flex flex-col gap-3 pt-2">
    {[{ w: "w-48", h: "h-14", right: false }, ...].map((s, i) => (
      <div key={i} className={cn("flex max-w-[80%] flex-col gap-1.5", s.right ? "ml-auto items-end" : "items-start")}>
        <div className={cn("animate-pulse rounded-2xl bg-[var(--ds-background-300)]", s.w, s.h)} />
        <div className="h-2 w-10 animate-pulse rounded bg-[var(--ds-background-300)]" />
      </div>
    ))}
  </div>
)}
```

**Page skeleton — mirrors final layout:**

The `auditLoading` skeleton matches the actual structure: header card shape + table with header row + 3 rows of dot-shimmer progress cells. Prevents layout shift when data arrives.

### Ranking page patterns (`src/app/jobs/[job_id]/ranking/page.tsx`)

The ranking page is a metrics dashboard — not a plain list. Layout (top to bottom):

1. **Page header** — `BarChart2` icon + title + subtitle + Actualizar button.
2. **Metric chips row** — 3-column grid: "Candidatos totales" (gray), "Recomendados" (green), "Score medio aptos" (blue). Each chip: `rounded-xl border border-white/[0.14]` + tinted background matching the accent.
3. **Winner Hero card** — only rendered when `aptos.length > 0`. Contains: `Trophy` icon in green tinted box, candidate name (`text-2xl font-bold`), "Recomendado" badge, and a **score ticker** (`font-mono text-4xl font-black text-[var(--ds-accent-green)]`). Top accent: 2px green gradient line.
4. **Score distribution chart** — `AreaChart` (recharts) with `ChartContainer`. Data: all candidates sorted by score descending — each point `{ rank: "#N", name, score, resultado }`. Gradient fill (green → transparent). Dots are green (APTO) or red (DESCARTADO). `ReferenceLine` at cutoff score when mixed results. Tooltip uses `ChartTooltipContent` with a custom `formatter` that casts `item.payload as unknown as ChartPoint` to show the candidate name.
5. **Full ranking table** — aptos section with score bars + "Recomendado" badge on #1; descartados section with `opacity-50` rows.

Entire page wrapped in `motion.div variants={containerVariants}` with `staggerChildren: 0.07` for sequential card reveals.

#### Chart component usage (`src/components/ui/chart.tsx`)

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  score: { label: "Puntuación", color: "var(--ds-accent-green)" },
} satisfies ChartConfig

<ChartContainer config={chartConfig} className="h-52 w-full">
  <AreaChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
    {/* ... recharts components ... */}
    <ChartTooltip content={<ChartTooltipContent formatter={...} hideLabel />} />
  </AreaChart>
</ChartContainer>
```

- `ChartContainer` wraps `ResponsiveContainer` and injects `--color-<key>` CSS vars from the config.
- `ChartConfig` type: `{ [key]: { label?, icon?, color? } }` — always `satisfies ChartConfig`.
- Custom `formatter` in `ChartTooltipContent` receives `(value, name, item, index)` — cast `item.payload as unknown as YourType` for strict-mode safety.
- Colors in chart components: reference `"var(--ds-accent-green)"` directly (not `var(--color-score)`) for dots/stroke to keep DS tokens as the single source of truth.
- Do **not** import `ChartLegend` or `ChartLegendContent` — they are not exported from `chart.tsx` (not needed yet).

### Interview UI component patterns (`src/components/ui/`)

The interview chat view uses ElevenLabs conversation components installed via `pnpm elevenlabs components add <name>`.

#### Conversation layout

```tsx
<Conversation className="min-h-0">          {/* StickToBottom — auto-scroll container, flex-1 */}
  <ConversationContent>                      {/* StickToBottom.Content — p-4 base */}
    <div className="mx-auto max-w-2xl px-6">
      {messages.length === 0 ? (
        <ConversationEmptyState icon={<Orb />} title="..." description="..." />
      ) : (
        /* messages */
      )}
    </div>
  </ConversationContent>
  <ConversationScrollButton />               {/* absolute bottom-4 center — must be inside Conversation */}
</Conversation>
```

- `Conversation` wraps `StickToBottom` — provides `useStickToBottomContext()` to descendants.
- `ConversationScrollButton` **must** be a direct child of `Conversation` (uses context), NOT inside `ConversationContent`.
- Add `className="min-h-0"` on `Conversation` when inside a flex column to prevent overflow.

#### Message bubbles

```tsx
<Message from={msg.role}>                    {/* "user" = right-aligned; "assistant" = left-aligned */}
  <MessageContent>                           {/* variant="contained" (default) or "flat" */}
    <Response>{msg.content}</Response>       {/* streamdown — renders markdown/streaming text */}
  </MessageContent>
  {msg.role === "assistant" && (
    <BotAvatar state={isProcessing ? "thinking" : null} className="size-8 shrink-0" />
  )}
</Message>
```

- `Message from="assistant"` uses `flex-row-reverse` — DOM order is `[MessageContent][BotAvatar]`, visually renders `[BotAvatar][MessageContent]`.
- `MessageContent` variant `"contained"`: user → `bg-[var(--ds-background-200)] text-[var(--ds-gray-1000)]` + adaptive shadow (light: `shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]`, dark: `dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.22)]`) + `ring-1 ring-[var(--ds-border)]`; assistant → `bg-[var(--ds-background-300)] text-[var(--ds-gray-1000)]`. **No blue background on user bubbles** — never use `bg-[var(--ds-accent-blue)]` for chat bubbles. **Never use `bg-primary` / `bg-secondary`** — those shadcn tokens are not mapped in `tailwind.config.ts` and produce no CSS.
- `Response` uses `streamdown` — handles both streamed tokens and completed text.

#### BotAvatar component (inline in `src/app/interview/page.tsx`)

Lightweight inline component — instant load, no dynamic import, no Three.js. Uses `Avatar` + `AvatarBadge` from `@/components/ui/avatar` to keep the status dot (burbujita).

```tsx
function BotAvatar({
  state = null,
  className = "size-8",
}: {
  state?: null | "thinking"
  className?: string
}) {
  return (
    <Avatar className={cn("rounded-xl after:rounded-xl", className)}>
      <AvatarFallback className="rounded-xl bg-[var(--ds-background-300)]">
        <Bot className="size-[55%] text-[var(--ds-accent-blue)]" strokeWidth={1.75} />
      </AvatarFallback>
      {state === null ? (
        <AvatarBadge className="bg-[var(--ds-accent-green)]" />
      ) : (
        <AvatarBadge className="animate-pulse bg-[var(--ds-accent-amber)]" />
      )}
    </Avatar>
  )
}
```

| `state` | Visual |
|---|---|
| `null` (idle) | Bot icon + green badge |
| `"thinking"` | Bot icon + pulsing amber badge |

- Uses `Bot` icon from lucide-react — **never** render "AI" text fallback.
- `AvatarBadge` is the status dot — always keep it, both states must render one.
- Sidebar session items use the same `Bot` icon inside `AvatarFallback` with `rounded-lg`.
- `orb.tsx` still exists in `src/components/ui/` but is **no longer used** in `/interview`. Do not re-introduce it there.

#### Chat message animation patterns

Live chat (`interview/page.tsx`) and transcript viewer (`audit/page.tsx`) follow the same animation rules to feel natural — like Claude or ChatGPT, not robotic.

**`AnimatePresence` — no `mode="popLayout"`:**
- Use `<AnimatePresence initial={false}>` (no mode) for the message list.
- `mode="popLayout"` takes exiting elements out of the DOM flow instantly, causing layout reflows and visible jumps when TypingDots disappear. Never use it for chat lists.

**Message enter animation — no `scale`:**
```tsx
initial={{ opacity: 0, y: 14 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, transition: { duration: 0.15, type: "tween" as const } }}
transition={{ type: "tween" as const, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
```
- `ease: [0.22, 1, 0.36, 1]` — expo-out cubic: starts fast, decelerates smoothly. Gives the natural "message arrives" feel.
- **No `scale`** — scale animations interact with `StickToBottom`'s scroll tracking and create visual jumps. Use only `opacity` + `y`.
- Exit is just `opacity: 0` at 150ms — fast fade so content swaps cleanly without positional fighting.

**Audit `ChatSheet` transcript — staggered entrance:**
```tsx
initial={{ opacity: 0, y: 6, x: msg.role === "user" ? 10 : -10, scale: 0.97 }}
animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
transition={{ type: "tween" as const, duration: 0.26, ease: "easeOut" as const, delay: i * 0.055 }}
```
- History loads all at once → stagger 55ms per message so it reads like a conversation replaying.
- Directional slide: user messages from right (`x: 10`), assistant from left (`x: -10`).
- Label ("Candidato" / "Nova AI") fades in 180ms after its bubble: `delay: i * 0.055 + 0.18`.
- Evaluation card enters after all messages: `delay: messages.length * 0.055 + 0.1`.
- Scale is acceptable here because this is a static history (no live scroll tracking).

#### ⚠️ @react-three/fiber — versión fijada en v8

`@react-three/fiber` **v9** requiere React 19. Este proyecto usa React 18.3.1. La v9 crashea con `TypeError: Cannot read properties of undefined (reading 'S')` en `createReconciler`.

**Versiones correctas (React 18 compatible):**
- `@react-three/fiber@^8.17` ✅
- `@react-three/drei@^9.122` ✅
- `three@^0.184` ✅

**No actualizar** `@react-three/fiber` a v9+ sin antes actualizar React a v19.

### Homepage component patterns

- **RSC by default** — `page.tsx` and `CtaFooter.tsx` are server components.
- **`"use client"` per section** — each interactive section declares its own client boundary; do not hoist to `page.tsx`.
- **Scroll animations** — use `useInView` from `framer-motion` with `{ once: true }`. Always pass explicit `transition={{ type: "tween", duration, delay }}` — never rely on spring defaults (breaks `exactOptionalPropertyTypes`).
- **Score counters** — use `requestAnimationFrame` with ease-out cubic; avoid `useMotionValue` chains.
- **Static data** — define module-level `const` arrays (not inside components) to satisfy `noUnusedLocals`.
- **Icons** — type lucide-react icons as `FC<SVGProps<SVGSVGElement> & { size?: number | string }>` when storing in data arrays. Use a local `const StageIcon = stage.Icon` inside `.map()` before using as JSX.
- **Primary CTA buttons** — always use `.btn-glow` class (defined in `globals.css`). Do not recreate glow effects inline. Secondary buttons use `variant="outline"` with `rounded-full`.
- **Navigation buttons** — use `render={<Link href="..." />}` prop on `<Button>` (base-ui composition pattern) to render as Next.js `<Link>` while keeping button styles.
- **Login dropdown** — `LoginDropdown` in `src/components/home/LoginDropdown.tsx` handles the "Acceder ▾" hero CTA. It tracks open state locally and closes on outside click.
- **Activity feed animations** — use `<AnimatePresence mode="popLayout">` for list items that enter/exit. Keep `duration` ≥ 0.5s and intervals ≥ 4000ms to maintain a professional, readable pace.
- **Favicon** — declared via `metadata.icons` in `layout.tsx` pointing to `/icon.png` (served from `public/`). Do not add a separate `<link>` tag.
- **Footer branding** — `CtaFooter` renders `/logo.png` via `next/image` at the bottom. Do not show the standalone icon there; the logo already includes it.

### Auth form patterns

- All auth pages use `AuthPageShell` — logo, radial glow background, copyright footer.
- Form fields wrap each `<Field>` in `<FocusField>` (lifts `y:-2` on focus via Framer Motion).
- Password fields use `<PasswordInput>` (Eye/EyeOff toggle, `tabIndex=-1` on icon button, `pr-11` padding).
- Error alerts: `bg-[var(--ds-accent-red)]/10 border-[var(--ds-accent-red)]/30 text-[var(--ds-accent-red)]`.
- Submit buttons always use `.btn-glow rounded-full border-0 w-full`.
- Client-side redirect guard via `useEffect` + `hasAdminKey()` / `hasCandidateToken()` at mount.

### Admin dashboard patterns

- **Auth guard** — `jobs/[job_id]/layout.tsx` is a client component. On mount, check `hasAdminKey()`; if missing, `router.replace("/login/admin")`. Show a spinner while checking (`ready` state flag) to prevent flash of content.
- **Active nav link** — use `usePathname()` and exact match: `pathname === base` for the root candidates tab, `pathname === \`${base}${href}\`` for sub-pages. Do not use `startsWith` to avoid false positives.
- **Data fetching** — each page fetches its own data in a `useCallback` + `useEffect` pattern. The `load` function handles loading/error state and is called on mount and via a refresh button.
- **Evaluate button** — calls `POST /candidates/{job_id}/evaluate`, shows feedback message, then auto-reloads candidates after 4 s. Disable during loading or evaluation.
- **Credential display** — APTO candidates show `login_username` + `login_password` in a `CredentialCell` with per-field copy buttons (Check icon confirmation for 2 s) and a password Eye/EyeOff toggle.
- **Ranking page** — fetches both `GET /jobs/{job_id}/ranking` and `GET /candidates/{job_id}` in parallel (`Promise.all`). Builds a `nameMap` from candidates to display names in the ranking list instead of raw UUIDs.
- **Report page** — loading state shows "5–15 segundos" message. Imprimir button (`window.print()`) only appears once the report is loaded. Content is rendered via `JobReport` with `whitespace: pre-wrap` (no markdown library dependency).
- **Error state** — uniform red alert: `border-[var(--ds-accent-red)]/30 bg-[var(--ds-accent-red)]/10 text-[var(--ds-accent-red)]`.
- **Spinner** — `h-6 w-6 animate-spin rounded-full border-2 border-[var(--ds-accent-blue)] border-t-transparent`.

### AdminSidebar dual-mode

`AdminSidebar` accepts `jobId?: string` (optional).

| `jobId` | Sidebar content |
|---|---|
| `string` (inside a job workspace) | Full job list — active job expanded with sub-nav (Candidatos / Top candidatos / Informe IA / Criterios / Auditoría CVs / Proceso) |
| `undefined` (on `/dashboard`) | "Resumen" section — 6 `SidebarMenuButton` items with colored badges: Vacantes, En proceso, Finalizadas, Clientes (unique `tenant_id`s), Candidatos (placeholder), Por cerrar (placeholder) |

- Dashboard items use `motion.div` with `initial={{ opacity:0, x:-6 }}` staggered 55ms each.
- Never show the job list on the dashboard — it duplicates the main content.

### JobMetricsPanel (right panel)

`<JobMetricsPanel jobId={string} open={boolean} />` — toggled via `PanelRight` icon button in the job layout header.

- Fetches candidates independently when `open` becomes `true`.
- Shows: total hero card, pipeline bars (Revisados / Recomendados / Descartados / Pendientes), conversion rate bar, quick-stats list.
- Animated bars use `motion.div width: 0→pct%` with `type:"tween", duration:0.5`.
- Slides in/out with `motion.aside width: 0→264` — sits in a `flex overflow-hidden` row alongside main content so it doesn't push a scrollbar.
- Panel header has its own refresh button; footer shows last-updated time.

### Job layout header structure

```
[SidebarTrigger] | [🏠 Inicio > job title > page] (breadcrumb, flex-1)    [PanelRight toggle]
```

- **Back navigation** — "Inicio" is a `BreadcrumbLink render={<Link href="/dashboard" />}` with `Home` icon + text. Never use a bare icon-only button for this.
- **Breadcrumb** — `Inicio > {jobTitle} > {pageLabel}`. Job title is non-interactive (`render={<span />}`). Page label is `BreadcrumbPage`.
- **Metrics toggle** — `PanelRight` icon button; turns blue + `bg-[var(--ds-background-300)]` when panel is open.

### Page transitions

Wrap page content in `motion.div key={pathname}` to trigger re-animation on route change:

```tsx
// In jobs/[job_id]/layout.tsx — wraps {children}
<motion.div
  key={pathname}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "tween" as const, duration: 0.22, ease: "easeOut" as const }}
>
  {children}
</motion.div>
```

Apply the same pattern (`motion.main` or `motion.div`) to standalone pages like `/dashboard`. Duration 0.22s is the standard for admin page transitions.

### Card design rules (dashboard)

These rules apply to every card, panel, chip, or surface in the admin dashboard.

#### Borders
- **Always** use `border-white/[0.14]` on card surfaces — never `border-[var(--ds-border)]` (too subtle at 8%).
- **Never** use colored accent borders on cards (`border-[var(--ds-accent-red)]/20`, `border-[var(--ds-accent-blue)]/25`, etc.) — they look flashy and are reserved exclusively for error alerts.
- **Never** add `hover:border-[var(--ds-accent-*)]` transitions on cards — same reason.

#### Hover states
- **No hover glow shadows** (`hover:shadow-[0_0_*_var(--ds-accent-*)]`) on cards — too eye-catching.
- Allowed hover states: subtle background brightness shift (`hover:bg-[var(--ds-background-300)]/80`) or text color change only.

#### Card accent indicators (color coding without colored borders)
Use these patterns to convey color without touching the border:
| Pattern | When to use |
|---|---|
| 2px top gradient line: `<div className="h-[2px] bg-gradient-to-r from-[var(--ds-accent-*)] via-[var(--ds-accent-*)]/40 to-transparent" />` | Section/dimension cards (scorecard, skills) |
| 3px left bar: `<div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ds-accent-red)]" />` + `relative overflow-hidden` on parent | KO criteria cards — signals elimination |
| Colored dot `size-1.5 rounded-full` inline with text | Skill chips, score level indicators |
| Tinted icon container: `bg-[var(--ds-accent-*)]/10` + icon `text-[var(--ds-accent-*)]` | Card headers |
| Tinted background cell: `bg-[var(--ds-accent-*)]/5` | Score rubric cells (1–5 grid) |

#### Inner card cells (e.g. score rubric grid)
- Do **not** use `relative overflow-hidden` + absolute-positioned stripe on small inner cells — causes content to appear visually on top of the border.
- Use inline dot indicator + tinted background instead (see pattern above).

#### Section headers inside cards
- Use a `SectionDivider` component: centered label with a `h-px bg-[var(--ds-border)]` line extending to both sides. Never use a bare `<h2>` without visual anchoring.

#### Framer Motion on cards
- Always specify `transition: { type: "tween" as const, duration, ease: "easeOut" as const }` — never omit `as const` on string literals (breaks `exactOptionalPropertyTypes`).
- Stagger card lists with `containerVariants` (`staggerChildren: 0.08`) + `cardVariants` (`y: 8, opacity: 0 → 1`, `duration: 0.28`).
- Stagger sections with `sectionVariants` (`y: 14, opacity: 0 → 1`, `duration: 0.38`).

### UX & Messaging Rules (homepage)

The homepage targets **non-technical business owners** (clinic owners, recruiters, managers) — not developers. These rules apply to all copy, labels, and UI content.

**Never expose on the homepage:**
- Internal scoring formulas or architecture (KO logic, deterministic matching, Python, weighted sums)
- Audit pipelines, system logs, or event types (AI_CALL, KO_CHECK, SCORE_COMPUTED)
- Engineering terminology (token, batch, TTL, prompt version, dimension D1–D8)
- Raw status codes used internally (DESCARTADO, KO, APTA/APTO)

**Always communicate in terms of outcomes:**
| ❌ Internal | ✅ User-facing |
|---|---|
| "Coincidencia determinista de palabras clave" | "Identifica quién encaja en minutos" |
| "Python puntúa cada respuesta del 1 al 5" | "Evaluación estructurada y consistente" |
| "8 dimensiones — logs de auditoría IA" | "Entrevistas justas, disponibles cuando las necesitas" |
| "Weighted scoring — lista para auditoría" | "Ranking claro con recomendaciones respaldadas" |

**UI tone reference:** Linear, Stripe, Notion, Arc Browser — premium SaaS marketing, not Grafana/DevOps dashboards.

### TypeScript strict mode quick-reference

| Rule | Pattern to follow |
|---|---|
| `noUncheckedIndexedAccess` | Use `.map()` callbacks; use `.at(i) ?? fallback` for single access |
| `exactOptionalPropertyTypes` | Never pass `prop={maybeUndefined}` — use `{...(val !== undefined ? { prop: val } : {})}` |
| `noUnusedLocals` | Prefix unused destructure vars with `_`; consume all module-level consts in JSX |

## Historial de commits importantes

| Fecha | Commit | Descripción |
|---|---|---|
| 2026-05-22 21:30 -05 | `2bd649f` | feat: upgrade interview chatbot con ElevenLabs — orb CSS, conversation layout, TypeScript fixes. **Punto de retorno seguro antes del experimento con @react-three/fiber v8.** |
| 2026-05-24 | `d9604d6` | feat: audit page + winner selection — `/jobs/{id}/audit`, `closeJob`, `getAdminSession`, sidebar "Proceso" item, new types en `interviews/types.ts` |
| 2026-05-25 | pendiente | perf: audit page progressive loading — `auditLoading`/`metricsLoading` split, session cache (`useRef<Map>`), ProgressCell shimmer, conversation-shaped sheet skeleton |
| 2026-05-25 | pendiente | perf: module-level TTL cache (`src/lib/cache.ts`) — `getCached(key, fetcher, opts)`, all read APIs cached 30–300 s, `force=true` bypass on Actualizar buttons + post-mutation reloads |
| 2026-05-25 | pendiente | feat: NavigationProgress — thin 2px blue top bar, fires on internal link click, completes on pathname change, zero external deps |
| 2026-05-24 | pendiente | refactor: replace Orb with BotAvatar (Bot icon + AvatarBadge), hide scores from candidate result view, farewell as chat bubble, store candidateUsername |
| 2026-05-24 | pendiente | feat: ranking page redesign — recharts AreaChart, winner hero card, metric chips, score distribution chart; adds `chart.tsx` + `--chart-*` tokens |
| 2026-05-24 | pendiente | refactor: user chat bubbles — neutral surface + adaptive shadow (no blue bg); natural message animations (expo-out, no scale, no popLayout) |
| 2026-05-24 | pendiente | feat: typing animation — sequential char-by-char reveal for new assistant messages; `"typing"` PageStatus, `pollSession(sid, animateNew, prevMsgCount)`, ~2.5 s/msg at 35ms tick, 320 ms pause between messages |
| 2026-05-25 | pendiente | feat: response chime — Web Audio API two-note chime (C5+G5) on bot turn end; `playChime()` module-level fn, zero deps, fires once per turn in `animateMsgs` terminal case |

> Si algo se rompe después de este punto, revertir con: `git revert HEAD` o `git reset --hard 2bd649f`

## Refactor pendiente — `src/app/interview/page.tsx`

El archivo tiene **1158 líneas**. Se ha analizado y acordado extraer los componentes puros sin riesgo. **No tocar `pollSession` ni `initSession` — esos callbacks se quedan en el page.**

### Qué extraer (seguro, riesgo cero):

| Componente | Destino | Por qué es seguro |
|---|---|---|
| `BotAvatar` (L93–112) | `src/features/interviews/components/BotAvatar.tsx` | Solo props, sin estado compartido. También lo usa `SessionsSidebar`. |
| `TypingDots` (L71–91) | `src/features/interviews/components/TypingDots.tsx` | Componente puro, sin deps. |
| `CenteredScreen` + `LoadingScreen` + `ErrorScreen` (L302–360) | `src/features/interviews/components/InterviewScreens.tsx` | Solo props, solo llaman a `BotAvatar`. |
| `SessionsSidebar` (L147–298) | `src/features/interviews/components/SessionsSidebar.tsx` | Recibe todo por props — `sessions`, `onSelect`, `onLogout`, `onClose?`. Necesita llevarse `STATUS_CONFIG` y `formatRelativeTime`. |

### Qué NO extraer:

- `pollSession` — `useCallback` que cierra sobre 6+ setState + 3 refs. Se queda en el page.
- `initSession` — mismo motivo.
- La vista de browsing y el chat view — usan 10+ variables del componente padre directamente.

### Resultado esperado:

`interview/page.tsx`: **1158 → ~680 líneas** sin cambiar ningún comportamiento.

## CI/CD

- **deploy.yml** — triggers on push to `main`: install → `pages:build` → `wrangler pages deploy` → Discord notification
- **discord-notify.yml** — Discord notifications for all pushes and PR lifecycle events

Required GitHub secrets: `NEXT_PUBLIC_BACKEND`, `NEXT_PUBLIC_JOB_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK`.

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
