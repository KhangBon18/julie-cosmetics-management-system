const router = require('express').Router();
const reviewController = require('../controllers/reviewController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', reviewController.getAll);
router.get('/:id', reviewController.getById);
router.post('/', reviewController.create);
router.put('/:id/visibility', managerUp, reviewController.toggleVisibility);
router.delete('/:id', managerUp, reviewController.delete);

module.exports = router;
