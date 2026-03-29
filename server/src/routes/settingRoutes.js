const router = require('express').Router();
const settingController = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All setting routes require admin
router.use(protect, adminOnly);

router.get('/', settingController.getAll);
router.get('/:key', settingController.getByKey);
router.put('/bulk', settingController.bulkUpdate);
router.put('/:key', settingController.update);

module.exports = router;
