import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeNotifications(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4000',
        'https://awa.nynch.com.br',
        'http://awa.nynch.com.br'
      ],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 Cliente conectado ao sistema de notificações:', socket.id);

    // Cliente se inscreve para receber notificações do seu usuário
    socket.on('subscribe-user', (userId: number) => {
      const roomName = `user-${userId}`;
      socket.join(roomName);
      console.log(`✅ Usuário ${userId} inscrito na sala ${roomName}`);
    });

    // Cliente cancela inscrição
    socket.on('unsubscribe-user', (userId: number) => {
      const roomName = `user-${userId}`;
      socket.leave(roomName);
      console.log(`❌ Usuário ${userId} saiu da sala ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log('👋 Cliente desconectado:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Notificar transferência de cartão
export function notifyTransferencia(usuarioDestinoId: number, data: any) {
  if (!io) {
    console.warn('⚠️  Socket.IO não inicializado');
    return;
  }

  const roomName = `user-${usuarioDestinoId}`;
  io.to(roomName).emit('nova-transferencia', {
    type: 'transferencia',
    timestamp: new Date().toISOString(),
    data
  });

  console.log(`🔔 Notificação enviada para usuário ${usuarioDestinoId}:`, data);
}

// Notificar atualização de cartão
export function notifyCartaoUpdate(cartaoId: number, action: string, data: any) {
  if (!io) {
    console.warn('⚠️  Socket.IO não inicializado');
    return;
  }

  io.emit('cartao-updated', {
    type: 'cartao-update',
    cartaoId,
    action,
    timestamp: new Date().toISOString(),
    data
  });

  console.log(`🔄 Notificação de atualização de cartão ${cartaoId}: ${action}`);
}

// Broadcast geral para todos os clientes
export function broadcastNotification(event: string, data: any) {
  if (!io) {
    console.warn('⚠️  Socket.IO não inicializado');
    return;
  }

  io.emit(event, {
    timestamp: new Date().toISOString(),
    data
  });

  console.log(`📢 Broadcast: ${event}`);
}
