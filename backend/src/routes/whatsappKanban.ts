import { Router } from 'express';
import { WhatsAppKanbanController } from '../controllers/WhatsAppKanbanController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const whatsappController = new WhatsAppKanbanController();

// Status e controle de conexão
router.get('/status', authenticateJWT, (req, res) => whatsappController.getStatus(req, res));
router.post('/connect', authenticateJWT, (req, res) => whatsappController.connect(req, res));
router.post('/reconnect', authenticateJWT, (req, res) => whatsappController.reconnect(req, res));
router.post('/clean-session', authenticateJWT, (req, res) => whatsappController.cleanSession(req, res));

// Conversas e mensagens
router.get('/conversas', authenticateJWT, (req, res) => whatsappController.getConversas(req, res));
router.get('/mensagens/:conversaId', authenticateJWT, (req, res) => whatsappController.getMensagens(req, res));
router.post('/enviar', authenticateJWT, (req, res) => whatsappController.enviarMensagem(req, res));
router.post('/mark-as-read', authenticateJWT, (req, res) => whatsappController.marcarComoLido(req, res));

// Sincronização
router.post('/sincronizar', authenticateJWT, (req, res) => whatsappController.sincronizarMensagens(req, res));

// Webhook para receber mensagens em tempo real
router.post('/webhook', (req, res) => whatsappController.webhookMensagem(req, res));

// Criar cartão no Kanban
router.post('/criar-cartao', authenticateJWT, (req, res) => whatsappController.criarCartao(req, res));

// Importar histórico completo
router.post('/importar-historico', authenticateJWT, (req, res) => whatsappController.importarHistorico(req, res));

export default router;
