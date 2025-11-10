"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissaoKanbanController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PermissaoKanbanController {
    // Listar permissões de um usuário (agora lê do campo JSON)
    async listByUsuario(req, res) {
        const usuarioId = Number(req.params.usuarioId);
        const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        let permissoes = usuario.permissoes;
        if (!permissoes || typeof permissoes !== 'object') {
            try {
                permissoes = permissoes ? JSON.parse(permissoes) : {};
            }
            catch {
                permissoes = {};
            }
        }
        // Converte formato interno para formato da interface
        const permissoesArray = [];
        if (permissoes.kanban && permissoes.kanban.abas && Array.isArray(permissoes.kanban.abas)) {
            let idCounter = 1;
            for (const aba of permissoes.kanban.abas) {
                const abaData = await prisma.aba.findUnique({ where: { id: aba.id }, include: { colunas: true } });
                if (aba.colunas && aba.colunas.length > 0) {
                    // Permissões específicas por coluna
                    for (const colunaId of aba.colunas) {
                        const coluna = abaData?.colunas.find((c) => c.id === colunaId);
                        permissoesArray.push({
                            id: idCounter++,
                            usuario_id: usuarioId,
                            aba_id: aba.id,
                            coluna_id: colunaId,
                            tipo: 'editar',
                            aba: abaData,
                            coluna: coluna
                        });
                    }
                }
                else {
                    // Acesso a todas as colunas da aba
                    permissoesArray.push({
                        id: idCounter++,
                        usuario_id: usuarioId,
                        aba_id: aba.id,
                        coluna_id: null,
                        tipo: 'editar',
                        aba: abaData,
                        coluna: null
                    });
                }
            }
        }
        res.json(permissoesArray);
    }
    // Listar permissões por aba/coluna
    async listByAbaColuna(req, res) {
        const { abaId, colunaId } = req.query;
        const permissoes = await prisma.permissaoKanban.findMany({
            where: {
                aba_id: abaId ? Number(abaId) : undefined,
                coluna_id: colunaId ? Number(colunaId) : undefined,
            },
            include: { usuario: true },
        });
        res.json(permissoes);
    }
    // Atribuir permissão (agora atualiza o campo permissoes do usuário)
    async create(req, res) {
        const { usuario_id, aba_id, coluna_id } = req.body;
        if (!usuario_id || !aba_id) {
            return res.status(400).json({ message: 'Usuário e aba são obrigatórios.' });
        }
        // Busca usuário
        const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id } });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        let permissoes = usuario.permissoes;
        if (!permissoes || typeof permissoes !== 'object') {
            try {
                permissoes = permissoes ? JSON.parse(permissoes) : {};
            }
            catch {
                permissoes = {};
            }
        }
        if (!permissoes.kanban)
            permissoes.kanban = {};
        if (!permissoes.kanban.abas)
            permissoes.kanban.abas = [];
        // Verifica se já existe permissão para a aba
        let abaPerm = permissoes.kanban.abas.find((a) => a.id === aba_id);
        if (!abaPerm) {
            abaPerm = { id: aba_id, colunas: [] };
            permissoes.kanban.abas.push(abaPerm);
        }
        // Se coluna_id informado, adiciona coluna específica
        if (coluna_id) {
            if (!abaPerm.colunas.includes(coluna_id))
                abaPerm.colunas.push(coluna_id);
        }
        else {
            // Se não, permite todas as colunas (colunas = [])
            abaPerm.colunas = [];
        }
        await prisma.usuario.update({ where: { id: usuario_id }, data: { permissoes } });
        res.status(201).json({ message: 'Permissão atribuída', permissoes });
    }
    // Remover permissão (atualiza o campo permissoes do usuário)
    async delete(req, res) {
        const { usuario_id, aba_id, coluna_id } = req.body;
        if (!usuario_id || !aba_id) {
            return res.status(400).json({ message: 'Usuário e aba são obrigatórios.' });
        }
        const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id } });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        let permissoes = usuario.permissoes;
        if (!permissoes || typeof permissoes !== 'object') {
            try {
                permissoes = permissoes ? JSON.parse(permissoes) : {};
            }
            catch {
                permissoes = {};
            }
        }
        if (!permissoes.kanban)
            permissoes.kanban = {};
        if (!permissoes.kanban.abas)
            permissoes.kanban.abas = [];
        // Remove permissão
        let abaPerm = permissoes.kanban.abas.find((a) => a.id === aba_id);
        if (!abaPerm) {
            return res.status(404).json({ message: 'Permissão não encontrada.' });
        }
        if (coluna_id) {
            abaPerm.colunas = abaPerm.colunas.filter((c) => c !== coluna_id);
            // Se não restar nenhuma coluna, remove a aba
            if (abaPerm.colunas.length === 0) {
                permissoes.kanban.abas = permissoes.kanban.abas.filter((a) => a.id !== aba_id);
            }
        }
        else {
            // Remove permissão da aba inteira
            permissoes.kanban.abas = permissoes.kanban.abas.filter((a) => a.id !== aba_id);
        }
        await prisma.usuario.update({ where: { id: usuario_id }, data: { permissoes } });
        res.json({ message: 'Permissão removida', permissoes });
    }
}
exports.PermissaoKanbanController = PermissaoKanbanController;
//# sourceMappingURL=PermissaoKanbanController.js.map