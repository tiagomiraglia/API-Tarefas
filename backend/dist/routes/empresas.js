"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.empresasRoutes = void 0;
const express_1 = require("express");
const database_1 = __importDefault(require("../database/database"));
const CompanyController_1 = require("../controllers/CompanyController");
const router = (0, express_1.Router)();
exports.empresasRoutes = router;
const companyController = new CompanyController_1.CompanyController();
// GET /api/empresas
router.get('/', async (req, res) => {
    try {
        // Se usuário logado for superuser, retorna todas as empresas
        // Lista todas as empresas cadastradas, sem filtro por usuários
        const result = await database_1.default.query('SELECT id, nome, cnpj, created_at, status FROM "Empresa"');
        res.json({ empresas: result.rows });
    }
    catch (error) {
        console.error('Erro ao buscar empresas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// GET /api/empresas/:id
router.get('/:id', companyController.getCompanyById);
// PUT /api/empresas/:id
router.put('/:id', companyController.updateCompany);
// PATCH /api/empresas/:id/suspender
router.patch('/:id/suspender', companyController.suspendCompany);
// PATCH /api/empresas/:id/reativar
router.patch('/:id/reativar', companyController.reactivateCompany);
// DELETE /api/empresas/:id
router.delete('/:id', companyController.deleteCompany);
//# sourceMappingURL=empresas.js.map