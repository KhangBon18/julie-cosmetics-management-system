# Julie Cosmetics — Forensic Audit Report

> **Date:** 26/03/2026 | **Auditor:** Antigravity AI | **Method:** Static code analysis + build verification
> **Verdict:** ⛔ **NO-GO** for public release
> **Score:** 6.5/10 (up from 5.5 after session-1 fixes, blocked by 4 remaining P0s)

---

## Executive Summary

Julie Cosmetics là hệ thống quản lý cửa hàng mỹ phẩm fullstack (React/Vite + Express + MySQL). Sau 2 phiên audit + fix, hệ thống đã cải thiện đáng kể (seed hashes, README, stock validation, security headers, RBAC). Tuy nhiên, **4 bugs P0 còn lại đủ để chặn release**:
1. CRM points không rollback khi xóa invoice
2. Admin ghi đè stock_quantity bypass triggers
3. Discount percent tin tưởng client hoàn toàn
4. Zero input validation trên toàn server

---

## A. Auth — VERIFIED ✅

| Check | Result | Evidence |
|-------|--------|----------|
| Login field | **VERIFIED** — username | `authController.js:27` — `User.findByUsername(username)` |
| Seed hashes verify | **VERIFIED** — all 4 accounts pass | Node.js `bcrypt.compare('admin123', hash)` → `true` |
| README matches source | **VERIFIED** — updated this session | `README.md` now says "username", lists correct accounts |
| Token storage | **VERIFIED** — localStorage | `AuthContext.jsx:11` — `localStorage.getItem('token')` |
| 401 handling | **VERIFIED** — redirect to /login | `api.js:26` — response interceptor checks 401 |
| Profile endpoint | **VERIFIED** — returns user data | `authController.js:58-68` — `User.findById(req.user.user_id)` |
| Password change hashing | **VERIFIED** — bcrypt.hash | `authController.js:82-83` — `bcrypt.genSalt(10)` + `bcrypt.hash()` |
| Logout | **VERIFIED** — client-side only | `AuthContext.jsx:30-33` — removes token from localStorage |
| Rate limiting | **VERIFIED** — 20/15min on auth | `server.js` — `authLimiter` applied to `/api/auth` |

---

## B. Role & Permission — VERIFIED ✅ (with 2 IDOR residuals)

### Permission Matrix (from route files)

