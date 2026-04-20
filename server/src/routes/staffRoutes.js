const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, roleCheckResolved } = require('../middleware/authMiddleware');
const { validateLeave } = require('../middleware/validationMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(protect);
router.use(roleCheckResolved('manager', 'staff', 'warehouse', 'employee', 'staff_portal'));

router.get('/dashboard', staffController.getDashboard);
router.get('/profile', staffController.getProfile);
router.put('/profile', staffController.updateProfile);
router.get('/salaries', staffController.getMySalaries);
router.get('/salaries/export', staffController.exportMySalaries);
router.get('/salary-formula', staffController.getSalaryFormula);
router.get('/leaves', staffController.getMyLeaves);
router.post('/leaves', validateLeave, staffController.createLeave);

module.exports = router;
