const router = require('express').Router();
const salaryController = require('../controllers/salaryController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateSalaryGenerate } = require('../middleware/validationMiddleware');

router.use(protect, managerUp);
router.get('/', salaryController.getAll);
router.get('/:id', salaryController.getById);
router.post('/', salaryController.create);
router.post('/calculate', salaryController.calculate);
router.post('/generate', validateSalaryGenerate, salaryController.generateAll);
router.put('/:id', salaryController.update);
router.delete('/:id', salaryController.delete);

module.exports = router;

