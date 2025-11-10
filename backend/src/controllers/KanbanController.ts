import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any; // Temporário até TypeScript Server recarregar

// Tipagem customizada para req.user
interface AuthRequest extends Request {
  user?: any;
}

export class KanbanController {
  // ABAS
  async listAbas(req: AuthRequest, res: Response) {
    const empresaId = Number(req.query.empresaId || req.user?.empresa_id);
    if (!empresaId || isNaN(empresaId)) {
      return res.status(400).json({ message: 'empresaId não informado ou inválido no token ou query.' });
    }
    try {
      const abas = await prisma.aba.findMany({
        where: { empresa_id: empresaId },
        orderBy: { ordem: 'asc' },
        include: { colunas: { orderBy: { ordem: 'asc' } } },
      });
      res.json(abas);
    } catch (error) {
      console.error('Erro ao buscar abas do Kanban:', error);
      res.status(500).json({ message: 'Erro interno ao buscar abas do Kanban.' });
    }
  }

  async createAba(req: AuthRequest, res: Response) {
    const { nome, ordem } = req.body;
    const empresaId = req.user?.empresa_id;
    if (!nome || !empresaId) return res.status(400).json({ message: 'Nome e empresa obrigatórios.' });
  const aba = await prisma.aba.create({
      data: { nome, ordem: ordem || 0, empresa_id: empresaId },
    });
    res.status(201).json(aba);
  }

  async updateAba(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { nome, ordem } = req.body;
  const aba = await prisma.aba.update({
      where: { id: Number(id) },
      data: { nome, ordem },
    });
    res.json(aba);
  }

  async deleteAba(req: AuthRequest, res: Response) {
    const { id } = req.params;
  await prisma.aba.delete({ where: { id: Number(id) } });
  res.json({ message: 'Aba removida' });
  }

  // COLUNAS
  async createColuna(req: AuthRequest, res: Response) {
    const { nome, ordem, aba_id, recebe_whats } = req.body;
    if (!nome || !aba_id) return res.status(400).json({ message: 'Nome e aba obrigatórios.' });
  const coluna = await prisma.coluna.create({
      data: { nome, ordem: ordem || 0, aba_id, recebe_whats: !!recebe_whats },
    });
    res.status(201).json(coluna);
  }

  async updateColuna(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { nome, ordem, recebe_whats } = req.body;
  const coluna = await prisma.coluna.update({
      where: { id: Number(id) },
      data: { nome, ordem, recebe_whats },
    });
    res.json(coluna);
  }

  async deleteColuna(req: AuthRequest, res: Response) {
    const { id } = req.params;
  await prisma.coluna.delete({ where: { id: Number(id) } });
  res.json({ message: 'Coluna removida' });
  }

  // Definir coluna padrão para WhatsApp
  async setColunaWhats(req: AuthRequest, res: Response) {
    const { colunaId } = req.body;
    // Remove flag de todas as colunas da mesma aba
  const coluna = await prisma.coluna.findUnique({ where: { id: colunaId } });
  if (!coluna) return res.status(404).json({ message: 'Coluna não encontrada' });
  await prisma.coluna.updateMany({ where: { aba_id: coluna.aba_id }, data: { recebe_whats: false } });
  await prisma.coluna.update({ where: { id: colunaId }, data: { recebe_whats: true } });
  res.json({ message: 'Coluna configurada para receber mensagens do WhatsApp.' });
  }

  // CARTÕES
  async listCartoes(req: AuthRequest, res: Response) {
    const { colunaId, abaId } = req.query;
    const empresaId = req.user?.empresa_id;
    const userId = req.user?.id;
    const isAdmin = req.user?.nivel === 'admin' || req.user?.nivel === 'superadmin' || req.user?.is_superuser;
    
    try {
      const where: any = {};
      if (colunaId) {
        where.coluna_id = Number(colunaId);
      } else if (abaId) {
        where.coluna = { aba_id: Number(abaId) };
      } else if (empresaId) {
        where.coluna = { aba: { empresa_id: empresaId } };
      }

      // FILTRO POR ATENDENTE: Se não for admin, mostrar apenas cartões do atendente
      if (!isAdmin && userId) {
        where.OR = [
          { atendente_responsavel_id: userId },
          { atendente_responsavel_id: null }, // Cartões sem atendente (livres)
          { created_by_id: userId } // Cartões criados pelo usuário
        ];
      }

      const cartoes = await prisma.cartao.findMany({
        where,
        orderBy: { ordem: 'asc' },
        include: {
          usuario_atribuido: { select: { id: true, nome: true, foto: true } },
          atendente_responsavel: { select: { id: true, nome: true, foto: true } },
          whatsapp: { select: { id: true, conversa_id: true, conversa_nome: true } },
          _count: { select: { anexos: true, historico: true, transferencias: true } }
        }
      });
      res.json(cartoes);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      res.status(500).json({ message: 'Erro ao buscar cartões' });
    }
  }

