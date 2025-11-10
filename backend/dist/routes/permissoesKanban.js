"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PermissaoKanbanController_1 = require("../controllers/PermissaoKanbanController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new PermissaoKanbanController_1.PermissaoKanbanController();
// Listar permissões de um usuário
router.get('/usuario/:usuarioId', auth_1.authenticateJWT, (req, res) => controller.listByUsuario(req, res));
// Listar permissões por aba/coluna
router.get('/listar', auth_1.authenticateJWT, (req, res) => controller.listByAbaColuna(req, res));
// Criar permissão (apenas admin)
router.post('/', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.create(req, res));
// Remover permissão (apenas admin)
router.delete('/:id', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.delete(req, res));
exports.default = router;
//# sourceMappingURL=permissoesKanban.js.map