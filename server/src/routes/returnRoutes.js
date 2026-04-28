const router = require('express').Router();
const returnController = require('../controllers/returnController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateReturn } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', requirePermission('returns.read'), returnController.getAll);
router.get('/:id', requirePermission('returns.read'), returnController.getById);
router.post('/', requirePermission('returns.create'), validateReturn, returnController.create);
router.put('/:id/approve', requirePermission('returns.update'), returnController.approve);
router.put('/:id/complete', requirePermission('returns.update'), returnController.complete);
router.put('/:id/reject', requirePermission('returns.update'), returnController.reject);

module.exports = router;
