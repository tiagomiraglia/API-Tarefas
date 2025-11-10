"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AvisoController_1 = require("../controllers/AvisoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const avisoController = new AvisoController_1.AvisoController();
// GET /api/avisos/ativo
router.get('/ativo', avisoController.getAvisoAtivo.bind(avisoController));
// POST /api/avisos/visualizacao (marcar avisos como vistos)
router.post('/visualizacao', auth_1.authenticateJWT, avisoController.registrarVisualizacao.bind(avisoController));
// GET /api/avisos/visualizacao/:id (listar visualizações de um aviso)
router.get('/visualizacao/:id', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.getVisualizacoes.bind(avisoController));
// GET /api/avisos (listar todos)
router.get('/', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.listAvisos.bind(avisoController));
// POST /api/avisos (criar aviso)
router.post('/', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.setAviso.bind(avisoController));
// PATCH /api/avisos/:id (editar aviso)
router.patch('/:id', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.editAviso.bind(avisoController));
// PATCH /api/avisos/:id/suspender (suspender aviso)
router.patch('/:id/suspender', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.suspendAviso.bind(avisoController));
// DELETE /api/avisos/:id (excluir aviso)
router.delete('/:id', auth_1.authenticateJWT, auth_1.requireSuperuser, avisoController.deleteAviso.bind(avisoController));
exports.default = router;
//# sourceMappingURL=avisos.js.map