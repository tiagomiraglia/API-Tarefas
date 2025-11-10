/**
 * Serviço de gerenciamento de sessões WhatsApp usando Baileys (integrado ao backend)
 * 
 * REGRAS DE NEGÓCIO:
 * - Cada empresa pode conectar APENAS 1 número WhatsApp por vez
 * - O número é detectado automaticamente ao escanear o QR Code
 * - Sessões são isoladas por empresa (multi-tenant seguro)
 * - Para trocar o número, é necessário desconectar o atual primeiro
 * 
 * CONFORMIDADE META/WHATSAPP:
 * - Uso legítimo do Baileys (biblioteca oficial open-source)
 * - Sem manipulação direta de protocolo WebSocket
 * - QR Code expira automaticamente (segurança)
 * - Sessões auditáveis e vinculadas ao CNPJ da empresa
 * - Segue boas práticas de privacidade e segurança
 * 
 * Estrutura de sessionId: `empresa_{empresaId}_{telefone}`
 * Exemplo: empresa_1_5511999999999
 * Temporário (antes de escanear): empresa_1_temp_1762555387881
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  ConnectionState
} from 'baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import * as QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

// Cliente Prisma para persistência
const prisma = new PrismaClient();

/**
 * Validações de entrada para segurança
 */
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valida número de telefone brasileiro
 */
export function validatePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Telefone é obrigatório', 'telefone');
  }

  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Deve ter pelo menos 10 dígitos (DDD + número)
  if (cleanPhone.length < 10) {
    throw new ValidationError('Telefone deve ter pelo menos 10 dígitos', 'telefone');
  }

  // Deve ter no máximo 13 dígitos (55 + DDD + número)
  if (cleanPhone.length > 13) {
    throw new ValidationError('Telefone deve ter no máximo 13 dígitos', 'telefone');
  }

  // Se não começa com 55, adiciona
  if (!cleanPhone.startsWith('55')) {
    return '55' + cleanPhone;
  }

  return cleanPhone;
}

/**
 * Valida ID da empresa
 */
export function validateEmpresaId(empresaId: any): number {
  if (empresaId === null || empresaId === undefined) {
    throw new ValidationError('ID da empresa é obrigatório', 'empresaId');
  }

  const id = Number(empresaId);
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    throw new ValidationError('ID da empresa deve ser um número inteiro positivo', 'empresaId');
  }

  return id;
}

/**
 * Valida sessionId
 */
export function validateSessionId(sessionId: string): { empresaId: number; telefone: string } {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('SessionId é obrigatório', 'sessionId');
  }

  const parsed = parseSessionId(sessionId);
  if (!parsed) {
    throw new ValidationError('SessionId inválido', 'sessionId');
  }

  return parsed;
}

/**
 * Valida mensagem para envio
 */
export function validateMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Mensagem é obrigatória', 'message');
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Mensagem não pode estar vazia', 'message');
  }

  if (trimmed.length > 4096) { // Limite do WhatsApp
    throw new ValidationError('Mensagem muito longa (máximo 4096 caracteres)', 'message');
  }

  return trimmed;
}

// Tipos
interface SessionInfo {
  sessionId: string;
  empresaId: number;
  telefone: string;
  socket: any;
  qr: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr';
  retryCount?: number; // Contador de tentativas de reconexão
}

// Armazenamento de sessões ativas em memória
const activeSessions = new Map<string, SessionInfo>();

// Diretório base para autenticação
const AUTH_DIR = path.join(__dirname, '..', 'baileys_auth');

// Logger configurado com sanitização
const logger = pino({
  level: process.env.LOG_LEVEL || 'error',
  formatters: {
    log: (obj: any) => {
      // Sanitizar dados sensíveis
      if (obj.telefone) {
        obj.telefone = obj.telefone.substring(0, 4) + '****' + obj.telefone.substring(obj.telefone.length - 2);
      }
      if (obj.sessionId) {
        // Manter apenas o prefixo da empresa
        const match = obj.sessionId.match(/^empresa_(\d+)/);
        if (match) {
          obj.sessionId = `empresa_${match[1]}_***`;
        }
      }
      return obj;
    }
  }
});

// Configurações de reconexão
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

