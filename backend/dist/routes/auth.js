"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const authController = new AuthController_1.AuthController();
// POST /api/auth/resetar-senha-temporaria
router.post('/resetar-senha-temporaria', authController.resetarSenhaTemporaria.bind(authController));
// POST /api/auth/registro
router.post('/registro', authController.register);
// POST /api/auth/login
router.post('/login', authController.login);
// POST /api/auth/logout
router.post('/logout', authController.logout);
// GET /api/auth/perfil
router.get('/perfil', authController.getProfile);
// POST /api/auth/recuperacao
router.post('/recuperacao', authController.recuperacao.bind(authController));
// POST /api/auth/verificar-codigo
router.post('/verificar-codigo', authController.verificarCodigo.bind(authController));
// POST /api/auth/resetar-senha
router.post('/resetar-senha', authController.resetarSenha.bind(authController));
//# sourceMappingURL=auth.js.map