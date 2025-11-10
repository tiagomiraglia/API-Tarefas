import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

import { authRoutes } from './routes/auth';

// Carrega variáveis de ambiente padrão
dotenv.config();

console.log('1. Carregando dotenv...');

const app = express();

const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('2. Middleware configurado...');

// Rotas básicas
app.get('/api', (req, res) => {
  console.log('3. Rota /api chamada');
  res.json({
    message: 'API do Projeto está funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  console.log('4. Rota /health chamada');
  res.status(200).json({ status: 'ok' });
});

// Apenas rota de auth por enquanto
console.log('5. Configurando rota auth...');
app.use('/api/auth', authRoutes);

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

const PORT = 4001;

console.log('6. Tentando iniciar servidor na porta', PORT);

server.listen(PORT, () => {
  console.log(`🚀 Servidor mínimo rodando na porta ${PORT}`);
  console.log(`📡 API disponível em: http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});