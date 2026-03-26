const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
