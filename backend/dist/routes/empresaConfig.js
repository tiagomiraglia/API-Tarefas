"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmpresaConfigController_1 = require("../controllers/EmpresaConfigController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new EmpresaConfigController_1.EmpresaConfigController();
// Obter configurações (todos podem ver)
router.get('/config', auth_1.authenticateJWT, (req, res) => controller.getConfig(req, res));
// Atualizar configurações (apenas admin)
router.put('/config', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.updateConfig(req, res));
exports.default = router;
//# sourceMappingURL=empresaConfig.js.map