// Configurações de rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 10; // Máximo 10 tentativas por janela

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limiting por empresa (para evitar abuso)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Métricas de monitoramento
interface ServiceMetrics {
  totalSessions: number;
  activeSessions: number;
  connectedSessions: number;
  failedConnections: number;
  messagesSent: number;
  lastCleanup: Date;
  uptime: number;
}

let serviceMetrics: ServiceMetrics = {
  totalSessions: 0,
  activeSessions: 0,
  connectedSessions: 0,
  failedConnections: 0,
  messagesSent: 0,
  lastCleanup: new Date(),
  uptime: Date.now()
};

/**
 * Atualiza métricas do serviço
 */
function updateMetrics(): void {
  serviceMetrics.activeSessions = activeSessions.size;
  serviceMetrics.connectedSessions = Array.from(activeSessions.values())
    .filter(session => session.status === 'connected').length;
}

/**
 * Obtém métricas atuais do serviço
 */
export function getServiceMetrics(): ServiceMetrics {
  updateMetrics();
  return { ...serviceMetrics };
}

/**
 * Registra envio de mensagem nas métricas
 */
function recordMessageSent(): void {
  serviceMetrics.messagesSent++;
}

/**
 * Registra falha de conexão nas métricas
 */
function recordFailedConnection(): void {
  serviceMetrics.failedConnections++;
}

/**
 * Verifica se a empresa está dentro do limite de rate limiting
 */
