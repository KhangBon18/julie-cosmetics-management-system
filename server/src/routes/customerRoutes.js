const router = require('express').Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', customerController.getAll);
router.get('/phone/:phone', customerController.findByPhone);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

module.exports = router;
