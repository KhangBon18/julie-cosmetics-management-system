const router = require('express').Router();
const leaveController = require('../controllers/leaveController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('leaves.read'), leaveController.getAll);
router.get('/:id', requirePermission('leaves.read'), leaveController.getById);
router.post('/', requirePermission('leaves.create'), leaveController.create);
router.put('/:id/approve', requirePermission('leaves.update'), leaveController.approve);
router.put('/:id/reject', requirePermission('leaves.update'), leaveController.reject);

module.exports = router;
