import { Router, Request, Response } from 'express';
import * as whatsappService from '../services/whatsappWebJsService';
import { authenticateJWT } from '../../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Integração WebSocket: emitir QR code/status em tempo real
let io: any = null;
export function setSocketIO(socketIOInstance: any) {
  io = socketIOInstance;
}

function emitSessionUpdate(session_id: string, data: any) {
  if (io) {
    io.to(session_id).emit('whatsapp-session-update', { session_id, ...data });
  }
}
// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateJWT);

// Middleware para obter empresa_id do usuário autenticado
async function getEmpresaId(req: Request): Promise<number | null> {
  const userId = (req as any).user?.id;
  if (!userId) return null;

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { empresa_id: true }
    });
    return user?.empresa_id || null;
  } catch (error) {
    console.error('Erro ao buscar empresa_id:', error);
    return null;
  }
}

/**
 * POST /api/whatsapp/sessions
 * Criar nova sessão WhatsApp
 * Body: { telefone?: string } - telefone é opcional, será detectado ao conectar
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
    const { telefone } = req.body;
  const result = await whatsappService.startSession(empresaId, telefone, emitSessionUpdate);
    emitSessionUpdate(result.sessionId, {
      status: result.status,
      qr: result.qr,
      message: 'Sessão criada com sucesso'
    });
    res.json({
      success: true,
      message: 'Sessão criada com sucesso',
      session_id: result.sessionId,
      status: result.status,
      qr: result.qr
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar sessão:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar sessão' });
  }
});

/**
 * GET /api/whatsapp/sessions
 * Listar sessões da empresa
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const sessions = whatsappService.listEmpresaSessions(empresaId);
    res.json({ sessions });
  } catch (error: any) {
    console.error('❌ Erro ao listar sessões:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar sessões' });
  }
});

/**
 * GET /api/whatsapp/sessions/:sessionId/qr
 * Obter QR Code de uma sessão
 */
router.get('/sessions/:sessionId/qr', async (req: Request, res: Response) => {
  try {
    const session_id = req.params.sessionId;
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const parsed = whatsappService.parseSessionId(session_id);
    if (parsed && parsed.empresaId !== empresaId && !(req as any).user?.is_superuser) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  const qr = whatsappService.getSessionQR(session_id);
  const status = whatsappService.getSessionStatus(session_id);
  emitSessionUpdate(session_id, { qr, status });
  res.json({ qr, status, session_id });
  } catch (error: any) {
    console.error('Erro ao obter QR:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter QR' });
  }
});

/**
 * GET /api/whatsapp/sessions/:sessionId/status
 * Obter status de uma sessão
 */
router.get('/sessions/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const session_id = req.params.sessionId;
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const parsed = whatsappService.parseSessionId(session_id);
    if (parsed && parsed.empresaId !== empresaId && !(req as any).user?.is_superuser) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  const status = whatsappService.getSessionStatus(session_id);
  const qr = whatsappService.getSessionQR(session_id);
  emitSessionUpdate(session_id, { status, hasQR: !!qr });
  res.json({ session_id, status, hasQR: !!qr });
  } catch (error: any) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter status' });
  }
});

/**
 * DELETE /api/whatsapp/sessions/:sessionId
 * Desconectar/excluir sessão
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session_id = req.params.sessionId;
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const parsed = whatsappService.parseSessionId(session_id);
    if (parsed && parsed.empresaId !== empresaId && !(req as any).user?.is_superuser) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  const success = await whatsappService.disconnectSession(session_id);
  emitSessionUpdate(session_id, { status: 'disconnected', message: 'Sessão desconectada' });
  res.json({ success, message: 'Sessão desconectada' });
  } catch (error: any) {
    console.error('Erro ao desconectar sessão:', error);
    res.status(500).json({ error: error.message || 'Erro ao desconectar sessão' });
  }
});

/**
 * POST /api/whatsapp/sessions/:sessionId/send
 * Enviar mensagem
 */
router.post('/sessions/:sessionId/send', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { to, message } = req.body;
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const parsed = whatsappService.parseSessionId(sessionId);
    if (parsed && parsed.empresaId !== empresaId && !(req as any).user?.is_superuser) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    if (!to || !message) {
      return res.status(400).json({ error: 'Campos "to" e "message" são obrigatórios' });
    }
  const result = await whatsappService.sendMessage(sessionId, to, message);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
  }
});

/**
 * DELETE /api/whatsapp/sessions/all
 * Desconectar todas as sessões da empresa
 */
router.delete('/sessions/all', async (req: Request, res: Response) => {
  try {
    let empresaId = await getEmpresaId(req);
    if (!empresaId) {
      if (!(req as any).user?.is_superuser) {
        return res.status(403).json({ error: 'Empresa não identificada' });
      }
      empresaId = 1; // default for superuser
    }
  const disconnected = await whatsappService.disconnectAllEmpresaSessions(empresaId);
    res.json({ success: true, disconnected, message: `${disconnected} sessões desconectadas` });
  } catch (error: any) {
    console.error('Erro ao desconectar todas as sessões:', error);
    res.status(500).json({ error: error.message || 'Erro ao desconectar sessões' });
  }
});

export default router;
