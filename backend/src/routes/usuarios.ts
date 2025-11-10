
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();
const userController = new UserController();
// PATCH /api/usuarios/:id/resend-temp-password (admin pode reenviar senha temporária)
router.patch('/:id/resend-temp-password', authenticateJWT, userController.resendTempPassword.bind(userController));

// POST /api/usuarios/time (admin cria usuário do time)
router.post('/time', authenticateJWT, userController.createTeamUser.bind(userController));

// GET /api/usuarios - retorna usuários visibles ao solicitante
router.get('/', authenticateJWT, userController.getAllUsers.bind(userController));

// GET /api/usuarios/:id
router.get('/:id', userController.getUserById);

// DELETE /api/usuarios/:id
router.delete('/:id', authenticateJWT, userController.deleteUser.bind(userController));

// PATCH /api/usuarios/:id/suspender
router.patch('/:id/suspender', userController.suspendUser);
// PATCH /api/usuarios/:id (atualizar perfil)
router.patch('/:id', authenticateJWT, upload.fields([{ name: 'foto', maxCount: 1 }]), userController.updateUser.bind(userController));

// PATCH /api/usuarios/:id/reativar
router.patch('/:id/reativar', userController.reactivateUser);

export { router as usuariosRoutes };