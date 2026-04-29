#!/bin/bash
# Full payroll workflow API test
set -e
BASE=http://localhost:5001/api
J='Content-Type: application/json'

echo "=== LOGIN ==="
TOKEN=$(curl -sf $BASE/auth/login -H "$J" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
A="Authorization: Bearer $TOKEN"
echo "Token OK"

echo ""
echo "=== DELETE old test data ==="
curl -sf "$BASE/payroll/periods" -H "$A" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for p in data.get('periods',[]):
  print(f'Period {p[\"period_id\"]}: {p[\"month\"]}/{p[\"year\"]} status={p[\"status\"]}')
" 2>/dev/null || echo "(no periods yet)"

echo ""
echo "=== 1. Create Attendance Period 4/2026 ==="
R=$(curl -sf $BASE/payroll/attendance-periods -X POST -H "$A" -H "$J" -d '{"month":4,"year":2026}' 2>/dev/null || curl -sf $BASE/payroll/attendance-periods -H "$A" | python3 -c "import sys,json;ps=json.load(sys.stdin)['periods'];p=[x for x in ps if x['month']==4 and x['year']==2026];print(json.dumps({'period':p[0],'message':'exists'}))" 2>/dev/null)
echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  period_id={d[\"period\"][\"period_id\"]} status={d[\"period\"][\"status\"]}')"
ATT_PID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['period']['period_id'])")

echo ""
echo "=== 2. Create Payroll Period 4/2026 ==="
R=$(curl -sf $BASE/payroll/periods -X POST -H "$A" -H "$J" -d '{"month":4,"year":2026}' 2>/dev/null || curl -sf $BASE/payroll/periods -H "$A" | python3 -c "import sys,json;ps=json.load(sys.stdin)['periods'];p=[x for x in ps if x['month']==4 and x['year']==2026];print(json.dumps({'period':p[0],'message':'exists'}))" 2>/dev/null)
echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  period_id={d[\"period\"][\"period_id\"]} status={d[\"period\"][\"status\"]}')"
PAY_PID=$(echo "$R" | python3 -c "import sys,json;print(json.load(sys.stdin)['period']['period_id'])")

echo ""
echo "=== 3. Calculate Payroll ==="
R=$(curl -sf $BASE/payroll/periods/$PAY_PID/calculate -X POST -H "$A")
echo "$R" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'  Created: {d[\"created\"]} employees')
print(f'  Errors: {len(d.get(\"errors\",[]))}')
print(f'  Period status: {d[\"period\"][\"status\"]}')
print(f'  Total gross: {d[\"period\"][\"total_gross\"]}')
print(f'  Total net: {d[\"period\"][\"total_net\"]}')
for w in d.get('warnings',[]):
  print(f'  ⚠ {w}')
for e in d.get('errors',[]):
  print(f'  ❌ {e[\"employee_name\"]}: {e[\"error\"]}')
"

echo ""
echo "=== 4. Get Payroll Records ==="
curl -sf $BASE/payroll/periods/$PAY_PID/records -H "$A" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for r in d['records']:
  print(f'  {r[\"employee_name\"]}: base={r[\"base_salary\"]} gross={r[\"gross_salary\"]} net={r[\"net_salary\"]} ot_min={r[\"total_overtime_minutes\"]} late={r[\"total_late_minutes\"]} status={r[\"status\"]}')
"

echo ""
echo "=== 5. Get first record detail ==="
FIRST_SID=$(curl -sf $BASE/payroll/periods/$PAY_PID/records -H "$A" | python3 -c "import sys,json;r=json.load(sys.stdin)['records'];print(r[0]['salary_id'] if r else '')")
if [ -n "$FIRST_SID" ]; then
  curl -sf $BASE/payroll/records/$FIRST_SID -H "$A" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['record']
print(f'  Employee: {r[\"employee_name\"]}')
print(f'  Work days: {r[\"work_days_actual\"]}/{r[\"work_days_standard\"]}')
print(f'  Unpaid leave: {r[\"unpaid_leave_days\"]}')
print(f'  Late min: {r[\"total_late_minutes\"]}, Early min: {r[\"total_early_leave_minutes\"]}')
print(f'  OT min: {r[\"total_overtime_minutes\"]}, OT amount: {r[\"overtime_amount\"]}')
print(f'  Adjustments: {len(d.get(\"adjustments\",[]))}')
"

  echo ""
  echo "=== 6. Add adjustment (bonus) ==="
  curl -sf $BASE/payroll/records/$FIRST_SID/adjustments -X POST -H "$A" -H "$J" \
    -d "{\"type\":\"bonus\",\"title\":\"Thưởng KPI Q1\",\"amount\":500000,\"note\":\"Vượt chỉ tiêu\"}" | python3 -m json.tool

  echo ""
  echo "=== 7. Get record after adjustment ==="
  curl -sf $BASE/payroll/records/$FIRST_SID -H "$A" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['record']
print(f'  Bonus: {r[\"bonus\"]}, Net: {r[\"net_salary\"]}')
print(f'  Adjustments: {len(d[\"adjustments\"])}')
for a in d['adjustments']:
  print(f'    - {a[\"type\"]}: {a[\"title\"]} = {a[\"amount\"]}')
"
fi

echo ""
echo "=== 8. Approve Payroll ==="
curl -sf $BASE/payroll/periods/$PAY_PID/approve -X POST -H "$A" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  Status: {d[\"period\"][\"status\"]}')"

echo ""
echo "=== 9. Mark Paid ==="
curl -sf $BASE/payroll/periods/$PAY_PID/mark-paid -X POST -H "$A" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  Status: {d[\"period\"][\"status\"]}')"

echo ""
echo "=== 10. Lock Payroll ==="
curl -sf $BASE/payroll/periods/$PAY_PID/lock -X POST -H "$A" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  Status: {d[\"period\"][\"status\"]}')"

echo ""
echo "=== 11. Try recalculate on locked (should fail) ==="
R=$(curl -s -w "\n%{http_code}" $BASE/payroll/periods/$PAY_PID/calculate -X POST -H "$A")
CODE=$(echo "$R" | tail -1)
echo "  HTTP $CODE (expected 409)"

echo ""
echo "=== 12. Lock attendance period ==="
curl -sf $BASE/payroll/attendance-periods/$ATT_PID/lock -X POST -H "$A" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  Status: {d[\"period\"][\"status\"]}')"

echo ""
echo "=== 13. Staff login ==="
STOKEN=$(curl -sf $BASE/auth/login -H "$J" -d '{"username":"staff1","password":"staff123"}' 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -n "$STOKEN" ]; then
  SA="Authorization: Bearer $STOKEN"
  echo "  Staff token OK"
  echo "=== 14. Staff get my salaries ==="
  curl -sf $BASE/staff/salaries -H "$SA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for s in d.get('salaries',[]):
  print(f'  {s[\"month\"]}/{s[\"year\"]}: net={s[\"net_salary\"]}')
print(f'  Total: {d.get(\"total\",0)} records')
" 2>/dev/null || echo "  (no data or endpoint issue)"
else
  echo "  Staff login failed (may not have staff1 user)"
fi

echo ""
echo "=== DONE ==="
