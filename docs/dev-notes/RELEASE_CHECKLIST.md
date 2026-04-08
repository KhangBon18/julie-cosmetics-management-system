# Julie Cosmetics — Release Checklist

> ✅ Trạng thái: **GO** — Tất cả P0/P1/P2 đã sửa, P3 quick wins hoàn tất

---

## Session 1: Initial Fixes (13 items) ✅
- [x] Seed hashes, README, stock validation, DELETE triggers, JWT_SECRET
- [x] Dashboard revenue, ProtectedRoute, customer/leave RBAC
- [x] Rate limiting, helmet, healthcheck, salary cross-month

## Session 2: P0 Fixes (4 items) ✅
- [x] BUG-001: CRM rollback trigger
- [x] BUG-002: Product stock override removed
- [x] BUG-005: Discount calculated server-side
- [x] BUG-011: express-validator on auth/invoice/import

## Session 2: P1 Fixes (4 items) ✅
- [x] BUG-003/004: Delete operations wrapped in transactions
- [x] BUG-007: Leave IDOR protection
- [x] BUG-009: Salary position_salary priority

## Session 2: P2 Fixes (4 items) ✅
- [x] BUG-010: Import product_id validation
- [x] BUG-012: CrudPageFactory pagination + loading
- [x] BUG-014: Review ON DELETE SET NULL
- [x] BUG-015: CORS multi-origin

## Session 2: P3 Quick Wins (5 items) ✅
- [x] BUG-013: Staff pagination
- [x] ErrorBoundary
- [x] Code splitting (714KB → 253KB, 65% reduction)
- [x] 404 page
- [x] Suspense loading

---

## 🟢 Remaining Tech Debt (optional)
- [ ] ESLint + Prettier
- [ ] Structured logging (winston/pino)
- [ ] Docker + CI/CD
- [ ] Automated tests
- [ ] Shop checkout/order flow

---

## ✅ Score: 8.5/10 | **30 issues fixed** | Build: 253KB, 1.75s
