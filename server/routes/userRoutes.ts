import { Router } from 'express';
import * as userController from '../controllers/userController';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../middleware/validation';

const router = Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
