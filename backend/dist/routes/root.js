"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.rootRoutes = router;
// Endpoint protegido para superusuário
const database_1 = __importDefault(require("../database/database"));
router.get('/', auth_1.authenticateJWT, auth_1.requireSuperuser, async (req, res) => {
    try {
        // Novas empresas do mês atual
        const empresasResult = await database_1.default.query(`SELECT COUNT(*) FROM "Empresa" WHERE DATE_TRUNC('month', NOW()) = DATE_TRUNC('month', created_at)`);
        const novasEmpresasMes = parseInt(empresasResult.rows[0].count, 10) || 0;
        // Buscar usuário atualizado do banco, incluindo foto
        const userId = req.user?.id;
        let user = null;
        if (userId) {
            const userResult = await database_1.default.query('SELECT id, nome, email, foto, is_superuser, empresa_id, nivel FROM "Usuario" WHERE id = $1', [userId]);
            if ((userResult.rowCount || 0) > 0) {
                user = {
                    ...userResult.rows[0],
                    is_superuser: !!userResult.rows[0].is_superuser
                };
            }
        }
        res.json({
            message: 'Bem-vindo ao painel root!',
            user,
            stats: {
                usuarios: 0, // Preencher com dados reais depois
                empresas: 0,
                faturamento: 0,
                novasEmpresasMes
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar métricas.' });
    }
});
//# sourceMappingURL=root.js.map