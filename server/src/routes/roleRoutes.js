const router = require('express').Router();
const roleController = require('../controllers/roleController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/modules', requirePermission('roles.read', 'users.update'), roleController.getModules);
router.get('/permissions/all', requirePermission('roles.read', 'users.update'), roleController.getAllPermissions);
router.get('/', requirePermission('roles.read', 'users.read'), roleController.getAll);
router.get('/:id', requirePermission('roles.read'), roleController.getById);
router.post('/', requirePermission('roles.create'), roleController.create);
router.put('/:id', requirePermission('roles.update'), roleController.update);
router.put('/:id/permissions', requirePermission('roles.update'), roleController.setPermissions);
router.delete('/:id', requirePermission('roles.delete'), roleController.delete);

module.exports = router;
