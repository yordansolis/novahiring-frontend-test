# NovaHiring — Frontend

Frontend for the NovaHiring AI hiring platform. Built with Next.js 14 App Router and deployed to Cloudflare Pages.

Connects to a FastAPI backend (`nova-hiring/`) that handles auth, job offers, candidate evaluation, and AI-driven interview sessions.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict mode)
- **Tailwind CSS 3.4** + **shadcn/ui** (`base-nova` style) + **@base-ui/react**
- **Framer Motion** — scroll reveals, entrance animations, form interactions
- **Cloudflare Pages** via `@cloudflare/next-on-pages`

---

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.local.example .env.local   # then fill in values

# 3. Start dev server
pnpm dev
```

> **pnpm only** — `npm` and `npx` are prohibited in this repo.

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND` | FastAPI base URL — e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_JOB_ID` | Active job offer ID for the CV upload entry point |

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_BACKEND=http://localhost:8000/api/v1
NEXT_PUBLIC_JOB_ID=job-clinica-salud-valencia-001
```

---

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm pages:build` | Build for Cloudflare Pages |
| `pnpm type-check` | TypeScript check (no emit) |
| `pnpm lint` | ESLint |

---

## Routes

| Route | Auth | Description |
|---|---|---|
| `/` | — | Marketing homepage |
| `/login` | — | Redirects to `/login/admin` |
| `/login/admin` | — | Recruiter login → stores `X-API-Key` in localStorage |
| `/login/candidate` | — | Candidate login → stores Bearer token in localStorage |
| `/upload?job_id=<id>` | — | CV upload form (public, multipart) |
| `/dashboard` | Admin key | Recruiter dashboard *(pending)* |
| `/interview` | Candidate token | Interview session *(pending)* |

---

## Auth flows

### Recruiter
```
/login/admin  →  POST /auth/admin/login
              →  saves nova_admin_api_key to localStorage
              →  redirect /dashboard
```

### Candidate (new applicant)
```
/upload?job_id=<id>  →  POST /candidates/upload (multipart)
                     →  shows passed_ko result
                     →  if APTO: admin sends credentials manually
                     →  candidate goes to /login/candidate
```

### Candidate (returning)
```
/login/candidate  →  POST /auth/candidate/login
                  →  saves nova_candidate_token + ids to localStorage
                  →  redirect /interview
```

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  ← Homepage
│   ├── login/admin/page.tsx      ← Recruiter login
│   ├── login/candidate/page.tsx  ← Candidate login
│   └── upload/page.tsx           ← CV upload
├── components/
│   ├── auth/AuthPageShell.tsx    ← Shared auth page layout (logo + copyright)
│   ├── home/                     ← Homepage sections
│   │   └── LoginDropdown.tsx     ← "Acceder ▾" CTA dropdown
│   └── ui/
│       ├── input.tsx             ← Base input with focus glow
│       ├── focus-field.tsx       ← Framer Motion lift on focus
│       └── password-input.tsx    ← Input + Eye/EyeOff toggle
├── features/
│   └── auth/
│       ├── components/           ← AdminLoginForm, CandidateLoginForm, CvUploadForm
│       ├── services/authApi.ts   ← loginAdmin, loginCandidate, uploadCv
│       └── types.ts              ← Auth types + STORAGE_KEYS
└── lib/
    ├── api.ts                    ← adminFetch, candidateFetch, publicFetch, guards
    └── utils.ts                  ← cn() helper
```

---

## CI/CD

Deploys automatically on push to `main` via GitHub Actions:

1. `pnpm install`
2. `pnpm pages:build` (`next-on-pages`)
3. `wrangler pages deploy`
4. Discord notification

**Required GitHub secrets:** `NEXT_PUBLIC_BACKEND`, `NEXT_PUBLIC_JOB_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK`.
