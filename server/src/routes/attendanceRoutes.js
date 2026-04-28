const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const {
  validateAttendanceListQuery,
  validateAttendanceAdjustmentReject,
  validateAttendanceAdjustmentReviewId,
  validateAttendanceManual,
} = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', requirePermission('attendances.read'), validateAttendanceListQuery, attendanceController.getAll);
router.get('/summary', requirePermission('attendances.read'), validateAttendanceListQuery, attendanceController.getSummary);
router.get('/export', requirePermission('attendances.export', 'attendances.read'), validateAttendanceListQuery, attendanceController.exportAttendances);
router.get('/adjustments', requirePermission('attendances.read'), validateAttendanceListQuery, attendanceController.getAdjustmentRequests);
router.post('/manual', requirePermission('attendances.create'), validateAttendanceManual, attendanceController.createManual);
router.put('/adjustments/:id/approve', requirePermission('attendances.update'), validateAttendanceAdjustmentReviewId, attendanceController.approveAdjustment);
router.put('/adjustments/:id/reject', requirePermission('attendances.update'), validateAttendanceAdjustmentReject, attendanceController.rejectAdjustment);
router.get('/:id', requirePermission('attendances.read'), attendanceController.getById);
router.put('/:id', requirePermission('attendances.update'), validateAttendanceManual, attendanceController.update);
router.delete('/:id', requirePermission('attendances.delete'), attendanceController.delete);

module.exports = router;
