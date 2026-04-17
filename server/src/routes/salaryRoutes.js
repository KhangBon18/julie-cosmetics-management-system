const router = require('express').Router();
const salaryController = require('../controllers/salaryController');
const { protect, requirePermission } = require('../middleware/authMiddleware');
const { validateSalaryGenerate, validateSalaryBonus } = require('../middleware/validationMiddleware');

router.use(protect);
router.get('/', requirePermission('salaries.read'), salaryController.getAll);
router.get('/export', requirePermission('salaries.export', 'salaries.read'), salaryController.exportSalaries);
router.get('/bonuses', requirePermission('salaries.read'), salaryController.getBonuses);
router.post('/bonuses', requirePermission('salaries.update', 'salaries.create'), validateSalaryBonus, salaryController.upsertBonus);
router.delete('/bonuses/:id', requirePermission('salaries.update', 'salaries.delete'), salaryController.deleteBonus);
router.get('/:id', requirePermission('salaries.read'), salaryController.getById);
router.post('/', requirePermission('salaries.create'), salaryController.create);
router.post('/calculate', requirePermission('salaries.create'), salaryController.calculate);
router.post('/generate', requirePermission('salaries.create'), validateSalaryGenerate, salaryController.generateAll);
router.put('/:id', requirePermission('salaries.update'), salaryController.update);
router.delete('/:id', requirePermission('salaries.delete'), salaryController.delete);

module.exports = router;
