const router = require('express').Router();
const promotionController = require('../controllers/promotionController');
const { protect, managerUp } = require('../middleware/authMiddleware');

// Admin/Manager: full CRUD
router.use(protect, managerUp);

router.get('/', promotionController.getAll);
router.get('/:id', promotionController.getById);
router.post('/', promotionController.create);
router.put('/:id', promotionController.update);
router.delete('/:id', promotionController.delete);

module.exports = router;
