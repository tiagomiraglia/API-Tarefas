"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaAdminController = void 0;
const database_1 = __importDefault(require("../database/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class EmpresaAdminController {
    // POST /api/auth/empresa-admin
    async criarEmpresaEAdmin(req, res) {
        try {
            const { nomeEmpresa, cnpj, nomeAdmin, emailAdmin, senhaAdmin } = req.body;
            if (!nomeEmpresa || !cnpj || !nomeAdmin || !emailAdmin || !senhaAdmin) {
                res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
                return;
            }
            // Cria empresa
            let empresaId;
            try {
                const empresaResult = await database_1.default.query('INSERT INTO "Empresa" (nome, cnpj) VALUES ($1, $2) RETURNING id', [nomeEmpresa, cnpj]);
                empresaId = empresaResult.rows[0].id;
            }
            catch (err) {
                if (err.code === '23505') {
                    res.status(400).json({ message: 'CNPJ já cadastrado.' });
                    return;
                }
                throw err;
            }
            // Cria usuário admin
            const hash = await bcryptjs_1.default.hash(senhaAdmin, 10);
            await database_1.default.query('INSERT INTO "Usuario" (nome, email, senha, empresa_id, is_superuser, nivel) VALUES ($1, $2, $3, $4, $5, $6)', [nomeAdmin, emailAdmin, hash, empresaId, false, 'admin']);
            res.status(201).json({ message: 'Empresa e usuário administrador cadastrados com sucesso!' });
        }
        catch (error) {
            console.error('Erro ao cadastrar empresa/admin:', error);
            res.status(500).json({ message: 'Erro ao cadastrar empresa/admin.' });
        }
    }
}
exports.EmpresaAdminController = EmpresaAdminController;
//# sourceMappingURL=EmpresaAdminController.js.map