const router = require('express').Router();
const employeeController = require('../controllers/employeeController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateEmployee } = require('../middleware/validationMiddleware');

router.use(protect, managerUp);
router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.post('/', validateEmployee, employeeController.create);
router.put('/:id', validateEmployee, employeeController.update);
router.delete('/:id', employeeController.delete);
router.get('/:id/positions', employeeController.getPositionHistory);
router.post('/:id/positions', employeeController.assignPosition);

module.exports = router;
