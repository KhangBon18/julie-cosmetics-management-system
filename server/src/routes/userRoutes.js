const router = require('express').Router();
const userController = require('../controllers/userController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateUserCreate, validateUserUpdate } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('users.read'), userController.getAll);
router.get('/:id/permissions', requirePermission('users.read'), userController.getPermissions);
router.put('/:id/permissions', requirePermission('users.update'), userController.setPermissions);
router.get('/:id', requirePermission('users.read'), userController.getById);
router.post('/', requirePermission('users.create'), validateUserCreate, userController.create);
router.put('/:id', requirePermission('users.update'), validateUserUpdate, userController.update);
router.put('/:id/reset-password', requirePermission('users.update'), userController.resetPassword);
router.put('/:id/toggle-active', requirePermission('users.update'), userController.toggleActive);
router.delete('/:id', requirePermission('users.delete'), userController.delete);

module.exports = router;
