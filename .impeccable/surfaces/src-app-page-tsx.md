---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief — Orbit landing page (src/app/page.tsx)

Scope: public marketing page for the Orbit subscription-management system. Mode: **Persuade**.
Audience: hackathon judges (primary) and a subscription-business operator evaluating the product. Job: understand what Orbit does in seconds, believe it is real, and sign in / sign up. Proof on hand: the idempotent billing engine, offline operation, perf evidence, the 7-scene feature set, roles.

## Direction contract

**THESIS:** The ledger that bills itself. The page *is* an open working ledger of a subscription business: invoices, statuses and totals set as the ledger's own entries, not as screenshots inside cards. Refuses the category default of hero-copy-over-app-screenshot plus equal feature cards.

**OWN-WORLD:** Achromatic ledger paper (white/ivory ground, ink text) with Pavithra's data-chroma discipline: one chart hue marks the live billing entries; status tones appear only on real status chips. Type: system display stack at −0.02em tracking for headlines, tabular-nums for every figure, mono reserved strictly for code/constraints. 1px hairlines and rule-lines as structure, zero decorative cards, zero gradients-as-decoration, no kicker/eyebrow labels.

**STORY:** Visitor reads the offer in one line (recurring billing that cannot bill twice), sees the mechanism rendered live (an invoice being generated from a subscription, amounts computed in front of them), meets the 7 scenes as a billing month narrative, checks the proof band (10,007 subs · 10.55 ms · 17 constraints · 142 tests), and acts — Enter Orbit (login) or Start free (signup).

**FIRST VIEWPORT:** Full-bleed ledger spread. Left column (≈44%): headline at display scale, one-line offer, two actions, three proof figures as a ledger footer row. Right column (≈56%): a live ledger panel — SUB-2026-00001 with lines, taxes, LAUNCH200 discount line, totals, CONFIRMED chip — presented as the actual artifact, with a "billing run just happened" status strip above it. Primary action sits at left under the offer, repeated as a small chip inside the ledger's status strip.

**FORM:** Assigned index 4 of the grounded list (the working-ledger spread); `seed:ec780f680c0db427`. Raises taken from the roll's discipline: keep literal carrier only when functional (the ledger IS the content), and material coverage — the ledger surface is the ground and the panels, not a sticker on a template.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Login screens (sibling surfaces: /login /signup /forgot-password /reset-password)

Same world, quieter register: centered ledger "folio" — a single bordered sheet with the brand mark, the form as ledger entries (inputs as ruled lines), the primary action as the inked seal. One quiet left panel (desktop) with the ledger motif + 3 product facts; form on the right. No gradients, no glass, no stock illustrations.
