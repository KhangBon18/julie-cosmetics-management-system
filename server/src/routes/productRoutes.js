const router = require('express').Router();
const productController = require('../controllers/productController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateProduct } = require('../middleware/validationMiddleware');

router.get('/', protect, requirePermission('products.read'), productController.getAll);
router.get('/low-stock', protect, requirePermission('products.read'), productController.getLowStock);
router.get('/:id', protect, requirePermission('products.read'), productController.getById);
router.post('/', protect, requirePermission('products.create'), validateProduct, productController.create);
router.put('/:id', protect, requirePermission('products.update'), validateProduct, productController.update);
router.delete('/:id', protect, requirePermission('products.delete'), productController.delete);

module.exports = router;
