"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuariosRoutes = void 0;
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
exports.usuariosRoutes = router;
const userController = new UserController_1.UserController();
// PATCH /api/usuarios/:id/resend-temp-password (admin pode reenviar senha temporária)
router.patch('/:id/resend-temp-password', auth_1.authenticateJWT, userController.resendTempPassword.bind(userController));
// POST /api/usuarios/time (admin cria usuário do time)
router.post('/time', auth_1.authenticateJWT, userController.createTeamUser.bind(userController));
// GET /api/usuarios - retorna usuários visibles ao solicitante
router.get('/', auth_1.authenticateJWT, userController.getAllUsers.bind(userController));
// GET /api/usuarios/:id
router.get('/:id', userController.getUserById);
// DELETE /api/usuarios/:id
router.delete('/:id', auth_1.authenticateJWT, userController.deleteUser.bind(userController));
// PATCH /api/usuarios/:id/suspender
router.patch('/:id/suspender', userController.suspendUser);
// PATCH /api/usuarios/:id (atualizar perfil)
router.patch('/:id', auth_1.authenticateJWT, upload_1.default.fields([{ name: 'foto', maxCount: 1 }]), userController.updateUser.bind(userController));
// PATCH /api/usuarios/:id/reativar
router.patch('/:id/reativar', userController.reactivateUser);
//# sourceMappingURL=usuarios.js.map