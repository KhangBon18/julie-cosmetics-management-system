const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', managerUp, paymentController.getAll);
router.get('/:id', managerUp, paymentController.getById);
router.get('/invoice/:invoiceId', managerUp, paymentController.getByInvoice);

// Manager+ actions
router.put('/:id/confirm', managerUp, paymentController.confirm);
router.put('/:id/failed', managerUp, paymentController.markFailed);
router.put('/:id/refund', managerUp, paymentController.refund);

module.exports = router;
