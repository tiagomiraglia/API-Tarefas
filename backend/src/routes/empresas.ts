
import { Router } from 'express';
import pool from '../database/database';
import { CompanyController } from '../controllers/CompanyController';

const router = Router();

const companyController = new CompanyController();

// GET /api/empresas

router.get('/', async (req, res) => {
  try {
    // Se usuário logado for superuser, retorna todas as empresas
    // Lista todas as empresas cadastradas, sem filtro por usuários
  const result = await pool.query('SELECT id, nome, cnpj, created_at, status FROM "Empresa"');
    res.json({ empresas: result.rows });
  } catch (error) {
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

export { router as empresasRoutes };