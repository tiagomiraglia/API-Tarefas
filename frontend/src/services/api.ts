import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Adiciona o token JWT em todas as requisições, se existir
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para tratar 401 (token expirado ou inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Exibe toast com mensagem amigável do backend, se existir
      if (error.response.data?.error) {
        // Importa dinamicamente para evitar problemas de dependência
        import('react-toastify').then(({ toast }) => {
          toast.error(error.response.data.error, { autoClose: 5000 });
        });
      }
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response.status === 403 && error.response.data?.error?.includes('Plano expirado')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;

// --- Autenticação ---
export interface LoginResponse {
  message: string;
  user: {
    id: number;
    nome: string;
    email: string;
    is_superuser: boolean;
    empresa_id: number;
    nivel: string;
    permissoes: any;
  };
  token: string;
  requirePasswordReset?: boolean;
}

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, senha });
  return response.data;
};

// --- WhatsApp Multi-Conexões ---
// Corrigido: backend usa /sessions ao invés de /connections
export const listWhatsappConnections = () => api.get('/whatsapp/sessions');
// Create a new backend WhatsApp connection (frontend code calls /whatsapp/sessions)
// Backend exposes POST /whatsapp/sessions to create a session
export const createWhatsappConnection = (payload: { telefone?: string }) =>
  api.post('/whatsapp/sessions', payload);
export const getWhatsappStatus = (sessionId: string) => api.get(`/whatsapp/sessions/${sessionId}/status`);
export const getWhatsappQr = (sessionId: string) => api.get(`/whatsapp/sessions/${sessionId}/qr`);
export const reconnectWhatsapp = (sessionId: string) => api.post(`/whatsapp/sessions/${sessionId}/send`, { message: 'reconnect' });
export const disconnectWhatsapp = (sessionId: string) => api.delete(`/whatsapp/sessions/${sessionId}`);
// Backend uses plural "sessions" in most routes — keep helpers aligned with that
export const deleteWhatsappConnection = (sessionId: string) => api.delete(`/whatsapp/sessions/${sessionId}`);
export const getWhatsappConnection = (sessionId: string) => api.get(`/whatsapp/sessions/${sessionId}`);
// Removido: cleanupWhatsappSessions não existe no backend

// --- Conversas e Chat ---
// NOTA: Essas rotas não existem no backend atual - implementações mock para evitar erros
export const getConversations = async () => {
  console.warn('⚠️ getConversations: Funcionalidade não implementada no backend');
  return [];
};

export const updateConversationStatus = async (id: string, status: string) => {
  console.warn('⚠️ updateConversationStatus: Funcionalidade não implementada no backend');
  // Mock implementation
};

export const deleteConversation = async (id: string) => {
  console.warn('⚠️ deleteConversation: Funcionalidade não implementada no backend');
  return { success: true };
};

export const cleanupDatabase = async () => {
  console.warn('⚠️ cleanupDatabase: Funcionalidade não implementada no backend');
  return { success: true };
};

export const cleanupOldData = async (days: number) => {
  console.warn('⚠️ cleanupOldData: Funcionalidade não implementada no backend');
  return { messagesDeleted: 0, conversationsDeleted: 0 };
};

// NOTA: Essas rotas não existem no backend atual - implementações mock para evitar erros
export interface WhatsAppResponse {
  success?: boolean;
  sentViaWhatsApp?: boolean;
  message?: string;
  error?: string;
}

export const sendWhatsappMessage = async (message: string, clientId: string, token: string): Promise<WhatsAppResponse> => {
  console.warn('⚠️ sendWhatsappMessage: Funcionalidade não implementada no backend');
  return { success: false, error: 'Funcionalidade não implementada' };
};

export const getHistory = async (clientId: string, token: string, page = 1, pageSize = 40) => {
  console.warn('⚠️ getHistory: Funcionalidade não implementada no backend');
  return { page, pageSize, total: 0, messages: [] };
};

export const markHistoryRead = async (clientId: string, token: string, until?: string) => {
  console.warn('⚠️ markHistoryRead: Funcionalidade não implementada no backend');
  return { success: true };
};

// --- Envio de mídia / localização ---
export interface SendMediaPayloadImage { type: 'image'; base64: string; filename?: string; caption?: string }
export interface SendMediaPayloadFile { type: 'file'; base64: string; filename?: string; caption?: string }
export interface SendMediaPayloadLocation { type: 'location'; lat: number; lng: number; title?: string; address?: string }
export type SendMediaPayload = SendMediaPayloadImage | SendMediaPayloadFile | SendMediaPayloadLocation;
export const sendMediaMessage = async (clientId: string, payload: SendMediaPayload) => {
  console.warn('⚠️ sendMediaMessage: Funcionalidade não implementada no backend');
  return { status: 'error', sentViaWhatsApp: false, type: payload.type, placeholder: 'Funcionalidade não implementada' };
};

