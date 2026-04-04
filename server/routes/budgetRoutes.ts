import { Router } from 'express';
import * as budgetController from '../controllers/budgetController';

const router = Router();

// CRUD
router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudgetById);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

// Budget vs Actual comparison
router.get('/:id/vs-actual', budgetController.getBudgetVsActual);

export default router;
