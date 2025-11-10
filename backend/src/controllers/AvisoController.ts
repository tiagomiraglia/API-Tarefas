import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AvisoController {
  // GET /api/avisos/ativo
  async getAvisoAtivo(req: Request, res: Response) {
    try {
      // Se não houver autenticação, retorna apenas globais
      let userId = null;
      let nivel = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
          nivel = decoded.nivel;
        } catch {}
      }
      let where: any = { ativo: true };
      if (userId && nivel) {
        where = {
          ativo: true,
          OR: [
            { destinatario_id: null, destinatario_nivel: null }, // global
            { destinatario_id: userId }, // usuário específico
            { destinatario_id: null, destinatario_nivel: nivel } // grupo
          ]
        };
      } else {
        // Não autenticado: só globais
        where = { ativo: true, destinatario_id: null, destinatario_nivel: null };
      }
      const avisos = await prisma.aviso.findMany({ where, orderBy: { data_criacao: 'desc' } });
      return res.json({ avisos });
    } catch (error) {
      console.error('Erro ao buscar avisos ativos:', error);
      return res.status(500).json({ error: 'Erro ao buscar avisos' });
    }
  }

  // POST /api/avisos/visualizacao (registrar visualização)
  async registrarVisualizacao(req: Request, res: Response) {
    try {
      const { avisoIds } = req.body;
      const userId = (req as any).user?.id;
      if (!userId || !Array.isArray(avisoIds)) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      // Registra visualização para cada aviso
      for (const avisoId of avisoIds) {
        // Verifica se já existe visualização
        const exists = await prisma.avisoVisualizacao.findFirst({
          where: {
            usuario_id: userId,
            aviso_id: avisoId
          }
        });
        
        if (!exists) {
          await prisma.avisoVisualizacao.create({
            data: {
              usuario_id: userId,
              aviso_id: avisoId
            }
          });
        }
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
      return res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
  }

  // GET /api/avisos/visualizacao/:id (listar visualizações de um aviso)
  async getVisualizacoes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const visualizacoes = await prisma.avisoVisualizacao.findMany({
        where: { aviso_id: Number(id) },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              nivel: true
            }
          }
        },
        orderBy: { visualizado_em: 'desc' }
      });
      return res.json({ visualizacoes });
    } catch (error) {
      console.error('Erro ao buscar visualizações:', error);
      return res.status(500).json({ error: 'Erro ao buscar visualizações' });
    }
  }

  // POST /api/avisos (criar ou atualizar aviso)
  async setAviso(req: Request, res: Response) {
    try {
      const { mensagem, ativo, data_expiracao, destinatario_id, destinatario_nivel } = req.body;
      // Permitir apenas um aviso ativo global (sem destinatário)
      if (ativo && !destinatario_id && !destinatario_nivel) {
        await prisma.aviso.updateMany({ data: { ativo: false }, where: { ativo: true, destinatario_id: null, destinatario_nivel: null } });
      }
      let aviso;
      // Se já existe aviso ativo global, atualiza, senão cria
      if (ativo && !destinatario_id && !destinatario_nivel) {
        aviso = await prisma.aviso.findFirst({ where: { ativo: true, destinatario_id: null, destinatario_nivel: null } });
      } else {
        aviso = null;
      }
      if (aviso) {
        aviso = await prisma.aviso.update({
          where: { id: aviso.id },
          data: { mensagem, ativo, data_expiracao, destinatario_id, destinatario_nivel },
        });
      } else {
        aviso = await prisma.aviso.create({
          data: { mensagem, ativo, data_expiracao, destinatario_id, destinatario_nivel },
        });
      }
      return res.json({ aviso });
    } catch (error) {
      console.error('Erro ao definir aviso:', error);
      return res.status(500).json({ error: 'Erro ao definir aviso' });
    }
  }

  // GET /api/avisos (listar todos)
  async listAvisos(req: Request, res: Response) {
    try {
      const avisos = await prisma.aviso.findMany({ orderBy: { data_criacao: 'desc' } });
      return res.json({ avisos });
    } catch (error) {
      console.error('Erro ao listar avisos:', error);
      return res.status(500).json({ error: 'Erro ao listar avisos' });
    }
  }

  // PATCH /api/avisos/:id (editar aviso)
  async editAviso(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mensagem, ativo, data_expiracao, destinatario_id, destinatario_nivel } = req.body;
      let aviso = await prisma.aviso.findUnique({ where: { id: Number(id) } });
      if (!aviso) return res.status(404).json({ error: 'Aviso não encontrado' });
      // Se ativar um aviso global, desativa outros avisos globais ativos
      if (ativo && !destinatario_id && !destinatario_nivel) {
        await prisma.aviso.updateMany({ 
          data: { ativo: false }, 
          where: { 
            ativo: true, 
            destinatario_id: null, 
            destinatario_nivel: null,
            NOT: { id: Number(id) }
          } 
        });
      }
      aviso = await prisma.aviso.update({
        where: { id: Number(id) },
        data: { mensagem, ativo, data_expiracao, destinatario_id, destinatario_nivel },
      });
      return res.json({ aviso });
    } catch (error) {
      console.error('Erro ao editar aviso:', error);
      return res.status(500).json({ error: 'Erro ao editar aviso' });
    }
  }

  // PATCH /api/avisos/:id/suspender (suspender aviso)
  async suspendAviso(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let aviso = await prisma.aviso.findUnique({ where: { id: Number(id) } });
      if (!aviso) return res.status(404).json({ error: 'Aviso não encontrado' });
      aviso = await prisma.aviso.update({
        where: { id: Number(id) },
        data: { ativo: false },
      });
      return res.json({ aviso });
    } catch (error) {
      console.error('Erro ao suspender aviso:', error);
      return res.status(500).json({ error: 'Erro ao suspender aviso' });
    }
  }

  // DELETE /api/avisos/:id (excluir aviso)
  async deleteAviso(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let aviso = await prisma.aviso.findUnique({ where: { id: Number(id) } });
      if (!aviso) return res.status(404).json({ error: 'Aviso não encontrado' });
      // Remove visualizações relacionadas antes de deletar o aviso
      await prisma.avisoVisualizacao.deleteMany({ where: { aviso_id: Number(id) } });
      await prisma.aviso.delete({ where: { id: Number(id) } });
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir aviso:', error);
      return res.status(500).json({ error: 'Erro ao excluir aviso' });
    }
  }
}
