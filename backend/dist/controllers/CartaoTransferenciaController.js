"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartaoTransferenciaController = void 0;
const client_1 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const prisma = new client_1.PrismaClient();
class CartaoTransferenciaController {
    /**
     * Transferir cartão para outro atendente
     * POST /api/cartoes/:id/transferir
     */
    async transferirCartao(req, res) {
        const { id } = req.params;
        const { usuario_destino_id, observacao } = req.body;
        const usuarioOrigemId = req.user?.id;
        const isAdmin = req.user?.nivel === 'admin' || req.user?.nivel === 'superadmin' || req.user?.is_superuser;
        if (!usuarioOrigemId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        if (!usuario_destino_id) {
            return res.status(400).json({ message: 'Usuario destino obrigatório' });
        }
        try {
            const cartaoId = Number(id);
            // Buscar cartão atual com informações completas
            const cartao = await prisma.cartao.findUnique({
                where: { id: cartaoId },
                include: {
                    coluna: true,
                    atendente_responsavel: { select: { id: true, nome: true } }
                }
            });
            if (!cartao) {
                return res.status(404).json({ message: 'Cartão não encontrado' });
            }
            // Verificar permissão: apenas o atendente responsável ou admin pode transferir
            if (!isAdmin && cartao.atendente_responsavel_id && cartao.atendente_responsavel_id !== usuarioOrigemId) {
                return res.status(403).json({
                    message: 'Você não tem permissão para transferir este cartão. Apenas o atendente responsável ou admin podem fazer isso.'
                });
            }
            // Verificar se o usuário destino existe
            const usuarioDestino = await prisma.usuario.findUnique({
                where: { id: usuario_destino_id },
                select: { id: true, nome: true, email: true, empresa_id: true }
            });
            if (!usuarioDestino) {
                return res.status(404).json({ message: 'Usuário destino não encontrado' });
            }
            // Verificar se o usuário destino é da mesma empresa
            if (usuarioDestino.empresa_id !== req.user?.empresa_id) {
                return res.status(403).json({ message: 'Usuário destino não pertence à mesma empresa' });
            }
            // Permitir transferência para si mesmo (caso admin)
            const colunaOrigemId = cartao.coluna_id;
            // Iniciar transação para garantir consistência
            const resultado = await prisma.$transaction(async (tx) => {
                // 1. Atualizar o cartão com novo atendente responsável
                const cartaoAtualizado = await tx.cartao.update({
                    where: { id: cartaoId },
                    data: {
                        atendente_responsavel_id: usuario_destino_id,
                        updated_at: new Date()
                    },
                    include: {
                        atendente_responsavel: { select: { id: true, nome: true, email: true } },
                        coluna: true
                    }
                });
                // 2. Registrar transferência no histórico
                const transferencia = await tx.cartaoTransferencia.create({
                    data: {
                        cartao_id: cartaoId,
                        usuario_origem_id: usuarioOrigemId,
                        usuario_destino_id: usuario_destino_id,
                        observacao: observacao || null,
                        coluna_origem_id: colunaOrigemId,
                        coluna_destino_id: cartaoAtualizado.coluna_id
                    },
                    include: {
                        usuario_origem: { select: { id: true, nome: true, email: true } },
                        usuario_destino: { select: { id: true, nome: true, email: true } }
                    }
                });
                // 3. Registrar no histórico do cartão
                await tx.cartaoHistorico.create({
                    data: {
                        cartao_id: cartaoId,
                        usuario_id: usuarioOrigemId,
                        acao: 'transferiu',
                        descricao: `Transferiu atendimento para ${usuarioDestino.nome}${observacao ? `: ${observacao}` : ''}`
                    }
                });
                return { cartao: cartaoAtualizado, transferencia };
            });
            console.log(`✅ Cartão ${cartaoId} transferido de ${usuarioOrigemId} para ${usuario_destino_id}`);
            // 🔔 NOTIFICAÇÃO EM TEMPO REAL - Avisar usuário destino
            try {
                (0, notificationService_1.notifyTransferencia)(usuario_destino_id, {
                    cartaoId,
                    cartaoTitulo: cartao.titulo,
                    usuarioOrigem: {
                        id: usuarioOrigemId,
                        nome: req.user?.nome || 'Usuário'
                    },
                    observacao: observacao || null,
                    transferencia: resultado.transferencia
                });
                // Notificar atualização geral do cartão
                (0, notificationService_1.notifyCartaoUpdate)(cartaoId, 'transferido', {
                    novoResponsavel: usuarioDestino,
                    antigoResponsavel: usuarioOrigemId
                });
            }
            catch (notifError) {
                console.error('⚠️  Erro ao enviar notificação:', notifError);
                // Não falha a transferência se a notificação falhar
            }
            res.json({
                message: 'Cartão transferido com sucesso',
                cartao: resultado.cartao,
                transferencia: resultado.transferencia
            });
        }
        catch (error) {
            console.error('❌ Erro ao transferir cartão:', error);
            res.status(500).json({
                message: 'Erro ao transferir cartão',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Buscar histórico de transferências de um cartão
     * GET /api/cartoes/:id/transferencias
     */
    async getHistoricoTransferencias(req, res) {
        const { id } = req.params;
        const isAdmin = req.user?.nivel === 'admin' || req.user?.nivel === 'superadmin' || req.user?.is_superuser;
        try {
            const cartaoId = Number(id);
            // Buscar cartão para verificar permissões
            const cartao = await prisma.cartao.findUnique({
                where: { id: cartaoId },
                select: {
                    id: true,
                    atendente_responsavel_id: true,
                    created_by_id: true,
                    coluna: {
                        include: {
                            aba: {
                                select: { empresa_id: true }
                            }
                        }
                    }
                }
            });
            if (!cartao) {
                return res.status(404).json({ message: 'Cartão não encontrado' });
            }
            // Verificar se o usuário tem permissão (admin ou atendente responsável ou criador)
            if (!isAdmin &&
                cartao.atendente_responsavel_id !== req.user?.id &&
                cartao.created_by_id !== req.user?.id) {
                return res.status(403).json({
                    message: 'Você não tem permissão para ver o histórico deste cartão'
                });
            }
            // Buscar transferências
            const transferencias = await prisma.cartaoTransferencia.findMany({
                where: { cartao_id: cartaoId },
                include: {
                    usuario_origem: {
                        select: { id: true, nome: true, email: true, foto: true }
                    },
                    usuario_destino: {
                        select: { id: true, nome: true, email: true, foto: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({
                cartao_id: cartaoId,
                total: transferencias.length,
                transferencias
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar histórico de transferências:', error);
            res.status(500).json({
                message: 'Erro ao buscar histórico de transferências',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Estatísticas de transferências (apenas admin)
     * GET /api/transferencias/estatisticas
     */
    async getEstatisticas(req, res) {
        const isAdmin = req.user?.nivel === 'admin' || req.user?.nivel === 'superadmin' || req.user?.is_superuser;
        const empresaId = req.user?.empresa_id;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Apenas administradores podem ver estatísticas' });
        }
        try {
            // Buscar transferências da empresa
            const transferencias = await prisma.cartaoTransferencia.findMany({
                where: {
                    cartao: {
                        coluna: {
                            aba: {
                                empresa_id: empresaId
                            }
                        }
                    }
                },
                include: {
                    usuario_origem: {
                        select: { id: true, nome: true }
                    },
                    usuario_destino: {
                        select: { id: true, nome: true }
                    },
                    cartao: {
                        select: {
                            titulo: true,
                            coluna: {
                                select: {
                                    nome: true,
                                    aba: {
                                        select: { nome: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 100 // Últimas 100 transferências
            });
            // Calcular estatísticas
            const totalTransferencias = transferencias.length;
            // Transferências por usuário (quem mais transfere)
            const porUsuarioOrigem = {};
            const porUsuarioDestino = {};
            transferencias.forEach((t) => {
                // Origem
                if (!porUsuarioOrigem[t.usuario_origem_id]) {
                    porUsuarioOrigem[t.usuario_origem_id] = { nome: t.usuario_origem.nome, count: 0 };
                }
                porUsuarioOrigem[t.usuario_origem_id].count++;
                // Destino
                if (!porUsuarioDestino[t.usuario_destino_id]) {
                    porUsuarioDestino[t.usuario_destino_id] = { nome: t.usuario_destino.nome, count: 0 };
                }
                porUsuarioDestino[t.usuario_destino_id].count++;
            });
            // Transferências por período (últimos 7 dias, 30 dias)
            const agora = new Date();
            const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
            const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ultimos7Dias = transferencias.filter((t) => new Date(t.created_at) >= seteDiasAtras).length;
            const ultimos30Dias = transferencias.filter((t) => new Date(t.created_at) >= trintaDiasAtras).length;
            res.json({
                total: totalTransferencias,
                ultimos7Dias,
                ultimos30Dias,
                porUsuarioOrigem: Object.entries(porUsuarioOrigem).map(([id, data]) => ({
                    usuario_id: Number(id),
                    nome: data.nome,
                    total_enviadas: data.count
                })).sort((a, b) => b.total_enviadas - a.total_enviadas),
                porUsuarioDestino: Object.entries(porUsuarioDestino).map(([id, data]) => ({
                    usuario_id: Number(id),
                    nome: data.nome,
                    total_recebidas: data.count
                })).sort((a, b) => b.total_recebidas - a.total_recebidas),
                ultimasTransferencias: transferencias.slice(0, 10).map((t) => ({
                    id: t.id,
                    cartao_titulo: t.cartao.titulo,
                    usuario_origem: t.usuario_origem.nome,
                    usuario_destino: t.usuario_destino.nome,
                    observacao: t.observacao,
                    created_at: t.created_at
                }))
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            res.status(500).json({
                message: 'Erro ao buscar estatísticas',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    /**
     * Listar todas as transferências com filtros (apenas admin)
     * GET /api/transferencias
     */
    async listarTransferencias(req, res) {
        const isAdmin = req.user?.nivel === 'admin' || req.user?.nivel === 'superadmin' || req.user?.is_superuser;
        const empresaId = req.user?.empresa_id;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Apenas administradores podem ver todas as transferências' });
        }
        try {
            const { usuario_id, cartao_id, limit = '50' } = req.query;
            const where = {
                cartao: {
                    coluna: {
                        aba: {
                            empresa_id: empresaId
                        }
                    }
                }
            };
            if (usuario_id) {
                const userId = Number(usuario_id);
                where.OR = [
                    { usuario_origem_id: userId },
                    { usuario_destino_id: userId }
                ];
            }
            if (cartao_id) {
                where.cartao_id = Number(cartao_id);
            }
            const transferencias = await prisma.cartaoTransferencia.findMany({
                where,
                include: {
                    usuario_origem: {
                        select: { id: true, nome: true, email: true, foto: true }
                    },
                    usuario_destino: {
                        select: { id: true, nome: true, email: true, foto: true }
                    },
                    cartao: {
                        select: {
                            id: true,
                            titulo: true,
                            coluna: {
                                select: {
                                    id: true,
                                    nome: true,
                                    aba: {
                                        select: { id: true, nome: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: Number(limit)
            });
            res.json({
                total: transferencias.length,
                transferencias
            });
        }
        catch (error) {
            console.error('❌ Erro ao listar transferências:', error);
            res.status(500).json({
                message: 'Erro ao listar transferências',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.CartaoTransferenciaController = CartaoTransferenciaController;
//# sourceMappingURL=CartaoTransferenciaController.js.map