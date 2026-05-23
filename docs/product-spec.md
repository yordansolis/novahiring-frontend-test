# NovaHiring — Product Specification

## What is NovaHiring?

NovaHiring is an AI-assisted technical hiring platform for small and mid-size businesses that need to hire a specialized freelancer or contractor — but lack the internal technical knowledge to evaluate candidates themselves.

The core problem it solves: **a non-technical client knows what they need built, but cannot tell a strong candidate from a weak one.** NovaHiring bridges that gap with a structured, auditable evaluation pipeline where Python code makes every hard decision and AI only processes language.

**Core principle: Python code is the brain. AI is only a language processing tool.**

---

## The problem it solves

A typical small business (a clinic, a logistics company, a local retailer) wants to hire a freelance developer to build something specific — a WhatsApp chatbot, an appointment system, an inventory tool. They post a job, receive 5–10 CVs, and have no idea how to compare them.

Without NovaHiring:
- They rely on gut feeling or superficial signals (portfolio aesthetics, years of experience)
- They miss critical disqualifiers (no RGPD knowledge, no WhatsApp API experience)
- They hire someone who looks good on paper but fails on the actual requirements
- They waste weeks before the mismatch becomes obvious

With NovaHiring:
- The client describes their problem in plain language (discovery chatbot)
- The system extracts objective KO criteria and a weighted scorecard
- Every CV is screened against those criteria automatically
- The top candidates are interviewed by an AI chatbot on exactly the relevant dimensions
- The recruiter gets a ranked list with justification, evidence, and gaps — ready to decide

---

## Users

### 1. The Client / Recruiter (admin)
A non-technical business owner or office manager who needs to hire someone technical.
- Does not understand code or tech stacks
- Knows the business problem: "we lose 15–20 appointments per week"
- Has a budget and a deadline
- Needs confidence that the person they hire can actually do the job

**What they see:** Discovery wizard → candidate ranking dashboard → evaluation reports → final recommendation.

### 2. The Candidate
A freelance developer or technical contractor applying for the job.
- Uploads their CV (PDF or Markdown)
- Gets immediately screened against KO criteria
- If they pass KO: receives a personal access token and an invitation to a structured interview
- Completes an 8-question chatbot interview at their own pace

**What they see:** CV upload form → confirmation of status → interview chatbot → completion.

### 3. The Platform Operator (internal)
The team running NovaHiring — manages job openings, monitors evaluations, troubleshoots.
- Has admin API key access
- Can trigger evaluations manually, read reports, view AI audit logs

---

## The three-stage pipeline

### Stage 1 — Discovery (Client → Job Profile)
The client answers a structured questionnaire (~20 adaptive questions) about their business, the system they want built, their team context, budget, and compliance needs.

The system infers from these answers:
- **KO criteria** — binary eliminators (e.g. "must have WhatsApp Business API experience")
- **Scorecard** — 8 dimensions with weights (e.g. RGPD compliance × 3, delivery speed × 2)
- **Interview questions** — 8 questions tailored to the specific job

Output: a `DiscoveryJSON` document stored in the database, which seeds everything else.

### Stage 2 — CV Screening (Candidate → APTO / DESCARTADO)
Candidates upload their CV. The platform:
1. Extracts text from the file (PDF or Markdown)
2. Runs deterministic KO screening (keyword matching + pattern analysis — no AI)
3. If any KO fails → candidate is immediately marked **DESCARTADO**, no further steps
4. If all KOs pass → candidate is saved and waits for batch evaluation

When the 5th CV arrives, the batch evaluation fires automatically in the background:
- For each passing candidate: AI scores their CV against each of the 8 dimensions (score 1–5)
- Python calculates the weighted score: `Σ(score × weight) / total_weight`
- Candidates above threshold get a personal Bearer token and a simulated email invitation

**Maximum 5 candidates per job opening.** After 5, the position closes.

### Stage 3 — Interview (Candidate → Final Evaluation)
APTO candidates use their token to access the interview chatbot.

The interview covers all 8 scorecard dimensions in order. For each dimension:
- The AI asks a targeted question
- The candidate types their answer
- The AI dialogue conductor classifies the intent (answering, clarifying, off-topic, etc.)
- If the answer is vague: one follow-up question
- After 3 turns: the answer is locked regardless
- After all 8 dimensions: AI scores each answer (1–5), Python calculates final score

