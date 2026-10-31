# User Prompts Log

_Chronological, timestamped (YYYY-MM-DD). Log every user prompt/instruction here._

## 2026-10-31

1. **Initial ruleset request** — Set up project ruleset/guidelines before the problem statement arrives:
   - Create `.gitignore` and `AGENTS.md`/`CLAUDE.md`. **Do not push or commit anything yet.**
   - Emphasize: database design & setup (top importance); model data through APIs with a local DB (PostgreSQL); minimal third-party APIs; real-time/dynamic data; robust input validation; proper git use; interactive clean UI; intuitive navigation.
   - Evaluation: coding standards, logic, modularity, frontend design, scalability, security, usability, debugging skill, and most importantly database design. Modular architecture, coding patterns, attention to detail, good technicals.
   - Use installed skills (`design-taste-frontend`/taste-skill, `impeccable`, etc.).
   - Maintain a `.aimem/` folder with all memories (user prompts, progress, complete context, tasks done/left) for cross-agent work.
   - Team: Gabriel James, Abhiram H, Catherine Maria Benny, Pavithra S Rajesh.
   - Event: Odoo × Make-a-Ton 9.0 Kochi Hackathon. Problem statement and details to be given later.
   - Shared organizers' Must-have / Nice-to-have list (recorded in `context.md`).

2. **Problem statement + ideation request** — Provided `Subscription_Management_System.pdf` as the problem statement. Asked to **ideate**: first understand what to do, and think extensively about what tech stacks to choose.
3. **Hosting question** — Asked whether Option A (Next.js+tRPC+Prisma+PG) can be hosted serverless / on free platforms. Answer: yes — Vercel + Neon is the standard free recipe; hosted demo is a bonus link only, judged demo stays local+offline per AGENTS.md §3 (DATABASE_URL env-driven). Hosting ease noted as a point for Option A; sponsor alignment remains the point for Option B.
4. **Stack decision + full plan request** — Team chose **Option A** (Next.js + tRPC + Prisma + PostgreSQL). Billing scheduler: **BOTH** — manual "Run billing day" button AND automatic background cron, done the best way possible. Asked for: robust, judge-impressing feature set (think extensively), a complete **SRS + plan document**, task division across the 4 participants, and a detailed end-to-end working plan.
5. **Project naming** — Asked for a project name. Shortlist presented (Orbit, RevLoop, Cadence, Everloop, Flywheel, Meter, Ledgerly, Brightbill). **Team chose: Orbit.** Threaded through docs/SRS, docs/PLAN, docs/ER, context.md.
6. **"Did you divide the tasks among 4?"** — Confirmed; pointed to `docs/PLAN.md` §2 (vertical slices: Gabriel=platform+billing, Abhiram=identity+catalog, Catherine=money-flow, Pavithra=experience+dashboard) + SRS §7 traceability.
7. **Team kickoff briefs + git cadence** — Asked how the other 3 members can start conversations with their preferred AI agents (first-person "I am ___ and I want to do ___" style). Rule added: **commit + push at least every 30 minutes of work** (binding team cadence). Created `docs/team/` with `README.md` + one brief per member (`gabriel.md`, `abhiram.md`, `catherine.md`, `pavithra.md`): each has a paste-ready kickoff prompt (read-order for repo docs, owned FRs, exact key requirements, hook contracts, git standing authorization for their own branch, phased sequence) + task checklist + coordination points.
8. **"remember. HIGHLY MODULAR"** — Upgraded architecture to true feature modules: `src/modules/<domain>/` with a fixed anatomy (`index.ts` barrel · router · service · schemas · queries · components · tests), barrel-only cross-module imports (eslint `no-restricted-imports` enforced at scaffold), pure framework-free services, provider-exported contracts, `shared/` never imports `modules/`, thin `app/` pages, and a **deletable-module test** at PR review. Applied to PLAN §1+§8, SRS NFR-MAIN-01, and all four team briefs.
9. **Git authorization + Phase 0 start + teammate identities** — "You may commit git. Let's begin Phase 0." → standing authorization for commits (baseline + checkpoints). Also: agent **may commit/push AS team members** `mariacatheriine`, `abhiramh7`, `PavithraSrajesh` (GitHub usernames) — **but only with Gabriel's explicit permission each time**. Recorded in context.md Key Decisions.
10. **"Which stack would Odoo prefer?"** — Asked which stack aligns with the sponsor (Odoo). Analysis: Odoo's own stack = Python backend (custom ORM), **PostgreSQL only**, JavaScript frontend (OWL, React-like), XML views, JSON-RPC APIs. The problem statement is modeled on Odoo's own Subscriptions/Sales/Invoicing modules (quotation templates, product variants with `price_extra`, recurring plans, invoices, payments). → Odoo-aligned pick = **Python (FastAPI + SQLAlchemy) + PostgreSQL + React/TS**. Awaiting team's final call.
