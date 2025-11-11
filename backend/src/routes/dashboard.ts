import { Router } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();
const dashboardController = new DashboardController();

// GET /api/dashboard/stats - Buscar estatísticas do dashboard
router.get('/stats', authenticateJWT, (req: AuthRequest, res) => dashboardController.getStats(req, res));

export { router as dashboardRoutes };