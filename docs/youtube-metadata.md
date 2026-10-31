# Orbit — YouTube UI Walkthrough Metadata

> Copy-paste assets for the Orbit UI walkthrough video.

---

## Title

```
Orbit — The Ledger That Bills Itself | Full UI Walkthrough (Odoo × Make-a-Ton 9.0)
```

---

## Description

```
Put your revenue in orbit. 🚀

This is a complete UI walkthrough of Orbit, the subscription management and recurring billing platform we built in 24 hours at the Odoo × Make-a-Ton 9.0 Hackathon, Kochi. Brightloop Software was running its entire subscription business on spreadsheets — renewals remembered by whoever noticed first, invoices typed by hand, payments matched by scrolling bank statements. Orbit replaces all of that with one system that runs the full life of a subscription, and its crown jewel is a billing engine that mathematically cannot bill you twice.

In this walkthrough we go through the whole product end to end: the landing page and product story, authentication with role-based access for admins, staff and customers, the catalog with products, variants, plans and taxes, quotation templates that spin up full subscriptions, the one-click billing day that generates invoices in bulk, the discount engine that auto-applies rules and stops when they expire, invoicing with confirm, send, print and an overdue chase list, payment recording with overpayment guards, the finance dashboard with MRR, ARR, aging buckets, renewal forecasts and CSV export, and finally the customer portal where subscribers manage everything themselves without emailing anyone.

🛠️ Tech Stack
Next.js 15 (App Router) · TypeScript · tRPC v11 · Prisma 6 · PostgreSQL · Tailwind CSS

✅ 142 tests · 12/12 core flows verified · worst query 10.55ms · 100% offline-capable

🔗 Repo: https://github.com/gabsgj/Orbit
🌐 Live mirror: https://orbit-amber-two.vercel.app

👥 Team
Gabriel James · Abhiram H · Catherine Maria Benny · Pavithra S Rajesh

Built for Odoo × Make-a-Ton 9.0 · CUSAT, Kochi

#Hackathon #NextJS #PostgreSQL #Odoo #MakeATon
```

---

## Tags

```
subscription management, recurring billing, nextjs, typescript, postgresql, prisma, trpc, hackathon project, odoo hackathon, make-a-ton, saas dashboard, ui walkthrough, web development, full stack project, billing system
```

---

## Thumbnail

✅ **Done — `assets/thumbnail/orbit-thumbnail.png` (1280×720)**

Built as an HTML page matching Orbit's branding (ink `#0f172a`, chroma blue `#1d5fbf`/`#2f6bf0`, off-white `#f8fafc`) and rendered with headless Chrome. Left: dashboard mockup with sidebar, KPI cards, MRR chart and PAID/DUE invoice pills. Right: Orbit logo mark, wordmark, tagline, UI WALKTHROUGH pill, hackathon badge.

To tweak and re-render:

```bash
# 1. edit assets/thumbnail/thumbnail.html
# 2. re-render:
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --window-size=1280,720 \
  --screenshot=assets/thumbnail/orbit-thumbnail.png \
  "file://$PWD/assets/thumbnail/thumbnail.html"
```
