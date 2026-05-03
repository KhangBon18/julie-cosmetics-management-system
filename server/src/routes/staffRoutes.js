const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const staffAttendanceController = require('../controllers/staffAttendanceController');
const { protect, roleCheckResolved } = require('../middleware/authMiddleware');
const {
  validateAttendanceAdjustment,
  validateAttendanceCheckAction,
  validateAttendanceListQuery,
  validateLeave
} = require('../middleware/validationMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(protect);
router.use(roleCheckResolved('manager', 'staff', 'warehouse', 'sales', 'employee', 'staff_portal'));

router.get('/dashboard', staffController.getDashboard);
router.get('/profile', staffController.getProfile);
router.put('/profile', staffController.updateProfile);
router.get('/salaries', staffController.getMySalaries);
router.get('/salaries/export', staffController.exportMySalaries);
router.get('/my-salary', staffController.getMySalaries);
router.get('/salary-slip/annual/:year', staffController.getAnnualSalarySlip);
router.get('/salary-slip/:month/:year', staffController.getMonthlySalarySlip);
router.get('/salary-formula', staffController.getSalaryFormula);
router.get('/leaves', staffController.getMyLeaves);
router.get('/my-leaves', staffController.getMyLeaves);
router.post('/leaves', validateLeave, staffController.createLeave);
router.get('/attendance/today', staffAttendanceController.getToday);
router.get('/attendance', validateAttendanceListQuery, staffAttendanceController.getMyAttendances);
router.post('/attendance/check-in', validateAttendanceCheckAction, staffAttendanceController.checkIn);
router.post('/attendance/check-out', validateAttendanceCheckAction, staffAttendanceController.checkOut);
router.post('/attendance/adjustments', validateAttendanceAdjustment, staffAttendanceController.createAdjustment);
router.get('/attendance/adjustments', validateAttendanceListQuery, staffAttendanceController.getMyAdjustments);

module.exports = router;
