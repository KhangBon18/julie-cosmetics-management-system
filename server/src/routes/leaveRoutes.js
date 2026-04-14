const router = require('express').Router();
const leaveController = require('../controllers/leaveController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateLeave, validateLeaveReject } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('leaves.read'), leaveController.getAll);
router.get('/:id', requirePermission('leaves.read'), leaveController.getById);
router.post('/', requirePermission('leaves.create'), validateLeave, leaveController.create);
router.put('/:id/approve', requirePermission('leaves.update'), leaveController.approve);
router.put('/:id/reject', requirePermission('leaves.update'), validateLeaveReject, leaveController.reject);

module.exports = router;
