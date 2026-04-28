const router = require('express').Router();
const payrollController = require('../controllers/payrollController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

// ── Attendance Periods ──────────────────────────────────────
router.get('/attendance-periods', requirePermission('attendances.read'), payrollController.getAttendancePeriods);
router.post('/attendance-periods', requirePermission('attendances.create'), payrollController.createAttendancePeriod);
router.post('/attendance-periods/:id/lock', requirePermission('attendances.update'), payrollController.lockAttendancePeriod);
router.post('/attendance-periods/:id/unlock', requirePermission('attendances.update'), payrollController.unlockAttendancePeriod);

// ── Payroll Periods ─────────────────────────────────────────
router.get('/periods', requirePermission('salaries.read'), payrollController.getPayrollPeriods);
router.post('/periods', requirePermission('salaries.create'), payrollController.createPayrollPeriod);
router.post('/periods/:id/calculate', requirePermission('salaries.create'), payrollController.calculatePayroll);
router.post('/periods/:id/approve', requirePermission('salaries.approve', 'salaries.update'), payrollController.approvePayroll);
router.post('/periods/:id/mark-paid', requirePermission('salaries.mark_paid', 'salaries.update'), payrollController.markPaid);
router.post('/periods/:id/lock', requirePermission('salaries.lock', 'salaries.update'), payrollController.lockPayroll);
router.get('/periods/:id/records', requirePermission('salaries.read'), payrollController.getRecords);
router.get('/periods/:id/export', requirePermission('salaries.read'), payrollController.exportPayroll);

// ── Payroll Records ─────────────────────────────────────────
router.get('/records/:id', requirePermission('salaries.read'), payrollController.getRecordById);
router.post('/records/:id/adjustments', requirePermission('salaries.update'), payrollController.createAdjustment);
router.delete('/adjustments/:id', requirePermission('salaries.update'), payrollController.deleteAdjustment);

module.exports = router;
