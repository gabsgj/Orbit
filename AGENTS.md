# AGENTS.md — Project Ruleset & Guidelines

> **Event:** Odoo × Make-a-Ton 9.0, Kochi Hackathon
> **Status:** Ruleset only — the actual problem statement and stack will be provided later. Everything in this file applies regardless of the problem.
> **Audience:** All 4 team members and any AI agent (OpenCode, Claude, etc.) working in this repo.

## Team

| Member |
| --- |
| Gabriel James |
| Abhiram H |
| Catherine Maria Benny |
| Pavithra S Rajesh |

---

## 1. Priorities (in order of weight)

1. **Database design** — the single most important evaluation criterion. Treat the schema as the foundation of everything.
2. Coding standards, logic, modularity, and coding patterns.
3. Frontend design — interactive, clean, consistent UI.
4. Scalability, security, usability.
5. Debugging skill — understand every line you ship.
6. Attention to detail in *everything*.

Evaluation criteria: **coding standards, logic, modularity, frontend design, scalability, security, usability, debugging skill, and most importantly database design.**

---

## 2. Database Design & Setup — TOP PRIORITY

- **Use a local database — PostgreSQL by default.** The app must run against a local DB, not a hosted toy.
- **Schema-first:** design the data model (entities, relationships, ER diagram) *before* writing application code. Save the ER diagram in the repo.
- **Model data through backend APIs.** The frontend never touches the database directly — all access goes through a well-defined API layer.
- Normalize to 3NF unless a denormalization is deliberate, measured, and documented.
- Every table: primary key, appropriate foreign keys, `NOT NULL`/`UNIQUE`/`CHECK` constraints, and indexes on columns used in joins/filters/lookups.
- Use **migrations** for all schema changes and provide **seed scripts** for demo/dev data. Schema changes are never applied by hand.
- Use meaningful, consistent naming (`snake_case` tables/columns, plural table names — pick one convention and stick to it).
- **Use the `postgresql-optimization` skill** (`.agents/skills/postgresql-optimization/`) for schema design review, indexing, and query tuning.

## 3. Real-Time & Dynamic Data (Must-Have)

- **Use real-time or dynamic data sources.** Static JSON is acceptable *only* for initial prototyping and must be replaced by real DB-backed API responses before the demo.
- Minimal use of third-party APIs — only where they add clear, real value.
- **Plan for offline/local operation:** the project must not depend entirely on internet connectivity or cloud-based tools. It must demo fully offline against the local DB.

## 4. Input Validation (Must-Have)

- **Validate robustly on both client and server.** Client-side validation is UX; server-side validation is the real gate.
- Validate types, formats, ranges, and lengths; enforce DB-level constraints as the last line of defense.
- All SQL through parameterized queries / ORM bindings — **zero string-concatenated SQL**.
- Sanitize/escape anything rendered back to the UI (XSS), and return clear, consistent error messages.

## 5. UI / UX (Must-Have)

- **Responsive and clean UI** with a **consistent color scheme and layout** across every screen.
- **Intuitive navigation:** proper menu placement and spacing; a user should never wonder where to click next.
- Interactive, polished, detail-oriented — no half-styled pages, no dead buttons.
- **Use the installed skills for all frontend work:**
  - `design-taste-frontend` (taste-skill) — art direction and anti-generic design for any page/screen you build or restyle.
  - `impeccable` — UX/UI review, polish, hierarchy, typography, accessibility, edge cases.
- Run the `impeccable` review pass on the UI before the final demo.

## 6. Git Discipline (Must-Have)

- **Every member commits.** One person managing the repo is *not enough* — judges check that all 4 members use version control properly.
- Feature branches (`feat/<name>`, `fix/<name>`); never commit directly to `main`. Merge via reviewed PRs.
- Small, atomic commits with **conventional messages**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `db:`.
- **Never commit secrets** (`.env`, keys) — `.gitignore` guards this; double-check anyway.
- Pull/rebase before pushing; resolve conflicts carefully, never with `--force` on shared branches.
- **AI agents: never run `git commit`, `git push`, `git reset`, or `git rebase` unless the user explicitly asks for that specific action.**

## 7. Architecture & Coding Standards

- **Modular architecture:** clear separation of concerns — routes/controllers, services/business logic, data access, and UI components each live in their own modules. No god-files.
- **Consistent coding patterns:** pick patterns (naming, file layout, error handling, API response shape) early, document them here, and follow them everywhere.
- Small, single-responsibility functions; DRY but not over-abstracted; no dead code.
- Config via environment variables; provide a committed `.env.example`.
- Document non-obvious decisions with brief comments; keep a running `README.md` with setup steps that actually work on a fresh machine.
- Scalability: stateless API layer, indexed queries, pagination on list endpoints — design so the app could grow without a rewrite.
- Security basics: hashed passwords if auth exists, least-privilege DB user, no secrets in code, dependency hygiene.

## 8. Nice-to-Haves (judges' list)

- Ability to design backend APIs, model data, and set up a local database — be ready to *explain* the schema and API design to judges.
- **Understand AI/code snippets thoroughly before using them.** Never blindly copy-paste without adapting to this project. If you can't explain a line, it doesn't ship.
- Use trendy technologies **only if they add real value** — boring and correct beats shiny and broken.

## 9. AI Agent Working Agreement

1. **Read this file and `.aimem/` before doing any work.** Update `.aimem/` as you go (see §10).
2. **Use the installed skills** — they are part of the toolchain, not decoration:
   - `design-taste-frontend` → any page/screen design or restyle.
   - `impeccable` → UI/UX critique and polish passes.
   - `postgresql-optimization` → schema, indexing, query work.
3. Follow the priorities in §1 — when trade-offs appear, database design and data modeling win.
4. Minimal diffs: change only what the task requires; match existing style.
5. Verify before declaring done: run the app, run the migrations, hit the endpoints, check the UI in a browser.
6. Ask before: git mutations, installing system-level tools, or introducing a third-party API/service.

## 10. `.aimem/` — Shared Memory Protocol (REQUIRED)

The `.aimem/` folder is the project's shared memory so that **any team member or any AI agent can pick up work cold** and have full context. It is **committed to git** (it must never contain secrets).

| File | Purpose | Update when |
| --- | --- | --- |
| `.aimem/context.md` | Complete project context: event, team, stack, problem statement, architecture, key decisions | On every major decision or new info |
| `.aimem/prompts.md` | Log of user prompts/instructions, timestamped | After **every** user prompt |
| `.aimem/progress.md` | Chronological log of what was done, by whom/which agent | After every work session |
| `.aimem/tasks.md` | Tasks done ✅ / tasks left ☐, prioritized | Continuously |

**Rules:**
- Agents update `.aimem/` **in the same change** as the work itself — not "later".
- Keep entries dated (`YYYY-MM-DD`), short, and factual.
- When the problem statement arrives, record it verbatim in `context.md` first.

---

*This ruleset is binding for the whole hackathon. Amend it only by team agreement, and record amendments in `.aimem/context.md`.*
