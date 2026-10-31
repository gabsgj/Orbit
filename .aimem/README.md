# .aimem/ — Shared Memory

This folder is the project's **shared memory** for all 4 team members and every AI agent that works on this repo. It enables cross-agent, cross-session continuity: anyone (human or agent) should be able to open this folder and resume work with full context.

## Files

| File | What goes in it |
| --- | --- |
| `context.md` | Complete project context: event, team, stack, problem statement (verbatim), architecture, key decisions |
| `prompts.md` | Timestamped log of user prompts/instructions |
| `progress.md` | Chronological log of completed work (who/what/when) |
| `tasks.md` | Tasks done ✅ and tasks left ☐, prioritized |

## Rules (binding, per AGENTS.md §10)

1. Update this folder **in the same change as the work itself** — never "later".
2. Date every entry (`YYYY-MM-DD`); keep entries short and factual.
3. **Never store secrets** here (no `.env` values, keys, passwords). This folder is committed to git.
4. When the problem statement arrives, record it verbatim in `context.md` before writing any code.
5. Before starting any work, read `context.md` → `tasks.md` → `progress.md` → `prompts.md`.
