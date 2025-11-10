import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { authRoutes } from './routes/auth';
import { empresaAdminRoutes } from './routes/empresaAdmin';
import { usuariosRoutes } from './routes/usuarios';
import { empresasRoutes } from './routes/empresas';
import { rootRoutes } from './routes/root';
import avisosRoutes from './routes/avisos';
import avisoVisualizacaoRoutes from './routes/avisoVisualizacao';
import whatsappBaileysRoutes from './modules/whatsapp/routes/whatsappBaileys';
import kanbanRoutes from './routes/kanban';
import permissoesKanbanRoutes from './routes/permissoesKanban';
import whatsappKanbanRoutes from './routes/whatsappKanban';
import transferenciasRoutes from './routes/transferencias';
import tagsRoutes from './routes/tags';
import empresaConfigRoutes from './routes/empresaConfig';
import { initializeNotifications } from './services/notificationService';

// Carrega variáveis de ambiente padrão
dotenv.config();

const app = express();

const server = http.createServer(app);
// // Inicializar sistema de notificações
// const io = initializeNotifications(server);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*', // Permite todas as origens temporariamente para debug
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API do Projeto está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint para Coolify
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
// app.use('/api/auth', empresaAdminRoutes);
// app.use('/api/usuarios', usuariosRoutes);
// app.use('/api/empresas', empresasRoutes);
// app.use('/api/root', rootRoutes);
// app.use('/api/whatsapp', whatsappBaileysRoutes);
// app.use('/api/avisos', avisosRoutes);
// app.use('/api/avisos/visualizacao', avisoVisualizacaoRoutes);
// app.use('/api/kanban', kanbanRoutes);
// app.use('/api/permissoes-kanban', permissoesKanbanRoutes);
// app.use('/api/whatsapp-kanban', whatsappKanbanRoutes);
// app.use('/api', transferenciasRoutes);
// app.use('/api/tags', tagsRoutes);
// app.use('/api/empresa', empresaConfigRoutes);

// Middleware de tratamento de erro
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em: http://localhost:${PORT}/api`);
  console.log(`🔔 Sistema de notificações ativado`);
});

// Exemplo: emitir evento de visualização (para integração futura)
// export function emitMessageSeen(data: any) {
//   if (io) {
//     io.emit('message-seen', data);
//   }
// }
