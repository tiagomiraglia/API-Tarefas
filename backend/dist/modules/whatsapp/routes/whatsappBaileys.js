"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const baileysService = __importStar(require("../services/baileysService.js"));
const auth_1 = require("../../../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Middleware para obter empresa_id do usuário autenticado
async function getEmpresaId(req) {
    const userId = req.user?.id;
    if (!userId)
        return null;
    try {
        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { empresa_id: true }
        });
        return user?.empresa_id || null;
    }
    catch (error) {
        console.error('Erro ao buscar empresa_id:', error);
        return null;
    }
}
/**
 * POST /api/whatsapp/sessions
 * Criar nova sessão WhatsApp
 * Body: { telefone?: string } - telefone é opcional, será detectado ao conectar
 */
router.post('/sessions', auth_1.authenticateJWT, async (req, res) => {
    try {
        const empresaId = await getEmpresaId(req);
        if (!empresaId) {
            return res.status(403).json({ error: 'Empresa não identificada' });
        }
        // ✅ Verificar se já existe uma sessão ativa
        const existingSessions = baileysService.listEmpresaSessions(empresaId);
        const activeSession = existingSessions.find((s) => s.status === 'connecting' || s.status === 'connected' || s.status === 'qr');
        if (activeSession) {
            console.log(`⚠️ Já existe sessão ativa: ${activeSession.sessionId}`);
            return res.status(400).json({
                error: 'Já existe uma conexão ativa. Desconecte antes de criar uma nova.',
                existingSession: activeSession
            });
        }
        const { telefone } = req.body;
        console.log(`🚀 Criando nova sessão para empresa ${empresaId}`);
        // Telefone agora é opcional - será detectado ao escanear QR Code
        const result = await baileysService.startSession(empresaId, telefone);
        console.log(`✅ Sessão criada com sucesso: ${result.sessionId}`);
        // TODO: Salvar no banco após conectar (quando tiver o número real)
        // Por enquanto mantemos apenas em memória
        res.json({
            success: true,
            message: telefone ? 'Sessão criada com sucesso' : 'QR Code gerado. Escaneie para conectar.',
            sessionId: result.sessionId,
            status: result.status,
            qr: result.qr
        });
    }
    catch (error) {
        console.error('❌ Erro ao criar sessão:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: error.message || 'Erro ao criar sessão' });
    }
});
/**
 * GET /api/whatsapp/sessions
 * Listar sessões da empresa
 */
router.get('/sessions', auth_1.authenticateJWT, async (req, res) => {
    try {
        const empresaId = await getEmpresaId(req);
        if (!empresaId) {
            return res.status(403).json({ error: 'Empresa não identificada' });
        }
        console.log(`📋 Listando sessões para empresa ${empresaId}`);
        const sessions = baileysService.listEmpresaSessions(empresaId);
        console.log(`📋 Encontradas ${sessions.length} sessões`);
        // TODO: Buscar informações do banco quando implementar persistência
        // Por enquanto retorna apenas sessões em memória
        res.json({ sessions });
    }
    catch (error) {
        console.error('❌ Erro ao listar sessões:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: error.message || 'Erro ao listar sessões' });
    }
});
/**
 * GET /api/whatsapp/sessions/:sessionId/qr
 * Obter QR Code de uma sessão
 */
router.get('/sessions/:sessionId/qr', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const empresaId = await getEmpresaId(req);
        // Verificar se a sessão pertence à empresa
        const parsed = baileysService.parseSessionId(sessionId);
        if (!parsed || parsed.empresaId !== empresaId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        // Verificar se sessão existe com ID antigo
        let qr = baileysService.getSessionQR(sessionId);
        let status = baileysService.getSessionStatus(sessionId);
        // Se não encontrou, pode ser que o sessionId tenha mudado após conexão
        // Buscar por todas as sessões da empresa
        if (!status || status === 'disconnected') {
            const empresaSessions = baileysService.listEmpresaSessions(empresaId);
            // Se encontrar uma sessão conectada, usar ela
            const connectedSession = empresaSessions.find((s) => s.status === 'connected');
            if (connectedSession) {
                console.log(`🔄 SessionId mudou de ${sessionId} para ${connectedSession.sessionId}`);
                return res.json({
                    qr: null,
                    status: 'connected',
                    sessionId: connectedSession.sessionId, // Retornar novo ID
                    telefone: connectedSession.telefone
                });
            }
        }
        res.json({ qr, status, sessionId });
    }
    catch (error) {
        console.error('Erro ao obter QR:', error);
        res.status(500).json({ error: error.message || 'Erro ao obter QR' });
    }
});
/**
 * GET /api/whatsapp/sessions/:sessionId/status
 * Obter status de uma sessão
 */
router.get('/sessions/:sessionId/status', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const empresaId = await getEmpresaId(req);
        // Verificar se a sessão pertence à empresa
        const parsed = baileysService.parseSessionId(sessionId);
        if (!parsed || parsed.empresaId !== empresaId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const status = baileysService.getSessionStatus(sessionId);
        const hasQR = !!baileysService.getSessionQR(sessionId);
        res.json({ sessionId, status, hasQR });
    }
    catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({ error: error.message || 'Erro ao obter status' });
    }
});
/**
 * DELETE /api/whatsapp/sessions/:sessionId
 * Desconectar/excluir sessão
 */
router.delete('/sessions/:sessionId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const empresaId = await getEmpresaId(req);
        // Verificar se a sessão pertence à empresa
        const parsed = baileysService.parseSessionId(sessionId);
        if (!parsed || parsed.empresaId !== empresaId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const success = await baileysService.disconnectSession(sessionId);
        // TODO: Remover do banco quando implementar persistência
        res.json({ success, message: 'Sessão desconectada' });
    }
    catch (error) {
        console.error('Erro ao desconectar sessão:', error);
        res.status(500).json({ error: error.message || 'Erro ao desconectar sessão' });
    }
});
/**
 * POST /api/whatsapp/sessions/:sessionId/send
 * Enviar mensagem
 */
router.post('/sessions/:sessionId/send', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { to, message } = req.body;
        const empresaId = await getEmpresaId(req);
        // Verificar se a sessão pertence à empresa
        const parsed = baileysService.parseSessionId(sessionId);
        if (!parsed || parsed.empresaId !== empresaId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        if (!to || !message) {
            return res.status(400).json({ error: 'Campos "to" e "message" são obrigatórios' });
        }
        const result = await baileysService.sendMessage(sessionId, to, message);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
    }
});
/**
 * DELETE /api/whatsapp/sessions/all
 * Desconectar todas as sessões da empresa
 */
router.delete('/sessions/all', auth_1.authenticateJWT, async (req, res) => {
    try {
        const empresaId = await getEmpresaId(req);
        if (!empresaId) {
            return res.status(403).json({ error: 'Empresa não identificada' });
        }
        const disconnected = await baileysService.disconnectAllEmpresaSessions(empresaId);
        res.json({ success: true, disconnected, message: `${disconnected} sessões desconectadas` });
    }
    catch (error) {
        console.error('Erro ao desconectar todas as sessões:', error);
        res.status(500).json({ error: error.message || 'Erro ao desconectar sessões' });
    }
});
exports.default = router;
//# sourceMappingURL=whatsappBaileys.js.map