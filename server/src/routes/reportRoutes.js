const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect, requirePermission('reports.read'));
router.get('/revenue', reportController.getRevenue);
router.get('/sales-summary', reportController.getSalesSummary);
router.get('/profit', reportController.getProfit);
router.get('/top-products', reportController.getTopProducts);
router.get('/inventory', reportController.getInventory);
router.get('/hr', reportController.getHRStats);
router.get('/export-invoices', requirePermission('reports.export'), reportController.exportInvoices);
router.get('/export-products', requirePermission('reports.export'), reportController.exportProducts);
router.get('/export-customers', requirePermission('reports.export'), reportController.exportCustomers);

module.exports = router;
