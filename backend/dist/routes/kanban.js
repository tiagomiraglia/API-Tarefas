"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KanbanController_1 = require("../controllers/KanbanController");
const auth_1 = require("../middleware/auth");
const kanbanPermissions_1 = require("../middleware/kanbanPermissions");
const router = (0, express_1.Router)();
const kanban = new KanbanController_1.KanbanController();
// ABAS
router.get('/abas', auth_1.authenticateJWT, (req, res) => kanban.listAbas(req, res));
router.post('/abas', auth_1.authenticateJWT, (req, res) => kanban.createAba(req, res));
router.put('/abas/:id', auth_1.authenticateJWT, (req, res) => kanban.updateAba(req, res));
router.delete('/abas/:id', auth_1.authenticateJWT, (req, res) => kanban.deleteAba(req, res));
// COLUNAS
router.post('/colunas', auth_1.authenticateJWT, (req, res) => kanban.createColuna(req, res));
router.put('/colunas/:id', auth_1.authenticateJWT, (req, res) => kanban.updateColuna(req, res));
router.delete('/colunas/:id', auth_1.authenticateJWT, (req, res) => kanban.deleteColuna(req, res));
// Definir coluna padrão para WhatsApp
router.post('/colunas/set-whats', auth_1.authenticateJWT, (req, res) => kanban.setColunaWhats(req, res));
// CARTÕES
router.get('/cartoes', auth_1.authenticateJWT, (req, res) => kanban.listCartoes(req, res));
router.get('/cartoes/:id', auth_1.authenticateJWT, (req, res) => kanban.getCartao(req, res));
router.post('/cartoes', auth_1.authenticateJWT, kanbanPermissions_1.verificarPermissaoColuna, kanbanPermissions_1.verificarPermissaoEdicao, (req, res) => kanban.createCartao(req, res));
router.put('/cartoes/:id', auth_1.authenticateJWT, (req, res) => kanban.updateCartao(req, res));
router.delete('/cartoes/:id', auth_1.authenticateJWT, kanbanPermissions_1.verificarPermissaoEdicao, (req, res) => kanban.deleteCartao(req, res));
router.post('/cartoes/move', auth_1.authenticateJWT, kanbanPermissions_1.verificarPermissaoMover, (req, res) => kanban.moveCartao(req, res));
// VINCULAÇÃO WHATSAPP
router.post('/cartoes/whatsapp/vincular', auth_1.authenticateJWT, (req, res) => kanban.vincularWhatsApp(req, res));
router.post('/cartoes/whatsapp/desvincular', auth_1.authenticateJWT, (req, res) => kanban.desvincularWhatsApp(req, res));
// MONITORAMENTO INTELIGENTE
router.get('/monitoramento', auth_1.authenticateJWT, (req, res) => kanban.getMonitoramento(req, res));
exports.default = router;
//# sourceMappingURL=kanban.js.map