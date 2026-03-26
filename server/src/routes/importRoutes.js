const router = require('express').Router();
const importController = require('../controllers/importController');
const { protect, roleCheck } = require('../middleware/authMiddleware');

router.use(protect, roleCheck('admin', 'manager', 'warehouse'));
router.get('/', importController.getAll);
router.get('/:id', importController.getById);
router.post('/', importController.create);
router.delete('/:id', importController.delete);

module.exports = router;
