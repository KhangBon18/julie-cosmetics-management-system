-- ============================================================
-- Migration 006: Add comprehensive indexes
-- Priority: HIGH (H-01) — Phase 1
-- Risk: LOW (additive, read performance boost, slight write overhead)
-- Downtime: NO (online DDL in MySQL 8.0)
-- Backup: Not required
-- Backend sync: None — indexes are transparent to application
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

-- ─── INVOICES ──────────────────────────────────────────────────
-- Report queries: filter by date range, group by date
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
-- JOIN/filter by customer
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
-- Filter by payment method
CREATE INDEX idx_invoices_payment_method ON invoices(payment_method);

-- ─── INVOICE_ITEMS ─────────────────────────────────────────────
-- Lookup items by invoice (FK index may exist, explicit is safer)
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
-- Top-selling product reports
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- ─── PRODUCTS ──────────────────────────────────────────────────
-- Filter by brand (public shop)
CREATE INDEX idx_products_brand_id ON products(brand_id);
-- Filter by category (public shop)
CREATE INDEX idx_products_category_id ON products(category_id);
-- Active product listing
CREATE INDEX idx_products_is_active ON products(is_active);
-- Price range queries
CREATE INDEX idx_products_sell_price ON products(sell_price);
-- Full-text search on product name and description
-- (replaces LIKE '%term%' which cannot use B-tree indexes)
ALTER TABLE products ADD FULLTEXT INDEX ft_products_search (product_name, description);

-- ─── IMPORT_RECEIPTS ───────────────────────────────────────────
CREATE INDEX idx_import_receipts_created_at ON import_receipts(created_at);
CREATE INDEX idx_import_receipts_supplier_id ON import_receipts(supplier_id);

-- ─── IMPORT_RECEIPT_ITEMS ──────────────────────────────────────
CREATE INDEX idx_import_items_receipt_id ON import_receipt_items(receipt_id);
CREATE INDEX idx_import_items_product_id ON import_receipt_items(product_id);

-- ─── EMPLOYEES ─────────────────────────────────────────────────
CREATE INDEX idx_employees_status ON employees(status);

-- ─── CUSTOMERS ─────────────────────────────────────────────────
CREATE INDEX idx_customers_membership ON customers(membership_tier);
CREATE INDEX idx_customers_email ON customers(email);

-- ─── LEAVE_REQUESTS ────────────────────────────────────────────
CREATE INDEX idx_leave_emp_status ON leave_requests(employee_id, status);

-- ─── REVIEWS ───────────────────────────────────────────────────
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);

-- ─── CATEGORIES ────────────────────────────────────────────────
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ─── SALARIES ──────────────────────────────────────────────────
-- Composite index for year/month range queries in reports
CREATE INDEX idx_salaries_year_month ON salaries(year, month);

-- ─── EMPLOYEE_POSITIONS ────────────────────────────────────────
-- Current position lookup (end_date IS NULL)
CREATE INDEX idx_ep_employee_current ON employee_positions(employee_id, end_date);

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP INDEX idx_invoices_created_at ON invoices;
-- DROP INDEX idx_invoices_customer_id ON invoices;
-- DROP INDEX idx_invoices_payment_method ON invoices;
-- DROP INDEX idx_invoice_items_invoice_id ON invoice_items;
-- DROP INDEX idx_invoice_items_product_id ON invoice_items;
-- DROP INDEX idx_products_brand_id ON products;
-- DROP INDEX idx_products_category_id ON products;
-- DROP INDEX idx_products_is_active ON products;
-- DROP INDEX idx_products_sell_price ON products;
-- ALTER TABLE products DROP INDEX ft_products_search;
-- DROP INDEX idx_import_receipts_created_at ON import_receipts;
-- DROP INDEX idx_import_receipts_supplier_id ON import_receipts;
-- DROP INDEX idx_import_items_receipt_id ON import_receipt_items;
-- DROP INDEX idx_import_items_product_id ON import_receipt_items;
-- DROP INDEX idx_employees_status ON employees;
-- DROP INDEX idx_customers_membership ON customers;
-- DROP INDEX idx_customers_email ON customers;
-- DROP INDEX idx_leave_emp_status ON leave_requests;
-- DROP INDEX idx_reviews_product_id ON reviews;
-- DROP INDEX idx_reviews_customer_id ON reviews;
-- DROP INDEX idx_categories_parent_id ON categories;
-- DROP INDEX idx_salaries_year_month ON salaries;
-- DROP INDEX idx_ep_employee_current ON employee_positions;

-- ── NOTES ──────────────────────────────────────────────────────
-- • MySQL InnoDB auto-creates indexes for FK columns, but explicit
--   indexes give us naming control and ensure composite patterns.
-- • If any index already exists (e.g., from FK auto-creation),
--   MySQL will throw "Duplicate key name" — safe to ignore or
--   wrap each CREATE INDEX in a procedure with error handling.
-- • FULLTEXT index requires InnoDB and MySQL 5.6+. Already using 8.0.
-- • Monitor index usage after 1 week with:
--   SELECT * FROM sys.schema_unused_indexes
--   WHERE object_schema = 'julie_cosmetics';
