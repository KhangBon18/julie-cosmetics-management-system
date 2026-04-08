const router = require('express').Router();
const supplierController = require('../controllers/supplierController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('suppliers.read'), supplierController.getAll);
router.get('/:id', requirePermission('suppliers.read'), supplierController.getById);
router.post('/', requirePermission('suppliers.create'), supplierController.create);
router.put('/:id', requirePermission('suppliers.update'), supplierController.update);
router.delete('/:id', requirePermission('suppliers.delete'), supplierController.delete);

module.exports = router;
