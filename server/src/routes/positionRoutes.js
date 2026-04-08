const router = require('express').Router();
const positionController = require('../controllers/positionController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', requirePermission('positions.read'), positionController.getAll);
router.get('/:id', requirePermission('positions.read'), positionController.getById);
router.post('/', requirePermission('positions.create'), positionController.create);
router.put('/:id', requirePermission('positions.update'), positionController.update);
router.delete('/:id', requirePermission('positions.delete'), positionController.delete);

module.exports = router;
