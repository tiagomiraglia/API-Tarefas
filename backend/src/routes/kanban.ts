import { Router } from 'express';
import { KanbanController } from '../controllers/KanbanController';
import { authenticateJWT } from '../middleware/auth';
import { verificarPermissaoColuna, verificarPermissaoEdicao, verificarPermissaoMover } from '../middleware/kanbanPermissions';

const router = Router();
const kanban = new KanbanController();

// ABAS
router.get('/abas', authenticateJWT, (req, res) => kanban.listAbas(req, res));
router.post('/abas', authenticateJWT, (req, res) => kanban.createAba(req, res));
router.put('/abas/:id', authenticateJWT, (req, res) => kanban.updateAba(req, res));
router.delete('/abas/:id', authenticateJWT, (req, res) => kanban.deleteAba(req, res));

// COLUNAS
router.post('/colunas', authenticateJWT, (req, res) => kanban.createColuna(req, res));
router.put('/colunas/:id', authenticateJWT, (req, res) => kanban.updateColuna(req, res));
router.delete('/colunas/:id', authenticateJWT, (req, res) => kanban.deleteColuna(req, res));

// Definir coluna padrão para WhatsApp
router.post('/colunas/set-whats', authenticateJWT, (req, res) => kanban.setColunaWhats(req, res));

// CARTÕES
router.get('/cartoes', authenticateJWT, (req, res) => kanban.listCartoes(req, res));
router.get('/cartoes/:id', authenticateJWT, (req, res) => kanban.getCartao(req, res));
router.post('/cartoes', authenticateJWT, verificarPermissaoColuna, verificarPermissaoEdicao, (req, res) => kanban.createCartao(req, res));
router.put('/cartoes/:id', authenticateJWT, (req, res) => kanban.updateCartao(req, res));
router.delete('/cartoes/:id', authenticateJWT, verificarPermissaoEdicao, (req, res) => kanban.deleteCartao(req, res));
router.post('/cartoes/move', authenticateJWT, verificarPermissaoMover, (req, res) => kanban.moveCartao(req, res));

// VINCULAÇÃO WHATSAPP
router.post('/cartoes/whatsapp/vincular', authenticateJWT, (req, res) => kanban.vincularWhatsApp(req, res));
router.post('/cartoes/whatsapp/desvincular', authenticateJWT, (req, res) => kanban.desvincularWhatsApp(req, res));

// MONITORAMENTO INTELIGENTE
router.get('/monitoramento', authenticateJWT, (req, res) => kanban.getMonitoramento(req, res));

export default router;
