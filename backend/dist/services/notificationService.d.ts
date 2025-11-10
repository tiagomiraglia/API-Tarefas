import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
export declare function initializeNotifications(server: HTTPServer): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function getIO(): SocketIOServer | null;
export declare function notifyTransferencia(usuarioDestinoId: number, data: any): void;
export declare function notifyCartaoUpdate(cartaoId: number, action: string, data: any): void;
export declare function broadcastNotification(event: string, data: any): void;
//# sourceMappingURL=notificationService.d.ts.map