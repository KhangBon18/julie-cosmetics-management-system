# Julie Cosmetics — Implementation Plan

> Last updated: 27/03/2026 | Phase: Sprint 2 complete

## Current Status

### ✅ Sprint 1 — Foundation & Auth Fixes (DONE)
- Wired `express-validator` to all 9 route files (auth, invoice, import, product, employee, customer, leave, salary, user)
- Fixed leave_type enum mismatch (`other` → `maternity`)
- Verified 8 previously-fixed bugs: CRM rollback, stock override, server-side discount, IDOR, salary calc, transactions, CORS

### ✅ Sprint 2 — Storefront UI/UX (DONE)
- **CheckoutPage**: Full checkout with customer info form, 3 payment methods (COD/transfer/cash), validation, double-submit prevention, order success state
- **Checkout API**: `POST /api/public/checkout` with server-side price lookup, stock validation, guest orders
- **ShopPage**: URL-param driven filters (category, brand, sort), debounced search, pagination, stock badges (out-of-stock/low-stock), clear filters, product count
- **CartPage**: Linked to checkout page, removed alert() placeholder
- **ProductModel**: Added `min_price`/`max_price` filter support
- Build verified ✅ (1.57s)

### 🔄 Sprint 3 — Backend Business Logic (NEXT)
- Standardize API response format
- Add reviews to public API
- Review remaining data integrity edge cases

### ⬜ Sprint 4 — Admin/Staff Modules
- CrudPageFactory pagination
- Admin module search/filter improvements
- Confirmation dialogs for destructive actions

### ⬜ Sprint 5 — Hardening & Docs
- Validation coverage review
- Upload safety
- Query efficiency
- Final docs

## Blockers
None currently.

## Architecture Decisions
1. **Checkout as guest invoice**: Checkout creates an invoice with `customer_id: null` (guest) to leverage existing stock/CRM trigger system
2. **Server-side price**: Checkout always looks up sell_price server-side, never trusting client prices
3. **URL-param filters**: ShopPage filters stored in URLSearchParams for shareability and browser back/forward support
