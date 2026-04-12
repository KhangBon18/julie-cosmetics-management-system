const router = require('express').Router();
const returnController = require('../controllers/returnController');
const { protect, managerUp } = require('../middleware/authMiddleware');
const { validateReturn } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', returnController.getAll);
router.get('/:id', returnController.getById);
router.post('/', validateReturn, returnController.create);
router.put('/:id/approve', managerUp, returnController.approve);
router.put('/:id/complete', managerUp, returnController.complete);
router.put('/:id/reject', managerUp, returnController.reject);

module.exports = router;
