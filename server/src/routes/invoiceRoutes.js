const router = require('express').Router();
const invoiceController = require('../controllers/invoiceController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateInvoice } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', invoiceController.getAll);
router.get('/revenue', managerUp, invoiceController.getRevenueStats);
router.get('/:id', invoiceController.getById);
router.post('/', validateInvoice, invoiceController.create);
router.delete('/:id', managerUp, invoiceController.delete);

module.exports = router;
