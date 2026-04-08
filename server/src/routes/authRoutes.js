const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateLogin, validateChangePassword } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/profile', protect, authController.getProfile);
router.put('/change-password', protect, validateChangePassword, authController.changePassword);

module.exports = router;
