const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('categories.read'), categoryController.getAll);
router.get('/:id', requirePermission('categories.read'), categoryController.getById);
router.post('/', requirePermission('categories.create'), categoryController.create);
router.put('/:id', requirePermission('categories.update'), categoryController.update);
router.delete('/:id', requirePermission('categories.delete'), categoryController.delete);

module.exports = router;
