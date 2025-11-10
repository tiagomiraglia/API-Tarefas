"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CartaoTransferenciaController_1 = require("../controllers/CartaoTransferenciaController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new CartaoTransferenciaController_1.CartaoTransferenciaController();
// Todas as rotas requerem autenticação
router.use(auth_1.authenticateJWT);
// Transferir cartão para outro atendente
router.post('/cartoes/:id/transferir', (req, res) => controller.transferirCartao(req, res));
// Buscar histórico de transferências de um cartão
router.get('/cartoes/:id/transferencias', (req, res) => controller.getHistoricoTransferencias(req, res));
// Estatísticas de transferências (apenas admin)
router.get('/transferencias/estatisticas', (req, res) => controller.getEstatisticas(req, res));
// Listar todas as transferências com filtros (apenas admin)
router.get('/transferencias', (req, res) => controller.listarTransferencias(req, res));
exports.default = router;
//# sourceMappingURL=transferencias.js.map