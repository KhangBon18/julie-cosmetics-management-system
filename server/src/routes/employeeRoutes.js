const router = require('express').Router();
const employeeController = require('../controllers/employeeController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateEmployee, validatePositionAssignment } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('employees.read'), employeeController.getAll);
router.get('/:id', requirePermission('employees.read'), employeeController.getById);
router.post('/', requirePermission('employees.create'), validateEmployee, employeeController.create);
router.put('/:id', requirePermission('employees.update'), validateEmployee, employeeController.update);
router.delete('/:id', requirePermission('employees.delete'), employeeController.delete);
router.get('/:id/positions', requirePermission('employees.read'), employeeController.getPositionHistory);
router.post('/:id/positions', requirePermission('employees.update'), validatePositionAssignment, employeeController.assignPosition);

module.exports = router;
