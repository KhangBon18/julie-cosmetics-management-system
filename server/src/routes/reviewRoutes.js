const router = require('express').Router();
const reviewController = require('../controllers/reviewController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('reviews.read'), reviewController.getAll);
router.get('/:id', requirePermission('reviews.read'), reviewController.getById);
router.put('/:id/visibility', requirePermission('reviews.update'), reviewController.toggleVisibility);
router.delete('/:id', requirePermission('reviews.delete'), reviewController.delete);

module.exports = router;
