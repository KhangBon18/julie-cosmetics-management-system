const router = require('express').Router();
const roleController = require('../controllers/roleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All role management is admin-only
router.use(protect, adminOnly);

router.get('/modules', roleController.getModules);
router.get('/permissions/all', roleController.getAllPermissions);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.put('/:id/permissions', roleController.setPermissions);
router.delete('/:id', roleController.delete);

module.exports = router;
