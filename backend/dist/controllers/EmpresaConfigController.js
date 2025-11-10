"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpresaConfigController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class EmpresaConfigController {
    // Obter configurações da empresa
    async getConfig(req, res) {
        try {
            const empresaId = req.user?.empresa_id;
            if (!empresaId) {
                return res.status(400).json({ error: 'Empresa não identificada' });
            }
            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaId },
                select: {
                    id: true,
                    nome: true,
                    config_kanban: true
                }
            });
            if (!empresa) {
                return res.status(404).json({ error: 'Empresa não encontrada' });
            }
            // Garantir valores padrão
            const configPadrao = {
                usar_orcamento: false,
                usar_status_visual: true,
                tags_personalizadas: false
            };
            const config = typeof empresa.config_kanban === 'object'
                ? { ...configPadrao, ...empresa.config_kanban }
                : configPadrao;
            res.json({
                empresa_id: empresa.id,
                empresa_nome: empresa.nome,
                config_kanban: config
            });
        }
        catch (error) {
            console.error('Erro ao obter configurações:', error);
            res.status(500).json({ error: 'Erro ao obter configurações' });
        }
    }
    // Atualizar configurações (apenas admin)
    async updateConfig(req, res) {
        try {
            const empresaId = req.user?.empresa_id;
            const { usar_orcamento, usar_status_visual, tags_personalizadas } = req.body;
            if (!empresaId) {
                return res.status(400).json({ error: 'Empresa não identificada' });
            }
            // Buscar configuração atual
            const empresaAtual = await prisma.empresa.findUnique({
                where: { id: empresaId },
                select: { config_kanban: true }
            });
            const configAtual = typeof empresaAtual?.config_kanban === 'object'
                ? empresaAtual.config_kanban
                : {};
            // Mesclar com novos valores
            const novaConfig = {
                ...configAtual,
                ...(usar_orcamento !== undefined && { usar_orcamento }),
                ...(usar_status_visual !== undefined && { usar_status_visual }),
                ...(tags_personalizadas !== undefined && { tags_personalizadas })
            };
            const empresa = await prisma.empresa.update({
                where: { id: empresaId },
                data: {
                    config_kanban: novaConfig
                },
                select: {
                    id: true,
                    nome: true,
                    config_kanban: true
                }
            });
            res.json({
                empresa_id: empresa.id,
                empresa_nome: empresa.nome,
                config_kanban: empresa.config_kanban
            });
        }
        catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
    }
}
exports.EmpresaConfigController = EmpresaConfigController;
//# sourceMappingURL=EmpresaConfigController.js.map