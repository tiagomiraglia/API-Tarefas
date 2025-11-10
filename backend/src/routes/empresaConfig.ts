import { Router } from 'express';
import { EmpresaConfigController } from '../controllers/EmpresaConfigController';
import { authenticateJWT, requireAdminOrSuperuser } from '../middleware/auth';

const router = Router();
const controller = new EmpresaConfigController();

// Obter configurações (todos podem ver)
router.get('/config', authenticateJWT, (req, res) => controller.getConfig(req, res));

// Atualizar configurações (apenas admin)
router.put('/config', authenticateJWT, requireAdminOrSuperuser, (req, res) => controller.updateConfig(req, res));

export default router;
