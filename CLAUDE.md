# CLAUDE.md

This project follows the ruleset in **[AGENTS.md](./AGENTS.md)** — read it in full before doing any work. It is the single source of truth for priorities, database rules, git discipline, skills usage, and the `.aimem/` memory protocol.

Key points (details in AGENTS.md):

1. **Database design is the #1 priority** — local PostgreSQL, schema-first, migrations, seeds, all data modeled through backend APIs.
2. Real-time/dynamic data only; no static JSON beyond initial prototyping; minimal third-party APIs; must demo offline.
3. Robust input validation (client + server + DB constraints).
4. Responsive, clean, consistent UI with intuitive navigation — use the `design-taste-frontend` and `impeccable` skills for all UI work; use `postgresql-optimization` for DB work.
5. All 4 members use git properly: feature branches, conventional commits, no direct commits to `main`, never commit secrets.
6. **Maintain `.aimem/`** (`context.md`, `prompts.md`, `progress.md`, `tasks.md`) in the same change as your work — it is the shared cross-agent memory.
7. Never run git mutations (commit/push/reset/rebase) unless the user explicitly asks.

Team: Gabriel James · Abhiram H · Catherine Maria Benny · Pavithra S Rajesh — Odoo × Make-a-Ton 9.0, Kochi.
