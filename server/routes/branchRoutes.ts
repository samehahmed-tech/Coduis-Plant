import { Router } from 'express';
import * as branchController from '../controllers/branchController';
import { requireRoles } from '../middleware/auth';

const router = Router();
const managerAuth = requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER');

router.get('/', branchController.getAllBranches);
router.post('/', managerAuth, branchController.createBranch);
router.put('/:id', managerAuth, branchController.updateBranch);
router.delete('/:id', managerAuth, branchController.deleteBranch);

export default router;
