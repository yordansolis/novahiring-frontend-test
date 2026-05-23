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
- **Headless UI**: `@base-ui/react` — Button, Input, Field primitives
- **Fonts**: Inter + JetBrains Mono via `next/font/google` (variables: `--font-geist`, `--font-geist-mono`)
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

Always use CSS variables — never hardcode color values. All tokens are defined in `src/app/globals.css`.

### Backgrounds
| Token | Value | Role |
|---|---|---|
| `var(--ds-background-100)` | `#0a0a0b` | Page background |
| `var(--ds-background-200)` | `#111113` | Card / section background |
| `var(--ds-background-300)` | `#18181b` | Raised surface (panels, inputs, code blocks) |

### Text
| Token | Value | Role |
|---|---|---|
| `var(--ds-gray-1000)` | `#fafafa` | Primary text |
| `var(--ds-gray-700)` | `#d4d4d8` | Secondary text |
| `var(--ds-gray-600)` | `#a1a1aa` | Muted text / descriptions |
| `var(--ds-gray-500)` | `#71717a` | Placeholder / labels |

### Accents
| Token | Role |
|---|---|
| `var(--ds-accent-blue)` | Interactive elements, links |
| `var(--ds-accent-green)` | APTA, verified, success states |
| `var(--ds-accent-red)` | DESCARTADO, KO failures, errors |
| `var(--ds-accent-amber)` | Processing, in-progress states |

### Borders
| Token / Class | Role |
|---|---|
| `var(--ds-border)` | `rgba(255,255,255,0.08)` — divider lines, separator elements |
| `border-white/[0.14]` | Card and component borders — use this instead of `border-[var(--ds-border)]` on any card surface. The default token (8%) is too subtle for card boundaries; 14% gives visible definition without being flashy. |

> **Rule:** `bg-[var(--ds-border)]` (as a background) is fine for thin decorative dividers (1px `h-px` lines). For actual `border-*` on cards, chips, and panels always use `border-white/[0.14]`.

### shadcn component token bridge
`globals.css` also maps shadcn's internal tokens (`--background`, `--foreground`, `--input`, `--ring`, `--primary`, etc.) to the `ds-*` design system so that generated shadcn/base-ui components render correctly in the dark theme. Do not remove these mappings.

### Tailwind custom utilities (mapped in `tailwind.config.ts`)
`bg-ds-bg-100`, `bg-ds-bg-200`, `bg-ds-bg-300`, `text-ds-gray-1000`, etc.
Raw CSS variable syntax also accepted: `bg-[var(--ds-background-200)]`.

### Global CSS utility classes (defined in `globals.css`, outside any `@layer`)

