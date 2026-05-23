# NovaHiring — User Interface Design System / Homepage

## Context

You are designing the main NovaHiring homepage.

NovaHiring is NOT a generic SaaS dashboard.

It is an AI-assisted technical hiring platform focused on:
- technical candidate assessment,
- structured hiring processes,
- auditability,
- AI interviews,
- deterministic scoring,
- recruiter confidence.

The platform helps non-technical companies assess freelance technical professionals through:
1. Discovery
2. CV screening
3. AI interviews
4. Candidate ranking

The visual identity should convey:

- a premium image,
- intuitive operation,
- intelligence,
- a cinematic aesthetic,
- modernity,
- technology,
- cleanliness,
- dynamism.

Avoid the generic startup aesthetic. ---
# Main Design Direction
The user interface should have a style similar to:
- Linear
- Retool
- Vercel
- Raycast
- Warp
NOT:
- Generic Tailwind panels,
- Cryptocurrency websites,
- Neon cyberpunk style,
- SaaS templates with excessive colors.

The interface should convey the feeling of:

"A real-time AI-powered recruitment control center."

--
# Technologies Used
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
--
# Visual Style
## Preferred Style
- Dark Mode First
- Elegant Contrast
- Subtle Glass Effect
- Soft Edges
- Soft Gradients
- Minimal but Elegant Shadows
- Ample Spacing
- Excellent Typographic Hierarchy

## Avoid
- Excessive Gradients,
- Random Colors,
- Borders with Excessive Radii,
- Cluttered Designs,
- Too Many Cards,
- Childish Designs

-- Typography
Use:
- Geist or Inte
The typography should convey:
- Cleanliness,
- Superior Quality,
- High Legibility,
- Modernity.

Use a clear hierarchy:
- Large Main Title,
- Subtle Labels,
- Panels with an Operational Look

--
# Main Objective

The homepage should immediately communicate:

"This platform intelligently and transparently evaluates technical candidates."

The page should visually explain the process.

Note: It should be as minimalist as possible.
--

# Main Section
DO NOT create a generic, centered main section.

Instead:
Create a dynamic interface with a split design.

## Left Side
Powerful Message.
Example tone:
- AI-Assisted Technical Hiring
- Structured Candidate Assessment
- Transparent Decision Making
- Audit-Ready Recruitment
CTA Buttons:
- Start Assessment
- View Demo

---

## Right Side
Create an interactive visual user interface.

This is the most important part.

Simulate:
- Candidate Ranking,
- AI-Powered Interview Processing,
- Score Calculation,
- Activity Logs,
- Process Statuses,
- Validation Systems.

Example ideas:
- Candidate scoreboard,
- "KO2 failed",
- "GDPR verified",
- "Processing interview...",
- Real-time activity feed,
- AI-powered typing indicators,
- Weighted score animations.

The interface should convey dynamism.

Use movement carefully.

---
# Required Sections
## 1. Hero
Split design with real-time system user interface.

---
## 2. Recruitment Process Visualization
Visual storytelling section.
Display:
Discovery
↓
CV Selection
↓
AI Interview
↓
Final Ranking

It should be interactive and dynamic.

Use a timeline or connected cards.

--

## 3. Candidate Evaluation Example

Use realistic fictional candidates inspired by:
- Sofía Delgado
- Carlos Rivas
- Elena Martínez

Display:
- Score,
- Status,
- Strengths,
- Interview Status,
- Change in Ranking.

This section should look like a real product.

-## 4. Auditability Section

One of NovaHiring's main differentiators is:

"AI is NOT the brain."

The interface should visually communicate:
- deterministic scoring,
- validated results,
- traceable AI calls,
- structured assessments,
- records and transparency.

Ideas:
- audit logs,
- validation badges,
- score verification,
- structured reports,
- timeline events.

-## 5. CTA Footer

Simple.

Minimalist.

Elegant.

--

# Motion Guidelines

Use Framer Motion.

Animations should convey:
- fluidity,
- intention,
- elegance,
- subtlety.

Good examples:
- fade transitions,
- score counting,
- activity pulses,
- typing indicators,
- row highlight animations,
- depth on hover.

Avoid:
- bouncing animations,
- excessive movement,
- distracting effects.

--

# Design Philosophy

Prioritize:
- White space,
- Composition,
- Typography,
- Rhythm,
- Hierarchy

Use the following reference skills:

pnpm dlx @elevenlabs/cli@latest components add bar-visualizer
pnpm dlx shadcn@latest init -t [framework]
pnpm add @glinui/ui @glinui/tokens
ui.tripled.work/components/native-hover-card

pnpm dev --filter=uitripled-docs
pnpm dev --filter=uitripled-docs