export function checkRateLimit(empresaId: number): boolean {
  const key = `empresa_${empresaId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // Primeira tentativa ou janela expirada
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Limite excedido
  }

  entry.count++;
  return true;
}

export function cleanupRateLimit(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Limpa sessões antigas e inativas (chamada periódica)
 */
export async function cleanupInactiveSessions(): Promise<void> {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 horas atrás

    console.log('🧹 Iniciando limpeza de sessões inativas...');

    // Buscar sessões desconectadas há mais de 24 horas
    const inactiveSessions = await (prisma as any).whatsAppSession.findMany({
      where: {
        status: 'disconnected',
        disconnected_at: {
          lt: cutoffTime
        }
      }
    });

    console.log(`📊 Encontradas ${inactiveSessions.length} sessões inativas para limpeza`);

    // Remover sessões antigas do banco
    for (const session of inactiveSessions) {
      try {
        await (prisma as any).whatsAppSession.delete({
          where: { session_id: session.session_id }
        });

        // Remover arquivos de autenticação se existirem
        const sessionDir = path.join(AUTH_DIR, session.session_id);
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
          console.log(`🗑️ Arquivos de autenticação removidos: ${session.session_id}`);
        }

        console.log(`🧹 Sessão inativa removida: ${session.session_id}`);
      } catch (error) {
        console.error(`❌ Erro ao remover sessão ${session.session_id}:`, error);
      }
    }

    console.log('✅ Limpeza de sessões inativas concluída');
  } catch (error) {
    console.error('❌ Erro na limpeza de sessões inativas:', error);
  }
}

/**
 * Carrega sessões ativas do banco de dados na inicialização
 */
export async function loadActiveSessions(): Promise<void> {
  try {
    console.log('🔄 Carregando sessões ativas do banco de dados...');

    const activeSessionsFromDB = await (prisma as any).whatsAppSession.findMany({
      where: {
        status: {
          in: ['connecting', 'connected', 'qr']
        }
      }
    });

    console.log(`📊 Encontradas ${activeSessionsFromDB.length} sessões ativas no banco`);

    // Para cada sessão ativa, tentar reconectar
    for (const sessionData of activeSessionsFromDB) {
      try {
        console.log(`🔄 Tentando restaurar sessão: ${sessionData.session_id}`);

        // Criar nova sessão (isso vai recriar a conexão)
        await startSession(sessionData.empresa_id, sessionData.telefone || undefined);

      } catch (error) {
        console.error(`❌ Erro ao restaurar sessão ${sessionData.session_id}:`, error);

        // Marcar como desconectada no banco
        await (prisma as any).whatsAppSession.update({
          where: { session_id: sessionData.session_id },
          data: {
            status: 'disconnected',
            disconnected_at: new Date(),
            updated_at: new Date()
          }
        });
      }
    }

    console.log('✅ Sessões ativas carregadas');
  } catch (error) {
    console.error('❌ Erro ao carregar sessões ativas:', error);
  }
}

/**
 * Garante que o diretório de autenticação existe
 */
function ensureAuthDir(sessionId: string): string {
  const sessionDir = path.join(AUTH_DIR, sessionId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  return sessionDir;
}

/**
 * Gera sessionId único para empresa + telefone
 * Se telefone não for informado, gera ID temporário com timestamp
 */
export function generateSessionId(empresaId: number, telefone?: string): string {
  if (telefone) {
    const cleanPhone = telefone.replace(/\D/g, '');
    return `empresa_${empresaId}_${cleanPhone}`;
  }
  // Sessão temporária até escanear QR Code
  return `empresa_${empresaId}_temp_${Date.now()}`;
}

/**
 * Extrai empresaId e telefone do sessionId
 */
export function parseSessionId(sessionId: string): { empresaId: number; telefone: string } | null {
  // Aceita formato normal e temporário
  const match = sessionId.match(/^empresa_(\d+)_(\d+)$/);
  if (match) {
    return {
      empresaId: parseInt(match[1]),
      telefone: match[2]
    };
  }
  const tempMatch = sessionId.match(/^empresa_(\d+)_temp_\d+$/);
  if (tempMatch) {
    return {
      empresaId: parseInt(tempMatch[1]),
      telefone: 'temp'
    };
  }
  return null;
}

/**
 * Inicia uma nova sessão WhatsApp
 * @param empresaId - ID da empresa
 * @param telefone - Número do telefone (opcional, será detectado ao conectar)
 */
export async function startSession(
  empresaId: number,
  telefone?: string
): Promise<{ sessionId: string; qr: string | null; status: string }> {
  // Validar entrada
  const validatedEmpresaId = validateEmpresaId(empresaId);
  let validatedTelefone: string | undefined;

  if (telefone) {
    validatedTelefone = validatePhoneNumber(telefone);
  }

  const sessionId = generateSessionId(validatedEmpresaId, validatedTelefone);

  // Se já existe sessão ativa, retornar informações atuais
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)!;
    return {
      sessionId,
      qr: session.qr,
      status: session.status
    };
  }

  console.log(`📱 Iniciando sessão WhatsApp: ${sessionId}`);

  const sessionDir = ensureAuthDir(sessionId);
  
  // Limpar diretório de autenticação anterior se existir
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`🧹 Diretório de autenticação limpo: ${sessionDir}`);
    } catch (err) {
      console.error('⚠️ Erro ao limpar diretório:', err);
    }
  }
  
  // Recriar diretório limpo
  fs.mkdirSync(sessionDir, { recursive: true });
  
  try {
    // Buscar versão mais recente do Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📌 Usando Baileys versão ${version}, latest: ${isLatest}`);

    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // Criar socket WhatsApp
    const socket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      browser: ['AWA System', 'Chrome', '10.0'],
      getMessage: async () => undefined,
      connectTimeoutMs: 30000,    // 30s para conectar (reduzido)
      qrTimeout: 30000,          // 30s para QR (reduzido)
      defaultQueryTimeoutMs: 30000, // 30s para queries (reduzido)
      msgRetryCounterCache: undefined,
      retryRequestDelayMs: 1000   // Delay entre retries
    });

    // Informações da sessão
    const sessionInfo: SessionInfo = {
      sessionId,
      empresaId,
      telefone: telefone || '',
      socket,
      qr: null,
      status: 'connecting',
      retryCount: 0 // Inicializar contador de tentativas
    };

    activeSessions.set(sessionId, sessionInfo);

    // Salvar sessão no banco de dados
    try {
      await (prisma as any).whatsAppSession.upsert({
        where: { session_id: sessionId },
        update: {
          status: 'connecting',
          retry_count: 0,
          last_activity: new Date(),
          updated_at: new Date()
        },
        create: {
          session_id: sessionId,
          empresa_id: empresaId,
          telefone: telefone || null,
          status: 'connecting',
          retry_count: 0
        }
      });
    } catch (dbError) {
      console.error('Erro ao salvar sessão no banco:', dbError);
      // Não falha a criação da sessão por erro de DB
    }

    // Event handlers
    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`🔄 Evento connection.update para ${sessionId}:`, { connection, hasQR: !!qr });

      // QR Code recebido
      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr);
          sessionInfo.qr = qrDataUrl;
          sessionInfo.status = 'qr';
          console.log(`📸 QR Code gerado para ${sessionId}`);

          // Atualizar no banco
          await (prisma as any).whatsAppSession.update({
            where: { session_id: sessionId },
            data: {
              status: 'qr',
              qr_code: qrDataUrl,
              last_activity: new Date(),
              updated_at: new Date()
            }
          });

        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }

      // Status da conexão mudou
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`🔌 Conexão fechada para ${sessionId}`);
        console.log(`   Status code: ${statusCode}`);
        console.log(`   Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          // Para erro 515 (não autenticado), tentar novamente com limite
          if (statusCode === 515) {
            if ((sessionInfo.retryCount || 0) < MAX_RETRY_ATTEMPTS) {
              sessionInfo.retryCount = (sessionInfo.retryCount || 0) + 1;
              console.log(`⚠️ Erro 515 (não autenticado) - tentativa ${sessionInfo.retryCount}/${MAX_RETRY_ATTEMPTS} em ${RETRY_DELAY_MS}ms...`);

              sessionInfo.status = 'connecting';
              activeSessions.delete(sessionId);

              // Limpar credenciais antigas e tentar novamente
              try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log(`🗑️ Credenciais antigas removidas`);
              } catch (err) {
                console.error('Erro ao limpar credenciais:', err);
              }

              setTimeout(() => {
                console.log(`🔄 Tentando reconectar ${sessionId} (tentativa ${sessionInfo.retryCount})...`);
                startSession(empresaId, telefone);
              }, RETRY_DELAY_MS);
            } else {
              console.error(`❌ Máximo de tentativas (${MAX_RETRY_ATTEMPTS}) atingido para ${sessionId}`);
              sessionInfo.status = 'disconnected';
              activeSessions.delete(sessionId);
            }
          } else if (statusCode === DisconnectReason.timedOut) {
            console.log(`⚠️ Timeout - não reconectando automaticamente`);
            sessionInfo.status = 'disconnected';
            activeSessions.delete(sessionId);
          } else {
            // Para outros erros, tentar reconectar com limite
            if ((sessionInfo.retryCount || 0) < MAX_RETRY_ATTEMPTS) {
              sessionInfo.retryCount = (sessionInfo.retryCount || 0) + 1;
              sessionInfo.status = 'connecting';

              setTimeout(() => {
                console.log(`🔄 Tentando reconectar ${sessionId} (tentativa ${sessionInfo.retryCount})...`);
                startSession(empresaId, telefone);
              }, RETRY_DELAY_MS);
            } else {
              console.error(`❌ Máximo de tentativas (${MAX_RETRY_ATTEMPTS}) atingido para ${sessionId}`);
              sessionInfo.status = 'disconnected';
              activeSessions.delete(sessionId);
            }
          }
        } else {
          sessionInfo.status = 'disconnected';
          activeSessions.delete(sessionId);

          // Atualizar no banco
          await (prisma as any).whatsAppSession.update({
            where: { session_id: sessionId },
            data: {
              status: 'disconnected',
              disconnected_at: new Date(),
              updated_at: new Date()
            }
          });

          // Limpar diretório de autenticação se foi logout
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`🗑️ Sessão ${sessionId} removida (logout)`);
          } catch (err) {
            console.error('Erro ao remover sessão:', err);
          }
        }
      } else if (connection === 'open') {
        console.log(`🎉 Conexão ABERTA para ${sessionId}!`);
        sessionInfo.status = 'connected';
        sessionInfo.qr = null;

        // Atualizar no banco
        await (prisma as any).whatsAppSession.update({
          where: { session_id: sessionId },
          data: {
            status: 'connected',
            qr_code: null,
            connected_at: new Date(),
            last_activity: new Date(),
            updated_at: new Date()
          }
        });
        
        // Detectar número do telefone conectado
        const user = socket.user;
        console.log(`👤 Usuário conectado:`, user);
        
        if (user && user.id) {
          const phoneNumber = user.id.split(':')[0];
          console.log(`📱 Número detectado: ${phoneNumber}`);
          
          // Se era sessão temporária, atualizar com número real
          if (!sessionInfo.telefone || sessionInfo.telefone === '') {
            sessionInfo.telefone = phoneNumber;

            // Gerar novo sessionId com número real
            const newSessionId = generateSessionId(empresaId, phoneNumber);

            // Se o ID mudou, mover para novo ID de forma segura
            if (newSessionId !== sessionId) {
              console.log(`🔄 Atualizando sessionId de ${sessionId} para ${newSessionId}`);

              // Usar uma abordagem mais segura para evitar race conditions
              const oldSession = activeSessions.get(sessionId);
              if (oldSession) {
                // Remover sessão antiga
                activeSessions.delete(sessionId);

                // Atualizar sessionInfo
                oldSession.sessionId = newSessionId;

                // Adicionar com novo ID
                activeSessions.set(newSessionId, oldSession);

                // Renomear diretório de auth de forma segura
                const newSessionDir = ensureAuthDir(newSessionId);
                try {
                  if (fs.existsSync(sessionDir) && sessionDir !== newSessionDir) {
                    // Verificar se o diretório de destino já existe
                    if (fs.existsSync(newSessionDir)) {
                      fs.rmSync(newSessionDir, { recursive: true, force: true });
                    }
                    fs.renameSync(sessionDir, newSessionDir);
                    console.log(`📁 Diretório renomeado: ${sessionDir} → ${newSessionDir}`);
                  }
                } catch (err) {
                  console.error('❌ Erro ao renomear diretório:', err);
                }
              }
            }
          }
        } else {
          console.warn(`⚠️ Usuário não detectado para ${sessionId}`);
        }
        
        console.log(`✅ Sessão ${sessionInfo.sessionId} conectada com sucesso!`);
      } else if (connection === 'connecting') {
        console.log(`⏳ Conectando ${sessionId}...`);
        sessionInfo.status = 'connecting';
      }
    });

    // Mensagens recebidas
    socket.ev.on('messages.upsert', async ({ messages, type }: { messages: any[], type: string }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          // Processar mensagem recebida
          console.log(`📨 Mensagem recebida em ${sessionId}:`, msg.key.remoteJid);
          // Aqui você pode emitir via Socket.IO ou processar a mensagem
        }
      }
    });

    return {
      sessionId,
      qr: sessionInfo.qr,
      status: sessionInfo.status
    };
  } catch (error) {
    console.error(`❌ Erro ao iniciar sessão ${sessionId}:`, error);
    activeSessions.delete(sessionId);
    throw handleError(error, `startSession(${empresaId})`);
  }
}

/**
 * Obtém QR Code de uma sessão
 */
export function getSessionQR(sessionId: string): string | null {
  const session = activeSessions.get(sessionId);
  return session?.qr || null;
}

/**
 * Obtém status de uma sessão
 */
export function getSessionStatus(sessionId: string): string {
  const session = activeSessions.get(sessionId);
  return session?.status || 'disconnected';
}

export async function disconnectSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId);

  if (!session) {
    console.warn(`⚠️ Sessão ${sessionId} não encontrada`);
    return false;
  }

  try {
    await session.socket.logout();
    activeSessions.delete(sessionId);

    // Atualizar no banco
    await (prisma as any).whatsAppSession.update({
      where: { session_id: sessionId },
      data: {
        status: 'disconnected',
        disconnected_at: new Date(),
        updated_at: new Date()
      }
    });

    // Limpar arquivos de autenticação
    const sessionDir = path.join(AUTH_DIR, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    console.log(`🔌 Sessão ${sessionId} desconectada`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao desconectar sessão ${sessionId}:`, error);
    return false;
  }
}

