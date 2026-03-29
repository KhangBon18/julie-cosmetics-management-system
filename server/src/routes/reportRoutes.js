const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect, managerUp);
router.get('/revenue', reportController.getRevenue);
router.get('/profit', reportController.getProfit);
router.get('/top-products', reportController.getTopProducts);
router.get('/inventory', reportController.getInventory);
router.get('/hr', reportController.getHRStats);
router.get('/export-invoices', reportController.exportInvoices);
router.get('/export-products', reportController.exportProducts);
router.get('/export-customers', reportController.exportCustomers);

module.exports = router;
