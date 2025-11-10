// Hook para gerenciar notificações em tempo real via Server-Sent Events
import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { normalizeRealtimePayload } from '../utils/normalizeConversation';

type SocketType = Awaited<ReturnType<typeof getSocket>>;

interface UseRealtimeNotificationsProps {
  onNewMessage?: (conversationData: any) => void;
  onStatusUpdate?: (conversationId: string, newStatus: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealtimeNotifications({
  onNewMessage,
  onStatusUpdate,
  onConnectionChange
}: UseRealtimeNotificationsProps) {
  const socketRef = useRef<SocketType | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(false);
  // SSE removed - socket.io only

  // socket.io connect logic
  const connectSocket = useCallback(async () => {
    // Evitar múltiplas conexões simultâneas
    if (socketRef.current || isConnectingRef.current) {
      console.log('⚠️ [Realtime] Socket já existe ou está em progresso');
      return;
    }

    try {
      console.log('🔌 [Realtime] Conectando via socket.io...');
      isConnectingRef.current = true;

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const socket = await getSocket(token ?? undefined);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ [Realtime] Socket conectado', socket.id);
        isConnectedRef.current = true;
        isConnectingRef.current = false;
        onConnectionChange?.(true);
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current as number);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('disconnect', (reason: string) => {
        console.warn('⚠️ [Realtime] Socket desconectado', reason);
        isConnectedRef.current = false;
        isConnectingRef.current = false;
        onConnectionChange?.(false);
      });

      socket.on('received-message', (payload: any) => {
        try {
          const normalized = normalizeRealtimePayload(payload);
          onNewMessage?.(normalized || payload.response || payload);
        } catch (e) {
          console.error('Erro ao processar received-message', e);
        }
      });

      socket.on('mensagem-enviada', (payload: any) => {
        try {
          const normalized = normalizeRealtimePayload(payload);
          onNewMessage?.(normalized || payload);
        } catch (e) {
          console.error('Erro ao processar mensagem-enviada', e);
        }
      });

      // Novo evento granular emitido pelo backend
      socket.on('new_message', (payload: any) => {
        try {
          onNewMessage?.(payload);
        } catch (e) {
          console.error('Erro ao processar new_message', e);
        }
      });

      socket.on('connect_error', (err: any) => {
        console.error('🔌 [Realtime] erro de conexão socket.io', err);
        onConnectionChange?.(false);
      });
    } catch (error) {
      console.error('❌ [Realtime] Erro ao criar conexão socket.io:', error);
      isConnectedRef.current = false;
      isConnectingRef.current = false;
      onConnectionChange?.(false);
    }
  }, [onNewMessage, onStatusUpdate, onConnectionChange]);

  const connect = useCallback(async () => {
    await connectSocket();
  }, [connectSocket]);

  const disconnect = useCallback(() => {
    console.log('🔌 [Realtime] Limpando listeners e fechando conexões...');

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current as number);
      reconnectTimeoutRef.current = null;
    }

    const s = socketRef.current;
    if (s) {
      try {
        s.off('connect');
        s.off('disconnect');
        s.off('received-message');
        s.off('mensagem-enviada');
  s.off('new_message');
        s.off('connect_error');
        s.disconnect?.();
      } catch (e) {}
      socketRef.current = null;
    }

  isConnectedRef.current = false;
  isConnectingRef.current = false;
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Conectar apenas uma vez ao montar o componente
  useEffect(() => {
    console.log('�️ [Realtime] Hook montado - iniciando conexão realtime');
    isMountedRef.current = true;
    connect();

    return () => {
      console.log('🧹 [Realtime] Hook desmontado - limpando conexão');
      isMountedRef.current = false;
      disconnect();
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    reconnect: connect,
    disconnect
  };
}

export default useRealtimeNotifications;
