const router = require('express').Router();
const positionController = require('../controllers/positionController');
const { protect, managerUp } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', positionController.getAll);
router.get('/:id', positionController.getById);
router.post('/', managerUp, positionController.create);
router.put('/:id', managerUp, positionController.update);
router.delete('/:id', managerUp, positionController.delete);

module.exports = router;
