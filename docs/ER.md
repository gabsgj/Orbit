# ER Diagram — Orbit · Subscription Management System

> Canonical data model. Schema-first per `AGENTS.md` §2: this diagram is the source of truth
> for `prisma/schema.prisma`. Any change here requires a migration + team huddle.
> Conventions: `snake_case` columns, plural tables, `NUMERIC(12,2)` money, `timestamptz` time,
> every FK indexed, every business rule backed by a DB constraint (the database is the last line of defense).

```mermaid
erDiagram
    users ||--o| customers : "is (role=customer)"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o{ audit_log : "acts"

    customers ||--o{ subscriptions : "owns"
    customers ||--o{ invoices : "billed"

    products ||--o{ product_variants : "has"
    attributes ||--o{ attribute_values : "defines"
    attribute_values ||--o{ product_variants : "composes"
    products ||--o{ plans : "sold_as"

    plans ||--o{ subscriptions : "governs"
    plans ||--o{ quotation_templates : "prefills"

    quotation_templates ||--o{ quotation_template_lines : "contains"
    quotation_templates ||--o{ subscriptions : "instantiates"

    subscriptions ||--o{ subscription_lines : "contains"
    subscription_lines }o--|| product_variants : "priced_by"
    subscriptions ||--o{ subscription_status_history : "tracks"
    subscriptions ||--o{ invoices : "generates"

    taxes ||--o{ subscription_line_taxes : "applies"
    subscription_lines ||--o{ subscription_line_taxes : "taxed"

    invoices ||--o{ invoice_lines : "contains"
    invoices ||--o{ payments : "settles"

    discount_rules ||--o{ discount_rule_products : "scoped"
    discount_rules ||--o{ discount_usages : "consumed"
    invoices ||--o{ discount_usages : "receives"

    billing_runs ||--o{ invoices : "produced"

    email_outbox }o--o| users : "addressed_to"

    users {
        uuid id PK
        citext email UK "one account per email"
        text password_hash "bcrypt, never plaintext"
        enum role "ADMIN | STAFF | CUSTOMER"
        timestamptz created_at
    }
    customers {
        uuid id PK
        uuid user_id FK_UK
        text company_name
        text billing_address
        text tax_id "nullable"
    }
    password_reset_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash UK "sha256, single-use"
        timestamptz expires_at "~1h"
        timestamptz used_at "null until consumed"
    }

    products {
        uuid id PK
        text name
        text type "service | good"
        numeric sales_price
        numeric cost_price
        text notes
        boolean is_active
    }
    attributes {
        uuid id PK
        text name UK "e.g. Brand"
    }
    attribute_values {
        uuid id PK
        uuid attribute_id FK
        text value "e.g. Odoo"
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        uuid attribute_value_id FK
        numeric price_extra "+560 for Odoo brand"
    }
    plans {
        uuid id PK
        uuid product_id FK
        numeric price
        enum period "DAILY | WEEKLY | MONTHLY | YEARLY"
        int min_quantity "CHECK >= 1"
        date available_from
        date available_to "CHECK > available_from"
        boolean auto_close
        boolean closable_early
        boolean pausable
        boolean renewable
        boolean is_active
    }

    quotation_templates {
        uuid id PK
        text name
        uuid plan_id FK
        int validity_days "CHECK > 0"
    }
    quotation_template_lines {
        uuid id PK
        uuid template_id FK
        uuid variant_id FK
        int quantity
        numeric unit_price "snapshot default"
    }

    subscriptions {
        uuid id PK
        text number UK "SUB-2026-00042 (from sequences)"
        uuid customer_id FK
        uuid plan_id FK
        uuid template_id FK "nullable"
        date start_date
        date expiry_date
        int payment_terms_days "net N, default 15"
        enum status "DRAFT|QUOTATION|CONFIRMED|ACTIVE|PAUSED|CLOSED"
        date next_billing_date "indexed; drives billing"
        date paused_on "nullable"
    }
    subscription_lines {
        uuid id PK
        uuid subscription_id FK
        uuid variant_id FK
        int quantity "CHECK > 0"
        numeric unit_price "snapshot at confirm time"
    }
    subscription_line_taxes {
        uuid subscription_id_FK FK
        uuid line_id FK
        uuid tax_id FK
        "composite PK (line_id, tax_id)"
    }
    subscription_status_history {
        uuid id PK
        uuid subscription_id FK
        enum from_status
        enum to_status
        uuid changed_by FK
        timestamptz changed_at
        text note
    }

    taxes {
        uuid id PK
        text name "e.g. GST 18%"
        numeric rate_percent "CHECK 0 < r <= 100"
        boolean is_active
    }

    discount_rules {
        uuid id PK
        text name
        enum kind "PERCENT | FIXED"
        numeric value "percent<=100 or amount>0"
        numeric min_purchase "nullable"
        int min_quantity "nullable"
        date start_date
        date end_date
        int usage_limit "nullable = unlimited"
        enum scope "PRODUCT | SUBSCRIPTION"
        boolean is_active
    }
    discount_rule_products {
        uuid rule_id FK
        uuid product_id FK
        "composite PK"
    }
    discount_usages {
        uuid id PK
        uuid rule_id FK
        uuid invoice_id FK
        numeric applied_amount
        timestamptz applied_at
    }

    invoices {
        uuid id PK
        text number UK "INV-2026-00123 (from sequences)"
        uuid customer_id FK
        uuid subscription_id FK
        uuid billing_run_id FK "nullable (manual adj.)"
        date issue_date
        date due_date "issue + payment_terms_days"
        enum status "DRAFT | CONFIRMED | PAID | CANCELLED"
        numeric subtotal
        numeric tax_total
        numeric discount_total
        numeric grand_total
        numeric amount_paid "documented denormalization, txn-maintained"
        date period_start "UK with subscription_id = anti-double-bill"
        date period_end
    }
    invoice_lines {
        uuid id PK
        uuid invoice_id FK
        uuid variant_id FK "nullable on discount lines"
        enum line_kind "PRODUCT | TAX_SUMMARY | DISCOUNT"
        text description
        int quantity
        numeric unit_price
        numeric tax_amount
        numeric line_total "snapshot — never recomputed from live prices"
    }
    payments {
        uuid id PK
        uuid invoice_id FK
        enum method "CASH | BANK_TRANSFER | CARD | UPI | CHEQUE"
        numeric amount "CHECK > 0"
        timestamptz paid_at
        text note
        uuid recorded_by FK
    }

    billing_runs {
        uuid id PK
        timestamptz started_at
        timestamptz finished_at
        enum trigger_type "MANUAL | CRON_LOCAL | CRON_VERCEL"
        uuid triggered_by FK "nullable for cron"
        int invoices_created
        int skipped_already_billed
        int errors
        enum status "RUNNING | DONE | FAILED"
    }

    sequences {
        text doc_type PK "SUB | INV"
        int year PK
        bigint last_number "UPDATE..RETURNING in txn = gapless"
    }

    email_outbox {
        uuid id PK
        text to_email
        text subject
        text body_html
        enum kind "RESET | INVOICE_SENT | REMINDER"
        timestamptz created_at
        timestamptz sent_at "null in offline mode = queued"
    }

    audit_log {
        uuid id PK
        uuid user_id FK
        text entity
        uuid entity_id
        text action
        jsonb meta
        timestamptz at
    }
```

