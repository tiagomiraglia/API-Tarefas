/**
 * Serviço usando whatsapp-web.js (Puppeteer) para gerenciar sessões WhatsApp.
 * Objetivo: manter a mesma interface usada pelas rotas para trocar Baileys por whatsapp-web.js.
 */
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Import dinamicamente para evitar problemas de tipagem em TS
const WA = require('whatsapp-web.js');
const { Client, LocalAuth } = WA;

interface SessionInfo {
  sessionId: string;
  empresaId: number;
  telefone: string;
  client: any;
  qr: string | null;
  status: 'connecting' | 'qr' | 'connected' | 'disconnected';
}

const activeSessions = new Map<string, SessionInfo>();
const AUTH_DIR = path.join(__dirname, '..', 'whatsapp_auth');
const MAX_SESSIONS_PER_EMPRESA = 3; // Limitar para não sobrecarregar

function ensureAuthDir(sessionId: string): string {
  const dir = path.join(AUTH_DIR, sessionId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getPrisma(): any {
  if (!global.prisma) {
    global.prisma = new (require('@prisma/client').PrismaClient)();
  }
  return global.prisma;
}

export function generateSessionId(empresaId: number, telefone?: string): string {
  if (telefone) {
    const clean = telefone.replace(/\D/g, '');
    return `empresa_${empresaId}_${clean}`;
  }
  return `empresa_${empresaId}_temp_${Date.now()}`;
}

export function parseSessionId(sessionId: string): { empresaId: number; telefone: string } | null {
  const match = sessionId.match(/^empresa_(\d+)_(\d+)$/);
  if (match) return { empresaId: parseInt(match[1]), telefone: match[2] };
  const temp = sessionId.match(/^empresa_(\d+)_temp_\d+$/);
  if (temp) return { empresaId: parseInt(temp[1]), telefone: 'temp' };
  return null;
}

export async function startSession(empresaId: number, telefone?: string, onSessionUpdate?: (sessionId: string, data: any) => void): Promise<{ sessionId: string; qr: string | null; status: string }> {
  const sessionId = generateSessionId(empresaId, telefone);

  // Verificar limite de sessões por empresa
  const empresaSessions = Array.from(activeSessions.values()).filter(s => s.empresaId === empresaId);
  if (empresaSessions.length >= MAX_SESSIONS_PER_EMPRESA) {
    throw new Error(`Limite de ${MAX_SESSIONS_PER_EMPRESA} sessões ativas por empresa atingido`);
  }

  const sessionDir = ensureAuthDir(sessionId);

  // limpar auth antigo para sessão nova
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  } catch (err) {
    console.error('Erro ao preparar dir de auth:', err);
  }

  const client = new Client({
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--memory-pressure-off',
        '--max_old_space_size=512'
      ]
    },
    authStrategy: new LocalAuth({ clientId: sessionId, dataPath: sessionDir })
  });

  const info: SessionInfo = {
    sessionId,
    empresaId,
    telefone: telefone || '',
    client,
    qr: null,
    status: 'connecting'
  };

  activeSessions.set(sessionId, info);

  client.on('qr', async (qr: string) => {
    try {
      // converter QR para dataURL
      const qrDataUrl = await QRCode.toDataURL(qr, { color: { dark: '#000000', light: '#FFFFFF' }, width: 256 });
      info.qr = qrDataUrl;
      info.status = 'qr';
      // persistir no banco
      try {
        await getPrisma().whatsAppSession.upsert({
          where: { session_id: sessionId },
          update: { status: 'qr', qr_code: qrDataUrl, updated_at: new Date(), last_activity: new Date() },
          create: { session_id: sessionId, empresa_id: empresaId, telefone: telefone || null, status: 'qr', qr_code: qrDataUrl }
        });
      } catch (dbErr) {
        console.error('Erro ao salvar QR no DB:', dbErr);
      }
      console.log('QR gerado para', sessionId);

      // Emitir evento em tempo real
      if (onSessionUpdate) {
        onSessionUpdate(sessionId, {
          status: 'qr',
          qr: qrDataUrl,
          message: 'QR Code gerado - escaneie com o WhatsApp'
        });
      }
    } catch (err) {
      console.error('Erro ao gerar data URL do QR:', err);
    }
  });

  client.on('ready', async () => {
    info.status = 'connected';
    info.qr = null;
    try {
      await getPrisma().whatsAppSession.upsert({
        where: { session_id: sessionId },
        update: { status: 'connected', qr_code: null, connected_at: new Date(), updated_at: new Date() },
        create: { session_id: sessionId, empresa_id: empresaId, telefone: telefone || null, status: 'connected' }
      });
    } catch (err) {
      console.error('Erro ao atualizar sessão no DB (ready):', err);
    }
    console.log('WhatsApp conectado para', sessionId);

    // Emitir evento em tempo real
    if (onSessionUpdate) {
      onSessionUpdate(sessionId, {
        status: 'connected',
        qr: null,
        message: 'WhatsApp conectado com sucesso!'
      });
    }
  });

  client.on('auth_failure', (msg: any) => {
    console.warn('auth_failure', sessionId, msg);
    info.status = 'disconnected';

    // Emitir evento em tempo real
    if (onSessionUpdate) {
      onSessionUpdate(sessionId, {
        status: 'disconnected',
        qr: null,
        message: 'Falha de autenticação'
      });
    }
  });

  client.on('disconnected', async (reason: any) => {
    console.log('disconnected', sessionId, reason);
    info.status = 'disconnected';
    activeSessions.delete(sessionId);
    try {
      await getPrisma().whatsAppSession.update({ where: { session_id: sessionId }, data: { status: 'disconnected', disconnected_at: new Date(), updated_at: new Date() } });
    } catch (err) {
      console.error('Erro ao atualizar sessão no DB (disconnected):', err);
    }

    // Emitir evento em tempo real
    if (onSessionUpdate) {
      onSessionUpdate(sessionId, {
        status: 'disconnected',
        qr: null,
        message: 'WhatsApp desconectado'
      });
    }
  });

  client.initialize().catch((err: Error) => {
    console.error('Erro ao inicializar client whatsapp-web.js:', err);
  });

  // salvar/atualizar DB inicial
  try {
    await getPrisma().whatsAppSession.upsert({
      where: { session_id: sessionId },
      update: { status: 'connecting', updated_at: new Date(), last_activity: new Date() },
      create: { session_id: sessionId, empresa_id: empresaId, telefone: telefone || null, status: 'connecting' }
    });
  } catch (err) {
    console.error('Erro ao salvar sessão no DB (start):', err);
  }

  return { sessionId, qr: info.qr, status: info.status };
}

