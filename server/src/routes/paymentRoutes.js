const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', requirePermission('payments.read'), paymentController.getAll);
router.get('/invoice/:invoiceId', requirePermission('payments.read'), paymentController.getByInvoice);
router.get('/:id', requirePermission('payments.read'), paymentController.getById);

router.put('/:id/confirm', requirePermission('payments.update'), paymentController.confirm);
router.put('/:id/failed', requirePermission('payments.update'), paymentController.markFailed);
router.put('/:id/refund', requirePermission('payments.update'), paymentController.refund);

module.exports = router;
