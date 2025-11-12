/**
 * Rotas para gerenciamento de conexões WhatsApp usando Baileys
 * 
 * IMPORTANTE: 
 * - Cada empresa pode ter APENAS 1 número WhatsApp conectado por vez
 * - O Baileys está integrado ao backend (não é servidor separado)
 * - Sessões são isoladas por empresa (multi-tenant seguro)
 * - Conformidade total com políticas Meta/WhatsApp
 * 
 * Endpoints:
 * - POST /api/whatsapp/sessions - Criar nova sessão (1 por empresa)
 * - GET /api/whatsapp/sessions - Listar sessão da empresa
 * - GET /api/whatsapp/sessions/:id/qr - Obter QR Code
 * - DELETE /api/whatsapp/sessions/:id - Desconectar sessão
 * - DELETE /api/whatsapp/sessions/all - Limpar todas as sessões da empresa
 */

import { Router, Request, Response } from 'express';
import * as baileysService from '../services/baileysService';
import { authenticateJWT } from '../../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
    const empresaId = await getEmpresaId(req);
    if (!empresaId) {
      return res.status(403).json({ error: 'Empresa não identificada' });
    }
    const { telefone } = req.body;
    const result = await baileysService.startSession(empresaId, telefone);
    res.json({
      success: true,
      message: 'Sessão criada com sucesso',
      sessionId: result.sessionId,
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
    const empresaId = await getEmpresaId(req);
    if (!empresaId) {
      return res.status(403).json({ error: 'Empresa não identificada' });
    }
    const sessions = baileysService.listEmpresaSessions(empresaId);
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
    const { sessionId } = req.params;
    const empresaId = await getEmpresaId(req);
    const parsed = baileysService.parseSessionId(sessionId);
    if (!parsed || parsed.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const qr = baileysService.getSessionQR(sessionId);
    const status = baileysService.getSessionStatus(sessionId);
    res.json({ qr, status, sessionId });
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
    const { sessionId } = req.params;
    const empresaId = await getEmpresaId(req);
    const parsed = baileysService.parseSessionId(sessionId);
    if (!parsed || parsed.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const status = baileysService.getSessionStatus(sessionId);
    const qr = baileysService.getSessionQR(sessionId);
    res.json({ sessionId, status, hasQR: !!qr });
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
    const { sessionId } = req.params;
    const empresaId = await getEmpresaId(req);
    const parsed = baileysService.parseSessionId(sessionId);
    if (!parsed || parsed.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const success = await baileysService.disconnectSession(sessionId);
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
    const empresaId = await getEmpresaId(req);
    const parsed = baileysService.parseSessionId(sessionId);
    if (!parsed || parsed.empresaId !== empresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    if (!to || !message) {
      return res.status(400).json({ error: 'Campos "to" e "message" são obrigatórios' });
    }
    const result = await baileysService.sendMessage(sessionId, to, message);
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
    const empresaId = await getEmpresaId(req);
    if (!empresaId) {
      return res.status(403).json({ error: 'Empresa não identificada' });
    }
    const disconnected = await baileysService.disconnectAllEmpresaSessions(empresaId);
    res.json({ success: true, disconnected, message: `${disconnected} sessões desconectadas` });
  } catch (error: any) {
    console.error('Erro ao desconectar todas as sessões:', error);
    res.status(500).json({ error: error.message || 'Erro ao desconectar sessões' });
  }
});

export default router;
