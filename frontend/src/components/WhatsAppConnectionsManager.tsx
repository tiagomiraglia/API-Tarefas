import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Form, Spinner, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { canonicalizeId } from '../utils/normalizeConversation';
import './Kanban.css'; // Reutilizando estilos se aplicável

// Definindo um tipo para o objeto de conexão para evitar 'any'
interface Connection {
  phone: string;
  connectionId?: string;
  client_name?: string;
  client_display_name?: string;
  status: string;
  isConnected: boolean;
  deviceName?: string;
  name?: string;
  pushname?: string;
  battery?: number;
  created_at?: string;
  updated_at?: string;
  imported?: boolean; // local flag to indicate already in myWhatsappConnections
}

interface WhatsAppConnectionsManagerProps {
  show: boolean;
  onHide: () => void;
}

const WhatsAppConnectionsManager: React.FC<WhatsAppConnectionsManagerProps> = ({ show, onHide }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [newConnectionId, setNewConnectionId] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrUpdateKey, setQrUpdateKey] = useState<number>(0);
  const [qrSession, setQrSession] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrImgLoading, setQrImgLoading] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);
  const [pendingQr, setPendingQr] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectingAction, setConnectingAction] = useState<'connect'|'reconnect'|null>(null);
  const [showingAllFallback, setShowingAllFallback] = useState(false); // when no myWhatsappConnections found, show all
  const [showRecoverPanel, setShowRecoverPanel] = useState(false);
  const [recoveryList, setRecoveryList] = useState<Connection[]>([]);
  const [loadingRecovery, setLoadingRecovery] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const closeModalTimer = useRef<number | null>(null);
  const creationToastRef = useRef<any>(null);
  const connectedToastShownRef = useRef<Set<string>>(new Set()); // Controla quais conexões já tiveram toast de sucesso
  const qrRenewalTimer = useRef<number | null>(null); // Timer para renovação automática do QR
  // small map to avoid showing identical toasts repeatedly (reduce noise)
  const recentToastMapRef = useRef<Map<string, number>>(new Map());
  const TOAST_DEDUPE_MS = 10_000;
  // Filtro de busca local nas conexões
  const [connectionSearch, setConnectionSearch] = useState('');
  // Feedback de cópia (raw ou normalizado)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedNormalizedId, setCopiedNormalizedId] = useState<string | null>(null);
  // Modo compacto
  const [compactMode, setCompactMode] = useState(false);
  // Collapse groups
  const [collapseConnected, setCollapseConnected] = useState(false);
  const [collapseDisconnected, setCollapseDisconnected] = useState(false);
  // Paginação por grupo
  const PAGE_SIZE = 25;
  const [pageConnected, setPageConnected] = useState(1);
  const [pageDisconnected, setPageDisconnected] = useState(1);

  // --- Persistência de preferências (modo compacto, collapses, páginas) ---
  const PREF_COMPACT = 'wa_conn_pref_compact';
  const PREF_COLLAPSE_CONNECTED = 'wa_conn_pref_collapse_connected';
  const PREF_COLLAPSE_DISCONNECTED = 'wa_conn_pref_collapse_disconnected';
  const PREF_PAGE_CONNECTED = 'wa_conn_pref_page_connected';
  const PREF_PAGE_DISCONNECTED = 'wa_conn_pref_page_disconnected';
  const prefsLoadedRef = useRef(false);

  // Carrega preferências apenas uma vez no mount
  useEffect(() => {
    try {
      const compactVal = localStorage.getItem(PREF_COMPACT);
      if (compactVal === '1') setCompactMode(true);
      const collConn = localStorage.getItem(PREF_COLLAPSE_CONNECTED);
      if (collConn === '1') setCollapseConnected(true);
      const collDisc = localStorage.getItem(PREF_COLLAPSE_DISCONNECTED);
      if (collDisc === '1') setCollapseDisconnected(true);
      const pageConn = parseInt(localStorage.getItem(PREF_PAGE_CONNECTED) || '1', 10);
      if (pageConn > 1) setPageConnected(pageConn);
      const pageDisc = parseInt(localStorage.getItem(PREF_PAGE_DISCONNECTED) || '1', 10);
      if (pageDisc > 1) setPageDisconnected(pageDisc);
    } catch (e) { /* ignore */ }
    prefsLoadedRef.current = true;
  }, []);

  // Salva preferências (evita gravar antes de carregar)
  useEffect(() => { if (prefsLoadedRef.current) localStorage.setItem(PREF_COMPACT, compactMode ? '1' : '0'); }, [compactMode]);
  useEffect(() => { if (prefsLoadedRef.current) localStorage.setItem(PREF_COLLAPSE_CONNECTED, collapseConnected ? '1' : '0'); }, [collapseConnected]);
  useEffect(() => { if (prefsLoadedRef.current) localStorage.setItem(PREF_COLLAPSE_DISCONNECTED, collapseDisconnected ? '1' : '0'); }, [collapseDisconnected]);
  useEffect(() => { if (prefsLoadedRef.current) localStorage.setItem(PREF_PAGE_CONNECTED, String(pageConnected)); }, [pageConnected]);
  useEffect(() => { if (prefsLoadedRef.current) localStorage.setItem(PREF_PAGE_DISCONNECTED, String(pageDisconnected)); }, [pageDisconnected]);

  const showDedupToast = (type: 'info'|'success'|'error'|'warn', message: React.ReactNode, key?: string, opts?: any) => {
    try {
      const dedupeKey = key || (typeof message === 'string' ? message : undefined);
      const now = Date.now();
      if (dedupeKey) {
        const last = recentToastMapRef.current.get(dedupeKey);
        if (last && (now - last) < TOAST_DEDUPE_MS) return; // skip duplicate
        recentToastMapRef.current.set(dedupeKey, now);
        // cleanup old entries
        recentToastMapRef.current.forEach((ts, k) => { if ((now - ts) > TOAST_DEDUPE_MS * 3) recentToastMapRef.current.delete(k); });
      }
      (toast as any)[type](message, opts || {});
    } catch (e) { console.warn('showDedupToast error', e); }
  };

  // Hoisted helpers to avoid re-creating on each render
  const sanitizeSessionId = (id: string) => {
    return String(id || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  // Compare two session identifiers using multiple normalizations
  const sessionMatches = (a?: string | null, b?: string | null) => {
    try {
      if (!a || !b) return false;
      const variantsA = new Set<string>();
      const variantsB = new Set<string>();
      variantsA.add(String(a));
      variantsB.add(String(b));
      const sa = sanitizeSessionId(String(a)); if (sa) variantsA.add(sa);
      const sb = sanitizeSessionId(String(b)); if (sb) variantsB.add(sb);
      try { const ca = canonicalizeId(String(a)); if (ca) variantsA.add(ca); } catch(e) {}
      try { const cb = canonicalizeId(String(b)); if (cb) variantsB.add(cb); } catch(e) {}
      for (const va of variantsA) for (const vb of variantsB) if (va && vb && String(va) === String(vb)) return true;
      return false;
    } catch (e) { return false; }
  };

  const clearQrState = () => {
    // stop polling and timers
    if (pollingRef.current) {
      clearInterval(pollingRef.current as number);
      pollingRef.current = null;
    }
    if (qrRenewalTimer.current) {
      clearInterval(qrRenewalTimer.current as number);
      qrRenewalTimer.current = null;
      console.log('🧹 [QR] Timer de renovação limpo (clearQrState)');
    }
    // clear UI state
    setQrCode(null);
    setQrUpdateKey(0);
    setQrSession(null);
    setQrImgLoading(false);
    setQrImgError(false);
    setConnectingId(null);
  setConnectingAction(null);
    setLoadingQr(false);
    // clear any scheduled modal close
    if (closeModalTimer.current) {
      clearTimeout(closeModalTimer.current as number);
      closeModalTimer.current = null;
    }
    // leave creationToastRef alone (do not forcibly dismiss user's toasts)
  };

  const mapApiConnection = (conn: any): Connection => ({
    // Defensive: ensure phone is at least an empty string to avoid localeCompare errors
    phone: conn.connectionId || conn.phone || '',
    connectionId: conn.connectionId,
    client_name: conn.client_name,
    client_display_name: conn.client_display_name,
    status: conn.status,
    isConnected: !!conn.isConnected,
    deviceName: conn.client_display_name || conn.client_name,
    name: conn.client_name,
    pushname: conn.client_display_name,
    battery: typeof conn.battery === 'number' ? conn.battery : undefined,
    created_at: conn.created_at,
    updated_at: conn.updated_at,
  });

  const fetchConnections = useCallback(async (opts?: { suppressLoading?: boolean }) => {
    try {
      if (!opts?.suppressLoading) setLoadingConnections(true);
  // If user saved specific phones, pass them to server so it returns only those rows
  const raw = localStorage.getItem('myWhatsappConnections');
  const myArr = raw ? JSON.parse(raw) : [];
  const phonesToQuery = Array.isArray(myArr) && myArr.length ? myArr.map((x: any) => String(x).trim()).filter(Boolean) : [];
  const url = phonesToQuery.length ? `/whatsapp/connections?phones=${encodeURIComponent(phonesToQuery.join(','))}` : '/whatsapp/connections';
  const response = await api.get<{ connections: Connection[] }>(url);
      
      // Backend pode retornar um array direto ou { connections: [...] }
      let connectionsArray: any[] = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) connectionsArray = response.data;
        else if (Array.isArray(response.data.connections)) connectionsArray = response.data.connections;
      }
      const mappedConnections = connectionsArray.map(mapApiConnection);
      
      // Load user's own connection IDs from localStorage and build a robust allowed set
      let myOwnRaw: string[] = [];
      try {
        const raw = localStorage.getItem('myWhatsappConnections');
        const arr = raw ? JSON.parse(raw) : [];
        myOwnRaw = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
      } catch (e) {
        myOwnRaw = [];
      }

      // Build a set containing canonicalized and sanitized variants to match backend shapes
      const allowedSet = new Set<string>();
      myOwnRaw.forEach(s => {
        const canon = canonicalizeId(s);
        if (canon) allowedSet.add(canon);
        const san = sanitizeSessionId(s);
        if (san) allowedSet.add(san);
        if (s) allowedSet.add(s);
      });

      const filtered = mappedConnections.filter(c => {
        try {
          const rawId = String(c.connectionId || c.phone || '');
          const canon = canonicalizeId(rawId);
          const san = sanitizeSessionId(rawId);
          return (canon && allowedSet.has(canon)) || (san && allowedSet.has(san)) || allowedSet.has(rawId);
        } catch (e) { return false; }
      });
      
      // Show only connections the user created. Do NOT show other backend connections by default.
      // If the user hasn't saved any IDs (allowedSet is empty) or the filtered list is empty,
      // set an empty list so unknown connections are hidden from the modal.
      if (allowedSet.size === 0) {
        setConnections([]);
        setShowingAllFallback(false);
      } else {
        const sortedConnections = filtered.sort((a, b) => (a.phone || '').localeCompare(b.phone || ''));
        setConnections(sortedConnections);
        setShowingAllFallback(false);
      }
    } catch (error: any) {
      toast.error('Erro ao listar conexões: ' + (error?.message || 'Erro desconhecido.'));
      setConnections([]);
    } finally {
      if (!opts?.suppressLoading) setLoadingConnections(false);
    }
  }, []);

  // Lista filtrada (case-insensitive) por telefone ou nome de exibição
  const filteredConnections = React.useMemo(() => {
    const q = connectionSearch.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter(c => {
      const fields = [c.phone, c.deviceName, c.pushname, c.client_display_name, c.name].filter(Boolean).map(String);
      return fields.some(f => f.toLowerCase().includes(q));
    });
  }, [connections, connectionSearch]);
  // Agrupamentos
  const connectedList = React.useMemo(() => filteredConnections.filter(c => c.status === 'CONNECTED'), [filteredConnections]);
  const disconnectedList = React.useMemo(() => filteredConnections.filter(c => c.status !== 'CONNECTED'), [filteredConnections]);
  // Ajustar páginas se filtro reduzir tamanho
  useEffect(() => { if ((pageConnected - 1) * PAGE_SIZE >= connectedList.length) setPageConnected(1); }, [connectedList, pageConnected]);
  useEffect(() => { if ((pageDisconnected - 1) * PAGE_SIZE >= disconnectedList.length) setPageDisconnected(1); }, [disconnectedList, pageDisconnected]);
  const totalPagesConnected = Math.max(1, Math.ceil(connectedList.length / PAGE_SIZE));
  const totalPagesDisconnected = Math.max(1, Math.ceil(disconnectedList.length / PAGE_SIZE));
  const pageSlice = (arr: Connection[], page: number) => arr.slice((page-1)*PAGE_SIZE, (page-1)*PAGE_SIZE + PAGE_SIZE);
  const connectedPage = pageSlice(connectedList, pageConnected);
  const disconnectedPage = pageSlice(disconnectedList, pageDisconnected);

  // Função para copiar identificação da conexão
  const copyPhone = (id?: string) => {
    if (!id) return;
    try {
      navigator.clipboard.writeText(id).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 2000);
      });
    } catch (e) {
      toast.info('Não foi possível copiar');
    }
  };
  const normalizeDigits = (v?: string) => {
    if (!v) return '';
    const base = v.includes('@') ? v.split('@')[0] : v;
    const digits = base.replace(/\D/g, '');
    return digits;
  };
  const copyNormalized = (id?: string) => {
    const digits = normalizeDigits(id);
    if (!digits) return;
    try {
      navigator.clipboard.writeText(digits).then(() => {
        setCopiedNormalizedId(digits);
        setTimeout(() => setCopiedNormalizedId(prev => (prev === digits ? null : prev)), 2000);
      });
    } catch { toast.info('Falha ao copiar'); }
  };

  // Fetch all backend connections (for recovery/import) - does not alter main list
  const fetchAllBackendConnections = useCallback(async () => {
    setLoadingRecovery(true);
    try {
      const res: any = await api.get('/whatsapp/connections');
      let conns: any[] = [];
      if (res && res.data) {
        conns = Array.isArray(res.data) ? res.data : (res.data.connections || []);
      }
      const mapped = conns.map(mapApiConnection).sort((a, b) => (a.phone || '').localeCompare(b.phone || ''));
      // Only show backend connections that belong to this user (saved in localStorage.myWhatsappConnections)
      try {
        const raw = localStorage.getItem('myWhatsappConnections');
        const arr = raw ? JSON.parse(raw) : [];
        const myOwnRaw = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
        const allowedSet = new Set<string>();
        myOwnRaw.forEach(s => {
          try { const c = canonicalizeId(s); if (c) allowedSet.add(c); } catch(e) {}
          const sa = sanitizeSessionId(s); if (sa) allowedSet.add(sa);
          if (s) allowedSet.add(s);
        });
        if (allowedSet.size === 0) {
          // No saved sessions for this user — show empty recovery list
          setRecoveryList([]);
        } else {
          const filtered = mapped.filter((c) => {
            try {
              const rawId = String(c.connectionId || c.phone || '');
              const canon = canonicalizeId(rawId);
              const san = sanitizeSessionId(rawId);
              return (canon && allowedSet.has(canon)) || (san && allowedSet.has(san)) || allowedSet.has(rawId);
            } catch (e) { return false; }
          });
          setRecoveryList(filtered);
        }
      } catch (e) {
        // If any error reading localStorage, fallback to empty recovery list to avoid leaking other users' sessions
        setRecoveryList([]);
      }
    } catch (e) {
      toast.error('Erro ao buscar conexões para recuperar.');
      setRecoveryList([]);
    } finally {
      setLoadingRecovery(false);
    }
  }, []);

  const importConnectionToMine = (conn: Connection) => {
    try {
      const raw = localStorage.getItem('myWhatsappConnections');
      const arr = raw ? JSON.parse(raw) : [];
      const toStore = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
      const canon = canonicalizeId(conn.phone || conn.connectionId || '') || (conn.phone || conn.connectionId || '');
      const san = sanitizeSessionId(conn.phone || conn.connectionId || '');
      [canon, san, conn.phone || conn.connectionId || ''].forEach(v => { if (v && !toStore.includes(v)) toStore.push(v); });
      localStorage.setItem('myWhatsappConnections', JSON.stringify(toStore));
      showDedupToast('success', `Importado ${canon}`, `import:${canon}`);
      // Refresh main list
      fetchConnections();
    } catch (e) {
      toast.error('Erro ao importar conexão.');
    }
  };

  // Remove a connection from the backend (used in the recovery panel)
  const deleteBackendConnection = async (conn: Connection) => {
    const rawId = conn.connectionId || conn.phone || '';
    if (!rawId) return;
    const exec = async () => {
      const tryIds = [rawId, sanitizeSessionId(rawId), canonicalizeId(rawId)].filter(Boolean).map(String);
      try {
        const toastId = toast.loading(`Removendo ${rawId}...`);
        let success = false;
        for (const id of tryIds) {
          try {
            await api.delete(`/whatsapp/connections/${encodeURIComponent(id)}`);
            success = true;
            break;
          } catch (innerErr) {
            // tentar próxima variante
          }
        }
        if (!success) throw new Error('Falha ao remover no servidor (todas as tentativas).');
        toast.update(toastId, { render: `Conexão ${rawId} removida`, type: 'success', isLoading: false, autoClose: 3000 });
        // Atualiza a lista de recuperação e lista principal
        setRecoveryList(prev => prev.filter(r => (r.connectionId || r.phone || '') !== rawId));
          // If the removed backend connection matches the currently shown QR session, clear QR state
          if (sessionMatches(rawId, qrSession)) {
            clearQrState();
          }
        try {
          const raw = localStorage.getItem('myWhatsappConnections');
          const arr = raw ? JSON.parse(raw) : [];
          if (Array.isArray(arr)) {
            const filtered = arr.filter((x: any) => {
              const s = String(x);
              const san = sanitizeSessionId(s);
              const canon = canonicalizeId(s);
              return !(s === rawId || san === rawId || canon === rawId || s === sanitizeSessionId(rawId) || canon === canonicalizeId(rawId));
            });
            localStorage.setItem('myWhatsappConnections', JSON.stringify(filtered));
          }
        } catch (e) { /* ignore */ }
        await fetchConnections();
      } catch (e: any) {
        toast.error(`Falha ao remover ${rawId}: ${e?.message || ''}`);
      }
    };
    showConfirm(`Remover conexão ${rawId} do servidor? Esta ação é irreversível.`, exec);
  };

  // Cancel a pending connection request: stop timers, clear QR and try to delete the session on the server
  const cancelPendingConnection = async (session?: string) => {
    const id = (session || qrSession || connectingId || newConnectionId || '').trim();
    if (!id) return;
    const exec = async () => {
      try {
        // stop polling and timers
        if (pollingRef.current) {
          clearInterval(pollingRef.current as number);
          pollingRef.current = null;
        }
        if (qrRenewalTimer.current) {
          clearInterval(qrRenewalTimer.current as number);
          qrRenewalTimer.current = null;
        }

        // clear UI state
        setQrCode(null);
        setQrSession(null);
        setConnectingId(null);
  setConnectingAction(null);
        setLoadingQr(false);

        // update creation toast if present
        if (creationToastRef.current) {
          try {
            toast.update(creationToastRef.current, { render: `❌ Pedido cancelado: ${id}`, type: 'info', isLoading: false, autoClose: 2500 });
          } catch (e) { /* ignore */ }
          creationToastRef.current = null;
        }

        // try delete on server (some servers may accept this even if not fully created)
        try {
          await api.delete(`/whatsapp/connections/${encodeURIComponent(id)}`);
        } catch (e) {
          // ignore server error, still clear local state
        }

        // remove from localStorage.myWhatsappConnections if present
        try {
          const raw = localStorage.getItem('myWhatsappConnections');
          const arr = raw ? JSON.parse(raw) : [];
          if (Array.isArray(arr)) {
            const filtered = arr.filter((x: any) => {
              const s = String(x);
              const san = sanitizeSessionId(s);
              const canon = canonicalizeId(s);
              return !(s === id || san === id || canon === id || s === sanitizeSessionId(id) || canon === canonicalizeId(id));
            });
            localStorage.setItem('myWhatsappConnections', JSON.stringify(filtered));
          }
        } catch (e) { /* ignore */ }

        // refresh list quietly
        await fetchConnections({ suppressLoading: true });
      } catch (err: any) {
        toast.error(`Falha ao cancelar ${id}: ${err?.message || ''}`);
      }
    };
    showConfirm(`Cancelar pedido de conexão ${id}?`, exec);
  };

  // Ensure this helper is considered "used" by TypeScript/linters (it may be invoked from external flows later)
  // This performs a read of the function reference without changing behavior.
  void cancelPendingConnection;

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmCallbackRef = useRef<(() => Promise<void>) | null>(null);
  const showConfirm = (message: string, cb: () => Promise<void>) => {
    setConfirmMessage(message);
    confirmCallbackRef.current = cb;
    setConfirmVisible(true);
  };
  const runConfirm = async (ok: boolean) => {
    setConfirmVisible(false);
    if (ok && confirmCallbackRef.current) {
      try {
        await confirmCallbackRef.current();
      } catch (e) { /* ignore */ }
      confirmCallbackRef.current = null;
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Debug para monitorar mudanças no QR Code
  useEffect(() => {
    if (qrCode) {
      console.log(`🖼️ [QR] QR Code recebido para sessão ${qrSession}, tamanho: ${qrCode.length} chars`);
      console.log(`🖼️ [QR] Primeiros 100 chars: ${qrCode.substring(0, 100)}...`);
    // Note: we deliberately *do not* toggle qrImgLoading here because
    // when the QR is preloaded we want to keep the current image visible
    // and avoid a brief flash. Loading state is managed where the QR
    // is first requested (fetchQrWithRetry) or when preloading swaps.
    } else {
      console.debug(`🖼️ [QR] QR Code limpo/nulo`);
      setQrImgLoading(false);
      setQrImgError(false);
    }
  }, [qrCode, qrSession]);

  
  const fetchQrWithRetry = useCallback(async (sessionId: string, retries = 20, delay = 3000) => {
  console.log(`🔍 [QR] Iniciando busca de QR para ${sessionId}, tentativas: ${retries}`);
  // mark as loading so UI shows the compact loader while we search for the QR
  try { setLoadingQr(true); } catch (e) { /* ignore in case unmounted */ }

  const preloadImage = (src: string, timeoutMs = 5000) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const img = new Image();
          let timer: any = null;
          img.onload = () => {
            if (timer) clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            if (timer) clearTimeout(timer);
            reject(new Error('image load error'));
          };
          img.src = src;
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              // prevent hanging
              try { img.onload = null; img.onerror = null; } catch(e) {}
              reject(new Error('image load timeout'));
            }, timeoutMs);
          }
        } catch (e) { reject(e); }
      });
    };
    
    for (let i = 1; i <= retries; i++) {
      try {
        console.log(`🔍 [QR] Tentativa ${i}/${retries} para ${sessionId}`);
        const response = await api.get(`/whatsapp/qr/${sessionId}`);
        console.log(`🔍 [QR] Resposta recebida para ${sessionId}:`, response.data);
        console.log(`🔍 [QR] response.data.qrCode existe:`, !!response.data?.qrCode);
        console.log(`🔍 [QR] Tipo de response.data.qrCode:`, typeof response.data?.qrCode);
        console.log(`🔍 [QR] Propriedades de response.data:`, Object.keys(response.data || {}));
        
        if (response.data && response.data.qrCode) {
          console.log(`✅ [QR] QR Code encontrado para ${sessionId}, tamanho:`, response.data.qrCode.length);
          const newQr = response.data.qrCode as string;
          // Attempt to preload the QR image; if preload fails, continue retry loop
          setPendingQr(newQr);
          try {
            await preloadImage(newQr, 5000);
            // preload ok -> swap to new QR (debounced slightly to avoid very-fast swaps)
            const swapDelay = 250; // ms
            setTimeout(() => {
              setQrUpdateKey(Date.now());
              setQrCode(newQr);
              // ensure flags
              setQrImgLoading(false);
              setQrImgError(false);
              try { setLoadingQr(false); } catch (e) { /* ignore */ }
            }, swapDelay);
            setQrSession(sessionId);
            setConnectingId(null);

            // Configurar renovação automática baseada na resposta do servidor
            const renewInterval = response.data.renewInterval || 18000; // padrão 18 segundos
            console.log(`⏰ [QR] Configurando renovação automática a cada ${renewInterval}ms`);
            if (qrRenewalTimer.current) {
              clearInterval(qrRenewalTimer.current as number);
            }
            qrRenewalTimer.current = window.setInterval(async () => {
              console.log(`🔄 [QR] Renovando QR Code para ${sessionId}`);
              try {
                const renewResponse = await api.get(`/whatsapp/qr/${sessionId}`);
                console.log(`🔄 [QR] Resposta de renovação para ${sessionId}:`, renewResponse.data);
                console.log(`🔄 [QR] renewResponse.data.qrCode existe:`, !!renewResponse.data?.qrCode);
                if (renewResponse.data && renewResponse.data.qrCode) {
                  console.log(`✅ [QR] QR Code renovado para ${sessionId}`);
                  console.log(`🔄 [QR] QR anterior length:`, qrCode?.length || 0);
                  console.log(`🔄 [QR] QR novo length:`, renewResponse.data.qrCode.length);
                  console.log(`🔄 [QR] QRs são iguais:`, qrCode === renewResponse.data.qrCode);
                  const renewed = renewResponse.data.qrCode as string;
                  setPendingQr(renewed);
                  try {
                    await preloadImage(renewed, 5000);
                    const swapDelay = 250;
                    setTimeout(() => {
                      setQrUpdateKey(Date.now());
                      setQrCode(renewed);
                      setQrImgLoading(false);
                      setQrImgError(false);
                      setPendingQr(null);
                    }, swapDelay);
                  } catch (e) {
                    console.warn(`❌ [QR] Falha ao carregar QR renovado para ${sessionId}`, e);
                    setPendingQr(null);
                  }
                }
              } catch (renewError) {
                console.error(`❌ [QR] Erro ao renovar QR Code para ${sessionId}:`, renewError);
                if (qrRenewalTimer.current) {
                  clearInterval(qrRenewalTimer.current as number);
                  qrRenewalTimer.current = null;
                }
              }
            }, renewInterval);
            setPendingQr(null);
            return; // sucesso
          } catch (preloadErr) {
            console.warn(`⚠️ [QR] Preload falhou para ${sessionId}, tentarei novamente:`, preloadErr);
            setPendingQr(null);
          }
        } else {
          console.warn(`⚠️ [QR] Resposta sem qrCode para ${sessionId}:`, response.data);
          console.warn(`⚠️ [QR] response.data é:`, response.data);
          console.warn(`⚠️ [QR] response.data.qrCode é:`, response.data?.qrCode);
        }
        } catch (error: any) {
          // quiet: log only, avoid noisy toasts during retries
          console.log(`🔍 [QR] tentativa ${i}/${retries} para ${sessionId} falhou.`);
        }
      
      // Aguardar antes da próxima tentativa (intervalos menores no início)
      if (i < retries) {
        const currentDelay = i <= 5 ? 2000 : delay; // Primeiras 5 tentativas: 2s, depois 3s
        console.log(`⏰ [QR] Aguardando ${currentDelay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }
  console.error(`❌ [QR] Falhou após ${retries} tentativas para ${sessionId}`);
  setLoadingQr(false);
  setConnectingId(null); // Reset o estado de connecting
  setConnectingAction(null);
  toast.error(`Falha ao obter QR Code para ${sessionId}.`);
  }, []);

  const handleCreate = async () => {
    if (!newConnectionId) return;

    // Higieniza o ID da conexão para ser sempre um formato válido (minúsculas, sem espaços/especiais)
    const sanitizedConnId = newConnectionId.toLowerCase().replace(/[\s\W_]+/g, '');
    if (!sanitizedConnId) {
      toast.error("O ID da conexão é inválido. Use apenas letras e números.");
      return;
    }

    // Antes de criar, verificar se já existe uma conexão com esse ID no backend
    try {
      const checkRes: any = await api.get('/whatsapp/connections');
      let conns: any[] = [];
      if (checkRes && checkRes.data) {
        conns = Array.isArray(checkRes.data) ? checkRes.data : (checkRes.data.connections || []);
      }
      const existing = conns.find((c: any) => (c.connectionId === sanitizedConnId || c.phone === sanitizedConnId));
      if (existing) {
        if (existing.isConnected) {
          // Já conectado: atualizar lista e limpar input
          await fetchConnections();
          setNewConnectionId('');
          return;
        } else {
          toast.info(`Sessão ${sanitizedConnId} já existe (desconectada). Buscando QR...`);
        }
      }
    } catch (e) {
      // prossegue mesmo se falhar verificação
    }

    // 1. Mostra toast de criação
    setCreating(true);
    const toastId = toast.loading(`Criando ${sanitizedConnId}...`);
    creationToastRef.current = toastId;
    try {
  // 2. Chama endpoint de criação (backend espera /whatsapp/connect)
  await api.post('/whatsapp/connect', { phone: sanitizedConnId });
      toast.update(toastId, { render: `Sessão ${sanitizedConnId} criada. Preparando QR...`, type: 'info', isLoading: true });

      // 3. Armazena em localStorage (se ainda não)
      try {
        const raw = localStorage.getItem('myWhatsappConnections');
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr) && !arr.includes(sanitizedConnId)) {
          arr.push(sanitizedConnId);
          localStorage.setItem('myWhatsappConnections', JSON.stringify(arr));
        } else if (!Array.isArray(arr)) {
          localStorage.setItem('myWhatsappConnections', JSON.stringify([sanitizedConnId]));
        }
      } catch {}

      // 4. Aguarda 5 segundos para permitir provisionamento
      console.log(`⏰ [CREATE] Aguardando 5 segundos antes de buscar QR para ${sanitizedConnId}...`);
      toast.update(toastId, { render: '⏳ Preparando QR Code (aguarde alguns segundos)...', type: 'info', isLoading: true });
      await new Promise(resolve => setTimeout(resolve, 5000));
      // 5. Busca QR code
      await fetchQrWithRetry(sanitizedConnId);
      // 6. Atualiza lista e limpa input
      setNewConnectionId('');
      await fetchConnections();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao criar conexão.';
      // ❌ Toast de erro
      toast.update(toastId, {
        render: `❌ Falha ao criar ${sanitizedConnId}: ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
      creationToastRef.current = null; // Limpar ref pois houve erro
  } finally { setCreating(false); }
  };

  const connectWhatsapp = async (phone: string) => {
    const sanitizedId = sanitizeSessionId(phone);
    console.log(`📞 [CONNECT] Iniciando conexão para telefone original: ${phone}, sanitizado: ${sanitizedId}`);
    // Verificar se já existe conexão no backend antes de iniciar processo de QR
    try {
      const checkRes: any = await api.get('/whatsapp/connections');
      let conns: any[] = [];
      if (checkRes && checkRes.data) {
        conns = Array.isArray(checkRes.data) ? checkRes.data : (checkRes.data.connections || []);
      }
      const existing = conns.find((c: any) => (c.connectionId === sanitizedId || c.phone === sanitizedId));
      if (existing) {
        if (existing.isConnected) {
          toast.success(`Conexão ${sanitizedId} já está conectada.`);
          await fetchConnections();
          return;
        } else {
          toast.info(`Sessão ${sanitizedId} encontrada. Tentando reconectar...`);
          // continuar para reconectar abaixo
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar conexões antes de conectar:', err);
      // prossegue normalmente se falhar
    }

  setConnectingId(sanitizedId);
  setConnectingAction('connect');
  setLoadingQr(true);
  setQrCode(null);
  setQrSession(sanitizedId);

    try {
      console.log(`📞 [CONNECT] Fazendo requisição POST para /whatsapp/connect com phone: ${sanitizedId}`);
      const response = await api.post('/whatsapp/connect', { phone: sanitizedId });
      console.log(`📞 [CONNECT] Resposta recebida:`, response.data);
      
  // pedido enviado, aguardar processamento e buscar QR
  console.log(`⏰ [CONNECT] Aguardando 5 segundos antes de buscar QR para ${sanitizedId}...`);

      // Aguarda 5 segundos para o wppconnect-server processar a conexão
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`⏰ [CONNECT] Iniciando busca de QR para ${sanitizedId}`);
      fetchQrWithRetry(sanitizedId);
    } catch (error) {
      console.error(`❌ [CONNECT] Erro ao conectar sessão ${sanitizedId}:`, error);
      toast.error(`Falha ao iniciar conexão para ${sanitizedId}.`);
      setLoadingQr(false);
  setConnectingId(null);
  setConnectingAction(null);
    }
  };
  
  // Função para reconectar uma sessão existente
  const reconnectWhatsapp = async (phone: string) => {
  setConnectingAction('reconnect');
  await connectWhatsapp(phone); // A lógica é a mesma de conectar
  setConnectingAction(null);
  };

  const disconnectWhatsapp = async (phone: string) => {
    if (!phone) {
      toast.error('❌ Erro: ID da conexão é inválido');
      return;
    }

    setLoadingConnections(true);
    // Limpa QR se for da conexão desconectada
    if (qrSession === phone) {
      setQrCode(null);
      setQrSession(null);
    }
    try {
      // Use path parameter to match the API helper (/whatsapp/disconnect/:session)
      const res = await api.post(`/whatsapp/disconnect/${encodeURIComponent(phone)}`);
      console.log('[DISCONNECT] response', res);
      // If the disconnected session is the one currently showing the QR, clear QR state
      if (sessionMatches(phone, qrSession)) {
        clearQrState();
      }
      await fetchConnections();
    } catch (err: any) {
      console.error('[DISCONNECT] falha ao desconectar', err);
      const message = err?.response?.data?.error || err?.message || 'Erro ao desconectar.';
      toast.error(`Falha ao desconectar ${phone}: ${message}`);
    } finally {
      setLoadingConnections(false);
    }
  };

  const removeWhatsapp = async (phone: string) => {
    if (!phone) {
      toast.error('❌ Erro: ID da conexão é inválido');
      return;
    }

    setRemovingId(phone);
    // Limpa QR se for da conexão removida
    if (qrSession === phone) {
      setQrCode(null);
      setQrSession(null);
    }
    
    // 🟡 Toast de confirmação
    const toastId = toast.loading(
      <div>
        <strong>🗑️ Removendo Conexão</strong>
        <br />
        <small>Desconectando {phone}...</small>
      </div>
    );
    
    try {
      const res = await api.delete(`/whatsapp/connections/${phone}`);
      // Log da resposta da deleção
      console.log('Resposta da deleção:', res);
      if (res?.status && res.status !== 200) {
        // ❌ Toast de erro
        toast.update(toastId, {
          render: `❌ Erro ao remover ${phone}: status ${res.status}`,
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      } else {
        // ✅ Toast de sucesso
        toast.update(toastId, {
          render: (
            <div>
              <strong>✅ Conexão Removida</strong>
              <br />
              <small>{phone} foi desconectado com sucesso</small>
            </div>
          ),
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      }
      // Aguarda 300ms antes de atualizar a lista para garantir que o backend processe a exclusão
      // If the removed phone is the same session currently showing QR, clear the QR UI
      if (sessionMatches(phone, qrSession)) {
        clearQrState();
      }
      setTimeout(async () => {
        await fetchConnections();
      }, 300);
    } catch (err: any) {
      let errorMessage = 'Erro desconhecido';
      if (err?.response) {
        errorMessage = `status ${err.response.status} - ${JSON.stringify(err.response.data)}`;
      } else {
        errorMessage = err?.message || 'Erro desconhecido';
      }
      // ❌ Toast de erro
      toast.update(toastId, {
        render: `❌ Falha ao remover ${phone}: ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      // Also remove from localStorage.myWhatsappConnections if present
      try {
        const raw = localStorage.getItem('myWhatsappConnections');
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) {
          const filtered = arr.filter((x: any) => {
            const s = String(x);
            const san = sanitizeSessionId(s);
            const canon = canonicalizeId(s);
            return !(s === phone || san === phone || canon === phone || s === sanitizeSessionId(phone) || canon === canonicalizeId(phone));
          });
          localStorage.setItem('myWhatsappConnections', JSON.stringify(filtered));
        }
      } catch (e) { /* ignore */ }
      setRemovingId(null);
    }
  };

  // Atualiza lista ao abrir modal e limpa ao fechar
  useEffect(() => {
    if (show) fetchConnections();
    if (!show) {
      setQrCode(null);
      setQrUpdateKey(0);
      setQrSession(null);
      setNewConnectionId('');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      // Limpar timer de renovação do QR
      if (qrRenewalTimer.current) {
        clearInterval(qrRenewalTimer.current as number);
        qrRenewalTimer.current = null;
        console.log('🧹 [QR] Timer de renovação limpo ao fechar modal');
      }
      // Clear any scheduled auto-close
      if (closeModalTimer.current) {
        clearTimeout(closeModalTimer.current as number);
        closeModalTimer.current = null;
      }
      creationToastRef.current = null; // Limpar ref quando modal é fechado
      connectedToastShownRef.current.clear(); // Limpar controle de toasts mostrados
    }
    // eslint-disable-next-line
  }, [show, fetchConnections]);

  // Polling para atualizar status da conexão após exibir QR
  useEffect(() => {
    if (qrSession) {
      if (pollingRef.current) clearInterval(pollingRef.current as number);
      pollingRef.current = window.setInterval(async () => {
        try {
          const res: any = await api.get('/whatsapp/connections');
          let conns: any = null;
          if (res && res.data) {
            if (Array.isArray(res.data)) {
              conns = res.data;
            } else if (res.data.connections && Array.isArray(res.data.connections)) {
              conns = res.data.connections;
            }
          }
          if (!conns) return;
          // Apply the same filtering logic locally (avoid extra network call to prevent UI flicker)
          try {
            const mappedConnections: Connection[] = conns.map((x: any) => mapApiConnection(x));
            let myOwnRaw: string[] = [];
            try {
              const raw = localStorage.getItem('myWhatsappConnections');
              const arr = raw ? JSON.parse(raw) : [];
              myOwnRaw = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
            } catch (e) { myOwnRaw = []; }
            const allowedSet = new Set<string>();
            myOwnRaw.forEach(s => {
              const canon = canonicalizeId(s);
              if (canon) allowedSet.add(canon);
              const san = sanitizeSessionId(s);
              if (san) allowedSet.add(san);
              if (s) allowedSet.add(s);
            });
            const filtered = mappedConnections.filter((c: Connection) => {
              try {
                const rawId = String(c.connectionId || c.phone || '');
                const canon = canonicalizeId(rawId);
                const san = sanitizeSessionId(rawId);
                return (canon && allowedSet.has(canon)) || (san && allowedSet.has(san)) || allowedSet.has(rawId);
              } catch (e) { return false; }
            });
            if (allowedSet.size === 0) {
              setConnections([]);
              setShowingAllFallback(false);
            } else {
              const sortedConnections = filtered.sort((a: Connection, b: Connection) => (a.phone || '').localeCompare(b.phone || ''));
              setConnections(sortedConnections);
              setShowingAllFallback(false);
            }
          } catch (e) {
            // fallback: do nothing here (we'll not disturb UI)
          }
          const found = conns.find((c: any) => c && c.connectionId === qrSession);
          if (found && found.isConnected && !connectedToastShownRef.current.has(found.connectionId)) {
            setQrCode(null);
            setQrSession(null);
            setConnectingAction(null);
            
            // Limpar timer de renovação do QR quando conectar
            if (qrRenewalTimer.current) {
              clearInterval(qrRenewalTimer.current as number);
              qrRenewalTimer.current = null;
              console.log('🧹 [QR] Timer de renovação limpo - conexão estabelecida');
            }
            
            // Marcar que já foi mostrado toast para esta conexão
            connectedToastShownRef.current.add(found.connectionId);
            
            // 🎉 Atualizar toast de criação para sucesso se existir
            if (creationToastRef.current) {
              toast.update(creationToastRef.current, {
                render: (
                  <div>
                    <strong>🎉 WhatsApp Conectado!</strong>
                    <br />
                    <small>{found.connectionId} autenticado via QR Code</small>
                  </div>
                ),
                type: 'success',
                isLoading: false,
                autoClose: 4000,
              });
              creationToastRef.current = null;
            } else {
              // Fallback: criar novo toast se não há referência
              toast.success(
                <div>
                  <strong>🎉 WhatsApp Conectado!</strong>
                  <br />
                  <small>{found.connectionId} autenticado via QR Code</small>
                </div>,
                {
                  autoClose: 4000,
                }
              );
            }
            if (pollingRef.current) {
              clearInterval(pollingRef.current as number);
              pollingRef.current = null;
            }
            // Schedule friendly auto-close of the modal after a short delay to improve UX
            try {
              // clear any previous timer
              if (closeModalTimer.current) {
                clearTimeout(closeModalTimer.current as number);
                closeModalTimer.current = null;
              }
              closeModalTimer.current = window.setTimeout(() => {
                // only close if modal still open
                try {
                  onHide();
                } catch (e) { /* ignore */ }
                closeModalTimer.current = null;
              }, 3000); // 3s delay
              // Inform the user that the modal will close
              showDedupToast('info', `${found.connectionId} conectado — fechando em alguns segundos...`, `autoclose:${found.connectionId}`);
            } catch (e) { /* ignore */ }
          }
        } catch {}
      }, 2500);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current as number);
        pollingRef.current = null;
      }
    }
    // eslint-disable-next-line
  }, [qrSession]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Gerenciar Conexões WhatsApp</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <InputGroup>
            <Form.Control 
              placeholder="ID da nova conexão (ex: nome, número, loja...)" 
              value={newConnectionId} 
              onChange={e => setNewConnectionId(e.target.value)}
              disabled={creating}
            />
            <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button onClick={handleCreate} disabled={creating || !newConnectionId} variant="success">
                {creating ? <Spinner size="sm" animation="border" /> : 'Nova Conexão'}
              </Button>
              <Button variant="outline-secondary" title="Recuperar conexões" onClick={() => { setShowRecoverPanel(!showRecoverPanel); if (!showRecoverPanel) fetchAllBackendConnections(); }}>
                🔁
              </Button>
            </div>
          </InputGroup>
        </div>
        {/* Recover panel shown next to Nova Conexão when toggled */}
        {showRecoverPanel && (
          <div className="mb-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%' }} className="wa-recover-panel">
              <div className="wa-recover-header">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>🔍</span>
                  <strong style={{ fontSize: 14 }}>Recuperar</strong>
                </div>
                <small className="wa-muted-note">Clique no ➕ para adicionar às suas conexões</small>
              </div>
              {loadingRecovery ? <Spinner animation="border" size="sm" /> : (
                <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {recoveryList.length === 0 && <div className="text-muted">Nenhuma conexão disponível para recuperar.</div>}
                  {(() => {
                    const rawMy = localStorage.getItem('myWhatsappConnections');
                    const arr = rawMy ? JSON.parse(rawMy) : [];
                    const toStore = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
                    const toStoreSet = new Set(toStore);
                    return recoveryList.map((r) => {
                      const canon = canonicalizeId(r.phone || r.connectionId || '') || (r.phone || r.connectionId || '');
                      const san = sanitizeSessionId(r.phone || r.connectionId || '');
                      const already = toStoreSet.has(canon) || toStoreSet.has(san) || toStoreSet.has(r.phone || r.connectionId || '');
                      return (
                        <div key={r.phone || r.connectionId} className="wa-recovery-item">
                          <div className="meta">
                            <span>📱</span>
                            <div>
                              <div className="wa-conn-title">{r.phone || r.connectionId}</div>
                              <div className="wa-conn-sub">{r.client_display_name || r.client_name || ''}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline-success wa-import-btn" title="Adicionar" onClick={() => importConnectionToMine(r)} disabled={already}>{already ? '✔' : '➕'}</button>
                            <button className="btn btn-outline-danger wa-import-btn" title="Remover do servidor" onClick={() => deleteBackendConnection(r)} style={{ borderColor: '#e3342f' }}>🗑</button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
        {/* QR container: render only when a QR is being generated/loaded/present to avoid a large empty placeholder */}
        {(qrCode || loadingQr || pendingQr || connectingId) ? (
          <div className="mb-3 wa-qr-section">
            <div className="wa-qr-card">
              <div className="wa-qr-inner">
                {qrCode ? (
                  qrImgError ? (
                    <div className="wa-qr-error">Erro ao carregar o QR Code...</div>
                  ) : (
                    <>
                      <img
                        key={qrUpdateKey}
                        src={qrCode}
                        alt="QR Code"
                        className="wa-qr-img"
                        style={{ display: qrImgLoading ? 'none' : 'block' }}
                        onLoad={() => { setQrImgLoading(false); setQrImgError(false); }}
                        onError={() => { setQrImgLoading(false); setQrImgError(true); }}
                      />
                      {pendingQr && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                          <small className="text-muted">Atualizando QR…</small>
                          <Spinner animation="border" size="sm" style={{ marginLeft: 8 }} />
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // When we are in loading state but don't yet have an image, show a small compact loader instead
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 18 }}>
                    <Spinner animation="border" size="sm" />
                    <small className="text-muted" style={{ marginTop: 8 }}>Aguardando QR...</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
          <h5 className="mb-0">Suas Conexões</h5>
          <Button
            variant={compactMode ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={() => setCompactMode(c => !c)}
            title={compactMode ? 'Modo normal' : 'Modo compacto'}
          >
            {compactMode ? <><i className="bi bi-arrows-expand" /> Normal</> : <><i className="bi bi-compress" /> Compacto</>}
          </Button>
        </div>
  {/* Recover panel moved next to 'Nova Conexão' — duplicate removed */}
        {loadingConnections ? (
          <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="wa-skeleton" style={{ width: '90%' }}>
              <div className="wa-skeleton-line" style={{ width: '40%' }} />
              <div className="wa-skeleton-line" style={{ width: '70%' }} />
              <div className="wa-skeleton-line" style={{ width: '55%' }} />
            </div>
          </div>
        ) : (
          <div>
            {/* Toolbar de filtro */}
            <div className="d-flex align-items-center mb-2 gap-2 flex-wrap">
              <InputGroup style={{ maxWidth: 260 }}>
                <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                <Form.Control
                  placeholder="Filtrar conexões..."
                  value={connectionSearch}
                  onChange={e => setConnectionSearch(e.target.value)}
                  size="sm"
                />
                {connectionSearch && (
                  <Button variant="outline-secondary" size="sm" onClick={() => setConnectionSearch('')} title="Limpar filtro">
                    <i className="bi bi-x" />
                  </Button>
                )}
              </InputGroup>
              <div className="ms-auto d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#28a745', marginRight:4 }} />Conectado</span>
                <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#6c757d', marginRight:4 }} />Desconectado</span>
              </div>
            </div>
            {filteredConnections.length === 0 && <div className="text-muted">Nenhuma conexão encontrada.</div>}
            {/* Grupo Conectadas */}
            {connectedList.length > 0 && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <button type="button" className="btn btn-link p-0" onClick={() => setCollapseConnected(c => !c)} style={{ textDecoration: 'none' }}>
                    <strong style={{ fontSize: 14 }}>
                      {collapseConnected ? <i className="bi bi-chevron-right" /> : <i className="bi bi-chevron-down" />} Conectadas ({connectedList.length})
                    </strong>
                  </button>
                  {totalPagesConnected > 1 && !collapseConnected && (
                    <div style={{ fontSize: 11, display: 'flex', gap: 4 }}>
                      <Button size="sm" variant="outline-secondary" disabled={pageConnected === 1} onClick={() => setPageConnected(p => Math.max(1, p-1))}>‹</Button>
                      <span style={{ display: 'inline-block', minWidth: 60, textAlign: 'center' }}>Pág {pageConnected}/{totalPagesConnected}</span>
                      <Button size="sm" variant="outline-secondary" disabled={pageConnected === totalPagesConnected} onClick={() => setPageConnected(p => Math.min(totalPagesConnected, p+1))}>›</Button>
                    </div>
                  )}
                </div>
                {!collapseConnected && connectedPage.map((conn, idx) => {
              const isConnecting = (connectingId === conn.phone);
              const statusConnected = conn.status === 'CONNECTED';
              const batteryPct = typeof conn.battery === 'number' ? conn.battery : undefined;
              return (
                <div
                  key={conn.phone || conn.connectionId || idx}
                  className={`p-${compactMode ? '1' : '2'} mb-2 rounded border d-flex align-items-center`}
                  style={{
                    position: 'relative',
                    gap: compactMode ? 8 : 12,
                    background: statusConnected ? '#f6fffa' : '#fff',
                    borderLeft: `6px solid ${statusConnected ? '#28a745' : '#6c757d'}`,
                    boxShadow: statusConnected ? '0 1px 3px rgba(40,167,69,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                    fontSize: compactMode ? 12 : 14
                  }}
                >
                  <div style={{ width: 14, display: 'flex', justifyContent: 'center' }}>
                    <span
                      title={statusConnected ? 'Conectado' : 'Desconectado'}
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: statusConnected ? '#28a745' : '#6c757d',
                        boxShadow: statusConnected ? '0 0 4px #28a745' : 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: compactMode ? 12 : 14 }}>{conn.phone}</strong>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        style={{ padding: '0 4px', lineHeight: '1.1', fontSize: 11 }}
                        title={copiedId === conn.phone ? 'Copiado!' : 'Copiar identificador'}
                        onClick={() => copyPhone(conn.phone)}
                      >
                        {copiedId === conn.phone ? <i className="bi bi-check-lg" /> : <i className="bi bi-clipboard" />}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        style={{ padding: '0 4px', lineHeight: '1.1', fontSize: 11 }}
                        title={copiedNormalizedId === normalizeDigits(conn.phone) ? 'Copiado!' : 'Copiar só dígitos'}
                        onClick={() => copyNormalized(conn.phone)}
                      >
                        {copiedNormalizedId === normalizeDigits(conn.phone) ? <i className="bi bi-check2" /> : <i className="bi bi-123" />}
                      </Button>
                      {statusConnected ? (
                        <span className="badge bg-success" style={{ fontWeight: 500 }}>Conectado</span>
                      ) : (
                        <span className="badge bg-secondary" style={{ fontWeight: 500 }}>Off-line</span>
                      )}
                      {isConnecting && connectingAction && (
                        <span className="text-warning" style={{ fontSize: 11 }}>
                          {connectingAction === 'connect' ? 'Gerando QR...' : 'Reconectando...'}
                        </span>
                      )}
                    </div>
                    {(conn.deviceName || conn.pushname || conn.name) && (
                      <div className="text-muted" style={{ fontSize: compactMode ? 11 : 12, marginTop: 2 }}>
                        📱 {conn.deviceName || conn.pushname || conn.name}
                      </div>
                    )}
                    {batteryPct !== undefined && !compactMode && (
                      <div style={{ marginTop: 4, maxWidth: 180 }} title={`Bateria: ${batteryPct}%`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.max(0, batteryPct))}%`, height: '100%', background: batteryPct > 30 ? '#28a745' : '#dc3545', transition: 'width .4s' }} />
                          </div>
                          <small style={{ fontSize: 10, color: '#555', width: 34, textAlign: 'right' }}>{batteryPct}%</small>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {!statusConnected && (
                      <>
                        <Button
                          size="sm"
                          variant={isConnecting && connectingAction === 'reconnect' ? 'warning' : 'outline-success'}
                          onClick={() => reconnectWhatsapp(conn.phone)}
                          disabled={isConnecting || loadingQr || !conn.phone}
                          title="Reconectar sessão"
                        >
                          {isConnecting && connectingAction === 'reconnect' ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <><i className="bi bi-arrow-repeat" /> Reconnect</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => connectWhatsapp(conn.phone)}
                          disabled={isConnecting || loadingQr || !conn.phone}
                          title="Gerar QR Code"
                        >
                          {isConnecting && connectingAction === 'connect' ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <><i className="bi bi-qr-code" /> Conectar</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-dark"
                          onClick={() => removeWhatsapp(conn.phone)}
                          disabled={removingId === conn.phone || !conn.phone}
                          title="Remover conexão"
                        >
                          {removingId === conn.phone ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-trash" /></>}
                        </Button>
                      </>
                    )}
                    {statusConnected && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => disconnectWhatsapp(conn.phone)}
                        disabled={removingId === conn.phone || !conn.phone}
                        title="Desconectar"
                      >
                        {removingId === conn.phone ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-x-circle" /> Sair</>}
                      </Button>
                    )}
                  </div>
                </div>
              );
                })}
              </div>
            )}
            {/* Grupo Desconectadas */}
            {disconnectedList.length > 0 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1 mt-2">
                  <button type="button" className="btn btn-link p-0" onClick={() => setCollapseDisconnected(c => !c)} style={{ textDecoration: 'none' }}>
                    <strong style={{ fontSize: 14 }}>
                      {collapseDisconnected ? <i className="bi bi-chevron-right" /> : <i className="bi bi-chevron-down" />} Desconectadas ({disconnectedList.length})
                    </strong>
                  </button>
                  {totalPagesDisconnected > 1 && !collapseDisconnected && (
                    <div style={{ fontSize: 11, display: 'flex', gap: 4 }}>
                      <Button size="sm" variant="outline-secondary" disabled={pageDisconnected === 1} onClick={() => setPageDisconnected(p => Math.max(1, p-1))}>‹</Button>
                      <span style={{ display: 'inline-block', minWidth: 60, textAlign: 'center' }}>Pág {pageDisconnected}/{totalPagesDisconnected}</span>
                      <Button size="sm" variant="outline-secondary" disabled={pageDisconnected === totalPagesDisconnected} onClick={() => setPageDisconnected(p => Math.min(totalPagesDisconnected, p+1))}>›</Button>
                    </div>
                  )}
                </div>
                {!collapseDisconnected && disconnectedPage.map((conn, idx) => {
                  const isConnecting = (connectingId === conn.phone);
                  const statusConnected = conn.status === 'CONNECTED';
                  const batteryPct = typeof conn.battery === 'number' ? conn.battery : undefined;
                  return (
                    <div
                      key={conn.phone || conn.connectionId || idx}
                      className={`p-${compactMode ? '1' : '2'} mb-2 rounded border d-flex align-items-center`}
                      style={{
                        position: 'relative',
                        gap: compactMode ? 8 : 12,
                        background: statusConnected ? '#f6fffa' : '#fff',
                        borderLeft: `6px solid ${statusConnected ? '#28a745' : '#6c757d'}`,
                        boxShadow: statusConnected ? '0 1px 3px rgba(40,167,69,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                        fontSize: compactMode ? 12 : 14
                      }}
                    >
                      <div style={{ width: 14, display: 'flex', justifyContent: 'center' }}>
                        <span
                          title={statusConnected ? 'Conectado' : 'Desconectado'}
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: statusConnected ? '#28a745' : '#6c757d',
                            boxShadow: statusConnected ? '0 0 4px #28a745' : 'none'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: compactMode ? 12 : 14 }}>{conn.phone}</strong>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            style={{ padding: '0 4px', lineHeight: '1.1', fontSize: 11 }}
                            title={copiedId === conn.phone ? 'Copiado!' : 'Copiar identificador'}
                            onClick={() => copyPhone(conn.phone)}
                          >
                            {copiedId === conn.phone ? <i className="bi bi-check-lg" /> : <i className="bi bi-clipboard" />}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            style={{ padding: '0 4px', lineHeight: '1.1', fontSize: 11 }}
                            title={copiedNormalizedId === normalizeDigits(conn.phone) ? 'Copiado!' : 'Copiar só dígitos'}
                            onClick={() => copyNormalized(conn.phone)}
                          >
                            {copiedNormalizedId === normalizeDigits(conn.phone) ? <i className="bi bi-check2" /> : <i className="bi bi-123" />}
                          </Button>
                          {statusConnected ? (
                            <span className="badge bg-success" style={{ fontWeight: 500 }}>Conectado</span>
                          ) : (
                            <span className="badge bg-secondary" style={{ fontWeight: 500 }}>Off-line</span>
                          )}
                          {isConnecting && connectingAction && (
                            <span className="text-warning" style={{ fontSize: 11 }}>
                              {connectingAction === 'connect' ? 'Gerando QR...' : 'Reconectando...'}
                            </span>
                          )}
                        </div>
                        {(conn.deviceName || conn.pushname || conn.name) && (
                          <div className="text-muted" style={{ fontSize: compactMode ? 11 : 12, marginTop: 2 }}>
                            📱 {conn.deviceName || conn.pushname || conn.name}
                          </div>
                        )}
                        {batteryPct !== undefined && !compactMode && (
                          <div style={{ marginTop: 4, maxWidth: 180 }} title={`Bateria: ${batteryPct}%`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 6, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, batteryPct))}%`, height: '100%', background: batteryPct > 30 ? '#28a745' : '#dc3545', transition: 'width .4s' }} />
                              </div>
                              <small style={{ fontSize: 10, color: '#555', width: 34, textAlign: 'right' }}>{batteryPct}%</small>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: compactMode ? 4 : 6 }}>
                        {!statusConnected && (
                          <>
                            <Button
                              size="sm"
                              variant={isConnecting && connectingAction === 'reconnect' ? 'warning' : 'outline-success'}
                              onClick={() => reconnectWhatsapp(conn.phone)}
                              disabled={isConnecting || loadingQr || !conn.phone}
                              title="Reconectar sessão"
                            >
                              {isConnecting && connectingAction === 'reconnect' ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                <><i className="bi bi-arrow-repeat" /> Reconnect</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => connectWhatsapp(conn.phone)}
                              disabled={isConnecting || loadingQr || !conn.phone}
                              title="Gerar QR Code"
                            >
                              {isConnecting && connectingAction === 'connect' ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                <><i className="bi bi-qr-code" /> Conectar</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-dark"
                              onClick={() => removeWhatsapp(conn.phone)}
                              disabled={removingId === conn.phone || !conn.phone}
                              title="Remover conexão"
                            >
                              {removingId === conn.phone ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-trash" /></>}
                            </Button>
                          </>
                        )}
                        {statusConnected && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => disconnectWhatsapp(conn.phone)}
                            disabled={removingId === conn.phone || !conn.phone}
                            title="Desconectar"
                          >
                            {removingId === conn.phone ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-x-circle" /> Sair</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {showingAllFallback && connections.length > 0 && (
              <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <small className="text-muted">
                  Nenhuma conexão encontrada com seu ID salvo. Mostrando todas as conexões disponíveis.
                </small>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fechar</Button>
      </Modal.Footer>
      {/* Confirmation modal used by showConfirm helper */}
      <Modal show={confirmVisible} onHide={() => runConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{confirmMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => runConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => runConfirm(true)}>Confirmar</Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default WhatsAppConnectionsManager;
