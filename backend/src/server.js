require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const initSchema = require('./initSchema');

async function start() {
  await initSchema();

  const app = express();

  // Permitir CORS para qualquer origem (ajuste para produção se necessário)
  app.use(cors({ origin: '*', credentials: true }));
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Servir arquivos de mídia estáticos
  const path = require('path');
  app.use('/media', express.static(path.join(__dirname, '../public/media')));

  app.use('/api', routes);

  const http = require('http');
  const server = http.createServer(app);

  // Socket.IO (opcional) será ligado para suportar clientes socket.io
  const { Server } = require('socket.io');
  const io = new Server(server, {
    // configure CORS for socket.io
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Passa a instância de io para o módulo de notificações
  const notifications = require('./notifications');
  if (notifications && typeof notifications.setIo === 'function') {
    notifications.setIo(io);
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT} (HTTP + Socket.IO)`);
  });
}

start();