| Class | Purpose |
|---|---|
| `.btn-glow` | Primary CTA button — blue gradient (`#4f93f8→#2563eb`), pulsing blue glow animation (`btn-glow-pulse`, 2.4s), white hover (`#f1f5f9` bg + dark text, animation paused). Use with `rounded-full border-0`. |

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
│   │       ├── ranking/page.tsx    ← Score-ranked candidate list with progress bars
│   │       ├── report/page.tsx     ← AI narrative report (Regenerar + Imprimir)
│   │       ├── profile/page.tsx    ← KO criteria + scorecard rubric grid
│   │       └── cvs/page.tsx        ← CV audit view — full CV text per candidate, filter by result
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
│   │   ├── conversation.tsx        ← ElevenLabs: Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton
│   │   ├── message.tsx             ← ElevenLabs: Message (user/assistant layout), MessageContent (contained/flat variants)
│   │   ├── orb.tsx                 ← CSS/Framer Motion animated orb — AgentState: null | "thinking" | "listening" | "talking"
│   │   └── response.tsx            ← ElevenLabs: Response — wraps streamdown for markdown/streaming text rendering
│   ├── admin/
│   │   ├── AdminSidebar.tsx        ← Left sidebar: job list (jobId set) or resumen metrics (jobId undefined)
│   │   └── JobMetricsPanel.tsx     ← Right collapsible panel: candidate pipeline stats per job
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
│   └── api.ts                      ← adminFetch, candidateFetch, publicFetch, logout helpers, guards
├── api/          ← HTTP clients for the FastAPI backend (future)
├── hooks/        ← Shared custom React hooks (future)
├── layouts/      ← Page layouts (future)
├── stores/       ← Global state — Zustand (future)
├── types/        ← TypeScript types mirroring backend contracts.py (future)
└── utils/        ← Pure utilities (future)
```

### Feature → Backend mapping

| `src/features/` | Backend (`nova-hiring/`) | Responsibility |
|---|---|---|
| `auth/` | `api/auth.py` | Login, Bearer / X-API-Key token validation, CV upload |
| `jobs/` | `api/jobs.py` | Job offer text, profile, ranking, AI report |
| `candidates/` | `api/candidates.py` | Candidate list, evaluation trigger |
| `interviews/` | `api/interviews.py` | Interview sessions, messages, interrupt flag |
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
| `/interview/*` | `hasCandidateToken()` | `/login/candidate` |

### Token storage (`src/features/auth/types.ts` — `STORAGE_KEYS`)

| Key | Value stored |
|---|---|
| `nova_admin_api_key` | API key from `POST /auth/admin/login` |
| `nova_candidate_token` | Bearer token from `POST /auth/candidate/login` |
| `nova_candidate_id` | candidate_id from candidate login |
| `nova_candidate_job_id` | job_id from candidate login |

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

- **Response shapes differ per endpoint** — do NOT use a single `InterviewSession` type for all calls:
  - `POST /sessions` → `{ session_id, status, message, next_question }` (one message, one question — no array)
  - `POST /sessions/{id}/message` → `{ session_status, next_question, evaluation_result }`
  - `GET /sessions/{id}` → `{ status, current_question_index, messages[] }` (full history, no next_question)
- **Messages are maintained client-side** — the page accumulates its own `messages[]` state; only `getSession` (used for polling) syncs from the backend.
- **Session ID persistence** — after a successful `createSession`, store the ID under `nova_session_id` in localStorage. On a 409 `session_already_exists`, extract `session_id` from `body.detail.session_id`; if absent, fall back to `localStorage["nova_session_id"]`. Clear this key on logout.
- **`nova_session_id` is NOT in `STORAGE_KEYS`** — it is managed locally within the interview page, not in `src/features/auth/types.ts`.

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
    <div className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/[0.14]">
      <Orb colors={ORB_COLORS} agentState={isProcessing ? "thinking" : null} className="h-full w-full" />
    </div>
  )}
</Message>
```

- `Message from="assistant"` uses `flex-row-reverse` — DOM order is `[MessageContent][Orb]`, visually renders `[Orb][MessageContent]`.
- `MessageContent` variant `"contained"` maps `user → bg-primary`, `assistant → bg-secondary` via shadcn token bridge.
- `Response` uses `streamdown` — handles both streamed tokens and completed text.

#### Orb component (`src/components/ui/orb.tsx`)

CSS + Framer Motion animated orb — **no Three.js dependency** (see Three.js note below).

```tsx
<Orb
  colors={["#4f93f8", "#2563eb"]}   // optional, defaults to brand blue
  agentState={null}                  // null | "thinking" | "listening" | "talking"
  className="size-8"                 // controls rendered size
/>
```

| `agentState` | Animation |
|---|---|
| `null` (idle) | Slow 3.5s gentle pulse |
| `"thinking"` | Medium 1.7s breath — loading state |
| `"listening"` | Faster 1.1s beat |
| `"talking"` | Quick 0.65s multi-keyframe throb |

- Always import `Orb` with `next/dynamic` + `ssr: false` when used in interview page (Framer Motion canvas-less but still client-only):

```tsx
const Orb = dynamic(
  () => import("@/components/ui/orb").then((m) => ({ default: m.Orb })),
  { ssr: false }
)
```

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
| `string` (inside a job workspace) | Full job list — active job expanded with sub-nav (Candidatos / Top candidatos / Informe IA / Criterios / Auditoría CVs) |
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

> Si algo se rompe después de este punto, revertir con: `git revert HEAD` o `git reset --hard 2bd649f`

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
