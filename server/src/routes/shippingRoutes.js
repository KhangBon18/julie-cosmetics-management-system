const router = require('express').Router();
const shippingController = require('../controllers/shippingController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', requirePermission('shipping.read'), shippingController.getAll);
router.get('/:id', requirePermission('shipping.read'), shippingController.getById);
router.put('/:id/status', requirePermission('shipping.update'), shippingController.updateStatus);
router.put('/:id/tracking', requirePermission('shipping.update'), shippingController.setTrackingCode);

module.exports = router;
