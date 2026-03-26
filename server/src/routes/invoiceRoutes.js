const router = require('express').Router();
const invoiceController = require('../controllers/invoiceController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', invoiceController.getAll);
router.get('/revenue', managerUp, invoiceController.getRevenueStats);
router.get('/:id', invoiceController.getById);
router.post('/', invoiceController.create);
router.delete('/:id', managerUp, invoiceController.delete);

module.exports = router;
