const express = require('express');
const router = express.Router();

const { usuariosRoutes } = require('./usuarios');
const { rootRoutes } = require('./root');
const { empresaAdminRoutes } = require('./empresaAdmin');
const { authRoutes } = require('./auth');
const { empresasRoutes } = require('./empresas');
const { dashboardRoutes } = require('./dashboard');
// Adicione outras rotas conforme necessário

router.use('/usuarios', usuariosRoutes);
router.use('/root', rootRoutes);
router.use('/empresa-admin', empresaAdminRoutes);
router.use('/auth', authRoutes);
router.use('/empresas', empresasRoutes);
router.use('/dashboard', dashboardRoutes);
// router.use('/tags', require('./tags').default); // Exemplo para rotas com export default
// router.use('/kanban', require('./kanban').default);
// router.use('/avisos', require('./avisos').default);
// router.use('/transferencias', require('./transferencias').default);
// router.use('/aviso-visualizacao', require('./avisoVisualizacao').default);
// router.use('/permissoes-kanban', require('./permissoesKanban').default);
// router.use('/whatsapp-kanban', require('./whatsappKanban').default);

module.exports = router;
