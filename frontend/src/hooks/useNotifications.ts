import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

interface NotificacaoTransferencia {
  type: 'transferencia';
  timestamp: string;
  data: {
    cartaoId: number;
    cartaoTitulo: string;
    usuarioOrigem: {
      id: number;
      nome: string;
    };
    observacao?: string;
  };
}

interface NotificacaoCartaoUpdate {
  type: 'cartao-update';
  cartaoId: number;
  action: string;
  timestamp: string;
  data: any;
}

type Notificacao = NotificacaoTransferencia | NotificacaoCartaoUpdate;

export function useNotifications(userId?: number) {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    // Conectar ao servidor WebSocket
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor de notificações');
      setConnected(true);

      // Se tiver userId, se inscrever nas notificações do usuário
      if (userId) {
        socket.emit('subscribe-user', userId);
        console.log(`📩 Inscrito nas notificações do usuário ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor de notificações');
      setConnected(false);
    });

    // Escutar novas transferências
    socket.on('nova-transferencia', (data: NotificacaoTransferencia) => {
      console.log('🔔 Nova transferência recebida:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Mostrar notificação do navegador se permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova Transferência', {
          body: `Você recebeu o cartão: ${data.data.cartaoTitulo}`,
          icon: '/favicon.ico',
          tag: `transferencia-${data.data.cartaoId}`
        });
      }

      // Tocar som de notificação
      playNotificationSound();
    });

    // Escutar atualizações de cartões
    socket.on('cartao-updated', (data: NotificacaoCartaoUpdate) => {
      console.log('🔄 Cartão atualizado:', data);
      // Você pode adicionar lógica adicional aqui
    });

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificações:', permission);
      });
    }

    return () => {
      if (userId) {
        socket.emit('unsubscribe-user', userId);
      }
      socket.disconnect();
    };
  }, [userId]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUhMMT6nl8LJnHgo5j9b00IQ5CBJY');
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Erro ao tocar som:', err));
    } catch (err) {
      console.log('Erro ao criar áudio:', err);
    }
  };

  const markAsRead = (index: number) => {
    setNotifications(prev => {
      const newNotifications = [...prev];
      newNotifications.splice(index, 1);
      return newNotifications;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    connected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    socket: socketRef.current
  };
}
