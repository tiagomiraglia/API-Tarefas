"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empresaAdminRoutes = void 0;
const express_1 = require("express");
const EmpresaAdminController_1 = require("../controllers/EmpresaAdminController");
const router = (0, express_1.Router)();
exports.empresaAdminRoutes = router;
const empresaAdminController = new EmpresaAdminController_1.EmpresaAdminController();
// POST /api/auth/empresa-admin
router.post('/empresa-admin', empresaAdminController.criarEmpresaEAdmin.bind(empresaAdminController));
//# sourceMappingURL=empresaAdmin.js.map