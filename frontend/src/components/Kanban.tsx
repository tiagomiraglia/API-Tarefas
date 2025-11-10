import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Col, Row, Spinner, Button, OverlayTrigger, Tooltip, Badge, Dropdown, Modal as BsModal, Form as BsForm } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import MenuSidebar from './MenuSidebar';
import './Kanban.css';
// helpers and imports consolidated
import { getConversations, updateConversationStatus, cleanupDatabase, cleanupOldData, deleteConversation, getHistory, markHistoryRead, sendWhatsappMessage, type WhatsAppResponse, getKanbanColumns, saveKanbanColumns, syncWhatsappHistory, syncWhatsappHistoryChunk, sendMediaMessage, type SendMediaPayload } from '../services/api';
import { canonicalizeId } from '../utils/normalizeConversation';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import RealtimeStatus from './RealtimeStatus';
import WhatsAppConnectionsManager from './WhatsAppConnectionsManager';

// Helpers
function maskPhoneNumber(phone?: string) {
  if (!phone) return '';
  
  // Se tem @, extrai a parte antes do @
  let cleanNumber = phone.includes('@') ? phone.split('@')[0] : phone;
  
  // Remove todos os caracteres não numéricos
  cleanNumber = cleanNumber.replace(/\D/g, '');
  
  // Remove +55 ou 55 do início se presente
  if (cleanNumber.startsWith('55')) {
    cleanNumber = cleanNumber.substring(2);
  }
  
  // Formata números brasileiros
  if (cleanNumber.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return cleanNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanNumber.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleanNumber.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Se não conseguiu formatar, retorna apenas os números
  return cleanNumber;
}

// (removed unused formatDateTime)

function formatTimeOnly(date?: string) {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper para criar iniciais para avatar no card
function getInitials(nameOrPhone?: string) {
  if (!nameOrPhone) return '??';
  // se for nome com espaços, pega primeiras letras do primeiro e do último
  const cleaned = String(nameOrPhone).trim();
  if (!cleaned) return '??';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    // se for número, pega últimos 2 dígitos
    const onlyDigits = cleaned.replace(/\D/g, '');
    if (onlyDigits.length >= 2) return onlyDigits.slice(-2);
    return cleaned.slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
}

function getAvatarColor(seed?: string) {
  const s = (seed || '').toString();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360; // hue
  return `hsl(${h}, 60%, 40%)`;
}

// Colunas do Kanban - exportado para facilitar testes / reutilização
interface Column {
  id?: string; // optional stable id (may be provided by server)
  key: string;
  title: string;
  icon: string;
  color: string;
  desc: string;
  dynamicSource?: string; // e.g. 'whatsapp'
}

// Colunas padrão (usadas como fallback)
const DEFAULT_COLUMNS: Column[] = [
  { key: 'mensagens', title: 'Mensagens', icon: 'bi-chat-dots', color: '#007bff', desc: 'Conversas novas' },
  { key: 'pedido', title: 'Pedido Realizado', icon: 'bi-bag-check', color: '#fd7e14', desc: 'Pedidos feitos' },
  { key: 'producao', title: 'Produção/Separação', icon: 'bi-gear', color: '#20c997', desc: 'Em produção' },
  { key: 'concluido', title: 'Pedido Concluído', icon: 'bi-check-circle', color: '#0d6efd', desc: 'Pedidos prontos' },
  { key: 'finalizado', title: 'Finalizado', icon: 'bi-flag', color: '#6c757d', desc: 'Atendimentos finalizados' },
];

// Paleta maior de ícones suportados (bootstrap icons usados no projeto)
const ICON_OPTIONS = [
  'bi-chat-dots','bi-chat-left-text','bi-chat-right-dots','bi-person-circle','bi-people','bi-person-plus','bi-person-bounding-box',
  'bi-bag-check','bi-basket','bi-cart','bi-box-seam','bi-box','bi-briefcase',
  'bi-gear','bi-gear-fill','bi-sliders','bi-tools','bi-hammer',
  'bi-check-circle','bi-check2','bi-award','bi-star','bi-flag','bi-flag-fill',
  'bi-list','bi-list-ul','bi-layout-three-columns','bi-grid','bi-columns-gap',
  'bi-clock','bi-stopwatch','bi-calendar','bi-calendar-check','bi-alarm',
  'bi-envelope','bi-phone','bi-telephone','bi-chat-square-text','bi-chat-left',
  'bi-truck','bi-truck-flatbed','bi-truck-loading','bi-currency-dollar','bi-cash-stack',
  'bi-emoji-smile','bi-exclamation-triangle','bi-info-circle','bi-question-circle','bi-bell'
];

interface Conversation {
  id: string;
  canonicalId?: string; // forma canônica para merge (telefone dígitos)
  clientName?: string;
  phone?: string;
  status?: string;
  lastMessage?: string;
  lastMessageContent?: string;
  lastMessageTimestamp?: string;
  product?: string;
  value?: number;
  timestamp?: string;
  updated_at?: string;
  unread_count?: number; // backend unread counter
  messages?: Array<{
    content: string;
    timestamp: string;
    from: string;
  }>;
  isGroup?: boolean;
  senderName?: string; // name of the sender (useful for groups)
  unreadCount?: number;
}

// --- Status normalization helper ---
// Garante que o status de uma conversa corresponda a alguma coluna existente.
// Se vier um status antigo (ex: 'mensagens', 'producao', 'concluido', 'finalizado')
// ou qualquer outro não presente, mapeia para a coluna mais apropriada ou primeira.
function normalizeStatus(rawStatus: string | undefined, columns: Column[]): string | undefined {
  if (!columns || columns.length === 0) return rawStatus;
  if (!rawStatus) return columns[0].key; // fallback
  const existing = columns.find(c => c.key === rawStatus);
  if (existing) return rawStatus;
  const lower = rawStatus.toLowerCase();
  // Mapeamentos heurísticos
  const mapPairs: Array<[RegExp, string]> = [
    /^mensagens?$/i, // antigas 'mensagens'
    /^novas?$/i,
  ].map(r => [r, columns[0].key] as [RegExp, string]);
  // Tentativas semânticas para outras etapas comuns
  const semantic: Array<[RegExp, string | undefined]> = [
    [/pedido|order|compra|venda/, columns.find(c => /pedido/i.test(c.title))?.key],
    [/produ|separa|prep|monta/, columns.find(c => /produ|separ/i.test(c.title))?.key],
    [/final|conclu|done|finish/, columns.find(c => /final|conclu/i.test(c.title))?.key],
    [/pagamento|payment|aguard/i, columns.find(c => /pag/i.test(c.title))?.key],
    [/whats|zap/, columns.find(c => /whats/i.test(c.title))?.key],
  ];
  for (const [rgx, target] of [...mapPairs, ...semantic]) {
    if (target && rgx.test(lower)) return target;
  }
  // fallback final: primeira coluna
  return columns[0].key;
}

function Kanban() {
  // Estado para controlar menu de opções e modais
  // removed unused showOptions state
  const [showDelete, setShowDelete] = useState<string | null>(null); // id do card para confirmação de exclusão
  const [showReply, setShowReply] = useState<Conversation | null>(null); // conversa para responder
  const [chatHistory, setChatHistory] = useState<any[]>([]); // histórico da conversa (array de {id, from, content, timestamp, delivery_status})
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPageSize] = useState(40);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);
  const [hasNewWhileScrolled, setHasNewWhileScrolled] = useState(false);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [openConversationTarget, setOpenConversationTarget] = useState<{ clientId: string; searchText?: string } | null>(null);
  // Conversations already remotely synchronized (device history) to avoid redundant calls
  const remoteSyncedRef = useRef<Set<string>>(new Set());
  // Persist sync state across reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem('remote_synced_conversations');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) remoteSyncedRef.current = new Set(arr.map(String));
      }
    } catch {/* ignore */}
  }, []);
  const persistRemoteSynced = useCallback(() => {
    try { localStorage.setItem('remote_synced_conversations', JSON.stringify(Array.from(remoteSyncedRef.current))); } catch {/* ignore */}
  }, []);
  const [replyMessage, setReplyMessage] = useState(''); // mensagem digitada
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const highlightTimerRef = useRef<number | null>(null);
  const [newMessageIds, setNewMessageIds] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [syncingRemote, setSyncingRemote] = useState(false); // estado de sync remoto
  const [lastSyncStats, setLastSyncStats] = useState<{ id: string; imported: number; totalFetched: number; at: number } | null>(null);
  const [progressSync, setProgressSync] = useState<{ active: boolean; fetched: number; inserted: number; cursor: string | null; done: boolean }>({ active: false, fetched: 0, inserted: 0, cursor: null, done: false });
  const cancelSyncRef = useRef<boolean>(false);
  const [showOnlyNotSynced, setShowOnlyNotSynced] = useState(false);
  const [showCadastro, setShowCadastro] = useState<Conversation | null>(null); // conversa para cadastro
  // lastUpdate tracking removed (unused)
  const [showCleanup, setShowCleanup] = useState(false); // modal de limpeza
  const [cleanupLoading, setCleanupLoading] = useState(false); // loading da limpeza
  const [showConnectionsManager, setShowConnectionsManager] = useState(false);
  // Toast for discreet notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success'|'danger'|'info'|'warning'>('info');
  // Colunas editáveis (persistidas no localStorage)
  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const raw = localStorage.getItem('kanban_columns');
      if (raw) {
        const parsed = JSON.parse(raw) as Column[];
        // Basic validation
        if (Array.isArray(parsed) && parsed.every(p => p.key && p.title)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_COLUMNS;
  });
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [editingColumnsDraft, setEditingColumnsDraft] = useState<Column[]>([]);
  const [savingColumns, setSavingColumns] = useState(false);
  // Nome do usuário (fallback simples)
  const userName = useMemo(() => {
    try {
      return localStorage.getItem('user_name') || localStorage.getItem('username') || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }, []);

  // Limpa destaques/manual search
  const clearHighlights = useCallback(() => {
    try {
      setHighlightedIds([]);
      setMatchCount(0);
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current as any);
        highlightTimerRef.current = null;
      }
    } catch {}
  }, []);

  // Função helper para buscar histórico
  const fetchChatHistory = useCallback(async (clientId: string, page = 1, append = false) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await getHistory(clientId, token, page, historyPageSize);
      if (res && Array.isArray((res as any).messages)) {
        const msgs = (res as any).messages.map((m: any) => ({
          id: m.id,
          from: m.from || m['from'],
          content: m.content,
          timestamp: m.timestamp,
          delivery_status: m.delivery_status || m.deliveryStatus
        }));
        setHistoryTotal((res as any).total || msgs.length);
        setHistoryPage((res as any).page || page);
        setChatHistory(prev => append ? [...msgs, ...prev] : msgs);
        return msgs;
      }
      setChatHistory(prev => append ? prev : []);
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      if (!append) setChatHistory([]);
      return [];
    }
  }, [historyPageSize]);

  // Robust fetch with variants + pagination support
  const fetchChatHistoryWithFallback = useCallback(async (clientId: string, page = 1, append = false) => {
    const attempt = async (idVariant: string) => fetchChatHistory(idVariant, page, append);
    // try original
    let res = await attempt(clientId);
    if (Array.isArray(res) && res.length > 0) return res;
    if (clientId && clientId.includes('@')) {
      const stripped = clientId.split('@')[0];
      res = await attempt(stripped);
      if (Array.isArray(res) && res.length > 0) return res;
    }
    try {
      const digits = clientId.replace(/\D/g, '');
      if (digits) {
        const with55 = digits.startsWith('55') ? digits : '55' + digits;
        res = await attempt(with55);
        if (Array.isArray(res) && res.length > 0) return res;
        const without55 = digits.startsWith('55') ? digits.slice(2) : digits;
        res = await attempt(without55);
        if (Array.isArray(res) && res.length > 0) return res;
      }
    } catch {}
    return res || [];
  }, [fetchChatHistory]);

  // Função para buscar histórico ao abrir modal de resposta
  useEffect(() => {
    const run = async () => {
      if (!showReply) { setChatHistory([]); return; }
      setLoadingHistory(true);
      const msgs = await fetchChatHistoryWithFallback(showReply.id, 1, false);
      setLoadingHistory(false);
      // If opened via deep-link/event (not through handleOpenConversation) and local history is tiny, auto trigger remote sync
      try {
        if ((!msgs || msgs.length < 5) && !remoteSyncedRef.current.has(showReply.id)) {
          setSyncingRemote(true);
          syncWhatsappHistory(showReply.phone || showReply.id, 300)
            .then((res) => {
              remoteSyncedRef.current.add(showReply.id);
              persistRemoteSynced();
              setLastSyncStats({ id: showReply.id, imported: res.imported, totalFetched: res.totalFetched, at: Date.now() });
              setToastMessage(`Histórico sincronizado (${res.imported}/${res.totalFetched})`);
              setToastVariant('success');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3500);
              setTimeout(() => { fetchChatHistoryWithFallback(showReply.id, 1, false); }, 900);
            })
            .catch(() => {/* silent */})
            .finally(() => setSyncingRemote(false));
        }
      } catch { setSyncingRemote(false); }
      // auto scroll to bottom after initial load
      setTimeout(() => {
        try {
          if (historyContainerRef.current) historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
          atBottomRef.current = true;
        } catch {}
      }, 40);
    };
    run();
  }, [showReply, fetchChatHistoryWithFallback]);

  // Listen for requests from other components to open a conversation modal
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent;
        const detail = ce.detail || {};
        const clientId = detail.clientId || '';
        const searchText = detail.searchText as string | undefined;
        if (!clientId) return;
        // set showReply to open modal
        setShowReply({ id: clientId, phone: clientId });
        setOpenConversationTarget({ clientId, searchText });
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('openConversation', handler as EventListener);
    return () => { window.removeEventListener('openConversation', handler as EventListener); };
  }, []);

  // If route contains ?openClient=..., open that conversation on mount
  const location = useLocation();
  const navigate = useNavigate();
  // Evita loop de navegação ao abrir o Kanban do usuário
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (hasOpenedRef.current) return;
    try {
      const params = new URLSearchParams(location.search);
      const toOpen = params.get('openClient');
      if (toOpen) {
        setShowReply({ id: toOpen, phone: toOpen });
        setOpenConversationTarget({ clientId: toOpen, searchText: undefined });
        params.delete('openClient');
        navigate({ search: params.toString() }, { replace: true });
        hasOpenedRef.current = true;
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // when chatHistory loads after an external open request, scroll/highlight
  useEffect(() => {
    if (!openConversationTarget) return;
    // only act if modal is open for the same client
    if (!showReply || showReply.id !== openConversationTarget.clientId) return;
    // wait a tick to ensure DOM rendered
    setTimeout(() => {
      const search = openConversationTarget.searchText;
      let targetIndex = -1;
      if (search) {
        targetIndex = chatHistory.findIndex(m => String(m.content || '').toLowerCase().includes(search.toLowerCase()));
      }
      if (targetIndex === -1) targetIndex = chatHistory.length - 1;
      if (targetIndex >= 0) {
        const el = messageRefs.current[targetIndex];
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // temporary highlight
          setHighlightedIds([`${openConversationTarget.clientId}::${targetIndex}`]);
          // clear highlight after 3s
          setTimeout(() => setHighlightedIds([]), 3000);
        }
      }
      // clear request
      setOpenConversationTarget(null);
    }, 150);
  }, [chatHistory, openConversationTarget, showReply]);


  // Função para enviar mensagem no chat
  const handleSendReply = async () => {
    if (!showReply || !replyMessage.trim()) return;
    
    const messageToSend = replyMessage.trim();
    setReplyMessage(''); // Limpa o campo imediatamente
    
    // Adiciona a mensagem otimisticamente ao histórico
    const newMessage = {
      content: messageToSend,
      from: 'user',
      timestamp: new Date().toISOString(),
      deliveryStatus: 'sending' // Status inicial
    };
    setChatHistory(prev => [...prev, newMessage]);
    
    try {
      const token = localStorage.getItem('token') || '';
      console.log('📤 Enviando mensagem:', messageToSend, 'para:', showReply.id);
      
      const response: WhatsAppResponse = await sendWhatsappMessage(messageToSend, showReply.id, token);
      console.log('✅ Resposta do servidor:', response);
      
      // Atualiza o status da mensagem baseado na resposta
      const updatedMessage = {
        ...newMessage,
        deliveryStatus: response?.sentViaWhatsApp ? 'delivered' : 'pending'
      };
      
      setChatHistory(prev => prev.map(msg => 
        msg === newMessage ? updatedMessage : msg
      ));
      
      if (response && response.sentViaWhatsApp) {
        console.log('✅ Mensagem enviada via WhatsApp com sucesso');
      } else {
        console.log('⚠️ Mensagem salva no banco mas não foi enviada via WhatsApp');
      }
      
      // Força atualização das conversas para refletir a nova mensagem
      setTimeout(() => {
        fetchConversations();
        fetchChatHistory(showReply.id);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Marca a mensagem como erro
      const errorMessage = {
        ...newMessage,
        deliveryStatus: 'error'
      };
      setChatHistory(prev => prev.map(msg => 
        msg === newMessage ? errorMessage : msg
      ));
      
      // Restaura a mensagem no campo em caso de erro
      setReplyMessage(messageToSend);
      
      // Mostra alerta de erro
  // Mostra toast de erro
  setToastMessage('❌ Erro ao enviar mensagem. Verifique sua conexão e tente novamente.');
  setToastVariant('danger');
  setShowToast(true);
    }
  };
  const handleDelete = async (conv: Conversation) => {
    setShowDelete(null);
    await handleDeleteConversation(conv.id, conv.clientName || 'Cliente');
  };

  // Função para cadastrar cliente (simulação)
  // Parâmetros mantidos para futura integração
  const handleCadastro = () => {
    // Aqui você pode chamar o backend para cadastrar
    // Exemplo: await cadastrarCliente(conv.id, nome)
    setShowCadastro(null);
  };

  // Helper to open cadastro modal prefilled from a conversation
  const addContactFromConversation = (conv: Conversation | null) => {
    if (!conv) return;
    setShowCadastro({
      ...conv,
      clientName: conv.clientName || undefined,
      phone: conv.phone || conv.id
    });
  };

  // Funções de limpeza
  const handleCleanupAll = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Isso irá apagar TODAS as conversas e mensagens do banco de dados. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }
    
    setCleanupLoading(true);
    try {
      await cleanupDatabase();
      alert('✅ Banco de dados limpo com sucesso!');
  setToastMessage('✅ Banco de dados limpo com sucesso!');
  setToastVariant('success');
  setShowToast(true);
      // Força recarregamento das conversas
      setConversations([]);
      prevConversations.current = [];
      await fetchConversations();
    } catch (error) {
      console.error('❌ Erro ao limpar banco:', error);
  setToastMessage('❌ Erro ao limpar banco de dados. Verifique o console para mais detalhes.');
  setToastVariant('danger');
  setShowToast(true);
    } finally {
      setCleanupLoading(false);
      setShowCleanup(false);
    }
  };

  const handleCleanupOld = async (days: number) => {
    if (!window.confirm(`⚠️ Isso irá apagar todas as conversas e mensagens mais antigas que ${days} dias. Deseja continuar?`)) {
      return;
    }
    
    setCleanupLoading(true);
    try {
      const result = await cleanupOldData(days) as { messagesDeleted: number; conversationsDeleted: number };
      alert(`✅ Limpeza concluída!\n📊 ${result.messagesDeleted} mensagens removidas\n📊 ${result.conversationsDeleted} conversas removidas`);
  setToastMessage(`✅ Limpeza concluída!\n📊 ${result.messagesDeleted} mensagens removidas\n📊 ${result.conversationsDeleted} conversas removidas`);
  setToastVariant('success');
  setShowToast(true);
      // Força recarregamento das conversas
      await fetchConversations();
    } catch (error) {
      console.error('❌ Erro ao limpar dados antigos:', error);
  setToastMessage('❌ Erro ao limpar dados antigos. Verifique o console para mais detalhes.');
  setToastVariant('danger');
  setShowToast(true);
    } finally {
      setCleanupLoading(false);
      setShowCleanup(false);
    }
  };

  // Excluir conversa específica
  const handleDeleteConversation = async (conversationId: string, clientName: string) => {
    if (!window.confirm(`⚠️ Excluir conversa com ${clientName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('🗑️ Excluindo conversa:', conversationId);
      await deleteConversation(conversationId);
      
      // Remove da lista local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      prevConversations.current = prevConversations.current.filter(conv => conv.id !== conversationId);
      
      console.log('✅ Conversa excluída com sucesso');
      // Atualizar a lista para sincronizar com servidor
      setTimeout(() => fetchConversations(), 1000);
    } catch (error) {
      console.error('❌ Erro ao excluir conversa:', error);
      alert('❌ Erro ao excluir conversa. Tente novamente.');
  setToastMessage('❌ Erro ao excluir conversa. Tente novamente.');
  setToastVariant('danger');
  setShowToast(true);
    }
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const prevConversations = useRef<Conversation[]>([]);
  const [sortOrder, setSortOrder] = useState<{ [key: string]: 'asc' | 'desc' }>({});
  const [isDragging, setIsDragging] = useState(false);

  // Atualiza modal aberto se a conversa carregou lastMessage e ainda não há histórico local
  useEffect(() => {
    if (!showReply) return;
    if (chatHistory.length > 0) return;
    const conv = conversations.find(c => c.id === showReply.id || (showReply.canonicalId && c.canonicalId === showReply.canonicalId));
    if (conv && conv.lastMessage) {
      fetchChatHistoryWithFallback(showReply.id, 1, false);
    }
  }, [conversations, showReply, chatHistory.length, fetchChatHistoryWithFallback]);

  const fetchConversations = useCallback(async () => {
    try {
  const data = await getConversations();
  console.log('🛰️ [KANBAN] getConversations response length:', Array.isArray(data) ? data.length : typeof data, data && (data as any).slice ? (data as any).slice(0,3) : data);
      
      if (Array.isArray(data)) {
        // Compara apenas se houve mudanças significativas
        const currentString = JSON.stringify(data.map(d => ({ 
          id: d.id, 
          lastMessage: d.lastMessage || d.lastMessageContent,
          timestamp: d.timestamp || d.lastMessageTimestamp,
          status: d.status 
        })));
        const previousString = JSON.stringify(prevConversations.current.map(d => ({ 
          id: d.id, 
          lastMessage: d.lastMessage || d.lastMessageContent,
          timestamp: d.timestamp || d.lastMessageTimestamp,
          status: d.status 
        })));
        
        const isDifferent = currentString !== previousString;
        
  if (isDifferent || prevConversations.current.length === 0) {
          
          // Mapeia dados para garantir estrutura correta e deduplicar por um id canônico
            const byCanonical = new Map<string, Conversation>();
            const safeCanonical = (raw: string) => {
              const digits = raw.replace(/\D/g, '');
              // considera como telefone se entre 8 e 15 dígitos (evita UUID virar só dígitos parciais)
              if (digits.length >= 8 && digits.length <= 15) return digits;
              if (raw.includes('@')) return raw.split('@')[0];
              return raw; // mantém UUID ou nomes
            };
            for (const conv of data) {
              const lastMessage = conv.lastMessage || conv.lastMessageContent || '';
              const timestamp = conv.timestamp || conv.lastMessageTimestamp || conv.updated_at || undefined;
              const backendId = conv.id; // ID real do banco (pode ser UUID)
              const canonical = safeCanonical(conv.phone || backendId || '');

              const existing = byCanonical.get(canonical);
              const candidate: Conversation = {
                ...(existing || {}),
                ...conv,
                id: backendId,          // preserva ID original para chamadas ao backend
                canonicalId: canonical, // usado para merge e matching
                phone: conv.phone || canonical,
                lastMessage,
                timestamp,
              };

              if (!existing) {
                byCanonical.set(canonical, candidate);
              } else {
                try {
                  const eTs = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
                  const cTs = candidate.timestamp ? new Date(candidate.timestamp).getTime() : 0;
                  if (cTs >= eTs) byCanonical.set(canonical, candidate);
                } catch {
                  byCanonical.set(canonical, candidate);
                }
              }
            }

            // Filter out sessions that have no meaningful preview to avoid creating empty cards
            const formattedData = Array.from(byCanonical.values());

            // Normaliza status para garantir que cada conversa seja exibida em uma coluna existente
            const normalizedData = formattedData.map(c => {
              const normalizedStatus = normalizeStatus(c.status, columns);
              return normalizedStatus && normalizedStatus !== c.status ? { ...c, status: normalizedStatus } : c;
            });
            setConversations(normalizedData as Conversation[]);
            prevConversations.current = normalizedData as Conversation[];
        }
      }
    } catch (error) {
      console.error('❌ [KANBAN] Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, [conversations.length, columns]);

  // After fetching conversations, try to load missing lastMessage previews for a few items to improve UX
  useEffect(() => {
    if (!loading && conversations.length > 0) {
      const toFetch = conversations.filter(c => !c.lastMessage).slice(0, 6); // limit to first 6 to avoid spike
  if (toFetch.length === 0) return;
      (async () => {
        for (const conv of toFetch) {
          try {
            const history = await fetchChatHistoryWithFallback(conv.id);
            if (Array.isArray(history) && history.length > 0) {
              const last = history[history.length - 1];
              setConversations(prev => prev.map(p => p.id === conv.id ? ({ ...p, lastMessage: last.content || p.lastMessage || '', timestamp: last.timestamp || p.timestamp }) : p));
            }
          } catch (e) {
            // ignore per-conv errors
          }
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, conversations.length]);

  // Agrupa conversas por coluna para render mais eficiente
  const groupedConversations = useMemo(() => {
    const map: Record<string, Conversation[]> = {};
    columns.forEach(c => (map[c.key] = []));
    conversations.forEach(conv => {
      if (showOnlyNotSynced && remoteSyncedRef.current.has(conv.id)) return;
      const rawStatus = typeof conv.status === 'string' ? conv.status.trim() : conv.status;
      const normalized = normalizeStatus(rawStatus, columns);
      const key = normalized || columns[0]?.key || 'mensagens';
      if (!map[key]) map[key] = [];
      map[key].push({ ...conv, status: key });
    });
    // Fallback defensivo: se todas as colunas ficaram vazias mas há conversas, coloca tudo na primeira coluna
    if (conversations.length > 0 && columns.length > 0) {
      const allEmpty = columns.every(c => !map[c.key] || map[c.key].length === 0);
      if (allEmpty) {
        const firstKey = columns[0].key;
        map[firstKey] = conversations.map(c => ({ ...c, status: firstKey }));
        try { console.warn('[KANBAN][fallback] Todas as colunas vazias apesar de haver', conversations.length, 'conversas. Forçando render na coluna', firstKey); } catch {}
      }
    }
    return map;
  }, [conversations, columns, showOnlyNotSynced]);

  // 🚀 HANDLERS PARA NOTIFICAÇÕES EM TEMPO REAL
  const handleNewMessage = useCallback((conversationData: any) => {
    // Normaliza formas diferentes de payloads que o backend pode emitir.
    const normalize = (data: any): Conversation | null => {
        if (!data) return null;

        // If it's already in conversation shape
        if (data.id) {
          const idStr = String(data.id);
          const phone = data.phone || (typeof idStr === 'string' && idStr.includes('@') ? idStr.split('@')[0] : undefined);
          const isGroup = (idStr && (idStr.includes('@g') || idStr.includes('@g.us') || idStr.includes('g.us'))) || !!data.isGroup || !!data.is_group;
          return {
            id: idStr,
            clientName: data.clientName || data.client_name || undefined,
            lastMessage: data.lastMessage || data.lastMessageContent || data.last_message || '',
            status: data.status,
            timestamp: data.timestamp || data.updated_at || data.lastMessageTimestamp || undefined,
            phone,
            isGroup,
            senderName: data.senderName || data.pushname || data.notifyName || data.notify_name || undefined,
          } as Conversation;
        }

        // Wrapped response payloads
        if (data.response) {
          const r = data.response;
          const id = r.id || r.idMessage || r.chatId || r.from || r.sender;
          const idStr = id ? String(id) : undefined;
          const message = r.body || r.text || r.message || r.content || (Array.isArray(r) && r[0] && r[0].body) || '';
          const ts = r.timestamp || r.time || (r.t && new Date(r.t).toISOString());
          const phone = r.from || (typeof idStr === 'string' && idStr.includes('@') ? idStr.split('@')[0] : undefined);
          const isGroup = (idStr && (idStr.includes('@g') || idStr.includes('@g.us') || idStr.includes('g.us'))) || !!r.isGroup || !!r.is_group;
          if (idStr) {
            return {
              id: idStr,
              clientName: r.clientName || r.client_name,
              lastMessage: message,
              status: r.status,
              timestamp: ts,
              phone,
              isGroup,
              senderName: r.senderName || r.pushname || r.notifyName || r.notify_name || r.author || undefined,
            } as Conversation;
          }
        }

        // Minimal payloads like { from, body }
        if (data.from || data.body || data.text) {
          const id = data.from || data.chatId || data.sender;
          const idStr = id ? String(id) : String(Math.random());
          const phone = typeof idStr === 'string' && idStr.includes('@') ? idStr.split('@')[0] : idStr;
          const isGroup = (idStr && (idStr.includes('@g') || idStr.includes('@g.us') || idStr.includes('g.us'))) || !!data.isGroup || !!data.is_group;
          return {
            id: idStr,
            lastMessage: data.body || data.text || data.message || '',
            timestamp: data.timestamp || new Date().toISOString(),
            phone,
            isGroup,
            senderName: data.pushname || data.notifyName || data.author || undefined,
          } as Conversation;
        }

        return null;
    };

  const normalized = normalize(conversationData);

    if (!normalized) {
      // Se não conseguimos normalizar, força um refresh completo para garantir consistência
      fetchConversations();
      return;
    }

    // ensure id/phone use canonical form so masked numbers and raw numbers map to same conversation
    try {
      const can = canonicalizeId(normalized.id || normalized.phone || undefined);
      if (can) {
        normalized.id = can;
        normalized.phone = normalized.phone || can;
      }
    } catch (e) {
      // ignore
    }

    // If incoming payload has no explicit status, try to assign it to the WhatsApp-bound column
  if (!normalized.status) {
      const whatsappCol = columns.find(c => c.dynamicSource === 'whatsapp');
      normalized.status = whatsappCol ? whatsappCol.key : (columns[0]?.key || 'mensagens');
    }
  // Normaliza caso status ainda não exista
  normalized.status = normalizeStatus(normalized.status, columns);

    const isWhatsAppMsg = (() => {
      try {
        // common whatsapp identifiers: id/from containing '@' or properties indicating whatsapp
        const s = JSON.stringify(conversationData || {}).toLowerCase();
        return s.includes('@s.whatsapp.net') || s.includes('@c.us') || s.includes('whatsapp');
      } catch { return false; }
    })();

  setConversations(prev => {
    const incomingRawId = normalized.id;
    // gerar canonical para merge sem estragar UUID
    const safeCanonical = (raw?: string) => {
      if (!raw) return undefined;
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 15) return digits;
      if (raw.includes('@')) return raw.split('@')[0];
      return raw;
    };
    const incomingCanonical = safeCanonical(normalized.phone || incomingRawId);

    const existingIndex = prev.findIndex(c => c.id === incomingRawId || (incomingCanonical && c.canonicalId === incomingCanonical));
    if (existingIndex >= 0) {
        const updated = [...prev];
  updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: normalized.lastMessage,
          timestamp: normalized.timestamp,
      phone: normalized.phone || updated[existingIndex].phone,
      canonicalId: updated[existingIndex].canonicalId || incomingCanonical,
      status: normalizeStatus(normalized.status, columns)
        };

        // If it's a WhatsApp message, ensure highlight, mark as new and scroll to it
        if (isWhatsAppMsg) {
          try { setHighlightedIds(ids => Array.from(new Set([normalized.id, ...(ids || [])]))); } catch {}
          try { setNewMessageIds(ids => Array.from(new Set([normalized.id, ...(ids || [])]))); } catch {}
          // scroll shortly after DOM update
          setTimeout(() => {
            const el = document.querySelector(`[data-conv-id='${normalized.id}']`);
            if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }, 80);
        }
        return updated;
      }

      // Insere no topo quando é nova conversa
      // Insere no topo quando é nova conversa
  const newState = [{ ...normalized, canonicalId: incomingCanonical, status: normalizeStatus(normalized.status, columns) }, ...prev];
      if (isWhatsAppMsg) {
        try { setHighlightedIds(ids => Array.from(new Set([normalized.id, ...(ids || [])]))); } catch {}
        try { setNewMessageIds(ids => Array.from(new Set([normalized.id, ...(ids || [])]))); } catch {}
        setTimeout(() => {
          const el = document.querySelector(`[data-conv-id='${normalized.id}']`);
          if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 80);
      }
  return newState;
    });

    // --- Atualiza histórico aberto em tempo real (fluxo estilo WhatsApp Web) ---
    try {
      if (showReply?.id) {
        // gera variantes para comparação tolerante (com/sem @, com/sem 55)
        const genVariants = (v?: string) => {
          if (!v) return [] as string[];
          const s = String(v);
          const set = new Set<string>();
          set.add(s);
          if (s.includes('@')) set.add(s.split('@')[0]);
          const digits = s.replace(/\D/g, '');
          if (digits) {
            set.add(digits);
            if (!digits.startsWith('55')) set.add('55' + digits);
            if (digits.startsWith('55')) set.add(digits.substring(2));
            set.add(digits + '@c.us');
            if (!digits.startsWith('55')) set.add('55' + digits + '@c.us');
          }
          return Array.from(set);
        };
        const openVars = genVariants(showReply.id);
        const incVars = genVariants(normalized.id || normalized.phone);
        const intersects = incVars.some(iv => openVars.includes(iv));
        if (intersects && normalized.lastMessage) {
          setChatHistory(prev => {
            const already = prev.slice(-8).some(m => m.content === normalized.lastMessage && (Math.abs(new Date(m.timestamp || '').getTime() - new Date(normalized.timestamp||'').getTime()) < 1500));
            if (already) return prev;
            const isUserMsg = normalized.status === 'user';
            const newList = [...prev, { id: 'rt_' + Date.now(), from: isUserMsg ? 'user' : 'client', content: normalized.lastMessage, timestamp: normalized.timestamp || new Date().toISOString(), delivery_status: isUserMsg ? 'sent' : undefined }];
            return newList;
          });
          setTimeout(() => {
            try {
              if (historyContainerRef.current) {
                if (atBottomRef.current) {
                  historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
                } else {
                  setHasNewWhileScrolled(true);
                }
              }
            } catch {}
          }, 40);
        }
      }
    } catch (e) {
      // silencioso
    }
  
  }, [fetchConversations, columns, showReply]);

  // When user opens a conversation (reply modal), acknowledge it (remove 'new' and highlight)
  useEffect(() => {
    if (showReply?.id) {
      const id = showReply.id;
      setNewMessageIds(prev => prev.filter(x => x !== id));
      setHighlightedIds(prev => prev.filter(x => x !== id));
    }
  }, [showReply]);

  const handleStatusUpdate = useCallback((conversationId: string, newStatus: string) => {
  setConversations(prev => prev.map(conv => conv.id === conversationId ? { ...conv, status: newStatus } : conv));
  
  }, []);


  // 🚀 HOOK PARA NOTIFICAÇÕES EM TEMPO REAL
  useRealtimeNotifications({
    onNewMessage: handleNewMessage,
    onStatusUpdate: handleStatusUpdate
  });

  useEffect(() => {
    console.log('🎯 Kanban iniciado - carregando conversas');
    fetchConversations();
    // Tentar carregar colunas do servidor (se houver) e sincronizar com localStorage
    (async () => {
      try {
        const cols = await getKanbanColumns();
        if (Array.isArray(cols) && cols.length) {
          // Preserve server-provided id and dynamic_source if present
          const normalized = cols.map((c: any, i: number) => ({ id: c.id || c.uuid || undefined, key: c.key || c.col_key || `col_${i}`, title: c.title, icon: c.icon || 'bi-list', color: c.color || '#6c757d', desc: c.desc || '', dynamicSource: c.dynamic_source || c.dynamicSource || undefined }));
          setColumns(normalized);
          try { localStorage.setItem('kanban_columns', JSON.stringify(normalized)); } catch (e) {}
        }
      } catch (e) {
        console.log('⚠️ não foi possível carregar colunas do servidor, mantendo local');
      }
    })();
    // Intervalo aumentado para 30 segundos para reduzir carga (SSE é o principal)
    const interval = window.setInterval(() => {
      fetchConversations();
    }, 30000);
    return () => {
      clearInterval(interval as number);
    };
  }, [fetchConversations]);

  // Listen for session restored events from the connections manager
  useEffect(() => {
    // helper: generate sensible id variants to match conversation ids/phones
    const genVariants = (rawId?: string) => {
      if (!rawId) return [] as string[];
      const res = new Set<string>();
      const id = String(rawId).trim();
      res.add(id);

      // if contains @, add stripped part before @
      if (id.includes('@')) {
        const before = id.split('@')[0];
        res.add(before);
      }

      // normalize digits-only form
      const digits = id.replace(/\D/g, '');
      if (digits) {
        res.add(digits);
        // with country code 55
        if (!digits.startsWith('55')) res.add('55' + digits);
        // without country code
        if (digits.startsWith('55')) res.add(digits.replace(/^55/, ''));
        // with @c.us
        res.add(digits + '@c.us');
        if (!digits.startsWith('55')) res.add('55' + digits + '@c.us');
      }

      // also try adding common suffixes
      if (!id.includes('@') && id.length > 0) {
        res.add(id + '@c.us');
        res.add(id + '@s.whatsapp.net');
      }

      // fallback: alphanumeric cleaned
      const cleaned = id.replace(/[^a-z0-9]/gi, '');
      if (cleaned) res.add(cleaned);

      return Array.from(res);
    };

    const handler = async (e: Event) => {
      try {
        const ce = e as CustomEvent;
        const connId = ce.detail?.connectionId as string | undefined;

        // brief UI hint
        setToastMessage('Sessão WhatsApp restaurada. Atualizando lista...');
        setToastVariant('info');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Ensure we have latest conversations
        await fetchConversations();

        if (!connId) return;

        const variants = genVariants(connId);

        // Try to find a conversation in the current state that matches any variant
        const match = conversations.find(conv => {
          try {
            const fields = [conv.id, conv.phone, conv.clientName, conv.senderName].filter(Boolean).map(String);
            for (const v of variants) {
              for (const f of fields) {
                // compare cleaned forms
                const fv = f.replace(/\s+/g, '').toLowerCase();
                const vv = v.replace(/\s+/g, '').toLowerCase();
                if (fv === vv) return true;
                // also match if fv contains vv or vv contains fv (partial)
                if (fv.includes(vv) || vv.includes(fv)) return true;
              }
            }
          } catch (err) { /* ignore */ }
          return false;
        });

        if (match) {
          // scroll and highlight
          setHighlightedIds(ids => Array.from(new Set([match.id, ...(ids || [])])));
          setTimeout(() => {
            const el = document.querySelector(`[data-conv-id='${match.id}']`) as HTMLElement | null;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
          return;
        }

        // If not found, try to refetch and re-evaluate (in case backend added the conversation shortly after)
        await fetchConversations();
        const variants2 = genVariants(connId);
        const match2 = (prevConversations.current || []).find(conv => {
          try {
            const fields = [conv.id, conv.phone, conv.clientName, conv.senderName].filter(Boolean).map(String);
            for (const v of variants2) {
              for (const f of fields) {
                const fv = f.replace(/\s+/g, '').toLowerCase();
                const vv = v.replace(/\s+/g, '').toLowerCase();
                if (fv === vv) return true;
                if (fv.includes(vv) || vv.includes(fv)) return true;
              }
            }
          } catch (err) { }
          return false;
        });
        if (match2) {
          setHighlightedIds(ids => Array.from(new Set([match2.id, ...(ids || [])])));
          setTimeout(() => {
            const el = document.querySelector(`[data-conv-id='${match2.id}']`) as HTMLElement | null;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      } catch (err) { console.warn('Erro ao processar whatsappSessionRestored', err); }
    };
    window.addEventListener('whatsappSessionRestored', handler as EventListener);
    return () => window.removeEventListener('whatsappSessionRestored', handler as EventListener);
  }, [fetchConversations]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const conv = conversations.find(c => c.id === draggableId);
    if (!conv) return;
    const destKey = destination.droppableId;
    if (conv.status !== destKey) {
      await updateConversationStatus(conv.id, destKey);
      fetchConversations();
    }
  }, [conversations, fetchConversations]);

  // removed unused moveToNext

  // Inicia sincronização progressiva chunked (barra de progresso)
  const startProgressiveSync = useCallback(async (conv: Conversation) => {
  if (syncingRemote || progressSync.active) return;
  cancelSyncRef.current = false;
    setSyncingRemote(true);
    setProgressSync({ active: true, fetched: 0, inserted: 0, cursor: null, done: false });
  const phone = conv.phone || conv.canonicalId || conv.id;
    let totalFetched = 0;
    let totalInserted = 0;
    let cursor: string | null = null;
    const max = 300;
    try {
      for (let i = 0; i < 20; i++) {
  if (cancelSyncRef.current) break;
        const res: any = await syncWhatsappHistoryChunk(phone, cursor, 50, max);
        // Se backend retornou warning (sessão indisponível ou falha de fetch), encerra de forma amigável
        if (res && (res.warning === 'no_token' || res.warning === 'fetch_failed')) {
          setProgressSync(prev => ({ ...prev, active: true, done: true }));
          setToastMessage(res.warning === 'no_token' ? 'Sessão indisponível para sincronizar no momento.' : 'Dispositivo offline, histórico parcial carregado.');
          setToastVariant('warning');
          setShowToast(true);
          break;
        }
        totalFetched += res.batchFetched;
        totalInserted += res.inserted;
        cursor = res.nextCursor;
        const done = res.done || totalFetched >= max || res.batchFetched === 0;
  setProgressSync({ active: true, fetched: totalFetched, inserted: totalInserted, cursor, done });
  if (cancelSyncRef.current) break;
        if (done) break;
      }
  remoteSyncedRef.current.add(conv.id);
  persistRemoteSynced();
      setLastSyncStats({ id: conv.id, imported: totalInserted, totalFetched, at: Date.now() });
      setToastMessage(`Histórico sincronizado (${totalInserted}/${totalFetched})`);
      setToastVariant('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      const el = historyContainerRef.current;
      const prevBottom = el ? (el.scrollHeight - el.scrollTop) : 0;
      await fetchChatHistory(conv.id, 1, false);
      setTimeout(() => {
        if (el) {
          const newScrollTop = el.scrollHeight - prevBottom;
          el.scrollTop = newScrollTop < 0 ? 0 : newScrollTop;
        }
      }, 50);
    } catch (e) {
      setToastMessage('Falha na sincronização progressiva');
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setSyncingRemote(false);
  setTimeout(() => setProgressSync(p => ({ ...p, active: false })), 1200);
    }
  }, [syncingRemote, progressSync.active, fetchChatHistory]);

  // Abre a conversa (modal) e tenta garantir que o card tenha dados reais
  const handleOpenConversation = async (conv: Conversation) => {
    if (isDragging) return;
    setShowReply(conv);
    setConversations(prev => prev.map(c => c.id === conv.id ? ({ ...c, unread_count: 0 }) : c));
    try {
  const history = await fetchChatHistory(conv.id, 1, false);
      if (Array.isArray(history) && history.length > 0) {
        const last = history[history.length - 1];
        const lastContent = last.content || '';
        const lastTs = last.timestamp || new Date().toISOString();
        let sender: string | undefined;
        if (last.from && typeof last.from === 'string') {
          const f = String(last.from);
          if (f && f !== 'client' && f !== 'user') sender = f;
        }
        const isGrp = !!(conv.id && (conv.id.includes('@g') || conv.id.includes('@g.us') || conv.id.includes('g.us')) || (last.from && String(last.from).includes('@g')));
        setConversations(prev => prev.map(c => c.id === conv.id ? ({
          ...c,
          lastMessage: c.lastMessage || lastContent,
          timestamp: c.timestamp || lastTs,
          senderName: c.senderName || sender || c.clientName || undefined,
          isGroup: typeof c.isGroup === 'boolean' ? c.isGroup : isGrp,
          phone: c.phone || (conv.id.includes('@') ? conv.id.split('@')[0] : c.phone)
        }) : c));
        setShowReply(prev => prev ? ({
          ...prev,
          lastMessage: prev.lastMessage || lastContent,
          timestamp: prev.timestamp || lastTs,
          senderName: prev.senderName || sender || prev.clientName || undefined,
          isGroup: typeof prev.isGroup === 'boolean' ? prev.isGroup : isGrp
        }) : prev);
      }
      // Se histórico local é pequeno e ainda não sincronizamos, dispara sync remoto
  const canon = conv.canonicalId || conv.id;
      if ((!history || history.length < 5) && !remoteSyncedRef.current.has(canon)) {
        await startProgressiveSync(conv);
      }
    } catch (e) {
      console.warn('⚠️ handleOpenConversation history fetch falhou:', (e as any)?.message || e);
    }
  };
  

  const handleSearch = () => {
    const q = (searchQuery || '').trim().toLowerCase();
    clearHighlights();
    if (!q) return;
    // Find conversations that match id, phone, clientName, or lastMessage
    const matches = conversations.filter(c => {
      const parts = [c.id, c.phone, c.clientName, c.lastMessage].filter(Boolean).map(s => String(s).toLowerCase());
      return parts.some(p => p.includes(q));
    });
    if (matches.length === 0) {
      // no matches - brief feedback
      setHighlightedIds([]);
      setMatchCount(0);
      return;
    }
    const ids = matches.map(m => m.id);
    setHighlightedIds(ids);
    setMatchCount(ids.length);

    // Scroll to the first matched conversation's column
    const first = matches[0];
    const colKey = first.status || columns[0]?.key;
    // find column element by droppableId data attr
    const colEl = document.querySelector(`[data-droppable-id='${colKey}']`);
    if (colEl) {
      (colEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Remove highlights after 6 seconds
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedIds([]);
  setMatchCount(0);
  highlightTimerRef.current = null;
    }, 6000) as unknown as number;
  };

  // Live search (debounced): triggers handleSearch after user stops typing
  useEffect(() => {
    // don't trigger on initial mount when searchQuery is empty
    const debounceMs = 350;
    const id = window.setTimeout(() => {
      // If query is empty, clear highlights (handleSearch handles this too)
      handleSearch();
    }, debounceMs) as unknown as number;
    return () => window.clearTimeout(id as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
  <div style={{ display: 'flex', width: '100vw', height: '100vh', minHeight: '100vh', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
      <MenuSidebar />
      <div className="kanban-main flex-grow-1 d-flex flex-column" style={{ padding: 0, height: '100vh', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 32px 0 32px' }}>
          <h3 className="mb-0" style={{ fontWeight: 700 }}>
            <i className="bi bi-kanban me-2 text-primary" />Painel de Atendimento
            {/* Realtime status moved to the RealtimeStatus component below */}
          </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <BsForm.Control
                    type="search"
                    placeholder="Buscar conversa (nome, número, texto)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                    style={{ width: 260, height: 34 }}
                    size="sm"
                  />
                  <Button variant="outline-secondary" size="sm" onClick={() => handleSearch()} title="Buscar">
                    <i className="bi bi-search" />
                  </Button>
                </div>
            <small className="text-muted me-2">
              Total: {conversations.length} {showOnlyNotSynced ? 'não sincronizadas' : 'conversas'}
            </small>
            <Button variant={showOnlyNotSynced ? 'primary' : 'outline-secondary'} size="sm" style={{ fontSize: 11 }} onClick={() => setShowOnlyNotSynced(s => !s)} title="Mostrar apenas conversas sem sync">
              {showOnlyNotSynced ? 'Mostrar todas' : 'Não sincronizadas'}
            </Button>
            {matchCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge bg="warning" text="dark">{matchCount} encontrado(s)</Badge>
              </div>
            )}
            {/* Compact realtime badges next to the total and action buttons */}
            <RealtimeStatus compact showMessages={false} onOpenConnections={() => setShowConnectionsManager(true)} />
              <Button variant="outline-secondary" size="sm" onClick={() => { setEditingColumnsDraft(columns); setShowEditColumns(true); }} style={{ fontSize: '12px' }} title="Editar colunas">
                <i className="bi bi-pencil-square me-1" />Colunas
              </Button>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowCleanup(true)}
              style={{ fontSize: '12px' }}
            >
              <i className="bi bi-trash me-1" />
              Limpar Dados
            </Button>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={fetchConversations}
              style={{ fontSize: '12px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Atualizando...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="mb-3" style={{ fontSize: 16, padding: '0 32px' }}>
          Olá, <b>{userName}</b>! Organize os atendimentos e pedidos arrastando os cards entre as etapas.
        </div>
  {/* RealtimeStatus compact is now inline in the header */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 16px 0 32px', position: 'relative' }}>
            {/* Setas de navegação lateral */}
            <button
              style={{ position: 'absolute', left: 0, top: '50%', zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transform: 'translateY(-50%)' }}
              onClick={() => {
                const row = document.querySelector('.kanban-row');
                if (row) row.scrollLeft -= 340;
              }}
              title="Mover para a esquerda"
            >
              <i className="bi bi-arrow-left" style={{ fontSize: 22 }} />
            </button>
            <button
              style={{ position: 'absolute', right: 0, top: '50%', zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transform: 'translateY(-50%)' }}
              onClick={() => {
                const row = document.querySelector('.kanban-row');
                if (row) row.scrollLeft += 340;
              }}
              title="Mover para a direita"
            >
              <i className="bi bi-arrow-right" style={{ fontSize: 22 }} />
            </button>
            <DragDropContext
              onBeforeCapture={() => setIsDragging(true)}
              onDragEnd={(result) => { setIsDragging(false); onDragEnd(result); }}
              onDragStart={() => setIsDragging(true)}
            >
              <Row className="kanban-row" style={{ overflowX: 'auto', flexWrap: 'nowrap', flex: 1, minHeight: 0 }}>
                {columns.map((col: Column) => {
                  const order = sortOrder[col.key] || 'desc';
                  const list = groupedConversations[col.key] || [];
                  // Put highlighted/matched conversations first in this column for visibility
                  const matchedInCol = list.filter(l => highlightedIds.includes(l.id));
                  const restInCol = list.filter(l => !highlightedIds.includes(l.id));
                  const sorted = [...matchedInCol, ...restInCol].sort((a: Conversation, b: Conversation) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    return order === 'desc'
                      ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                  });
                  return (
                    <Droppable droppableId={col.key} key={col.key}>
                      {(provided) => (
                          <Col
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            data-droppable-id={col.key}
                            className="kanban-col"
                            style={{ width: 340, minWidth: 340, maxWidth: 340, marginRight: 18 }}
                          >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                            <i className={`bi ${col.icon} me-2`} style={{ color: col.color, fontSize: 22 }} />
                            <span style={{ fontWeight: 600, fontSize: 17 }}>{col.title}</span>
                            <OverlayTrigger placement="top" overlay={<Tooltip>{col.desc}</Tooltip>}>
                              <i className="bi bi-question-circle text-muted ms-1" style={{ fontSize: 15, cursor: 'pointer' }} />
                            </OverlayTrigger>
                            <Dropdown style={{ marginLeft: 'auto' }}>
                              <Dropdown.Toggle variant="light" style={{ fontSize: 13, padding: '2px 10px', border: '1px solid #ddd' }}>
                                {order === 'desc' ? 'Mais recentes' : 'Mais antigas'}
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item active={order === 'desc'} onClick={() => setSortOrder(s => ({ ...s, [col.key]: 'desc' }))}>Mais recentes primeiro</Dropdown.Item>
                                <Dropdown.Item active={order === 'asc'} onClick={() => setSortOrder(s => ({ ...s, [col.key]: 'asc' }))}>Mais antigas primeiro</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                          <div style={{ minHeight: 80, maxHeight: 600, overflowY: 'auto' }}>
                            {list.length === 0 ? (
                              <div className="text-muted" style={{ fontSize: 14, marginTop: 12 }}>Nenhum item nesta etapa.</div>
                            ) : (
                              sorted.slice(0, 10).map((conv: Conversation, idx: number) => (
                                <Draggable draggableId={conv.id} index={idx} key={conv.id}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.9 : 1,
                                        marginBottom: 10,
                                        zIndex: snapshot.isDragging ? 12 : undefined
                                      }}
                                      className={`kanban-fadein ${highlightedIds.includes(conv.id) ? 'kanban-highlight' : ''}`}
                                      data-conv-id={conv.id}
                                    >
                                      <Card
                                        className={`kanban-card shadow-sm tooltip-hover-card ${newMessageIds.includes(conv.id) ? 'kanban-new' : ''}`}
                                        style={{ borderLeft: `4px solid ${col.color}`, cursor: 'pointer', borderRadius: 8 }}
                                        onClick={() => handleOpenConversation(conv)}
                                      >
                                        <Card.Body style={{ padding: '10px 12px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: getAvatarColor(conv.senderName || conv.clientName || conv.phone || conv.id), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                              {getInitials(conv.senderName || conv.clientName || conv.phone || conv.id)}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                  {conv.senderName ? `${conv.senderName}${conv.isGroup ? ' • Grupo' : ''}` : (conv.clientName || maskPhoneNumber(conv.phone || conv.id))}
                                                </div>
                                                <div style={{ textAlign: 'right', color: '#6c757d', fontSize: 12, flexShrink: 0 }}>
                                                  <div>{conv.timestamp ? formatTimeOnly(conv.timestamp) : ''}</div>
                                                  { (conv as any).unreadCount > 0 || (conv as any).unread_count > 0 ? (
                                                    <Badge bg="success" style={{ marginTop: 6, fontSize: 12 }}>
                                                      {(conv as any).unreadCount || (conv as any).unread_count}
                                                    </Badge>
                                                  ) : null }
                                                  {/* Badge de sync recente */}
                                                  {lastSyncStats && lastSyncStats.id === conv.id && Date.now() - lastSyncStats.at < 60000 && (
                                                    <Badge bg="info" style={{ marginTop: 4, fontSize: 10 }}>sync</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div style={{ color: '#6c757d', fontSize: 13, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.lastMessage && conv.lastMessage.trim().length > 0 ? conv.lastMessage : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Nenhuma mensagem ainda</span>}
                                              </div>
                                            </div>
                                          </div>
                                        </Card.Body>
                                      </Card>

                                      {/* Per-conversation modals */}
                                      <BsModal show={showDelete === conv.id} onHide={() => setShowDelete(null)} centered>
                                        <BsModal.Header closeButton>
                                          <BsModal.Title>Confirmar exclusão</BsModal.Title>
                                        </BsModal.Header>
                                        <BsModal.Body>Tem certeza que deseja excluir esta conversa?</BsModal.Body>
                                        <BsModal.Footer>
                                          <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancelar</Button>
                                          <Button variant="danger" onClick={() => handleDelete(conv)}>Excluir</Button>
                                        </BsModal.Footer>
                                      </BsModal>

                                      <BsModal show={showCadastro?.id === conv.id} onHide={() => setShowCadastro(null)} centered>
                                        <BsModal.Header closeButton>
                                          <BsModal.Title>
                                            <i className="bi bi-person-plus me-2" />Cadastrar cliente
                                          </BsModal.Title>
                                        </BsModal.Header>
                                        <BsModal.Body>
                                          <BsForm.Group>
                                            <BsForm.Label>Nome do cliente</BsForm.Label>
                                            <BsForm.Control type="text" placeholder="Digite o nome..." />
                                          </BsForm.Group>
                                          <div className="mt-3 text-muted" style={{ fontSize: 14 }}>
                                            <strong>Telefone:</strong> {maskPhoneNumber(showCadastro?.phone || showCadastro?.id)}
                                          </div>
                                        </BsModal.Body>
                                        <BsModal.Footer>
                                          <Button variant="secondary" onClick={() => setShowCadastro(null)}>Cancelar</Button>
                                          <Button variant="success" onClick={handleCadastro}>
                                            <i className="bi bi-check-lg me-1" />Cadastrar
                                          </Button>
                                        </BsModal.Footer>
                                      </BsModal>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        </Col>
                      )}
                    </Droppable>
                  );
                })}
              </Row>
            </DragDropContext>
          </div>
        )}
        <div className="mt-4 text-muted" style={{ fontSize: 15, textAlign: 'center', paddingBottom: 16 }}>
          <i className="bi bi-lightbulb me-2 text-warning" />Arraste ou avance as conversas para organizar o fluxo de atendimento e pedidos.<br />
          Cada etapa pode ser personalizada conforme o processo do seu negócio.
        </div>

        {/* Modal de limpeza de dados */}
        {/* Modal de conversa / responder */}
        <BsModal show={!!showReply} onHide={() => setShowReply(null)} size="lg" centered>
          <BsModal.Header closeButton>
            <BsModal.Title>
              {showReply ? (showReply.senderName || showReply.clientName || maskPhoneNumber(showReply.phone || showReply.id)) : 'Conversa'}
            </BsModal.Title>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {(syncingRemote || progressSync.active) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, minWidth: 190 }}>
                  <Spinner animation="border" size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11 }}>Sync {progressSync.done ? 'ok' : ''}</div>
                      {progressSync.active && !progressSync.done && (
                        <button
                          type="button"
                          className="btn btn-link p-0 m-0"
                          style={{ fontSize: 10 }}
                          onClick={() => { cancelSyncRef.current = true; setToastMessage('Sync cancelado'); setToastVariant('warning'); setShowToast(true); setTimeout(()=> setShowToast(false), 2500); }}
                        >Cancelar</button>
                      )}
                    </div>
                    <div style={{ position: 'relative', height: 6, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset:0, width: `${Math.min(100, (progressSync.fetched/300)*100)}%`, background: '#0d6efd', transition: 'width .3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <small style={{ fontSize: 10 }}>{progressSync.fetched}/300</small>
                      {progressSync.done && <small style={{ fontSize: 10, color: '#198754' }}>Pronto</small>}
                    </div>
                  </div>
                </div>
              )}
              <Button variant="outline-primary" size="sm" onClick={() => { if (showReply) { fetchChatHistoryWithFallback(showReply.id, 1, false); } }} title="Atualizar histórico"><i className="bi bi-arrow-clockwise" /></Button>
              {showReply && chatHistory.length > 0 && chatHistory.length < 8 && !syncingRemote && !remoteSyncedRef.current.has(showReply.id) && (
                <Button variant="outline-success" size="sm" onClick={() => {
                  setSyncingRemote(true);
                  syncWhatsappHistory(showReply.phone || showReply.id, 300).then(res => {
                    remoteSyncedRef.current.add(showReply.id);
                    persistRemoteSynced();
                    setLastSyncStats({ id: showReply.id, imported: res.imported, totalFetched: res.totalFetched, at: Date.now() });
                    setToastMessage(`Histórico sincronizado (${res.imported}/${res.totalFetched})`);
                    setToastVariant('success');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3500);
                    setTimeout(() => fetchChatHistoryWithFallback(showReply.id, 1, false), 800);
                  }).finally(() => setSyncingRemote(false));
                }} title="Sincronizar histórico remoto">
                  <i className="bi bi-cloud-download" />
                </Button>
              )}
              <Button variant="outline-secondary" size="sm" onClick={() => { if (showReply) { setShowDelete(showReply.id); } }}>Excluir</Button>
              <Button variant="outline-primary" size="sm" onClick={() => addContactFromConversation(showReply)}>Adicionar contato</Button>
            </div>
          </BsModal.Header>
          <BsModal.Body style={{ maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
              ref={el => { historyContainerRef.current = el; }}
              onScroll={async e => {
                const el = e.currentTarget;
        // detect bottom
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
        atBottomRef.current = nearBottom;
        if (nearBottom) setHasNewWhileScrolled(false);
                if (el.scrollTop < 40 && chatHistory.length < historyTotal) {
                  // load older page
                  const nextPage = historyPage + 1;
                  const beforeHeight = el.scrollHeight;
                  await fetchChatHistory(showReply!.id, nextPage, true);
                  setHistoryPage(nextPage);
                  // maintain scroll position after prepend
                  setTimeout(() => {
                    const afterHeight = el.scrollHeight;
                    el.scrollTop = afterHeight - beforeHeight;
                  }, 20);
                }
                // mark as read when scrolled near bottom
                if (nearBottom) {
                  try {
                    const token = localStorage.getItem('token') || '';
                    markHistoryRead(showReply!.id, token).catch(()=>{});
                  } catch {}
                }
              }}
              style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
              {hasNewWhileScrolled && (
                <div style={{ position: 'sticky', bottom: 8, display: 'flex', justifyContent: 'center' }}>
                  <Button size="sm" variant="primary" onClick={() => { if (historyContainerRef.current) { historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight; atBottomRef.current = true; setHasNewWhileScrolled(false); } }}>Novas mensagens ↓</Button>
                </div>
              )}
              {loadingHistory ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 160 }}>
                  <Spinner animation="border" />
                </div>
              ) : (
                (chatHistory && chatHistory.length > 0) ? (
                  chatHistory.map((m, i) => {
                    const isUser = m.from === 'user';
                    const status = m.delivery_status || m.deliveryStatus;
                    const statusIcon = isUser ? (status === 'read' ? 'bi-check2-all text-primary' : status === 'delivered' ? 'bi-check2-all' : status === 'sent' ? 'bi-check2' : 'bi-check') : '';
                    const contentLower = (m.content || '').toLowerCase();
                    const mediaType = (m as any).media_type;
                    let renderContent: any = m.content;
                    if (mediaType === 'image' || (!mediaType && contentLower.startsWith('[imagem]'))) {
                      // imagem: não temos a base64 original; mantemos legenda após marcador
                      const caption = m.content.replace(/^\[imagem\]\s*/i,'');
                      renderContent = (<div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <div style={{width:180,height:120,background:'#eee',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#888',fontSize:12}}>Imagem</div>
                        {caption && <div style={{whiteSpace:'pre-wrap'}}>{caption}</div>}
                      </div>);
                    } else if (mediaType === 'file' || (!mediaType && contentLower.startsWith('[arquivo]'))) {
                      const caption = m.content.replace(/^\[arquivo\]\s*/i,'');
                      renderContent = (
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <i className="bi bi-paperclip" />
                          <span style={{whiteSpace:'pre-wrap'}}>{caption || 'Arquivo enviado'}</span>
                        </div>
                      );
                    } else if (mediaType === 'location' || (!mediaType && contentLower.startsWith('[localização]'))) {
                      const rest = m.content.replace(/^\[localização\]\s*/i,'');
                      renderContent = (
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <i className="bi bi-geo-alt" /> <strong>Localização</strong>
                          </div>
                          <span style={{whiteSpace:'pre-wrap',fontSize:13}}>{rest}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id || i} ref={r => { messageRefs.current[i] = r; }} style={{ marginBottom: 8, display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                        <div style={{ background: isUser ? '#dcf8c6' : '#fff', padding: '8px 10px', borderRadius: 8, maxWidth: '70%', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)', position: 'relative' }}>
                          <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{renderContent}</div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{m.timestamp ? formatTimeOnly(m.timestamp) : ''}</span>
                            {statusIcon && <i className={`bi ${statusIcon}`} style={{ fontSize: 14 }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted">Nenhuma mensagem ainda</div>
                )
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                <BsForm.Control as="textarea" rows={1} value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Digite sua resposta..." onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Button size="sm" variant="outline-secondary" title="Anexar mídia" onClick={() => fileInputRef.current?.click()} disabled={sendingMedia}>
                    <i className="bi bi-paperclip" />
                  </Button>
                  <Button size="sm" variant="outline-secondary" title="Enviar localização" disabled={sendingMedia} onClick={() => {
                    if (!showReply) return;
                    if (!navigator.geolocation) { setToastMessage('Geolocalização não suportada'); setToastVariant('warning'); setShowToast(true); return; }
                    navigator.geolocation.getCurrentPosition(async pos => {
                      try {
                        setSendingMedia(true);
                        await sendMediaMessage(showReply.id, { type:'location', lat: pos.coords.latitude, lng: pos.coords.longitude, title: 'Localização atual' });
                        setToastMessage('Localização enviada'); setToastVariant('success'); setShowToast(true); setTimeout(()=>setShowToast(false),2500);
                        fetchChatHistory(showReply.id,1,false);
                      } catch { setToastMessage('Falha ao enviar localização'); setToastVariant('danger'); setShowToast(true); }
                      finally { setSendingMedia(false); }
                    }, () => { setToastMessage('Não foi possível obter localização'); setToastVariant('warning'); setShowToast(true); });
                  }}>
                    <i className="bi bi-geo-alt" />
                  </Button>
                  {sendingMedia && <small style={{ color:'#0d6efd' }}>Enviando mídia...</small>}
                </div>
                <input ref={fileInputRef} type="file" style={{ display:'none' }} multiple={false} onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file || !showReply) return;
                  try {
                    setSendingMedia(true);
                    const arrBuf = await file.arrayBuffer();
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));
                    const isImage = /^image\//.test(file.type);
                    const payload: SendMediaPayload = isImage ? { type:'image', base64: `data:${file.type};base64,${base64}`, filename: file.name, caption: replyMessage.trim() || undefined } : { type:'file', base64: `data:${file.type};base64,${base64}`, filename: file.name, caption: replyMessage.trim() || undefined } as any;
                    await sendMediaMessage(showReply.id, payload);
                    setReplyMessage('');
                    setToastMessage(isImage ? 'Imagem enviada' : 'Arquivo enviado'); setToastVariant('success'); setShowToast(true); setTimeout(()=>setShowToast(false),2500);
                    fetchChatHistory(showReply.id,1,false);
                  } catch (err) {
                    console.error('erro envio mídia', err); setToastMessage('Falha ao enviar mídia'); setToastVariant('danger'); setShowToast(true);
                  } finally { setSendingMedia(false); if (fileInputRef.current) fileInputRef.current.value=''; }
                }} />
              </div>
              <Button variant="primary" onClick={handleSendReply} disabled={!replyMessage.trim()}>Enviar</Button>
            </div>
          </BsModal.Body>
        </BsModal>
        <BsModal show={showCleanup} onHide={() => setShowCleanup(false)} centered>
          <BsModal.Header closeButton>
            <BsModal.Title>
              <i className="bi bi-trash me-2" />Limpeza de Dados
            </BsModal.Title>
          </BsModal.Header>
          <BsModal.Body>
            <div className="mb-3">
              <h6>⚠️ Atenção: Estas ações são irreversíveis!</h6>
              <p className="text-muted mb-3">
                Use estas opções para limpar dados antigos ou resetar completamente o sistema.
              </p>
            </div>
            
            <div className="d-grid gap-2">
              <Button 
                variant="danger" 
                onClick={handleCleanupAll}
                disabled={cleanupLoading}
                style={{ marginBottom: '8px' }}
              >
                {cleanupLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-exclamation-triangle me-2" />
                    Limpar TUDO (Reset Completo)
                  </>
                )}
              </Button>
              
              <Button 
                variant="warning" 
                onClick={() => handleCleanupOld(7)}
                disabled={cleanupLoading}
                style={{ marginBottom: '8px' }}
              >
                <i className="bi bi-calendar-minus me-2" />
                Limpar dados de +7 dias
              </Button>
              
              <Button 
                variant="outline-warning" 
                onClick={() => handleCleanupOld(30)}
                disabled={cleanupLoading}
                style={{ marginBottom: '8px' }}
              >
                <i className="bi bi-calendar-minus me-2" />
                Limpar dados de +30 dias
              </Button>
            </div>
            
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Dica:</strong> Use a limpeza por dias para manter apenas conversas recentes. 
                O reset completo apaga tudo e é útil para começar do zero.
              </small>
            </div>
          </BsModal.Body>
          <BsModal.Footer>
            <Button variant="secondary" onClick={() => setShowCleanup(false)}>
              Cancelar
            </Button>
          </BsModal.Footer>
        </BsModal>
  {/* Modal de edição de colunas */}
  <BsModal show={showEditColumns} onHide={() => setShowEditColumns(false)} centered size="lg" fullscreen="sm-down">
          <BsModal.Header closeButton>
            <BsModal.Title>
              <i className="bi bi-columns-gap me-2" />Editar colunas
            </BsModal.Title>
          </BsModal.Header>
          <BsModal.Body>
            <p className="text-muted">Você pode adicionar, remover ou renomear as colunas do seu fluxo. As mudanças são salvas localmente no seu navegador.</p>
            {editingColumnsDraft.map((col, idx) => (
              <div key={col.key} className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
                <Dropdown>
                  <Dropdown.Toggle variant="link" bsPrefix="p-0 border-0 bg-transparent" style={{ padding: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: col.color || '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', cursor: 'pointer' }}>
                      <i className={`bi ${col.icon || 'bi-list'}`} style={{ color: '#fff', fontSize: 18 }} />
                    </div>
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ minWidth: 220, padding: 8, maxWidth: 420, maxHeight: 260, overflowY: 'auto' }}>
                    <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                      {ICON_OPTIONS.map(opt => (
                        <Button
                          key={opt}
                          variant="light"
                          size="sm"
                          onClick={() => {
                            const copy = [...editingColumnsDraft];
                            copy[idx] = { ...copy[idx], icon: opt };
                            setEditingColumnsDraft(copy);
                          }}
                          aria-label={opt.replace('bi-', '')}
                          title={opt.replace('bi-', '')}
                          style={{
                            width: 44,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            borderRadius: 6
                          }}
                        >
                          <i className={`bi ${opt}`} style={{ fontSize: 18 }} />
                        </Button>
                      ))}
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <BsForm.Control
                    value={col.title}
                    onChange={e => {
                      const copy = [...editingColumnsDraft];
                      copy[idx] = { ...copy[idx], title: e.target.value };
                      setEditingColumnsDraft(copy);
                    }}
                    style={{ flex: 1, height: 36, padding: '6px 10px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BsForm.Check
                      type="checkbox"
                      id={`dynamic-whatsapp-${idx}`}
                      label="WhatsApp"
                      checked={col.dynamicSource === 'whatsapp'}
                      onChange={e => {
                        const copy = [...editingColumnsDraft];
                        // If checking this one, unset others
                        if (e.target.checked) {
                          for (let j = 0; j < copy.length; j++) {
                            copy[j] = { ...copy[j], dynamicSource: undefined };
                          }
                          copy[idx] = { ...copy[idx], dynamicSource: 'whatsapp' };
                        } else {
                          copy[idx] = { ...copy[idx], dynamicSource: undefined };
                        }
                        setEditingColumnsDraft(copy);
                      }}
                    />
                    <input
                      type="color"
                      value={col.color || '#6c757d'}
                      onChange={e => {
                        const copy = [...editingColumnsDraft];
                        copy[idx] = { ...copy[idx], color: e.target.value };
                        setEditingColumnsDraft(copy);
                      }}
                      style={{ width: 36, height: 28, border: 'none', background: 'transparent' }}
                    />
                    <Button variant="outline-danger" size="sm" onClick={async () => {
                      const copyColumns = [...editingColumnsDraft];
                      const target = copyColumns[idx];
                      // If trying to remove dynamic column, require reassign
                      if (target.dynamicSource === 'whatsapp') {
                        const otherCols = copyColumns.filter((_, i) => i !== idx);
                        if (otherCols.length === 0) {
                          alert('Não é possível remover a única coluna vinculada ao WhatsApp. Crie outra coluna antes.');
                          return;
                        }
                        const names = otherCols.map(c => `${c.key}:${c.title}`).join('\n');
                        const pick = window.prompt('Esta coluna está vinculada ao WhatsApp. Escolha a key da coluna para reatribuir as conversas:\n' + names);
                        if (!pick) return; // cancel
                        const found = otherCols.find(c => c.key === pick);
                        if (!found) { alert('Coluna não encontrada. Ação cancelada.'); return; }
                        // move conversations locally (best effort)
                        for (const conv of conversations) {
                          if (conv.status === target.key) {
                            try { await updateConversationStatus(conv.id, found.key); } catch(e) { console.warn('Falha ao mover conv', conv.id, e); }
                          }
                        }
                      }
                      const newCopy = copyColumns.filter((_, i) => i !== idx);
                      setEditingColumnsDraft(newCopy);
                    }} style={{ padding: '6px 8px' }}>Remover</Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2">
              <Button size="sm" onClick={() => {
                // create a new unique key
                const newKeyBase = 'col_' + Math.random().toString(36).substring(2, 8);
                const newCol: Column = { key: newKeyBase, title: 'Nova etapa', icon: 'bi-list', color: '#6c757d', desc: '' };
                setEditingColumnsDraft(prev => [...prev, newCol]);
              }}><i className="bi bi-plus-circle me-1" />Adicionar coluna</Button>
            </div>
          </BsModal.Body>
          <BsModal.Footer>
          <Button variant="secondary" onClick={() => { setShowEditColumns(false); }}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={async () => {
            // safe save: if any conversations would be left without a column, move them to the first new column
            if (!editingColumnsDraft || editingColumnsDraft.length === 0) {
              alert('Não é possível salvar sem colunas. Adicione ao menos uma coluna.');
              return;
            }
            setSavingColumns(true);
            try {
              const newKeys = (editingColumnsDraft || []).map(c => c.key);
              // Validation: no empty titles
              const anyEmpty = editingColumnsDraft.some(c => !c.title || !String(c.title).trim());
              if (anyEmpty) {
                alert('Por favor preencha o título de todas as colunas antes de salvar.');
                setSavingColumns(false);
                return;
              }
              // Validation: at most one whatsapp dynamic source
              const whatsappCount = (editingColumnsDraft || []).filter(c => c.dynamicSource === 'whatsapp').length;
              if (whatsappCount > 1) {
                alert('Apenas uma coluna pode ser vinculada ao WhatsApp. Desmarque outras antes de salvar.');
                setSavingColumns(false);
                return;
              }
              const firstKey = newKeys[0];
              // Find conversations whose status is no longer present
              const toMove = conversations.filter(conv => conv.status && !newKeys.includes(conv.status));
              // Update server for each affected conversation
              for (const conv of toMove) {
                try {
                  await updateConversationStatus(conv.id, firstKey);
                } catch (e) {
                  console.error('Erro ao mover conversa para nova coluna:', conv.id, e);
                }
              }
              // Persist new columns locally
              setColumns(editingColumnsDraft);
              try { localStorage.setItem('kanban_columns', JSON.stringify(editingColumnsDraft)); } catch (e) {}
              // Try to save on server; if fails, keep localStorage
              try {
                await saveKanbanColumns(editingColumnsDraft.map((c, i) => ({ id: c.id, key: c.key, title: c.title, icon: c.icon, color: c.color, order_index: i, dynamic_source: c.dynamicSource })));
              } catch (err) {
                console.warn('⚠️ Falha ao salvar colunas no servidor. Alterações salvas localmente.');
              }
              // Refresh conversations to reflect server-side changes
              await fetchConversations();
              setShowEditColumns(false);
            } finally {
              setSavingColumns(false);
            }
          }}>
            {savingColumns ? 'Salvando...' : 'Salvar'}
          </Button>
        </BsModal.Footer>
        </BsModal>
      </div>
  {/* Modal do gerenciador de conexões */}
  <WhatsAppConnectionsManager show={showConnectionsManager} onHide={() => setShowConnectionsManager(false)} />
  {/* Toast container used for discreet notifications (reads toast state to avoid unused var warnings) */}
  <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 2000 }}>
    {/* lightweight inline toast using title only to avoid adding new imports */}
    {showToast && (
      <div style={{ background: toastVariant === 'success' ? '#d4edda' : toastVariant === 'danger' ? '#f8d7da' : '#fff3cd', padding: '8px 12px', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: 13, color: '#000' }}>{toastMessage}</div>
      </div>
    )}
  </div>
    </div>
  );
}

export default Kanban;
