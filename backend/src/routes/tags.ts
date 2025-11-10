import { Router } from 'express';
import { TagController } from '../controllers/TagController';
import { authenticateJWT, requireAdminOrSuperuser } from '../middleware/auth';

const router = Router();
const controller = new TagController();

// Listar tags (todos podem ver)
router.get('/', authenticateJWT, (req, res) => controller.listTags(req, res));

// CRUD (apenas admin)
router.post('/', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.createTag(req, res));
router.put('/:id', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.updateTag(req, res));
router.delete('/:id', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.deleteTag(req, res));

export default router;
