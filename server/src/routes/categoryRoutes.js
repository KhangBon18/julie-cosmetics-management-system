const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', managerUp, categoryController.create);
router.put('/:id', managerUp, categoryController.update);
router.delete('/:id', managerUp, categoryController.delete);

module.exports = router;
