const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', paymentController.getAll);
router.get('/:id', paymentController.getById);
router.get('/invoice/:invoiceId', paymentController.getByInvoice);

// Manager+ actions
router.put('/:id/confirm', managerUp, paymentController.confirm);
router.put('/:id/failed', managerUp, paymentController.markFailed);
router.put('/:id/refund', managerUp, paymentController.refund);

module.exports = router;
