const router = require('express').Router();
const productController = require('../controllers/productController');
const { protect, managerUp, roleCheck } = require('../middleware/authMiddleware');
const { validateProduct } = require('../middleware/validationMiddleware');

router.get('/', protect, productController.getAll);
router.get('/low-stock', protect, roleCheck('admin', 'manager', 'warehouse'), productController.getLowStock);
router.get('/:id', protect, productController.getById);
router.post('/', protect, managerUp, validateProduct, productController.create);
router.put('/:id', protect, managerUp, validateProduct, productController.update);
router.delete('/:id', protect, managerUp, productController.delete);

module.exports = router;
