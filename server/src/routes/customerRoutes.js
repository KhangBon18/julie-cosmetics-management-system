const router = require('express').Router();
const customerController = require('../controllers/customerController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateCustomer } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', customerController.getAll);
router.get('/phone/:phone', customerController.findByPhone);
router.get('/:id', customerController.getById);
router.post('/', validateCustomer, customerController.create);
router.put('/:id', managerUp, validateCustomer, customerController.update);
router.delete('/:id', managerUp, customerController.delete);

module.exports = router;
