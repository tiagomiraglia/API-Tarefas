import { Router } from 'express';
import { CartaoTransferenciaController } from '../controllers/CartaoTransferenciaController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const controller = new CartaoTransferenciaController();

// Todas as rotas requerem autenticação
router.use(authenticateJWT);

// Transferir cartão para outro atendente
router.post('/cartoes/:id/transferir', (req, res) => controller.transferirCartao(req, res));

// Buscar histórico de transferências de um cartão
router.get('/cartoes/:id/transferencias', (req, res) => controller.getHistoricoTransferencias(req, res));

// Estatísticas de transferências (apenas admin)
router.get('/transferencias/estatisticas', (req, res) => controller.getEstatisticas(req, res));

// Listar todas as transferências com filtros (apenas admin)
router.get('/transferencias', (req, res) => controller.listarTransferencias(req, res));

export default router;
