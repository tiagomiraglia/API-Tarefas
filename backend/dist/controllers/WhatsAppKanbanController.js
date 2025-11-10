"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppKanbanController = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
class WhatsAppKanbanController {
    constructor() {
        this.WPPCONNECT_URL = process.env.WPPCONNECT_URL || 'http://localhost:5000';
    }
    // Status da conexão WhatsApp
    async getStatus(req, res) {
        try {
            const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/status/default`, { timeout: 3000 });
            const data = response.data;
            console.log('📡 WPPConnect Response:', JSON.stringify(data, null, 2));
            console.log('🔍 Status check:', {
                'data.status': data.status,
                'data.status === "qrcode"': data.status === 'qrcode',
                'data.qr exists': !!data.qr,
                'data.qr type': typeof data.qr,
                'data.qr length': data.qr?.length || 0
            });
            const hasQRValue = data.status === 'qrcode' && !!data.qr;
            const readyValue = data.status === 'connected';
            console.log('🎯 Calculated values:', {
                hasQR: hasQRValue,
                ready: readyValue
            });
            // Adapta o formato do wppconnect para o formato esperado pelo frontend
            const adaptedResponse = {
                session: data.session || 'default',
                status: data.status,
                ready: readyValue,
                hasQR: hasQRValue,
                qr: data.qr || null,
                phone: data.info?.phone || null,
                name: data.info?.name || null,
                // Mantém compatibilidade com código antigo
                isConnected: data.status === 'connected'
            };
            console.log('📤 Sending to frontend:', JSON.stringify({ ...adaptedResponse, qr: adaptedResponse.qr ? `[${adaptedResponse.qr.substring(0, 50)}...]` : null }, null, 2));
            res.json(adaptedResponse);
        }
        catch (error) {
            console.error('❌ Error fetching WhatsApp status:', error.message);
            res.status(503).json({
                error: 'Serviço WhatsApp indisponível',
                message: error.message,
                ready: false,
                hasQR: false
            });
        }
    }
    // Conectar WhatsApp
    async connect(req, res) {
        try {
            const response = await axios_1.default.post(`${this.WPPCONNECT_URL}/connect/default`, {}, { timeout: 5000 });
            res.json(response.data);
        }
        catch (error) {
            res.status(500).json({
                error: 'Erro ao conectar WhatsApp',
                message: error.message
            });
        }
    }
    // Reconectar WhatsApp
    async reconnect(req, res) {
        try {
            const response = await axios_1.default.post(`${this.WPPCONNECT_URL}/reconnect`, {}, { timeout: 5000 });
            res.json(response.data);
        }
        catch (error) {
            res.status(500).json({
                error: 'Erro ao reconectar WhatsApp',
                message: error.message
            });
        }
    }
    // Limpar sessão WhatsApp (útil quando trava por erro EBUSY)
    async cleanSession(req, res) {
        try {
            const response = await axios_1.default.post(`${this.WPPCONNECT_URL}/clean-session`, {}, { timeout: 10000 });
            res.json(response.data);
        }
        catch (error) {
            res.status(500).json({
                error: 'Erro ao limpar sessão WhatsApp',
                message: error.message
            });
        }
    }
    // Buscar conversas disponíveis do WhatsApp
    async getConversas(req, res) {
        try {
            // Verifica se WhatsApp está conectado
            let statusResponse;
            try {
                statusResponse = await axios_1.default.get(`${this.WPPCONNECT_URL}/status/default`, { timeout: 3000 });
            }
            catch (error) {
                return res.status(503).json({
                    error: 'Serviço WhatsApp indisponível',
                    message: 'O serviço WhatsApp não está rodando. Inicie o wppconnect primeiro.'
                });
            }
            if (statusResponse.data.status !== 'connected') {
                return res.status(503).json({
                    error: 'WhatsApp não conectado',
                    message: 'Conecte o WhatsApp primeiro para visualizar as conversas'
                });
            }
            // Conecta ao serviço wppconnect para buscar conversas
            const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-chats`, { timeout: 10000 });
            if (!response.data || !Array.isArray(response.data)) {
                return res.json([]);
            }
            // Busca todos os cartões vinculados a conversas do WhatsApp da empresa do usuário
            const userId = req.user?.id;
            const usuario = await prisma.usuario.findUnique({
                where: { id: userId }
            });
            let cartoesVinculados = [];
            if (usuario?.empresa_id) {
                cartoesVinculados = await prisma.cartaoWhatsApp.findMany({
                    include: {
                        cartao: {
                            include: {
                                coluna: {
                                    include: {
                                        aba: true
                                    }
                                },
                                atendente_responsavel: {
                                    select: {
                                        id: true,
                                        nome: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                });
            }
            const conversas = response.data.map((chat) => {
                const chatId = chat.id._serialized || chat.id;
                const cartaoVinculado = cartoesVinculados.find(cv => cv.conversa_id === chatId);
                return {
                    id: chatId,
                    name: chat.name || chat.pushname || chatId,
                    isGroup: chat.isGroup || false,
                    unreadCount: chat.unreadCount || 0,
                    timestamp: chat.t || chat.lastMessage?.timestamp || Date.now() / 1000,
                    lastMessage: chat.lastMessage ? {
                        body: chat.lastMessage.body || '',
                        timestamp: chat.lastMessage.timestamp || Date.now() / 1000
                    } : undefined,
                    // Informações do cartão vinculado
                    cartao: cartaoVinculado ? {
                        id: cartaoVinculado.cartao.id,
                        titulo: cartaoVinculado.cartao.titulo,
                        coluna: cartaoVinculado.cartao.coluna.nome,
                        aba: cartaoVinculado.cartao.coluna.aba.nome,
                        atendente: cartaoVinculado.cartao.atendente_responsavel ? {
                            id: cartaoVinculado.cartao.atendente_responsavel.id,
                            nome: cartaoVinculado.cartao.atendente_responsavel.nome,
                            iniciais: cartaoVinculado.cartao.atendente_responsavel.nome
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()
                        } : null
                    } : null
                };
            });
            // Ordena por timestamp decrescente
            conversas.sort((a, b) => b.timestamp - a.timestamp);
            res.json(conversas);
        }
        catch (error) {
            console.error('Erro ao buscar conversas:', error.message);
            res.status(500).json({ error: 'Erro ao buscar conversas do WhatsApp', details: error.message });
        }
    }
    // Buscar mensagens de uma conversa específica
    async getMensagens(req, res) {
        const { conversaId } = req.params;
        const { cartaoId } = req.query;
        try {
            if (cartaoId) {
                // Buscar mensagens salvas no banco para o cartão
                const cartaoWhatsApp = await prisma.cartaoWhatsApp.findFirst({
                    where: { cartao_id: Number(cartaoId) },
                    include: { mensagens: { orderBy: { timestamp: 'asc' } } }
                });
                if (cartaoWhatsApp) {
                    return res.json(cartaoWhatsApp.mensagens);
                }
            }
            // Buscar mensagens diretamente do WhatsApp
            const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-messages/${encodeURIComponent(conversaId)}`);
            if (!response.data || !Array.isArray(response.data)) {
                return res.json([]);
            }
            const mensagens = response.data.map((msg) => ({
                id: msg.id._serialized || msg.id,
                body: msg.body || '',
                timestamp: msg.timestamp || Date.now() / 1000,
                fromMe: msg.fromMe || false,
                from: msg.from || msg.author || '',
                hasMedia: msg.hasMedia || false,
                type: msg.type || 'chat'
            }));
            res.json(mensagens);
        }
        catch (error) {
            console.error('Erro ao buscar mensagens:', error.message);
            res.status(500).json({ error: 'Erro ao buscar mensagens', details: error.message });
        }
    }
    // Enviar mensagem via WhatsApp
    async enviarMensagem(req, res) {
        const { phone, message } = req.body;
        try {
            if (!phone || !message) {
                return res.status(400).json({ error: 'phone e message são obrigatórios' });
            }
            // Enviar mensagem via wppconnect
            const response = await axios_1.default.post(`${this.WPPCONNECT_URL}/api/default/send-message`, {
                phone,
                message
            });
            res.json({ success: true, data: response.data });
        }
        catch (error) {
            console.error('Erro ao enviar mensagem:', error.message);
            res.status(500).json({ error: 'Erro ao enviar mensagem', details: error.message });
        }
    }
    // Marcar mensagens como lidas (sincroniza em todos os dispositivos)
    async marcarComoLido(req, res) {
        const { chatId } = req.body;
        try {
            if (!chatId) {
                return res.status(400).json({ error: 'chatId é obrigatório' });
            }
            console.log(`📖 Marcando chat ${chatId} como lido...`);
            // Chama o endpoint do Baileys para marcar como lido
            const response = await axios_1.default.post(`${this.WPPCONNECT_URL}/api/default/mark-as-read`, {
                chatId
            });
            res.json({ success: true, data: response.data });
        }
        catch (error) {
            console.error('Erro ao marcar como lido:', error.message);
            res.status(500).json({ error: 'Erro ao marcar como lido', details: error.message });
        }
    }
    // Sincronizar mensagens do WhatsApp para o cartão
    async sincronizarMensagens(req, res) {
        const { cartaoId } = req.body;
        try {
            const cartaoWhatsApp = await prisma.cartaoWhatsApp.findFirst({
                where: { cartao_id: Number(cartaoId) }
            });
            if (!cartaoWhatsApp) {
                return res.status(404).json({ message: 'Cartão não vinculado ao WhatsApp' });
            }
            // Buscar mensagens do WhatsApp
            // Buscar mensagens mais recentes do wppconnect
            const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-messages/${cartaoWhatsApp.conversa_id}`);
            // Salvar mensagens no banco
            for (const msg of response.data) {
                const mensagemId = msg.id._serialized || msg.id;
                await prisma.mensagemWhatsApp.upsert({
                    where: {
                        cartao_whatsapp_id_mensagem_id: {
                            cartao_whatsapp_id: cartaoWhatsApp.id,
                            mensagem_id: mensagemId
                        }
                    },
                    update: {
                        conteudo: msg.body || '',
                        status: msg.ack ? ['sent', 'delivered', 'read', 'played'][msg.ack - 1] : 'sent'
                    },
                    create: {
                        cartao_whatsapp_id: cartaoWhatsApp.id,
                        mensagem_id: mensagemId,
                        autor: msg.from || msg.author,
                        conteudo: msg.body || '',
                        tipo: msg.type || 'text',
                        midia_url: msg.mediaUrl || null,
                        is_from_me: msg.fromMe || false,
                        timestamp: new Date(msg.timestamp * 1000),
                        status: msg.ack ? ['sent', 'delivered', 'read', 'played'][msg.ack - 1] : 'sent'
                    }
                });
            }
            res.json({ message: 'Mensagens sincronizadas com sucesso' });
        }
        catch (error) {
            console.error('Erro ao sincronizar mensagens:', error);
            res.status(500).json({ message: 'Erro ao sincronizar mensagens' });
        }
    }
    // Webhook para receber mensagens em tempo real
    async webhookMensagem(req, res) {
        const { event, data } = req.body;
        try {
            if (event === 'onmessage' && data) {
                const conversaId = data.chatId || data.from;
                // Buscar cartão vinculado a essa conversa
                const cartaoWhatsApp = await prisma.cartaoWhatsApp.findFirst({
                    where: { conversa_id: conversaId }
                });
                if (cartaoWhatsApp) {
                    // Salvar mensagem
                    await prisma.mensagemWhatsApp.create({
                        data: {
                            cartao_whatsapp_id: cartaoWhatsApp.id,
                            mensagem_id: data.id._serialized || data.id,
                            autor: data.from || data.author,
                            conteudo: data.body || '',
                            tipo: data.type || 'text',
                            midia_url: data.mediaUrl || null,
                            is_from_me: data.fromMe || false,
                            timestamp: new Date(data.timestamp * 1000),
                            status: 'received'
                        }
                    });
                }
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error('Erro no webhook:', error);
            res.json({ success: false });
        }
    }
    // Criar cartão no Kanban a partir de uma conversa
    async criarCartao(req, res) {
        const { conversaId, conversaNome, colunaId, atendenteId } = req.body;
        const userId = req.user?.id;
        try {
            console.log('📝 Criando cartão:', { conversaId, conversaNome, colunaId, atendenteId, userId });
            if (!conversaId || !conversaNome) {
                return res.status(400).json({ error: 'conversaId e conversaNome são obrigatórios' });
            }
            // Verifica se o usuário tem acesso ao Kanban
            const usuario = await prisma.usuario.findUnique({
                where: { id: userId },
                include: { empresa: true }
            });
            if (!usuario) {
                console.error('❌ Usuário não encontrado:', userId);
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            console.log('✅ Usuário encontrado:', usuario.nome, 'Empresa:', usuario.empresa_id);
            // Verifica se o usuário tem uma empresa associada
            if (!usuario.empresa_id) {
                console.error('❌ Usuário sem empresa associada:', usuario.nome);
                return res.status(400).json({
                    error: 'Usuário não possui empresa associada. Entre em contato com o administrador.'
                });
            }
            // Busca a coluna onde criar o cartão
            let coluna;
            if (colunaId) {
                // Se foi especificada uma coluna, usa ela
                coluna = await prisma.coluna.findFirst({
                    where: {
                        id: colunaId,
                        aba: {
                            empresa_id: usuario.empresa_id
                        }
                    },
                    include: { aba: true }
                });
                if (!coluna) {
                    return res.status(404).json({
                        error: 'Coluna não encontrada ou você não tem acesso a ela'
                    });
                }
            }
            else {
                // Senão, busca a primeira coluna que recebe WhatsApp
                coluna = await prisma.coluna.findFirst({
                    where: {
                        recebe_whats: true,
                        aba: {
                            empresa_id: usuario.empresa_id
                        }
                    },
                    include: { aba: true }
                });
                if (!coluna) {
                    console.error('❌ Nenhuma coluna configurada para WhatsApp na empresa:', usuario.empresa_id);
                    return res.status(404).json({
                        error: 'Nenhuma coluna configurada para receber WhatsApp. Acesse Configurações > Kanban e marque a opção "Recebe WhatsApp" em uma coluna.'
                    });
                }
            }
            console.log('✅ Coluna encontrada:', coluna.nome, 'Aba:', coluna.aba.nome);
            // Verifica se já existe um cartão para esta conversa
            const cartaoExistente = await prisma.cartaoWhatsApp.findFirst({
                where: { conversa_id: conversaId }
            });
            if (cartaoExistente) {
                console.log('⚠️ Cartão já existe para esta conversa:', cartaoExistente.cartao_id);
                return res.status(400).json({
                    error: 'Já existe um cartão para esta conversa',
                    cartaoId: cartaoExistente.cartao_id
                });
            }
            console.log('🔍 Buscando mensagens da conversa...');
            // Busca mensagens da conversa
            let mensagens = [];
            try {
                const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-messages/${encodeURIComponent(conversaId)}`);
                if (response.data && Array.isArray(response.data)) {
                    mensagens = response.data;
                    console.log('✅ Encontradas', mensagens.length, 'mensagens');
                }
            }
            catch (error) {
                console.error('❌ Erro ao buscar mensagens:', error);
            }
            // Cria o cartão
            const ultimaMensagem = mensagens.length > 0 ? mensagens[mensagens.length - 1].body : '';
            const nextPosition = await this.getNextPositionInColumn(coluna.id);
            console.log('📝 Criando cartão no Kanban...');
            const cartaoData = {
                titulo: conversaNome,
                descricao: ultimaMensagem || 'Conversa do WhatsApp',
                coluna_id: coluna.id,
                ordem: nextPosition,
                created_by_id: userId
            };
            // Atribui atendente se foi especificado
            if (atendenteId) {
                cartaoData.atendente_responsavel_id = atendenteId;
                console.log('👤 Atribuindo ao atendente:', atendenteId);
            }
            const cartao = await prisma.cartao.create({
                data: cartaoData
            });
            console.log('✅ Cartão criado:', cartao.id);
            // Cria o registro de WhatsApp
            const cartaoWhatsApp = await prisma.cartaoWhatsApp.create({
                data: {
                    cartao_id: cartao.id,
                    conversa_id: conversaId,
                    conversa_nome: conversaNome
                }
            });
            console.log('✅ Registro WhatsApp criado:', cartaoWhatsApp.id);
            // Importa histórico de mensagens (últimas 50)
            if (mensagens.length > 0) {
                const mensagensParaSalvar = mensagens.slice(-50);
                console.log(`💬 Importando ${mensagensParaSalvar.length} mensagens...`);
                let importadas = 0;
                for (const msg of mensagensParaSalvar) {
                    try {
                        // Extrai ID da mensagem de forma segura
                        let messageId;
                        if (typeof msg.id === 'string') {
                            messageId = msg.id;
                        }
                        else if (msg.id && typeof msg.id === 'object') {
                            messageId = msg.id._serialized || msg.id.id || JSON.stringify(msg.id);
                        }
                        else {
                            messageId = `msg_${Date.now()}_${Math.random()}`;
                        }
                        // Converte timestamp de forma segura
                        let messageDate;
                        if (msg.timestamp) {
                            // Se timestamp é em segundos, converte para milissegundos
                            const ts = typeof msg.timestamp === 'number' ? msg.timestamp : parseInt(msg.timestamp);
                            messageDate = new Date(ts > 9999999999 ? ts : ts * 1000);
                        }
                        else {
                            messageDate = new Date();
                        }
                        await prisma.mensagemWhatsApp.create({
                            data: {
                                cartao_whatsapp_id: cartaoWhatsApp.id,
                                mensagem_id: messageId,
                                autor: msg.from || conversaId,
                                conteudo: msg.body || '',
                                tipo: msg.type || 'text',
                                is_from_me: msg.fromMe || false,
                                timestamp: messageDate
                            }
                        });
                        importadas++;
                    }
                    catch (error) {
                        // Ignora erros de duplicação
                        if (error instanceof Error && !error.message.includes('Unique constraint')) {
                            console.error('Erro ao salvar mensagem:', error);
                        }
                    }
                }
                console.log(`✅ ${importadas} mensagens importadas`);
            }
            console.log('✅ Cartão criado com sucesso!');
            res.json({
                success: true,
                message: 'Cartão criado com sucesso!',
                cartao: {
                    id: cartao.id,
                    titulo: cartao.titulo,
                    coluna: coluna.nome,
                    aba: coluna.aba.nome
                }
            });
        }
        catch (error) {
            console.error('❌ Erro ao criar cartão:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({
                error: 'Erro ao criar cartão no Kanban',
                details: error.message
            });
        }
    }
    // Importar histórico completo de conversas
    async importarHistorico(req, res) {
        const userId = req.user?.id;
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { id: userId },
                include: { empresa: true }
            });
            if (!usuario) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            // Busca a primeira coluna que recebe WhatsApp
            const coluna = await prisma.coluna.findFirst({
                where: {
                    recebe_whats: true,
                    aba: {
                        empresa_id: usuario.empresa_id
                    }
                },
                include: { aba: true }
            });
            if (!coluna) {
                return res.status(404).json({
                    error: 'Nenhuma coluna configurada para receber WhatsApp'
                });
            }
            // Busca todas as conversas
            const response = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-chats`);
            if (!response.data || !Array.isArray(response.data)) {
                return res.json({ imported: 0, skipped: 0 });
            }
            let imported = 0;
            let skipped = 0;
            let ordemAtual = await this.getNextPositionInColumn(coluna.id);
            for (const chat of response.data) {
                const chatId = chat.id._serialized || chat.id;
                const chatName = chat.name || chat.pushname || chatId;
                // Verifica se já existe
                const existente = await prisma.cartaoWhatsApp.findFirst({
                    where: { conversa_id: chatId }
                });
                if (existente) {
                    skipped++;
                    continue;
                }
                try {
                    // Busca mensagens
                    const msgResponse = await axios_1.default.get(`${this.WPPCONNECT_URL}/api/default/all-messages/${encodeURIComponent(chatId)}`);
                    const mensagens = msgResponse.data && Array.isArray(msgResponse.data) ? msgResponse.data : [];
                    const ultimaMensagem = mensagens.length > 0 ? mensagens[mensagens.length - 1].body : '';
                    // Cria cartão
                    const cartao = await prisma.cartao.create({
                        data: {
                            titulo: chatName,
                            descricao: ultimaMensagem || 'Conversa do WhatsApp',
                            coluna_id: coluna.id,
                            ordem: ordemAtual++,
                            created_by_id: userId
                        }
                    });
                    // Cria registro WhatsApp
                    const cartaoWhatsApp = await prisma.cartaoWhatsApp.create({
                        data: {
                            cartao_id: cartao.id,
                            conversa_id: chatId,
                            conversa_nome: chatName
                        }
                    });
                    // Importa mensagens (últimas 50)
                    if (mensagens.length > 0) {
                        const mensagensParaSalvar = mensagens.slice(-50);
                        for (const msg of mensagensParaSalvar) {
                            try {
                                await prisma.mensagemWhatsApp.create({
                                    data: {
                                        cartao_whatsapp_id: cartaoWhatsApp.id,
                                        mensagem_id: msg.id._serialized || msg.id,
                                        autor: msg.from || chatId,
                                        conteudo: msg.body || '',
                                        tipo: msg.type || 'text',
                                        is_from_me: msg.fromMe || false,
                                        timestamp: new Date((msg.timestamp || Date.now() / 1000) * 1000)
                                    }
                                });
                            }
                            catch (error) {
                                // Ignora erros de duplicação
                            }
                        }
                    }
                    imported++;
                }
                catch (error) {
                    console.error(`Erro ao importar conversa ${chatId}:`, error);
                    skipped++;
                }
            }
            res.json({
                success: true,
                imported,
                skipped,
                message: `${imported} conversas importadas, ${skipped} ignoradas`
            });
        }
        catch (error) {
            console.error('Erro ao importar histórico:', error);
            res.status(500).json({ error: 'Erro ao importar histórico' });
        }
    }
    // Função auxiliar para obter próxima posição na coluna
    async getNextPositionInColumn(colunaId) {
        const lastCartao = await prisma.cartao.findFirst({
            where: { coluna_id: colunaId },
            orderBy: { ordem: 'desc' }
        });
        return (lastCartao?.ordem || 0) + 1;
    }
}
exports.WhatsAppKanbanController = WhatsAppKanbanController;
//# sourceMappingURL=WhatsAppKanbanController.js.map