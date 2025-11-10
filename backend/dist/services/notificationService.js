"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeNotifications = initializeNotifications;
exports.getIO = getIO;
exports.notifyTransferencia = notifyTransferencia;
exports.notifyCartaoUpdate = notifyCartaoUpdate;
exports.broadcastNotification = broadcastNotification;
const socket_io_1 = require("socket.io");
let io = null;
function initializeNotifications(server) {
    io = new socket_io_1.Server(server, {
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
        socket.on('subscribe-user', (userId) => {
            const roomName = `user-${userId}`;
            socket.join(roomName);
            console.log(`✅ Usuário ${userId} inscrito na sala ${roomName}`);
        });
        // Cliente cancela inscrição
        socket.on('unsubscribe-user', (userId) => {
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
function getIO() {
    return io;
}
// Notificar transferência de cartão
function notifyTransferencia(usuarioDestinoId, data) {
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
function notifyCartaoUpdate(cartaoId, action, data) {
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
function broadcastNotification(event, data) {
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
//# sourceMappingURL=notificationService.js.map