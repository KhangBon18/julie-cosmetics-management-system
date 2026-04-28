const router = require('express').Router();
const promotionController = require('../controllers/promotionController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', requirePermission('promotions.read'), promotionController.getAll);
router.get('/:id', requirePermission('promotions.read'), promotionController.getById);
router.post('/', requirePermission('promotions.create'), promotionController.create);
router.put('/:id', requirePermission('promotions.update'), promotionController.update);
router.delete('/:id', requirePermission('promotions.delete'), promotionController.delete);

module.exports = router;