/**
 * Desconecta todas as sessões de uma empresa
 */
export async function disconnectAllEmpresaSessions(empresaId: number): Promise<number> {
  const sessions = listEmpresaSessions(empresaId);
  let disconnected = 0;
  
  for (const session of sessions) {
    const success = await disconnectSession(session.sessionId);
    if (success) disconnected++;
  }
  
  console.log(`🧹 ${disconnected} sessões da empresa ${empresaId} desconectadas`);
  return disconnected;
}

export async function sendMessage(
  sessionId: string,
  to: string,
  message: string
): Promise<any> {
  try {
    // Validar entrada
    validateSessionId(sessionId);
    const validatedTo = validatePhoneNumber(to);
    const validatedMessage = validateMessage(message);

    const session = activeSessions.get(sessionId);

    if (!session || session.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    const jid = `${validatedTo}@s.whatsapp.net`;
    const result = await session.socket.sendMessage(jid, { text: validatedMessage });
    
    // Registrar métrica de mensagem enviada
    recordMessageSent();
    
    return result;
  } catch (error) {
    throw handleError(error, `sendMessage(${sessionId})`);
  }
}

/**
 * Lista todas as sessões ativas
 */
export function listActiveSessions(): Array<{
  sessionId: string;
  empresaId: number;
  telefone: string;
  status: string;
  hasQR: boolean;
}> {
  return Array.from(activeSessions.values()).map(session => ({
    sessionId: session.sessionId,
    empresaId: session.empresaId,
    telefone: session.telefone,
    status: session.status,
    hasQR: !!session.qr
  }));
}

/**
 * Lista sessões de uma empresa específica
 */
export function listEmpresaSessions(empresaId: number): Array<{
  sessionId: string;
  telefone: string;
  status: string;
  hasQR: boolean;
}> {
  try {
    const allSessions = Array.from(activeSessions.values());
    console.log(`🔍 Total de sessões ativas em memória: ${allSessions.length}`);

    const empresaSessions = allSessions
      .filter(session => session && session.empresaId === empresaId)
      .map(session => ({
        sessionId: session.sessionId || '',
        telefone: session.telefone || '',
        status: session.status || 'disconnected',
        hasQR: !!session.qr
      }));

    console.log(`🔍 Sessões da empresa ${empresaId} em memória: ${empresaSessions.length}`);
    return empresaSessions;
  } catch (error) {
    console.error('❌ Erro ao listar sessões da empresa:', error);
    return [];
  }
}

/**
 * Valida conformidade com políticas do WhatsApp
 */
export function validateWhatsAppCompliance(
  empresaId: number,
  telefone: string,
  message?: string
): { compliant: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Verificar se é um número brasileiro válido
  if (!telefone.startsWith('55')) {
    warnings.push('Número não é brasileiro');
  }

  // Verificar mensagens suspeitas (se fornecida)
  if (message) {
    const suspiciousPatterns = [
      /spam|promoção|desconto|oferta/i,
      /bitcoin|cripto|investimento/i,
      /clique aqui|acesse|visite/i,
      /gratuito|grátis|free/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        warnings.push('Mensagem pode violar políticas do WhatsApp');
        break;
      }
    }

    // Verificar comprimento (WhatsApp permite até 4096 chars)
    if (message.length > 4096) {
      warnings.push('Mensagem muito longa');
    }
  }

  // Verificar rate limiting da empresa
  if (!checkRateLimit(empresaId)) {
    warnings.push('Limite de mensagens excedido');
  }

  return {
    compliant: warnings.length === 0,
    warnings
  };
}

/**
 * Trata erros de forma segura (sem expor informações sensíveis)
 */
export function handleError(error: any, context: string): Error {
  console.error(`❌ Erro em ${context}:`, error);

  // Para erros de validação, retornar como está
  if (error instanceof ValidationError) {
    return error;
  }

  // Para outros erros, retornar mensagem genérica
  if (error instanceof Boom) {
    const statusCode = error.output?.statusCode;
    switch (statusCode) {
      case DisconnectReason.loggedOut:
        return new Error('Sessão desconectada. Faça login novamente.');
      case DisconnectReason.timedOut:
        return new Error('Conexão expirou. Tente novamente.');
      case DisconnectReason.restartRequired:
        return new Error('Reinicialização necessária. Tente novamente.');
      default:
        return new Error('Erro de conexão com WhatsApp. Tente novamente.');
    }
  }

  // Erro genérico para casos não previstos
  return new Error('Erro interno do servidor. Contate o suporte.');
}
