const router = require('express').Router();
const brandController = require('../controllers/brandController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', brandController.getAll);
router.get('/:id', brandController.getById);
router.post('/', managerUp, brandController.create);
router.put('/:id', managerUp, brandController.update);
router.delete('/:id', managerUp, brandController.delete);

module.exports = router;
