const router = require('express').Router();
const customerController = require('../controllers/customerController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateCustomer } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('customers.read'), customerController.getAll);
router.get('/phone/:phone', requirePermission('customers.read'), customerController.findByPhone);
router.get('/:id', requirePermission('customers.read'), customerController.getById);
router.get('/:id/detail', requirePermission('customers.read'), customerController.getDetail);
router.post('/', requirePermission('customers.create'), validateCustomer, customerController.create);
router.put('/:id', requirePermission('customers.update'), validateCustomer, customerController.update);
router.put('/:id/reset-password', requirePermission('customers.update'), customerController.resetPassword);
router.put('/:id/toggle-lock', requirePermission('customers.update'), customerController.toggleAccountLock);
router.delete('/:id', requirePermission('customers.delete'), customerController.delete);

module.exports = router;
