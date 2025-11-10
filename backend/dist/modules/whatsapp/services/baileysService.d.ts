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
/**
 * Validações de entrada para segurança
 */
export declare class ValidationError extends Error {
    field: string;
    constructor(message: string, field: string);
}
/**
 * Valida número de telefone brasileiro
 */
export declare function validatePhoneNumber(phone: string): string;
/**
 * Valida ID da empresa
 */
export declare function validateEmpresaId(empresaId: any): number;
/**
 * Valida sessionId
 */
export declare function validateSessionId(sessionId: string): {
    empresaId: number;
    telefone: string;
};
/**
 * Valida mensagem para envio
 */
export declare function validateMessage(message: string): string;
interface ServiceMetrics {
    totalSessions: number;
    activeSessions: number;
    connectedSessions: number;
    failedConnections: number;
    messagesSent: number;
    lastCleanup: Date;
    uptime: number;
}
/**
 * Obtém métricas atuais do serviço
 */
export declare function getServiceMetrics(): ServiceMetrics;
/**
 * Verifica se a empresa está dentro do limite de rate limiting
 */
export declare function checkRateLimit(empresaId: number): boolean;
export declare function cleanupRateLimit(): void;
/**
 * Limpa sessões antigas e inativas (chamada periódica)
 */
export declare function cleanupInactiveSessions(): Promise<void>;
/**
 * Carrega sessões ativas do banco de dados na inicialização
 */
export declare function loadActiveSessions(): Promise<void>;
/**
 * Gera sessionId único para empresa + telefone
 * Se telefone não for informado, gera ID temporário com timestamp
 */
export declare function generateSessionId(empresaId: number, telefone?: string): string;
/**
 * Extrai empresaId e telefone do sessionId
 */
export declare function parseSessionId(sessionId: string): {
    empresaId: number;
    telefone: string;
} | null;
/**
 * Inicia uma nova sessão WhatsApp
 * @param empresaId - ID da empresa
 * @param telefone - Número do telefone (opcional, será detectado ao conectar)
 */
export declare function startSession(empresaId: number, telefone?: string): Promise<{
    sessionId: string;
    qr: string | null;
    status: string;
}>;
/**
 * Obtém QR Code de uma sessão
 */
export declare function getSessionQR(sessionId: string): string | null;
/**
 * Obtém status de uma sessão
 */
export declare function getSessionStatus(sessionId: string): string;
export declare function disconnectSession(sessionId: string): Promise<boolean>;
/**
 * Desconecta todas as sessões de uma empresa
 */
export declare function disconnectAllEmpresaSessions(empresaId: number): Promise<number>;
export declare function sendMessage(sessionId: string, to: string, message: string): Promise<any>;
/**
 * Lista todas as sessões ativas
 */
export declare function listActiveSessions(): Array<{
    sessionId: string;
    empresaId: number;
    telefone: string;
    status: string;
    hasQR: boolean;
}>;
/**
 * Lista sessões de uma empresa específica
 */
export declare function listEmpresaSessions(empresaId: number): Array<{
    sessionId: string;
    telefone: string;
    status: string;
    hasQR: boolean;
}>;
/**
 * Valida conformidade com políticas do WhatsApp
 */
export declare function validateWhatsAppCompliance(empresaId: number, telefone: string, message?: string): {
    compliant: boolean;
    warnings: string[];
};
/**
 * Trata erros de forma segura (sem expor informações sensíveis)
 */
export declare function handleError(error: any, context: string): Error;
export {};
//# sourceMappingURL=baileysService.d.ts.map