export function getSessionQR(sessionId: string): string | null {
  const s = activeSessions.get(sessionId);
  return s?.qr || null;
}

export function getSessionStatus(sessionId: string): string {
  const s = activeSessions.get(sessionId);
  return s?.status || 'disconnected';
}

export async function disconnectSession(sessionId: string): Promise<boolean> {
  const s = activeSessions.get(sessionId);
  if (!s) return false;
  try {
    await s.client.logout?.();
    try { s.client.destroy?.(); } catch {}
    activeSessions.delete(sessionId);
    // remover auth local
    const dir = path.join(AUTH_DIR, sessionId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    try { await getPrisma().whatsAppSession.update({ where: { session_id: sessionId }, data: { status: 'disconnected', disconnected_at: new Date(), updated_at: new Date() } }); } catch (e) {}
    return true;
  } catch (err) {
    console.error('Erro ao desconectar sessão:', err);
    return false;
  }
}

export function listEmpresaSessions(empresaId: number) {
  const arr = Array.from(activeSessions.values()).filter(s => s.empresaId === empresaId).slice(0,1).map(s => ({ sessionId: s.sessionId, telefone: s.telefone, status: s.status, hasQR: !!s.qr }));
  return arr;
}

export async function disconnectAllEmpresaSessions(empresaId: number): Promise<number> {
  const sessions = listEmpresaSessions(empresaId);
  let disconnected = 0;
  for (const s of sessions) {
    const ok = await disconnectSession(s.sessionId);
    if (ok) disconnected++;
  }
  return disconnected;
}

export async function sendMessage(sessionId: string, to: string, message: string): Promise<any> {
  const s = activeSessions.get(sessionId);
  if (!s || s.status !== 'connected') throw new Error('Sessão não conectada');
  const clean = to.replace(/\D/g, '');
  const jid = `${clean}@c.us`;
  return s.client.sendMessage(jid, message);
}

export function listActiveSessions() {
  return Array.from(activeSessions.values()).map(s => ({ sessionId: s.sessionId, empresaId: s.empresaId, telefone: s.telefone, status: s.status, hasQR: !!s.qr }));
}

export async function cleanupInactiveSessions(): Promise<number> {
  let cleaned = 0;
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  for (const [sessionId, info] of activeSessions.entries()) {
    // Se a sessão está desconectada há mais de 24h, remover
    if (info.status === 'disconnected') {
      try {
        await disconnectSession(sessionId);
        cleaned++;
      } catch (err) {
        console.error('Erro ao limpar sessão inativa:', sessionId, err);
      }
    }
  }

  return cleaned;
}

// Executar limpeza a cada 30 minutos
setInterval(async () => {
  try {
    const cleaned = await cleanupInactiveSessions();
    if (cleaned > 0) {
      console.log(`🧹 Limpou ${cleaned} sessões inativas`);
    }
  } catch (err) {
    console.error('Erro na limpeza automática:', err);
  }
}, 30 * 60 * 1000);
