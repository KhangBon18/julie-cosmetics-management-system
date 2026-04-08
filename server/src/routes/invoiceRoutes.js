const router = require('express').Router();
const invoiceController = require('../controllers/invoiceController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateInvoice } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('invoices.read'), invoiceController.getAll);
router.get('/revenue', requirePermission('reports.read'), invoiceController.getRevenueStats);
router.get('/:id', requirePermission('invoices.read'), invoiceController.getById);
router.post('/', requirePermission('invoices.create'), validateInvoice, invoiceController.create);
router.delete('/:id', requirePermission('invoices.delete'), invoiceController.delete);

module.exports = router;