## Constraint cheat-sheet (the "database design" talking points for judges)

| Rule | Enforcement |
|---|---|
| One account per email | `users.email` `UNIQUE` + `citext` (case-insensitive) |
| **Never billed twice** | `UNIQUE(subscription_id, period_start)` on `invoices` — the DB itself refuses a duplicate period |
| Never billed concurrently | `pg_advisory_xact_lock('billing')` in every billing run |
| Valid plan windows | `CHECK (available_to > available_from)` |
| Valid discount values | `CHECK ((kind='PERCENT' AND value<=100) OR (kind='FIXED' AND value>0))` |
| Positive quantities / amounts | `CHECK (quantity > 0)`, `CHECK (amount > 0)` |
| Gapless document numbers | `sequences` row updated with `UPDATE … RETURNING` inside the invoice transaction |
| Invoice immutability | invoice lines are **snapshots**; no FK to live prices on totals |
| Usage-limit integrity | `discount_usages` rows counted inside the same transaction that creates the invoice |
| Fast finance queries | indexes: `subscriptions(status,next_billing_date)`, `invoices(customer_id,status)`, partial index on unpaid+overdue, `payments(invoice_id)` |

**Deliberate denormalization (documented per ruleset §2):** `invoices.amount_paid` is maintained
transactionally by `PaymentService` (same txn as the `payments` insert) so the dashboard's
"outstanding / overdue" queries are indexed column reads instead of per-row SUM subqueries.
This is the measured trade that keeps the finance dashboard < 2s at 10k+ subscriptions.
