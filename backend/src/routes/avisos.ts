import { Router } from 'express';
import { AvisoController } from '../controllers/AvisoController';
import { authenticateJWT, requireSuperuser } from '../middleware/auth';

const router = Router();
const avisoController = new AvisoController();


// GET /api/avisos/ativo
router.get('/ativo', avisoController.getAvisoAtivo.bind(avisoController));
// POST /api/avisos/visualizacao (marcar avisos como vistos)
router.post('/visualizacao', authenticateJWT, avisoController.registrarVisualizacao.bind(avisoController));
// GET /api/avisos/visualizacao/:id (listar visualizações de um aviso)
router.get('/visualizacao/:id', authenticateJWT, requireSuperuser, avisoController.getVisualizacoes.bind(avisoController));
// GET /api/avisos (listar todos)
router.get('/', authenticateJWT, requireSuperuser, avisoController.listAvisos.bind(avisoController));
// POST /api/avisos (criar aviso)
router.post('/', authenticateJWT, requireSuperuser, avisoController.setAviso.bind(avisoController));
// PATCH /api/avisos/:id (editar aviso)
router.patch('/:id', authenticateJWT, requireSuperuser, avisoController.editAviso.bind(avisoController));
// PATCH /api/avisos/:id/suspender (suspender aviso)
router.patch('/:id/suspender', authenticateJWT, requireSuperuser, avisoController.suspendAviso.bind(avisoController));
// DELETE /api/avisos/:id (excluir aviso)
router.delete('/:id', authenticateJWT, requireSuperuser, avisoController.deleteAviso.bind(avisoController));

export default router;
