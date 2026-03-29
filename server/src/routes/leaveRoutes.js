const router = require('express').Router();
const leaveController = require('../controllers/leaveController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateLeave } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', managerUp, leaveController.getAll);
router.get('/:id', leaveController.getById);
router.post('/', validateLeave, leaveController.create);
router.put('/:id/approve', managerUp, leaveController.approve);
router.put('/:id/reject', managerUp, leaveController.reject);
router.delete('/:id', managerUp, leaveController.delete);

module.exports = router;