  async getCartao(req: AuthRequest, res: Response) {
    const { id } = req.params;
    try {
      const cartao = await prisma.cartao.findUnique({
        where: { id: Number(id) },
        include: {
          usuario_atribuido: { select: { id: true, nome: true, foto: true } },
          coluna: { include: { aba: true } },
          whatsapp: {
            include: {
              mensagens: { orderBy: { timestamp: 'asc' }, take: 50 }
            }
          },
          historico: {
            include: { usuario: { select: { id: true, nome: true } } },
            orderBy: { created_at: 'desc' },
            take: 20
          },
          anexos: { orderBy: { created_at: 'desc' } }
        }
      });
      if (!cartao) return res.status(404).json({ message: 'Cartão não encontrado' });
      res.json(cartao);
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      res.status(500).json({ message: 'Erro ao buscar cartão' });
    }
  }

  async createCartao(req: AuthRequest, res: Response) {
    const { titulo, descricao, coluna_id, usuario_atribuido_id, data_vencimento, etiquetas, cor } = req.body;
    const userId = req.user?.id;
    if (!titulo || !coluna_id) return res.status(400).json({ message: 'Título e coluna obrigatórios' });
    try {
      // Buscar a maior ordem na coluna
      const maxOrdem = await prisma.cartao.aggregate({
        where: { coluna_id },
        _max: { ordem: true }
      });
      const cartao = await prisma.cartao.create({
        data: {
          titulo,
          descricao,
          coluna_id,
          usuario_atribuido_id,
          data_vencimento: data_vencimento ? new Date(data_vencimento) : null,
          etiquetas: etiquetas || [],
          cor: cor || '#ffffff',
          ordem: (maxOrdem._max.ordem || 0) + 1,
          created_by_id: userId,
          historico: {
            create: {
              usuario_id: userId,
              acao: 'criou',
              descricao: 'Cartão criado'
            }
          }
        },
        include: {
          usuario_atribuido: { select: { id: true, nome: true, foto: true } }
        }
      });
      res.status(201).json(cartao);
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      res.status(500).json({ message: 'Erro ao criar cartão' });
    }
  }

  async updateCartao(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { 
      titulo, 
      descricao, 
      usuario_atribuido_id, 
      data_vencimento, 
      etiquetas, 
      checklist, 
      cor,
      status_atendimento,
      valor_orcamento,
      anotacoes
    } = req.body;
    const userId = req.user?.id;
    try {
      const cartao = await prisma.cartao.update({
        where: { id: Number(id) },
        data: {
          ...(titulo !== undefined && { titulo }),
          ...(descricao !== undefined && { descricao }),
          ...(usuario_atribuido_id !== undefined && { usuario_atribuido_id }),
          ...(data_vencimento !== undefined && { 
            data_vencimento: data_vencimento ? new Date(data_vencimento) : null 
          }),
          ...(etiquetas !== undefined && { etiquetas }),
          ...(checklist !== undefined && { checklist }),
          ...(cor !== undefined && { cor }),
          ...(status_atendimento !== undefined && { status_atendimento }),
          ...(valor_orcamento !== undefined && { valor_orcamento }),
          ...(anotacoes !== undefined && { anotacoes }),
          historico: {
            create: {
              usuario_id: userId,
              acao: 'editou',
              descricao: 'Cartão atualizado'
            }
          }
        },
        include: {
          usuario_atribuido: { select: { id: true, nome: true, foto: true } }
        }
      });
      res.json(cartao);
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      res.status(500).json({ message: 'Erro ao atualizar cartão' });
    }
  }

