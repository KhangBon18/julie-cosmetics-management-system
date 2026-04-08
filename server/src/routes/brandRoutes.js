const router = require('express').Router();
const brandController = require('../controllers/brandController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('brands.read'), brandController.getAll);
router.get('/:id', requirePermission('brands.read'), brandController.getById);
router.post('/', requirePermission('brands.create'), brandController.create);
router.put('/:id', requirePermission('brands.update'), brandController.update);
router.delete('/:id', requirePermission('brands.delete'), brandController.delete);

module.exports = router;
