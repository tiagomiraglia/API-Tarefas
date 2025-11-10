"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const auth_1 = require("./routes/auth");
// Carrega variáveis de ambiente padrão
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// // Inicializar sistema de notificações
// const io = initializeNotifications(server);
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Permite todas as origens temporariamente para debug
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/auth', auth_1.authRoutes);
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
app.use((err, req, res, next) => {
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
//# sourceMappingURL=server.js.map