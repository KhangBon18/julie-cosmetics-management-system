const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

const withGroupBy = (groupBy, handler) => (req, res, next) => {
  req.query = { ...req.query, group_by: groupBy };
  return handler(req, res, next);
};

router.use(protect, requirePermission('reports.read'));
router.get('/revenue', reportController.getRevenue);
router.get('/sales-summary', reportController.getSalesSummary);
router.get('/profit', reportController.getProfit);
router.get('/top-products', reportController.getTopProducts);
router.get('/inventory', reportController.getInventory);
router.get('/hr', reportController.getHRStats);

router.get('/hr/monthly', withGroupBy('month', reportController.getHRStats));
router.get('/hr/yearly', withGroupBy('year', reportController.getHRStats));
router.get('/hr/annual', withGroupBy('year', reportController.getHRStats));

router.get('/inventory/monthly', withGroupBy('month', reportController.getInventory));
router.get('/inventory/yearly', withGroupBy('year', reportController.getInventory));
router.get('/inventory/annual', withGroupBy('year', reportController.getInventory));

router.get('/sales/monthly', withGroupBy('month', reportController.getSalesSummary));
router.get('/sales/quarterly', withGroupBy('quarter', reportController.getSalesSummary));
router.get('/sales/yearly', withGroupBy('year', reportController.getSalesSummary));
router.get('/sales/annual', withGroupBy('year', reportController.getSalesSummary));

router.get('/profit/monthly', withGroupBy('month', reportController.getProfit));
router.get('/profit/quarterly', withGroupBy('quarter', reportController.getProfit));
router.get('/profit/yearly', withGroupBy('year', reportController.getProfit));
router.get('/profit/annual', withGroupBy('year', reportController.getProfit));

router.get('/export-invoices', requirePermission('reports.export'), reportController.exportInvoices);
router.get('/export-products', requirePermission('reports.export'), reportController.exportProducts);
router.get('/export-customers', requirePermission('reports.export'), reportController.exportCustomers);

module.exports = router;
