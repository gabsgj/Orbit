# Team Kickoff Briefs — Orbit

One file per member. **Each member opens their own file and pastes the "Kickoff Prompt"
(code block) as the first message to their preferred AI agent** (OpenCode, Claude Code,
Cursor, Copilot, etc.). The prompt tells the agent to read the repo docs first, so every
agent starts with full shared context — no tribal knowledge.

| Member | Role | Brief |
|---|---|---|
| Gabriel James | Platform & Billing Lead | [`gabriel.md`](gabriel.md) |
| Abhiram H | Identity & Catalog Lead | [`abhiram.md`](abhiram.md) |
| Catherine Maria Benny | Money-Flow Lead | [`catherine.md`](catherine.md) |
| Pavithra S Rajesh | Experience & Insights Lead | [`pavithra.md`](pavithra.md) |

## Team-wide git cadence (binding, 2026-10-31)

- **Commit + push at least every 30 minutes of work — non-negotiable.** Judges check that
  all 4 members use git properly; a steady commit cadence is the proof.
- Work only on your own `feat/<module>-<name>` branch. **Never commit to `main`.**
- Small atomic commits, conventional messages (`feat:`, `fix:`, `db:`, `test:`, `docs:`).
- Each brief includes a standing authorization so your agent *may* commit+push on your
  branch when you ask — that satisfies the "explicit ask" rule in `AGENTS.md` §6.
- Shared files (`prisma/schema.prisma`, root layout, design tokens, `docs/team/*`):
  announce in the group before changing.

## Session checklist for every member

1. Open your brief → paste the kickoff prompt to your agent.
2. Your agent reads `AGENTS.md`, `.aimem/context.md`, `docs/SRS.md`, `docs/ER.md`, `docs/PLAN.md`.
3. Confirm the app builds and seeds locally before writing feature code.
4. Update `.aimem/tasks.md` as you complete items; agent logs progress in `.aimem/progress.md`.
5. Push every ≤30 min. Open a PR when your slice passes its Definition of Done.
