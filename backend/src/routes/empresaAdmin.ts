import { Router } from 'express';
import { EmpresaAdminController } from '../controllers/EmpresaAdminController';

const router = Router();
const empresaAdminController = new EmpresaAdminController();

// POST /api/auth/empresa-admin
router.post('/empresa-admin', empresaAdminController.criarEmpresaEAdmin.bind(empresaAdminController));

export { router as empresaAdminRoutes };