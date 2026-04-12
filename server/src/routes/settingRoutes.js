const router = require('express').Router();
const settingController = require('../controllers/settingController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.get('/', protect, requirePermission('settings.read'), settingController.getAll);
router.get('/:key', protect, requirePermission('settings.read'), settingController.getByKey);
router.post('/backup', protect, requirePermission('settings.update'), settingController.backup);
router.put('/bulk', protect, requirePermission('settings.update'), settingController.bulkUpdate);
router.put('/:key', protect, requirePermission('settings.update'), settingController.update);

module.exports = router;
