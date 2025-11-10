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
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=whatsappBaileys.d.ts.map