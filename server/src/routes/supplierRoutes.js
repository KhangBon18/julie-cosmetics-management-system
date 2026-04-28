const router = require('express').Router();
const supplierController = require('../controllers/supplierController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('suppliers.read'), supplierController.getAll);
router.get('/:id/product-mappings', requirePermission('suppliers.read', 'suppliers.update'), supplierController.getProductMappings);
router.post('/:id/product-mappings', requirePermission('suppliers.update'), supplierController.addProductMapping);
router.delete('/:id/product-mappings/:productId', requirePermission('suppliers.update'), supplierController.removeProductMapping);
router.get('/:id', requirePermission('suppliers.read'), supplierController.getById);
router.post('/', requirePermission('suppliers.create'), supplierController.create);
router.put('/:id', requirePermission('suppliers.update'), supplierController.update);
router.delete('/:id', requirePermission('suppliers.delete'), supplierController.delete);

module.exports = router;
