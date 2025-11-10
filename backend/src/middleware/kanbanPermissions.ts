import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// Verifica se o usuário tem permissão para acessar uma aba
export async function verificarPermissaoAba(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const abaId = Number(req.params.abaId || req.query.abaId || req.body.aba_id);

  if (!userId || !abaId) {
    return res.status(400).json({ message: 'Usuário ou aba não informado' });
  }

  try {
    // Verificar se o usuário é admin ou superuser
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (usuario?.is_superuser || usuario?.nivel === 'admin') {
      return next();
    }

    // Verificar permissão específica
    const permissao = await prisma.permissaoKanban.findFirst({
      where: {
        usuario_id: userId,
        aba_id: abaId
      }
    });

    if (!permissao) {
      return res.status(403).json({ message: 'Sem permissão para acessar esta aba' });
    }

    // Adicionar permissão no request para uso posterior
    (req as any).kanbanPermissao = permissao;
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ message: 'Erro ao verificar permissão' });
  }
}

// Verifica se o usuário tem permissão para acessar uma coluna
export async function verificarPermissaoColuna(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const colunaId = Number(req.params.colunaId || req.query.colunaId || req.body.coluna_id || req.body.destino_coluna_id);

  if (!userId || !colunaId) {
    return res.status(400).json({ message: 'Usuário ou coluna não informado' });
  }

  try {
    // Verificar se o usuário é admin ou superuser
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (usuario?.is_superuser || usuario?.nivel === 'admin') {
      return next();
    }

    // Buscar a aba da coluna
    const coluna = await prisma.coluna.findUnique({
      where: { id: colunaId },
      include: { aba: true }
    });

    if (!coluna) {
      return res.status(404).json({ message: 'Coluna não encontrada' });
    }

    // Verificar permissão específica para a coluna
    const permissaoColuna = await prisma.permissaoKanban.findFirst({
      where: {
        usuario_id: userId,
        aba_id: coluna.aba_id,
        coluna_id: colunaId
      }
    });

    // Ou permissão geral para a aba
    const permissaoAba = await prisma.permissaoKanban.findFirst({
      where: {
        usuario_id: userId,
        aba_id: coluna.aba_id,
        coluna_id: null
      }
    });

    if (!permissaoColuna && !permissaoAba) {
      return res.status(403).json({ message: 'Sem permissão para acessar esta coluna' });
    }

    // Adicionar permissão no request
    (req as any).kanbanPermissao = permissaoColuna || permissaoAba;
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ message: 'Erro ao verificar permissão' });
  }
}

// Verifica se o usuário pode editar (não apenas visualizar)
export async function verificarPermissaoEdicao(req: AuthRequest, res: Response, next: NextFunction) {
  const permissao = (req as any).kanbanPermissao;
  const usuario = req.user;

  if (usuario?.is_superuser || usuario?.nivel === 'admin') {
    return next();
  }

  if (!permissao || permissao.tipo === 'visualizar') {
    return res.status(403).json({ message: 'Sem permissão para editar' });
  }

  next();
}

// Verifica se o usuário pode mover cartões
export async function verificarPermissaoMover(req: AuthRequest, res: Response, next: NextFunction) {
  const permissao = (req as any).kanbanPermissao;
  const usuario = req.user;

  if (usuario?.is_superuser || usuario?.nivel === 'admin') {
    return next();
  }

  if (!permissao || !['mover', 'editar', 'admin'].includes(permissao.tipo)) {
    return res.status(403).json({ message: 'Sem permissão para mover cartões' });
  }

  next();
}
