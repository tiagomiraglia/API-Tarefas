import { Router } from 'express';
import { PermissaoKanbanController } from '../controllers/PermissaoKanbanController';
import { authenticateJWT, requireAdminOrSuperuser } from '../middleware/auth';

const router = Router();
const controller = new PermissaoKanbanController();

// Listar permissões de um usuário
router.get('/usuario/:usuarioId', authenticateJWT, (req, res) => controller.listByUsuario(req, res));
// Listar permissões por aba/coluna
router.get('/listar', authenticateJWT, (req, res) => controller.listByAbaColuna(req, res));
// Criar permissão (apenas admin)
router.post('/', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.create(req, res));
// Remover permissão (apenas admin)
router.delete('/:id', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.delete(req, res));

export default router;
