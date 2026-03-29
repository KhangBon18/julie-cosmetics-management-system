const router = require('express').Router();
const shippingController = require('../controllers/shippingController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', shippingController.getAll);
router.get('/:id', shippingController.getById);
router.put('/:id/status', shippingController.updateStatus);
router.put('/:id/tracking', shippingController.setTrackingCode);

module.exports = router;
