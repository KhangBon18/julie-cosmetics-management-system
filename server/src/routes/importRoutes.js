const router = require('express').Router();
const importController = require('../controllers/importController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateImport } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('imports.read'), importController.getAll);
router.get('/:id', requirePermission('imports.read'), importController.getById);
router.post('/', requirePermission('imports.create'), validateImport, importController.create);
router.delete('/:id', requirePermission('imports.delete'), importController.delete);

module.exports = router;
