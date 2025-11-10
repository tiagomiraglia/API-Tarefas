// Componente de teste para verificar as notificações em tempo real
import React, { useEffect } from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { getSingleton as getSocketSingleton } from '../services/socket';
import { listWhatsappConnections } from '../services/api';

type Props = {
  compact?: boolean; // se true, renderiza módulos de badges inline (para cabeçalho)
  showMessages?: boolean; // controlar exibição do badge de mensagens
  onOpenConnections?: () => void; // chamado ao clicar no indicador compacto
};

const RealtimeStatus: React.FC<Props> = ({ compact = false, showMessages = true, onOpenConnections }) => {
  const [connected, setConnected] = React.useState(false);
  const [lastMessage, setLastMessage] = React.useState<string>('');
  const [messageCount, setMessageCount] = React.useState(0);
  const [whatsappStatus, setWhatsappStatus] = React.useState<{
    connected: number;
    total: number;
    status: string;
  }>({ connected: 0, total: 0, status: 'disconnected' });

  // server reachability flag — true when backend API responds
  const [serverUp, setServerUp] = React.useState<boolean>(true);

  useRealtimeNotifications({
    onNewMessage: (data) => {
      try {
        const name = data?.client_name || data?.clientName || '';
        setLastMessage(name ? `${name}: ${data.lastMessage || data.last_message || ''}` : (data.lastMessage || data.last_message || ''));
      } catch (e) {}
      setMessageCount(prev => prev + 1);
    },
    onStatusUpdate: () => {},
    onConnectionChange: (isConnected) => {
      setConnected(isConnected);
    }
  });

  // Also observe socket.io singleton directly (helps reflect true socket status quickly)
  useEffect(() => {
    let s = getSocketSingleton();
    let onConnect: (() => void) | null = null;
    let onDisconnect: (() => void) | null = null;

    const attach = (socket: any) => {
      try {
        onConnect = () => setConnected(true);
        onDisconnect = () => setConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        // initial state
        setConnected(Boolean(socket.connected));
      } catch (e) {
        // ignore
      }
    };

    if (s) attach(s);

    // Periodically re-check for singleton (in case it is created after mount)
    const interval = window.setInterval(() => {
      if (!s) {
        s = getSocketSingleton();
        if (s) attach(s);
      }
    }, 800);

    return () => {
      try {
        if (s && onConnect) s.off('connect', onConnect);
        if (s && onDisconnect) s.off('disconnect', onDisconnect);
      } catch (e) {}
      window.clearInterval(interval as number);
    };
  }, []);

  // Verificar status do WhatsApp periodicamente
  useEffect(() => {
    let mounted = true;
    const runningRef = { current: false } as { current: boolean };
    const checkWhatsAppStatus = async () => {
      if (runningRef.current) return; // avoid overlapping calls
      runningRef.current = true;
      try {
        const res = await listWhatsappConnections();
        // If the API call succeeded, mark server as up
        setServerUp(true);
        const raw = res && res.data ? res.data : [];
        // normalize to an array: some backends return { connections: [] } or an array directly
        const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.connections) ? raw.connections : []);
        const total = arr.length;
        // tolerate different layouts: 'isConnected' boolean, or 'status' string (CONNECTED)
        const connectedCount = arr.filter((c: any) => {
          if (typeof c.isConnected === 'boolean') return c.isConnected;
          if (typeof c.status === 'string') return c.status.toUpperCase() === 'CONNECTED';
          // fallback: treat truthy 'connected' prop as connected
          return !!c.connected || !!c.connect || false;
        }).length;

        if (mounted) setWhatsappStatus({ connected: connectedCount, total, status: connectedCount > 0 ? 'connected' : 'disconnected' });
      } catch (error) {
  // marca servidor como down em caso de erro de rede/API
  setServerUp(false);
      } finally {
        runningRef.current = false;
      }
    };

    // initial and persistent checks
    checkWhatsAppStatus();
    const interval = window.setInterval(checkWhatsAppStatus, 5000);

    // also trigger check when window/tab regains focus or becomes visible
    const onVisibility = () => { if (document.visibilityState === 'visible') checkWhatsAppStatus(); };
    const onFocus = () => { checkWhatsAppStatus(); };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => { mounted = false; window.clearInterval(interval as number); window.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('focus', onFocus); };
  }, []);

  // Also listen for socket events that indicate WhatsApp connections changed so we update immediately
  useEffect(() => {
    const s = getSocketSingleton();
    const onConnectionsUpdated = () => {
      try {
        // trigger an immediate re-check
        (async () => { try { await listWhatsappConnections(); /* we don't need result here, RealtimeStatus's effect will pick up via its interval or we can call check directly if extracted */ } catch (e) {} })();
        // As a lightweight immediate action, trigger a visibility-based check by dispatching a custom event the existing effect listens to
        // (we'll call the list directly and also setServerUp optimistically)
        setServerUp(true);
      } catch (e) {}
    };

    try {
      if (s) {
        s.on('whatsapp-connections-updated', onConnectionsUpdated);
        s.on('received-message', onConnectionsUpdated);
        s.on('mensagem-enviada', onConnectionsUpdated);
      }
    } catch (e) {}

    return () => {
      try {
        if (s) {
          s.off('whatsapp-connections-updated', onConnectionsUpdated);
          s.off('received-message', onConnectionsUpdated);
          s.off('mensagem-enviada', onConnectionsUpdated);
        }
      } catch (e) {}
    };
  }, []);

  const tooltipContent = (
    <div style={{ maxWidth: 320 }}>
  <div><strong>Realtime:</strong> {connected ? 'Conectado' : 'Desconectado'}</div>
  <div><strong>Servidor:</strong> {serverUp ? 'Funcionando' : 'Indisponível'}</div>
      <div><strong>Mensagens recebidas:</strong> {messageCount}</div>
      <hr />
      <div><strong>WhatsApp:</strong> {whatsappStatus.connected}/{whatsappStatus.total} {whatsappStatus.status === 'connected' ? '(conectado)' : '(desconectado)'}</div>
    </div>
  );

  // cor baseada em conexões ativas (compact)
  const connActive = whatsappStatus.connected > 0;
  const connColor = connActive ? '#28a745' : '#dc3545';

  if (compact) {
    // layout compacto para cabeçalho: apenas badges inline, sem bordas grandes
    return (
      <OverlayTrigger placement="bottom" overlay={<Tooltip id="realtime-tooltip-compact">{tooltipContent}</Tooltip>}>
        <div
          role={onOpenConnections ? 'button' : undefined}
          tabIndex={onOpenConnections ? 0 : undefined}
          onClick={() => onOpenConnections?.()}
          onKeyDown={(e: any) => { if (onOpenConnections && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpenConnections(); } }}
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8, cursor: onOpenConnections ? 'pointer' : 'default' }}
        >
          {/* Realtime dot + label */}
          <div title={serverUp ? 'Servidor respondendo' : 'Servidor indisponível'} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: serverUp ? '#28a745' : '#dc3545', display: 'inline-block', boxShadow: '0 0 0 3px rgba(0,0,0,0.03)' }} />
            <small style={{ fontWeight: 600, fontSize: 12, color: serverUp ? '#28a745' : '#dc3545' }}>{'Servidor'}</small>
          </div>

          {/* Conexões (compact): apenas dot + número */}
          <div title={`${whatsappStatus.connected} conectados de ${whatsappStatus.total}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: connColor, display: 'inline-block' }} />
            <small style={{ fontWeight: 600, fontSize: 12, color: connColor }}>Conexões</small>
            <small style={{ fontWeight: 700, fontSize: 12, color: connColor }}>{whatsappStatus.connected}</small>
          </div>

          {/* Messages count compact (opcional) */}
          {showMessages && (
            <Badge bg="info" style={{ fontSize: 12, padding: '6px 8px' }} title={`${messageCount} mensagens recebidas`}>{messageCount} msgs</Badge>
          )}
        </div>
      </OverlayTrigger>
    );
  }

  return (
    <div className="mb-3 p-2 border rounded d-flex align-items-center justify-content-between">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="realtime-tooltip">{tooltipContent}</Tooltip>}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            {/* Dot + label for realtime */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={connected ? 'Conexão em tempo real ativa' : 'Conexão em tempo real inativa'}>
              <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: serverUp ? '#28a745' : '#dc3545', display: 'inline-block' }} />
              <Badge bg={serverUp ? 'success' : 'danger'} style={{ fontWeight: 600 }}>{'Servidor'}</Badge>
            </div>

            <Badge bg={whatsappStatus.status === 'connected' ? 'success' : 'warning'} style={{ fontWeight: 600 }} title={`${whatsappStatus.connected} conectados de ${whatsappStatus.total}`}>
              Conexões {whatsappStatus.connected}/{whatsappStatus.total}
            </Badge>
            {showMessages && <Badge bg="info">{messageCount} msgs</Badge>}
          </div>
        </OverlayTrigger>
        <div style={{ marginLeft: 8 }}>
          <small className="text-muted">{lastMessage ? `Última: ${lastMessage}` : ''}</small>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#6c757d' }}>
        <small>Hover para detalhes</small>
      </div>
    </div>
  );
};

export default RealtimeStatus;
