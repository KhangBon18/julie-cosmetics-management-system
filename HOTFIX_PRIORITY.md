# Julie Cosmetics — Hotfix Priority

> Forensic Audit: 26/03/2026 | Verdict: **NO-GO** until P0 resolved

---

## P0 — Phải sửa trước khi public (Deploy Blockers)

| # | Bug ID | Issue | Evidence | Effort |
|---|--------|-------|----------|--------|
| 1 | BUG-001 | **CRM points/tier không rollback khi xóa invoice** — Customer vĩnh viễn tích lũy points sai | `schema.sql` chỉ có `trg_invoice_after_insert`, không có DELETE trigger cho CRM | 30 min |
| 2 | BUG-002 | **Admin product UPDATE ghi đè stock_quantity** — Bypass trigger system, phá toàn bộ inventory audit trail | `productModel.js:81-85` — `UPDATE SET stock_quantity = ?` từ req.body | 20 min |
| 3 | BUG-005 | **Discount percent truyền từ FE, BE không verify** — Attacker gửi discount 99% qua API | `invoiceModel.js:73` — `discount_percent || 0` dùng trực tiếp | 30 min |
| 4 | BUG-011 | **Zero input validation** — Mọi endpoint trust req.body hoàn toàn | Không có express-validator/joi/yup trong dependencies | 2-4 hrs |

### P0 Fix Plan

**BUG-001 Fix:** Thêm trigger `BEFORE DELETE ON invoices`:
```sql
CREATE TRIGGER trg_invoice_before_delete
BEFORE DELETE ON invoices FOR EACH ROW
BEGIN
  IF OLD.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_points = GREATEST(0, total_points - OLD.points_earned),
        total_spent  = GREATEST(0, total_spent - OLD.final_total),
        membership_tier = CASE
          WHEN GREATEST(0, total_points - OLD.points_earned) >= 500 THEN 'gold'
          WHEN GREATEST(0, total_points - OLD.points_earned) >= 100 THEN 'silver'
          ELSE 'standard'
        END
    WHERE customer_id = OLD.customer_id;
  END IF;
END$$
```

**BUG-002 Fix:** Loại `stock_quantity` khỏi product update:
```javascript
// productModel.update — bỏ stock_quantity khỏi destructuring và UPDATE SET
const { product_name, brand_id, category_id, description, skin_type, volume,
        import_price, sell_price, image_url, is_active } = data;
// UPDATE SET ... không bao gồm stock_quantity
```

**BUG-005 Fix:** BE tự tính discount dựa trên customer tier:
```javascript
// invoiceModel.create — sau khi validate items:
let discountPct = 0;
if (customer_id) {
  const [cust] = await connection.query(
    'SELECT membership_tier FROM customers WHERE customer_id = ?', [customer_id]);
  if (cust[0]?.membership_tier === 'gold') discountPct = 5;
  else if (cust[0]?.membership_tier === 'silver') discountPct = 2;
}
```

---

## P1 — Nên sửa trước beta/public nhỏ

| # | Bug ID | Issue | Evidence | Effort |
|---|--------|-------|----------|--------|
| 1 | BUG-003 | Import DELETE không dùng transaction | `importModel.js:92-94` — `pool.query` thay vì transaction | 15 min |
| 2 | BUG-004 | Invoice DELETE không dùng transaction | `invoiceModel.js:138` — `pool.query` thay vì transaction | 15 min |
| 3 | BUG-007 | Leave GET /:id có thể xem đơn người khác (IDOR) | `leaveRoutes.js:7` — chỉ `protect`, không check ownership | 20 min |
| 4 | BUG-009 | Salary tính base_salary từ employee, bỏ qua position_salary | `salaryCalculation.js:13,37` — query lấy nhưng không dùng | 10 min |

---

## P2 — Hậu public nhưng cần kế hoạch

| # | Bug ID | Issue | Evidence | Effort |
|---|--------|-------|----------|--------|
| 1 | BUG-010 | Import create không validate product_id, FK error trả 500 thay vì 400 | `importModel.js:75-79` | 15 min |
| 2 | BUG-012 | CrudPageFactory không pagination, hiển thị sai tổng | `CrudPageFactory.jsx:17-18` | 1 hr |
| 3 | BUG-014 | Review CASCADE xóa customer → mất data review | `schema.sql:221` | 10 min |
| 4 | BUG-015 | CORS hardcoded localhost, deploy sẽ fail | `server.js:34` | 5 min |

---

## P3 — Polishing / Tech debt

| # | Issue | Effort |
|---|-------|--------|
| 1 | Staff controller hardcodes limit:100 (BUG-013) | 10 min |
| 2 | No ESLint/Prettier | 30 min |
| 3 | Bundle size 714KB, cần code splitting | 1 hr |
| 4 | No React Error Boundary | 30 min |
| 5 | Responsive sidebar không collapse mobile | 1 hr |
| 6 | No structured logging (winston/pino) | 1 hr |
| 7 | No Docker/CI/CD | 2-4 hrs |
| 8 | No automated tests (0 test files) | 4-8 hrs |
| 9 | Shop không có checkout/order flow | 4-8 hrs |

---

## Timeline Estimate

| Phase | Items | Effort |
|-------|-------|--------|
| **P0 (block release)** | 4 items | **4-6 hours** |
| **P1 (pre-beta)** | 4 items | **1 hour** |
| **P2 (post-launch)** | 4 items | **1.5 hours** |
| **P3 (tech debt)** | 9 items | **15-25 hours** |

**Fastest path to safe public launch:** Fix P0 + P1 = ~7 hours (1 developer).
