import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../database/database';

export class DashboardController {
  // GET /api/dashboard/stats
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const empresaId = req.user?.empresa_id;
      if (!empresaId) {
        res.status(403).json({ message: 'Empresa não identificada.' });
        return;
      }

      // 1. Mensagens hoje - contar mensagens recebidas hoje
      const mensagensHojeResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM "MensagemWhatsApp" m
        JOIN "CartaoWhatsApp" cw ON m.cartao_whatsapp_id = cw.id
        JOIN "Cartao" c ON cw.cartao_id = c.id
        WHERE c.empresa_id = $1
        AND DATE(m.timestamp) = CURRENT_DATE
        AND m.is_from_me = false
      `, [empresaId]);

      const mensagensHoje = parseInt(mensagensHojeResult.rows[0].total, 10) || 0;

      // 2. Atendimentos - contar cartões criados hoje
      const atendimentosHojeResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM "Cartao"
        WHERE empresa_id = $1
        AND DATE(created_at) = CURRENT_DATE
      `, [empresaId]);

      const atendimentosHoje = parseInt(atendimentosHojeResult.rows[0].total, 10) || 0;

      // 3. Tempo médio - calcular tempo médio entre criação e finalização dos cartões
      const tempoMedioResult = await pool.query(`
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as horas_medias
        FROM "Cartao"
        WHERE empresa_id = $1
        AND status_atendimento IN ('resolvido', 'finalizado')
        AND updated_at > created_at
        AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '30 days'
      `, [empresaId]);

      const tempoMedioHoras = parseFloat(tempoMedioResult.rows[0].horas_medias) || 0;
      let tempoMedioFormatado = '--';

      if (tempoMedioHoras > 0) {
        if (tempoMedioHoras < 1) {
          // Menos de 1 hora, mostrar em minutos
          const minutos = Math.round(tempoMedioHoras * 60);
          tempoMedioFormatado = `${minutos}m`;
        } else if (tempoMedioHoras < 24) {
          // Menos de 24 horas, mostrar em horas
          tempoMedioFormatado = `${Math.round(tempoMedioHoras)}h`;
        } else {
          // Mais de 24 horas, mostrar em dias
          const dias = Math.round(tempoMedioHoras / 24);
          tempoMedioFormatado = `${dias}d`;
        }
      }

      res.json({
        mensagensHoje,
        atendimentosHoje,
        tempoMedio: tempoMedioFormatado,
        tempoMedioHoras // para cálculos futuros
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}