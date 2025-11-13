import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

let socket: Socket | null = null;

export function connectSocket(token?: string) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
}

export function joinWhatsappSession(session_id: string) {
  if (!socket) return;
  socket.emit('join-session', session_id);
}

export function onWhatsappSessionUpdate(
  callback: (data: { session_id: string; status?: string; qr?: string; message?: string; hasQR?: boolean }) => void
) {
  if (!socket) return;
  socket.on('whatsapp-session-update', callback);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