The recruiter then sees a ranked list of all candidates with scores, justifications, and an AI-generated narrative report.

---

## Key product decisions

### AI never makes hard decisions
KO screening is pure Python keyword/pattern matching. Score calculations are deterministic arithmetic. AI is only used to interpret free-text (CV prose, interview answers) and generate narrative summaries. This ensures the platform is defensible, auditable, and free of hallucinated verdicts.

### Every AI call is logged
Every call to Anthropic or OpenAI is recorded in `ai_call_logs` with the full input, output, token counts, latency, and validation status. Non-negotiable for audit purposes.

### Prompts are versioned in the database
No prompts are hardcoded in source files. A prompt change is a behavior change and must be traceable. Switching from Anthropic to OpenAI is a database row change, not a code deployment.

### Score validation
AI dimension scores are validated to be integers 1–5. If the AI returns something outside this range or non-numeric, the system retries up to 2 times before failing loudly. Scores are never silently accepted without validation.

### 5-candidate cap
The platform is designed for focused, high-signal hiring — not volume recruiting. Each job accepts a maximum of 5 candidates. This forces quality-over-quantity from the start.

---

## Reference case — Clínica Salud Valencia

This is the seeded demo case used for development and testing. It represents a real-world hiring scenario the platform is designed to handle.

**Client:** Clínica Salud Valencia S.L., Valencia, Spain — private multi-specialty clinic  
**Problem:** 15–20 lost appointments per week (~€4,000/month in lost revenue). Single receptionist, fully manual process.  
**Budget:** €8,000–12,000  
**Deadline:** 3 months  
**What they need built:** Appointment management system with WhatsApp chatbot, Google Calendar sync, and a receptionist panel

### KO criteria for this job

| ID | Criterion | Why it eliminates |
|----|-----------|-------------------|
| KO1 | No experience with WhatsApp Business API (Meta) | Core integration — non-negotiable |
| KO2 | No understanding of RGPD/LOPDGDD for health data | Legal requirement for handling patient data in Spain |
| KO3 | Can only work with external technical supervision | Clinic has no internal tech team — must be fully autonomous |

### Scorecard (8 dimensions, weights sum to 19)

| ID | Dimension | Weight | What it measures |
|----|-----------|--------|-----------------|
| D1 | Technical integrations | ×3 | WhatsApp API, Google Calendar, reservation system, reception panel |
| D2 | RGPD/LOPDGDD compliance | ×3 | Health data protection knowledge and practice |
| D3 | Autonomy | ×3 | Can make architectural decisions alone, no hand-holding |
| D4 | Build-vs-buy pragmatism | ×3 | Chooses tools wisely given budget constraints |
| D5 | Delivery under tight deadlines | ×2 | Track record of shipping on time |
| D6 | Communication with non-technical clients | ×2 | Can explain decisions to a clinic manager |
| D7 | Healthcare sector experience | ×2 | Domain knowledge of clinics, patient flows |
| D8 | Stack fit for budget | ×1 | Infrastructure choices appropriate for €8–12k |

**Formula:** `Score = Σ(score × weight) / 19`, scale 1.0–5.0

### Expected ranking from the reference case

| Rank | Candidate | Score | Status | Why |
|------|-----------|-------|--------|-----|
| #1 | Sofía Delgado | 4.84/5 | APTA | Delivered SaludConnect (identical scope) in 11 weeks. Full RGPD+AIPD compliance. All 4 integrations. |
| #2 | Carlos Rivas | 4.74/5 | APTO | Built and operated CitaFácil SaaS (12 live clinics). Most explicit build-vs-buy reasoning. |
| #3 | Elena Martínez | 4.58/5 | APTA | 99.8% uptime over 18 months. Only candidate with formal DPO certification. |
| — | Jhordan Solis | — | DESCARTADO | Passes KO1 (WhatsApp exp) but zero mention of RGPD/LOPDGDD anywhere in CV (KO2 fails). |
| — | Miguel Torres | — | DESCARTADO | Fails KO1 + KO2 + KO3. Enterprise stack (Angular+Java+Oracle), always worked in large supervised teams. |
| — | Ana Lombard | — | DESCARTADA | Fails KO1 + KO2 + KO3. Same profile as Torres. Strong in corporate finance/energy, wrong context. |

