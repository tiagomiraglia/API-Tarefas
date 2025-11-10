import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class TagController {
  // Listar tags da empresa (ativas)
  async listTags(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.user?.empresa_id;
      if (!empresaId) {
        return res.status(400).json({ error: 'Empresa não identificada' });
      }

      const tags = await (prisma as any).tag.findMany({
        where: {
          empresa_id: empresaId,
          ativo: true
        },
        orderBy: {
          ordem: 'asc'
        }
      });

      res.json(tags);
    } catch (error) {
      console.error('Erro ao listar tags:', error);
      res.status(500).json({ error: 'Erro ao listar tags' });
    }
  }

  // Criar tag (apenas admin)
  async createTag(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.user?.empresa_id;
      const { nome, cor, icone, ordem } = req.body;

      if (!empresaId) {
        return res.status(400).json({ error: 'Empresa não identificada' });
      }

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const tag = await (prisma as any).tag.create({
        data: {
          empresa_id: empresaId,
          nome,
          cor: cor || '#6366f1',
          icone: icone || 'tag',
          ativo: true,
          ordem: ordem || 0
        }
      });

      res.status(201).json(tag);
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      res.status(500).json({ error: 'Erro ao criar tag' });
    }
  }

  // Atualizar tag (apenas admin)
  async updateTag(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresa_id;
      const { nome, cor, icone, ativo, ordem } = req.body;

      if (!empresaId) {
        return res.status(400).json({ error: 'Empresa não identificada' });
      }

      // Verificar se a tag pertence à empresa
      const tagExistente = await (prisma as any).tag.findFirst({
        where: {
          id: Number(id),
          empresa_id: empresaId
        }
      });

      if (!tagExistente) {
        return res.status(404).json({ error: 'Tag não encontrada' });
      }

      const tag = await (prisma as any).tag.update({
        where: { id: Number(id) },
        data: {
          ...(nome !== undefined && { nome }),
          ...(cor !== undefined && { cor }),
          ...(icone !== undefined && { icone }),
          ...(ativo !== undefined && { ativo }),
          ...(ordem !== undefined && { ordem })
        }
      });

      res.json(tag);
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      res.status(500).json({ error: 'Erro ao atualizar tag' });
    }
  }

  // Deletar tag (apenas admin) - soft delete
  async deleteTag(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresa_id;

      if (!empresaId) {
        return res.status(400).json({ error: 'Empresa não identificada' });
      }

      // Verificar se a tag pertence à empresa
      const tagExistente = await (prisma as any).tag.findFirst({
        where: {
          id: Number(id),
          empresa_id: empresaId
        }
      });

      if (!tagExistente) {
        return res.status(404).json({ error: 'Tag não encontrada' });
      }

      // Soft delete
      await (prisma as any).tag.update({
        where: { id: Number(id) },
        data: { ativo: false }
      });

      res.json({ message: 'Tag desativada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      res.status(500).json({ error: 'Erro ao deletar tag' });
    }
  }
}
