"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WhatsAppKanbanController_1 = require("../controllers/WhatsAppKanbanController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const whatsappController = new WhatsAppKanbanController_1.WhatsAppKanbanController();
// Status e controle de conexão
router.get('/status', auth_1.authenticateJWT, (req, res) => whatsappController.getStatus(req, res));
router.post('/connect', auth_1.authenticateJWT, (req, res) => whatsappController.connect(req, res));
router.post('/reconnect', auth_1.authenticateJWT, (req, res) => whatsappController.reconnect(req, res));
router.post('/clean-session', auth_1.authenticateJWT, (req, res) => whatsappController.cleanSession(req, res));
// Conversas e mensagens
router.get('/conversas', auth_1.authenticateJWT, (req, res) => whatsappController.getConversas(req, res));
router.get('/mensagens/:conversaId', auth_1.authenticateJWT, (req, res) => whatsappController.getMensagens(req, res));
router.post('/enviar', auth_1.authenticateJWT, (req, res) => whatsappController.enviarMensagem(req, res));
router.post('/mark-as-read', auth_1.authenticateJWT, (req, res) => whatsappController.marcarComoLido(req, res));
// Sincronização
router.post('/sincronizar', auth_1.authenticateJWT, (req, res) => whatsappController.sincronizarMensagens(req, res));
// Webhook para receber mensagens em tempo real
router.post('/webhook', (req, res) => whatsappController.webhookMensagem(req, res));
// Criar cartão no Kanban
router.post('/criar-cartao', auth_1.authenticateJWT, (req, res) => whatsappController.criarCartao(req, res));
// Importar histórico completo
router.post('/importar-historico', auth_1.authenticateJWT, (req, res) => whatsappController.importarHistorico(req, res));
exports.default = router;
//# sourceMappingURL=whatsappKanban.js.map