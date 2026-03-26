const router = require('express').Router();
const supplierController = require('../controllers/supplierController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

router.use(protect, roleCheck('admin', 'manager', 'warehouse'));
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', supplierController.create);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.delete);

module.exports = router;
