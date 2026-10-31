-- Business-rule CHECK constraints — the database is the last line of defense
-- (docs/ER.md constraint cheat-sheet; SRS §6). Prisma schema carries FKs,
-- uniques and indexes; raw SQL adds what Prisma can't express: CHECKs and
-- partial indexes. Column names are the mapped snake_case names (verified).

-- Plans: valid availability window + sane minimum quantity
ALTER TABLE "plans"
  ADD CONSTRAINT "plans_window_valid" CHECK ("available_to" > "available_from"),
  ADD CONSTRAINT "plans_min_quantity_valid" CHECK ("min_quantity" >= 1);

-- Quotation templates: positive validity
ALTER TABLE "quotation_templates"
  ADD CONSTRAINT "quotation_templates_validity_valid" CHECK ("validity_days" > 0);

-- Lines: strictly positive quantities
ALTER TABLE "quotation_template_lines"
  ADD CONSTRAINT "qtl_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "subscription_lines"
  ADD CONSTRAINT "sl_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "invoice_lines"
  ADD CONSTRAINT "il_quantity_positive" CHECK ("quantity" > 0);

-- Subscriptions: expiry after start, non-negative payment terms
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_dates_valid" CHECK ("expiry_date" > "start_date"),
  ADD CONSTRAINT "subscriptions_terms_valid" CHECK ("payment_terms_days" >= 0);

-- Discounts: kind-correct value, valid window, sane limits
ALTER TABLE "discount_rules"
  ADD CONSTRAINT "discount_value_by_kind" CHECK (
    ("kind" = 'PERCENT' AND "value" > 0 AND "value" <= 100)
    OR ("kind" = 'FIXED' AND "value" > 0)
  ),
  ADD CONSTRAINT "discount_window_valid" CHECK ("end_date" >= "start_date"),
  ADD CONSTRAINT "discount_usage_limit_valid" CHECK ("usage_limit" IS NULL OR "usage_limit" >= 1),
  ADD CONSTRAINT "discount_min_purchase_valid" CHECK ("min_purchase" IS NULL OR "min_purchase" >= 0),
  ADD CONSTRAINT "discount_min_quantity_valid" CHECK ("min_quantity" IS NULL OR "min_quantity" >= 1);

-- Taxes: percentage range
ALTER TABLE "taxes"
  ADD CONSTRAINT "taxes_rate_range" CHECK ("rate_percent" > 0 AND "rate_percent" <= 100);

-- Payments: strictly positive amounts (overpayment guard lives in PaymentService)
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

-- Invoices: totals never negative; paid never exceeds total (belt-and-braces
-- behind PaymentService's transactional overpayment guard)
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_totals_non_negative" CHECK (
    "subtotal" >= 0 AND "tax_total" >= 0 AND "discount_total" >= 0 AND "grand_total" >= 0
  ),
  ADD CONSTRAINT "invoices_paid_within_total" CHECK ("amount_paid" <= "grand_total");

-- Partial index: overdue lookups hit only the rows that can be overdue
-- (SRS §6 rule 6: CONFIRMED + due_date < today + outstanding > 0)
CREATE INDEX "invoices_overdue_idx" ON "invoices" ("due_date") WHERE "status" = 'CONFIRMED';