// --- Remote device history sync (pull older WhatsApp messages into local DB) ---
export const syncWhatsappHistory = async (phoneOrId: string, limit = 300) => {
  console.warn('⚠️ syncWhatsappHistory: Funcionalidade não implementada no backend');
  return { imported: 0, totalFetched: 0, conversationId: phoneOrId, existingAnchor: null };
};

// Chunked progressive sync (para barra de progresso)
export interface ChunkSyncResponse {
  batchFetched: number;
  inserted: number;
  nextCursor: string | null;
  done: boolean;
  conversationId: string;
}
export const syncWhatsappHistoryChunk = async (phoneOrId: string, cursor?: string | null, batch = 50, limit = 300): Promise<ChunkSyncResponse> => {
  console.warn('⚠️ syncWhatsappHistoryChunk: Funcionalidade não implementada no backend');
  return { batchFetched: 0, inserted: 0, nextCursor: null, done: true, conversationId: phoneOrId };
};

// Backwards-compat alias expected by some components
export const fetchChatHistory = getHistory;

export const getIaReply = async (message: string, token: string) => {
  console.warn('⚠️ getIaReply: Funcionalidade não implementada no backend');
  return { reply: 'Funcionalidade de IA não implementada' };
};

// --- Kanban Columns (user-specific) ---
// NOTA: Essas rotas não existem no backend atual - implementações mock para evitar erros
export const getKanbanColumns = async () => {
  console.warn('⚠️ getKanbanColumns: Funcionalidade não implementada no backend');
  return { columns: [] };
};

export const saveKanbanColumns = async (columns: any[]) => {
  console.warn('⚠️ saveKanbanColumns: Funcionalidade não implementada no backend');
  return { success: true };
};

// Helper to post an incoming message (used by integrations/webhooks). Includes optional source.
// NOTA: Essa rota não existe no backend atual - implementação mock para evitar erros
export const postIncomingMessage = async (clientName: string, message: string, source?: string) => {
  console.warn('⚠️ postIncomingMessage: Funcionalidade não implementada no backend');
  return { success: true };
};

// --- Clients CRUD ---
// NOTA: Essas rotas não existem no backend atual - implementações mock para evitar erros
export const getClients = async () => {
  console.warn('⚠️ getClients: Funcionalidade não implementada no backend');
  return [];
};

export const createClient = async (payload: any) => {
  console.warn('⚠️ createClient: Funcionalidade não implementada no backend');
  return { id: 'mock-id', ...payload };
};

export const updateClient = async (id: string, payload: any) => {
  console.warn('⚠️ updateClient: Funcionalidade não implementada no backend');
  return { id, ...payload };
};

export const deleteClient = async (id: string) => {
  console.warn('⚠️ deleteClient: Funcionalidade não implementada no backend');
  return { success: true };
};

// --- Transferências de Atendimento ---
export interface TransferenciaCartao {
  id: number;
  cartao_id: number;
  usuario_origem_id: number;
  usuario_destino_id: number;
  observacao?: string;
  coluna_origem_id?: number;
  coluna_destino_id?: number;
  created_at: string;
  usuario_origem?: {
    id: number;
    nome: string;
    email: string;
    foto?: string;
  };
  usuario_destino?: {
    id: number;
    nome: string;
    email: string;
    foto?: string;
  };
}

export interface EstatisticasTransferencias {
  total: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  porUsuarioOrigem: Array<{
    usuario_id: number;
    nome: string;
    total_enviadas: number;
  }>;
  porUsuarioDestino: Array<{
    usuario_id: number;
    nome: string;
    total_recebidas: number;
  }>;
  ultimasTransferencias: Array<{
    id: number;
    cartao_titulo: string;
    usuario_origem: string;
    usuario_destino: string;
    observacao?: string;
    created_at: string;
  }>;
}

export const transferirCartao = async (cartaoId: number, usuarioDestinoId: number, observacao?: string) => {
  const res = await api.post(`/cartoes/${cartaoId}/transferir`, {
    usuario_destino_id: usuarioDestinoId,
    observacao
  });
  return res.data;
};

export const getHistoricoTransferencias = async (cartaoId: number) => {
  const res = await api.get<{
    cartao_id: number;
    total: number;
    transferencias: TransferenciaCartao[];
  }>(`/cartoes/${cartaoId}/transferencias`);
  return res.data;
};

export const getEstatisticasTransferencias = async () => {
  const res = await api.get<EstatisticasTransferencias>('/transferencias/estatisticas');
  return res.data;
};

export const listarTransferencias = async (filters?: { usuario_id?: number; cartao_id?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (filters?.usuario_id) params.append('usuario_id', String(filters.usuario_id));
  if (filters?.cartao_id) params.append('cartao_id', String(filters.cartao_id));
  if (filters?.limit) params.append('limit', String(filters.limit));
  
  const res = await api.get<{
    total: number;
    transferencias: TransferenciaCartao[];
  }>(`/transferencias?${params.toString()}`);
  return res.data;
};