| Route | protect | managerUp | adminOnly | roleCheck |
|-------|---------|-----------|-----------|-----------|
| auth/login | ✗ | ✗ | ✗ | ✗ |
| auth/profile, change-password | ✓ | ✗ | ✗ | ✗ |
| products CRUD | ✓ | write-only | ✗ | low-stock: admin/mgr/wh |
| employees | ✓ | ✓ (all) | ✗ | ✗ |
| customers read | ✓ | ✗ | ✗ | ✗ |
| customers write | ✓ | ✓ | ✗ | ✗ |
| invoices read | ✓ | ✗ | ✗ | ✗ |
| invoices delete/revenue | ✓ | ✓ | ✗ | ✗ |
| imports, suppliers | ✓ | ✗ | ✗ | admin/mgr/warehouse |
| leaves list | ✓ | ✓ | ✗ | ✗ |
| leaves create | ✓ | ✗ | ✗ | ✗ |
| leaves approve/reject/delete | ✓ | ✓ | ✗ | ✗ |
| **leaves /:id** | ✓ | **✗ — IDOR** | ✗ | ✗ |
| salaries | ✓ | ✓ (all) | ✗ | ✗ |
| reports | ✓ | ✓ (all) | ✗ | ✗ |
| users | ✓ | ✗ | ✓ | ✗ |
| brands, categories, positions | ✓ | write-only | ✗ | ✗ |
| reviews | ✓ | visibility/delete | ✗ | ✗ |
| staff/* | ✓ | ✗ | ✗ | ✗ |
| public/* | ✗ | ✗ | ✗ | ✗ |

### FE Route Guard
- **VERIFIED** — `ProtectedRoute.jsx` wraps admin routes in `App.jsx`
- Roles enforced: employees/brands/categories/reports → admin+manager, imports/suppliers → +warehouse, users → admin-only

### Residual Issues
- **BUG-007 (IDOR):** `GET /leaves/:id` — any user can read any leave request
- **BUG-008:** `GET /invoices` — all invoices visible to all staff (may be intentional)

---

## C. Inventory / Sales / Import — FAIL ❌ (3 bugs)

| Check | Result | Evidence |
|-------|--------|----------|
| Import → stock++ | **VERIFIED** — trigger | `schema.sql:249-257` `trg_import_item_insert` |
| Sale → stock-- | **VERIFIED** — trigger | `schema.sql:229-236` `trg_invoice_item_insert` |
| Invoice delete → stock rollback | **VERIFIED** — trigger added | `schema.sql:238-246` `trg_invoice_item_delete` |
| Import delete → stock rollback | **VERIFIED** — trigger added | `schema.sql:259-267` `trg_import_item_delete` |
| Stock validation before sale | **VERIFIED** — SELECT FOR UPDATE | `invoiceModel.js:68-85` |
| Invoice create uses transaction | **VERIFIED** | `invoiceModel.js:63` `beginTransaction()` |
| Import create uses transaction | **VERIFIED** | `importModel.js:56` `beginTransaction()` |
| Invoice delete uses transaction | **FAIL** | `invoiceModel.js` cuối — `pool.query('DELETE...')` trực tiếp |
| Import delete uses transaction | **FAIL** | `importModel.js:92-94` — `pool.query` trực tiếp |
| Admin stock override protection | **FAIL** | `productModel.js:81-85` — `UPDATE SET stock_quantity = ?` từ input |
| Import items validate product_id | **FAIL** | `importModel.js:75-79` — no pre-check, FK error = 500 |

---

## D. CRM / Customer Tiers — FAIL ❌ (2 bugs)

| Check | Result | Evidence |
|-------|--------|----------|
| Points earned on invoice | **VERIFIED** — trigger | `schema.sql:270-285` `trg_invoice_after_insert` |
| Points formula | **VERIFIED** — 1pt/10,000₫ | `invoiceModel.js:76` `Math.floor(finalTotal / 10000)` |
| Tier auto-update | **VERIFIED** — in trigger | standard→silver@100, silver→gold@500 |
| **Points rollback on delete** | **FAIL** | No `BEFORE DELETE ON invoices` trigger for CRM |
| **Discount server-side verify** | **FAIL** | `invoiceModel.js:73` — `discount_percent \|\| 0` trusts client |
| Customer phone UNIQUE | **VERIFIED** | `schema.sql:173` — `UNIQUE` constraint |

---

## E. HR / Leave / Salary — VERIFIED ✅ (1 minor bug)

| Check | Result | Evidence |
|-------|--------|----------|
| Salary formula | **VERIFIED** — `net = base × (actual/standard) + bonus - deductions` | `salaryCalculation.js:36-52` |
| Cross-month leave fix | **VERIFIED** — GREATEST/LEAST overlap | `salaryCalculation.js:24-38` — fixed this session |
| Salary UNIQUE constraint | **VERIFIED** — DB enforced | `schema.sql:95` — `UNIQUE KEY uq_emp_month (employee_id, month, year)` |
| Duplicate prevention in generate | **VERIFIED** — try/catch skip | `salaryController.js:62-74` — catches duplicate error |
| Leave approval flow | **VERIFIED** — managerUp required | `leaveRoutes.js:9-10` — approve/reject require `managerUp` |
| Position salary vs base_salary | **FAIL (minor)** | `salaryCalculation.js:37` uses `emp.base_salary`, ignores queried `position_salary` |

---

## F. Page Completeness

| Page | Fetch | Create | Update | Delete | Loading | Error | Pagination | Search/Filter | Verdict |
|------|-------|--------|--------|--------|---------|-------|------------|---------------|---------|
| Products | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ (search, category, brand) | **Ready** |
| Employees | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ | **Ready** |
| Customers | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ (search, tier) | **Ready** |
| Invoices | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ (customer, payment) | **Ready** |
| Imports | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ (supplier) | **Ready** |
| Brands | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ (CrudFactory) | ✗ | **Demo** |
| Categories | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | **Demo** |
| Positions | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | **Demo** |
| Suppliers | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | **Demo** |
| Leaves | ✓ | ✓ | approve/reject | ✓ | ✓ | ✗ | ✓ (BE) | ✓ | **Ready** |
| Salaries | ✓ | ✓ (generate) | ✓ | ✓ | ✓ | ✗ | ✓ (BE) | ✓ (month, year) | **Ready** |
| Users | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (BE) | ✗ | **Ready** |
| Reviews | ✓ | ✓ | toggle visible | ✓ | ✓ | ✗ | ✓ (BE) | ✗ | **Ready** |
| Reports | ✓ | — | — | — | ✓ | ✗ | — | year filter | **Ready** |
| Dashboard | ✓ | — | — | — | ✓ | ✗ | — | — | **Ready** |
| Shop | ✓ | — | — | — | ✓ | ✗ | ✓ (BE) | ✓ | **Ready** |
| Product Detail | ✓ | — | — | — | ✓ | ✗ | — | — | **Ready** |
| Cart | ✓ | add/remove | qty | clear | — | ✗ | — | — | **Demo** (no checkout) |
| Staff Portal | ✓ | leave create | profile | — | ✓ | ✗ | — | — | **Ready** |

**Kết luận:** 13/19 pages **Ready**, 5/19 pages **Demo** (thiếu error state, pagination), 1 page **Demo** (cart — no checkout).

---

## G. Security Posture

| Check | Result | Evidence |
|-------|--------|----------|
| Helmet | **VERIFIED** | `server.js` — `app.use(helmet(...))` |
| Rate limiting | **VERIFIED** | Auth: 20/15min, Global: 200/min |
| CORS | **VERIFIED** (dev only) | Hardcoded localhost, needs CLIENT_URL in prod |
| JWT secret | **VERIFIED** — fixed | Strong random key, placeholder in .env.example |
| .env in git | **UNVERIFIED** — .gitignore should exclude but .env exists in workspace |
| Upload security | **VERIFIED** | `uploadMiddleware.js` — mime filter (5 types) + 5MB limit |
| Input validation | **FAIL** | Zero validation library in dependencies |
| SQL injection | **VERIFIED** — parameterized | All queries use `?` placeholders |
| XSS | **VERIFIED** — React auto-escapes | No `dangerouslySetInnerHTML` usage found |

---

## Conclusion

### Public release today: ⛔ NO-GO

### Top 5 Reasons
1. **P0-BUG-001:** CRM points/tier corrupts permanently on invoice delete (no rollback trigger)
2. **P0-BUG-002:** Admin can SET arbitrary stock_quantity, invalidating all inventory triggers
3. **P0-BUG-005:** Discount percent trusted from client — can send 99% discount via cURL
4. **P0-BUG-011:** Zero input validation — any field can be empty/malicious
5. **P1-BUG-003/004:** DELETE operations without transaction risk partial stock corruption

### Minimum Ship Criteria
- [ ] Fix 4 P0 bugs (~4-6 hours)
- [ ] Fix 4 P1 bugs (~1 hour)
- [ ] Set CLIENT_URL env var for production CORS

### Fastest Path to Safe Public Launch
1. Add `BEFORE DELETE ON invoices` trigger for CRM rollback → 30 min
2. Remove `stock_quantity` from product UPDATE → 20 min
3. Calculate discount server-side from customer tier → 30 min
4. Add express-validator for invoice, salary, employee routes → 2-4 hrs
5. Wrap delete operations in transactions → 30 min
6. Add ownership check for `GET /leaves/:id` → 20 min
7. Fix salary `position_salary` usage → 10 min
8. **Total: ~5-7 hours, 1 developer**

### After Launch Roadmap
- Error boundaries + 404 page
- CrudPageFactory pagination
- Code splitting (714KB bundle)
- Automated test suite
- Docker + CI/CD
- Shop checkout flow
