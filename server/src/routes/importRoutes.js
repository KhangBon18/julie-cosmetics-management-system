const router = require('express').Router();
const importController = require('../controllers/importController');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { validateImport } = require('../middleware/validationMiddleware');

router.use(protect, roleCheck('admin', 'manager', 'warehouse'));
router.get('/', importController.getAll);
router.get('/:id', importController.getById);
router.post('/', validateImport, importController.create);
router.delete('/:id', importController.delete);

module.exports = router;
