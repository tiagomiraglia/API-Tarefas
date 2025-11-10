import { Router, Response } from 'express';
import { authenticateJWT, requireSuperuser, AuthRequest } from '../middleware/auth';

const router = Router();

// Endpoint protegido para superusuário
import pool from '../database/database';

router.get('/', authenticateJWT, requireSuperuser, async (req: AuthRequest, res: Response) => {
  try {
    // Novas empresas do mês atual
    const empresasResult = await pool.query(
      `SELECT COUNT(*) FROM "Empresa" WHERE DATE_TRUNC('month', NOW()) = DATE_TRUNC('month', created_at)`
    );
    const novasEmpresasMes = parseInt(empresasResult.rows[0].count, 10) || 0;

    // Buscar usuário atualizado do banco, incluindo foto
    const userId = req.user?.id;
    let user = null;
    if (userId) {
      const userResult = await pool.query('SELECT id, nome, email, foto, is_superuser, empresa_id, nivel FROM "Usuario" WHERE id = $1', [userId]);
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
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar métricas.' });
  }
});

export { router as rootRoutes };