  async moveCartao(req: AuthRequest, res: Response) {
    const { cartaoId, destino_coluna_id, nova_ordem } = req.body;
    const userId = req.user?.id;
    try {
      const cartao = await prisma.cartao.findUnique({ where: { id: cartaoId }, include: { coluna: true } });
      if (!cartao) return res.status(404).json({ message: 'Cartão não encontrado' });
      
      const origem_coluna_id = cartao.coluna_id;
      
      // Atualizar cartão
      await prisma.cartao.update({
        where: { id: cartaoId },
        data: {
          coluna_id: destino_coluna_id,
          ordem: nova_ordem || 0,
          historico: {
            create: {
              usuario_id: userId,
              acao: 'moveu',
              descricao: `Moveu cartão para outra coluna`,
              de_coluna_id: origem_coluna_id,
              para_coluna_id: destino_coluna_id
            }
          }
        }
      });
      
      res.json({ message: 'Cartão movido com sucesso' });
    } catch (error) {
      console.error('Erro ao mover cartão:', error);
      res.status(500).json({ message: 'Erro ao mover cartão' });
    }
  }

  async deleteCartao(req: AuthRequest, res: Response) {
    const { id } = req.params;
    try {
      await prisma.cartao.delete({ where: { id: Number(id) } });
      res.json({ message: 'Cartão removido' });
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      res.status(500).json({ message: 'Erro ao deletar cartão' });
    }
  }

  // VINCULAÇÃO WHATSAPP
  async vincularWhatsApp(req: AuthRequest, res: Response) {
    const { cartaoId, conversaId, conversaNome } = req.body;
    try {
      const whatsapp = await prisma.cartaoWhatsApp.upsert({
        where: { cartao_id: cartaoId },
        update: { conversa_id: conversaId, conversa_nome: conversaNome },
        create: { cartao_id: cartaoId, conversa_id: conversaId, conversa_nome: conversaNome }
      });
      res.json(whatsapp);
    } catch (error) {
      console.error('Erro ao vincular WhatsApp:', error);
      res.status(500).json({ message: 'Erro ao vincular WhatsApp' });
    }
  }

  async desvincularWhatsApp(req: AuthRequest, res: Response) {
    const { cartaoId } = req.body;
    try {
      await prisma.cartaoWhatsApp.delete({ where: { cartao_id: cartaoId } });
      res.json({ message: 'WhatsApp desvinculado' });
    } catch (error) {
      console.error('Erro ao desvincular WhatsApp:', error);
      res.status(500).json({ message: 'Erro ao desvincular WhatsApp' });
    }
  }

  // MONITORAMENTO INTELIGENTE
  async getMonitoramento(req: AuthRequest, res: Response) {
    const empresaId = Number(req.query.empresaId || req.user?.empresa_id);
    if (!empresaId || isNaN(empresaId)) {
      return res.status(400).json({ message: 'empresaId não informado ou inválido.' });
    }

    try {
      // Buscar estrutura completa do Kanban
      const abas = await prisma.aba.findMany({
        where: { empresa_id: empresaId },
        orderBy: { ordem: 'asc' },
        include: {
          colunas: {
            orderBy: { ordem: 'asc' },
            include: {
              _count: {
                select: { cartoes: true }
              }
            }
          }
        }
      });

      // Buscar todos os usuários da empresa
      const usuarios = await prisma.usuario.findMany({
        where: { empresa_id: empresaId },
        select: {
          id: true,
          nome: true,
          email: true,
          foto: true,
          nivel: true,
          permissoes: true
        }
      });

      // Processar permissões de cada usuário
      const usuariosComPermissoes = usuarios.map((usuario: any) => {
        let permissoes: any = usuario.permissoes;
        if (!permissoes || typeof permissoes !== 'object') {
          try {
            permissoes = permissoes ? JSON.parse(permissoes) : {};
          } catch {
            permissoes = {};
          }
        }

        return {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          foto: usuario.foto,
          nivel: usuario.nivel,
          permissoesKanban: permissoes.kanban || { abas: [] }
        };
      });

      // Estatísticas gerais
      const totalCartoes = await prisma.cartao.count({
        where: {
          coluna: {
            aba: {
              empresa_id: empresaId
            }
          }
        }
      });

      const totalUsuarios = usuarios.length;
      const usuariosComAcesso = usuariosComPermissoes.filter(
        (u: any) => u.nivel === 'superadmin' || u.nivel === 'admin' || (u.permissoesKanban.abas && u.permissoesKanban.abas.length > 0)
      ).length;

      res.json({
        estrutura: abas,
        usuarios: usuariosComPermissoes,
        estatisticas: {
          totalAbas: abas.length,
          totalColunas: abas.reduce((acc: number, aba: any) => acc + aba.colunas.length, 0),
          totalCartoes,
          totalUsuarios,
          usuariosComAcesso
        }
      });
    } catch (error) {
      console.error('Erro ao buscar monitoramento:', error);
      res.status(500).json({ message: 'Erro ao buscar monitoramento do Kanban.' });
    }
  }
}