---

## Interview dialogue system

The chatbot is not a simple Q&A form. Each dimension has a full dialogue loop managed by the AI:

| Candidate behavior | System response |
|--------------------|----------------|
| Clear, direct answer | Locks the answer, moves to next dimension |
| Vague but relevant answer | Asks one targeted follow-up |
| Off-topic (1st time) | Explains what's needed, asks again |
| Off-topic (2nd time) | Accepts "no experience in this area", advances |
| "I don't know" | Acknowledges with empathy, advances immediately |
| Asks for clarification | Answers briefly, re-asks the original question |
| "I want to correct my answer" | Clears dimension history, re-asks from scratch |
| "I want to quit" | Closes session gracefully (status: abandoned) |

After 3 candidate turns on any dimension, answers are force-collected and the interview advances regardless. This prevents infinite loops.

A Redis processing lock (30-second TTL) prevents concurrent message submissions to the same session.

---

## Data model overview

```
job_openings           1 ──< candidates         1 ──< evaluations
    │                              │                       │
    │                       cv_text, sha256         dimension_scores
    │                       profile_json            weighted_score
    │                       passed_ko               resultado
    │
    └── prompt_versions    (provider, model, system_prompt, temperature)
    └── ai_call_logs        (full audit: input, output, tokens, latency)
    └── chat_sessions       (interview state machine, v2 schema)
         └── messages        (full conversation history)
         └── candidate_invitations (token log, simulated email)
```

---

## Prompt architecture

Six active prompt versions in the database:

| Name | Provider | Model | Temp | Purpose |
|------|----------|-------|------|---------|
| `cv_dimension_evaluator` | Anthropic | claude-sonnet-4-6 | 0.0 | Score CV against one dimension |
| `cv_dimension_evaluator_openai` | OpenAI | gpt-4o-mini | 0.0 | Same, OpenAI fallback |
| `interview_response_evaluator` | Anthropic | claude-sonnet-4-6 | 0.0 | Score interview answer (1–5) |
| `interview_dialogue_conductor` | Anthropic | claude-sonnet-4-6 | 0.3 | Drive per-dimension conversation |
| `narrative_report_writer` | Anthropic | claude-sonnet-4-6 | 0.3 | Generate markdown ranking report |
| `narrative_report_writer_openai` | OpenAI | gpt-4o | 0.3 | Same, OpenAI fallback |

Temperature 0.0 for scoring (deterministic), 0.3 for dialogue and narrative (natural variation).

---

## What the platform intentionally does NOT do

- No LangChain, LangGraph, or agent frameworks
- No RAG or vector search
- No fine-tuning
- No real email sending (simulated via log + DB record)
- No multi-tenant job board — single job per deployment for MVP
- No candidate self-service portal beyond CV upload and interview
- No video, voice, or asynchronous interview formats
- No ATS integrations

These are out of scope for the MVP. The platform is a focused, auditable evaluation engine — not a full HR suite.

---

## Infrastructure

| Component | Role |
|-----------|------|
| FastAPI | REST API (async) |
| PostgreSQL 16 | All persistent state + audit log |
| Redis 7 | Session locks (NX mutex), interrupt flags, candidate tokens (7-day TTL) |
| Pydantic v2 | All data contracts — defined before business logic |
| SQLAlchemy 2 (async) | ORM, NullPool (Lambda-compatible for future deploy) |
| Alembic | DB migrations |
| pypdf | PDF text extraction |
| pytest + httpx | Async test suite (70 unit tests, 5 acceptance tests) |
| Anthropic / OpenAI | AI backends — provider set per prompt in DB |

---

## Implementation status

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 0–3 | ✅ Done | Core infrastructure, models, CV screening, scoring |
| 4–6 | ✅ Done | Interview chatbot, report writer, job offer API |
| 4.6–4.7 | ✅ Done | Hybrid dialogue, CV upload, auto-evaluation, Bearer tokens |
| 7 | ⏳ Next | Rate limiting |
| 8–10 | ⏳ | CI, health metrics, AWS Lambda deploy |
