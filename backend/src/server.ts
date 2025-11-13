import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import { authRoutes } from './routes/auth';
import { empresaAdminRoutes } from './routes/empresaAdmin';
import { usuariosRoutes } from './routes/usuarios';
import { empresasRoutes } from './routes/empresas';
import { rootRoutes } from './routes/root';
import { dashboardRoutes } from './routes/dashboard';
import kanbanRoutes from './routes/kanban';
import whatsappBaileysRoutes, { setSocketIO } from './modules/whatsapp/routes/whatsappBaileys';

// Carrega variáveis de ambiente padrão
// dotenv.config();

console.log('1. Carregando dotenv...');

// Inicializar Prisma global (lazy loading)
declare global {
  var prisma: any;
}

global.prisma = null;

export function getPrisma(): any {
  if (!global.prisma) {
    global.prisma = new (require('@prisma/client').PrismaClient)();
  }
  return global.prisma;
}

const app = express();

const server = http.createServer(app);

// Integração socket.io
import { Server as SocketIOServer } from 'socket.io';
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

setSocketIO(io);

io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);
  // O frontend pode entrar em uma "room" com o sessionId para receber updates
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} entrou na sessão ${sessionId}`);
  });
  socket.on('disconnect', () => {
    console.log('Socket desconectado:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('2. Middleware configurado...');

// Rotas básicas
// app.get('/api', (req, res) => {
//   console.log('3. Rota /api chamada');
//   res.json({
//     message: 'API do Projeto está funcionando!',
//     version: '1.0.0',
//     timestamp: new Date().toISOString()
//   });
// });

app.get('/health', (req, res) => {
  console.log('4. Rota /health chamada');
  res.status(200).json({ status: 'ok' });
});

// Rotas da API
console.log('5. Configurando rotas...');
app.use('/api/auth', authRoutes);
app.use('/api/auth', empresaAdminRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/root', rootRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/whatsapp', whatsappBaileysRoutes);

// Middleware de tratamento de erro
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err.stack);
  res.status(500).json({
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 4000;

console.log('6. Tentando iniciar servidor na porta', PORT);

server.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em: http://localhost:${PORT}/api`);

  // Carregar sessões WhatsApp ativas após o servidor iniciar
  try {
    const whatsappService = await import('./modules/whatsapp/services/whatsappWebJsService');
    await whatsappService.loadActiveSessions((sessionId, data) => {
      if (io) {
        io.to(sessionId).emit('whatsapp-session-update', { session_id: sessionId, ...data });
      }
    });
    console.log('📱 Sessões WhatsApp ativas carregadas');
  } catch (error) {
    console.error('Erro ao carregar sessões WhatsApp:', error);
  }
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});
