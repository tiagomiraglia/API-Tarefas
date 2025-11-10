"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/avisos/visualizacao
// Body: { avisoIds: number[] }
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const usuarioId = req.user?.id;
        const { avisoIds } = req.body;
        if (!usuarioId || !Array.isArray(avisoIds)) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }
        // Upsert visualização para cada aviso
        await Promise.all(avisoIds.map(async (aviso_id) => {
            await prisma.avisoVisualizacao.upsert({
                where: { aviso_id_usuario_id: { aviso_id, usuario_id: usuarioId } },
                update: { visualizado_em: new Date() },
                create: { aviso_id, usuario_id: usuarioId },
            });
        }));
        return res.json({ ok: true });
    }
    catch (error) {
        console.error('Erro ao registrar visualização de aviso:', error);
        return res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
});
// GET /api/avisos/visualizacao/:avisoId
// Retorna lista de usuários que visualizaram o aviso
router.get('/:avisoId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const avisoId = Number(req.params.avisoId);
        if (!avisoId)
            return res.status(400).json({ error: 'ID inválido' });
        const visualizacoes = await prisma.avisoVisualizacao.findMany({
            where: { aviso_id: avisoId },
            include: { usuario: { select: { id: true, nome: true, email: true, nivel: true } } },
            orderBy: { visualizado_em: 'asc' }
        });
        return res.json({ visualizacoes });
    }
    catch (error) {
        console.error('Erro ao buscar visualizações:', error);
        return res.status(500).json({ error: 'Erro ao buscar visualizações' });
    }
});
exports.default = router;
//# sourceMappingURL=avisoVisualizacao.js.map