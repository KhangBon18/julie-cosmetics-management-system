const router = require('express').Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateUserCreate } = require('../middleware/validationMiddleware');

router.use(protect, adminOnly);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', validateUserCreate, userController.create);
router.put('/:id', userController.update);
router.put('/:id/reset-password', userController.resetPassword);
router.put('/:id/toggle-active', userController.toggleActive);
router.delete('/:id', userController.delete);

module.exports = router;
