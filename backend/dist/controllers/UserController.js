"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const database_1 = __importDefault(require("../database/database"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const mailer_1 = require("../utils/mailer");
class UserController {
    // PATCH /api/usuarios/:id
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            // Suporte a multipart/form-data para upload de imagem
            let nome = req.body.nome;
            let email = req.body.email;
            let senha = req.body.senha;
            let foto = req.body.foto;
            let permissoes = req.body.permissoes;
            // Se vier arquivo, converte para base64
            if (req.files && req.files.foto) {
                const file = req.files.foto[0];
                foto = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            }
            const fields = [];
            const values = [];
            if (nome) {
                fields.push('nome');
                values.push(nome);
            }
            if (email) {
                fields.push('email');
                values.push(email);
            }
            if (foto) {
                fields.push('foto');
                values.push(foto);
            }
            if (senha) {
                const bcrypt = require('bcryptjs');
                const hash = await bcrypt.hash(senha, 10);
                fields.push('senha');
                values.push(hash);
            }
            if (permissoes) {
                fields.push('permissoes');
                // Se vier como string (JSON), faz parse
                if (typeof permissoes === 'string') {
                    try {
                        permissoes = JSON.parse(permissoes);
                    }
                    catch { }
                }
                values.push(permissoes);
            }
            if (fields.length === 0) {
                res.status(400).json({ message: 'Nenhum campo para atualizar.' });
                return;
            }
            const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
            values.push(id);
            await database_1.default.query(`UPDATE "Usuario" SET ${setClause} WHERE id = $${fields.length + 1}`, values);
            res.json({ message: 'Usuário atualizado com sucesso!' });
        }
        catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // DELETE /api/usuarios/:id
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            // Verifica se o usuário a excluir é superuser
            const userResult = await database_1.default.query('SELECT is_superuser, nivel, empresa_id FROM "Usuario" WHERE id = $1', [id]);
            if (userResult.rowCount === 0) {
                res.status(404).json({ message: 'Usuário não encontrado.' });
                return;
            }
            const userToDelete = userResult.rows[0];
            const isSuperuser = userToDelete.is_superuser;
            const nivel = userToDelete.nivel;
            const empresaIdOfUser = userToDelete.empresa_id;
            if (isSuperuser) {
                // Conta quantos superusers existem
                const countResult = await database_1.default.query('SELECT COUNT(*) FROM "Usuario" WHERE is_superuser = true');
                const superuserCount = parseInt(countResult.rows[0].count, 10);
                if (superuserCount <= 1) {
                    res.status(403).json({ message: 'Não é permitido excluir o último superuser!' });
                    return;
                }
            }
            else if (nivel === 'admin') {
                // Se for um admin de empresa, conta quantos admins existem na mesma empresa
                const adminsResult = await database_1.default.query('SELECT COUNT(*) FROM "Usuario" WHERE empresa_id = $1 AND nivel = $2', [empresaIdOfUser, 'admin']);
                const adminsCount = parseInt((adminsResult.rows[0] && adminsResult.rows[0].count) || '0', 10);
                if (adminsCount <= 1) {
                    res.status(403).json({ message: 'Não é permitido excluir o último admin desta empresa.' });
                    return;
                }
            }
            // Exclui usuário
            await database_1.default.query('DELETE FROM "Usuario" WHERE id = $1', [id]);
            res.json({ message: 'Usuário excluído com sucesso!' });
        }
        catch (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // PATCH /api/usuarios/:id/reativar
    async reactivateUser(req, res) {
        try {
            const { id } = req.params;
            const result = await database_1.default.query('UPDATE "Usuario" SET suspenso = false WHERE id = $1 RETURNING id, nome, email, suspenso', [id]);
            if (result.rowCount === 0) {
                res.status(404).json({ message: 'Usuário não encontrado' });
                return;
            }
            res.json({
                message: 'Usuário reativado com sucesso!',
                user: result.rows[0]
            });
        }
        catch (error) {
            console.error('Erro ao reativar usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // GET /api/usuarios
    async getAllUsers(req, res) {
        try {
            const requester = req.user || {};
            // Se for superuser, retorna todos os usuários
            if (requester.is_superuser) {
                const result = await database_1.default.query(`
            SELECT u.id, u.nome, u.email, u.nivel, u.is_superuser, u.suspenso, to_char(u.ultimo_login, 'DD/MM/YYYY HH24:MI') as ultimo_acesso, e.nome AS empresa_nome, u.foto
            FROM "Usuario" u
            LEFT JOIN "Empresa" e ON u.empresa_id = e.id
          `);
                res.json({ users: result.rows });
                return;
            }
            // Senão, retorna apenas usuários da mesma empresa
            const empresaId = requester.empresa_id;
            const result = await database_1.default.query(`
          SELECT u.id, u.nome, u.email, u.nivel, u.is_superuser, u.suspenso, to_char(u.ultimo_login, 'DD/MM/YYYY HH24:MI') as ultimo_acesso, e.nome AS empresa_nome, u.foto
          FROM "Usuario" u
          LEFT JOIN "Empresa" e ON u.empresa_id = e.id
          WHERE u.empresa_id = $1
        `, [empresaId]);
            res.json({ users: result.rows });
        }
        catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // GET /api/usuarios/:id
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            // Buscar também o campo permissoes
            const result = await database_1.default.query(`SELECT id, nome, email, foto, permissoes,
         to_char(created_at, 'DD/MM/YYYY HH24:MI') as criado_em,
         to_char(ultimo_login, 'DD/MM/YYYY HH24:MI') as ultimo_acesso
         FROM "Usuario" WHERE id = $1`, [id]);
            if (result.rowCount === 0) {
                res.status(404).json({ message: 'Usuário não encontrado' });
                return;
            }
            res.json({ user: result.rows[0] });
        }
        catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // POST /api/usuarios/time
    async createTeamUser(req, res) {
        try {
            const { nome, email, permissoes } = req.body;
            const empresaId = req.user?.empresa_id;
            const empresaNome = req.user?.empresa_nome;
            if (!empresaId) {
                res.status(403).json({ message: 'Acesso negado: empresa não identificada.' });
                return;
            }
            if (!nome || !email) {
                res.status(400).json({ message: 'Nome e email são obrigatórios.' });
                return;
            }
            // Verifica se já existe usuário com o mesmo email na empresa
            const exists = await database_1.default.query('SELECT id FROM "Usuario" WHERE email = $1 AND empresa_id = $2', [email, empresaId]);
            if ((exists.rowCount || 0) > 0) {
                res.status(400).json({ message: 'Já existe um usuário com este email nesta empresa.' });
                return;
            }
            // Gera senha temporária aleatória
            const tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
            const bcrypt = require('bcryptjs');
            const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
            // Define validade de 1 hora para senha temporária
            const tempPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
            // Salva usuário com senha temporária e flag de reset
            const result = await prisma.usuario.create({
                data: {
                    nome,
                    email,
                    empresa_id: empresaId,
                    permissoes: permissoes || {},
                    is_superuser: false, // sempre false para cadastro de time
                    temp_password: tempPasswordHash,
                    temp_password_expires_at: tempPasswordExpiresAt,
                    needs_password_reset: true,
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    empresa_id: true,
                    permissoes: true,
                    is_superuser: true,
                }
            });
            // Monta e-mail de boas-vindas com senha temporária
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const html = `
        <div style="font-family:sans-serif;max-width:500px">
          <h2>Bem-vindo ao time <b>${empresaNome || 'da empresa'}</b>!</h2>
          <p>Seu acesso foi criado. Use o e-mail <b>${email}</b> e a senha temporária abaixo para acessar o sistema:</p>
          <div style="font-size:1.5rem;font-weight:bold;letter-spacing:2px;margin:16px 0 24px 0">${tempPassword}</div>
          <p><b>Importante:</b> Esta senha expira em 1 hora ou após o primeiro login. No primeiro acesso, você deverá criar uma nova senha pessoal.</p>
          <p style="color:#888;font-size:13px">Se não foi você, ignore este e-mail.</p>
        </div>
      `;
            await (0, mailer_1.sendMail)(email, 'Acesso ao sistema - senha temporária', html);
            res.status(201).json({
                message: 'Usuário criado e senha temporária enviada por e-mail!',
                user: result
            });
        }
        catch (error) {
            console.error('Erro ao criar usuário do time:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // PATCH /api/usuarios/:id/resend-temp-password
    async resendTempPassword(req, res) {
        try {
            const { id } = req.params;
            const { email: newEmail } = req.body;
            // Busca usuário
            const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
            if (!user) {
                res.status(404).json({ message: 'Usuário não encontrado.' });
                return;
            }
            // Permitir atualizar e-mail antes do primeiro login
            let emailToSend = user.email;
            if (newEmail && newEmail !== user.email) {
                // Verifica se já existe usuário com esse novo e-mail
                const exists = await prisma.usuario.findFirst({ where: { email: newEmail } });
                if (exists) {
                    res.status(400).json({ message: 'Já existe um usuário com este e-mail.' });
                    return;
                }
                await prisma.usuario.update({ where: { id: user.id }, data: { email: newEmail } });
                emailToSend = newEmail;
            }
            // Gera nova senha temporária
            const tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
            const bcrypt = require('bcryptjs');
            const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
            const tempPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
            // Atualiza usuário com nova senha temporária e flag de reset
            await prisma.usuario.update({
                where: { id: user.id },
                data: {
                    temp_password: tempPasswordHash,
                    temp_password_expires_at: tempPasswordExpiresAt,
                    needs_password_reset: true,
                }
            });
            // Envia e-mail
            const empresaNome = req.user?.empresa_nome || '';
            const html = `
        <div style="font-family:sans-serif;max-width:500px">
          <h2>Nova senha temporária para o time <b>${empresaNome}</b></h2>
          <p>Seu acesso foi atualizado. Use o e-mail <b>${emailToSend}</b> e a senha temporária abaixo para acessar o sistema:</p>
          <div style="font-size:1.5rem;font-weight:bold;letter-spacing:2px;margin:16px 0 24px 0">${tempPassword}</div>
          <p><b>Importante:</b> Esta senha expira em 1 hora ou após o primeiro login. No primeiro acesso, você deverá criar uma nova senha pessoal.</p>
          <p style="color:#888;font-size:13px">Se não foi você, ignore este e-mail.</p>
        </div>
      `;
            await (0, mailer_1.sendMail)(emailToSend, 'Nova senha temporária de acesso', html);
            res.json({ message: 'Nova senha temporária enviada por e-mail!' });
        }
        catch (error) {
            console.error('Erro ao reenviar senha temporária:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    // PATCH /api/usuarios/:id/suspender
    async suspendUser(req, res) {
        try {
            const { id } = req.params;
            const result = await database_1.default.query('UPDATE "Usuario" SET suspenso = true WHERE id = $1 RETURNING id, nome, email, suspenso', [id]);
            if (result.rowCount === 0) {
                res.status(404).json({ message: 'Usuário não encontrado' });
                return;
            }
            res.json({
                message: 'Usuário suspenso com sucesso!',
                user: result.rows[0]
            });
        }
        catch (error) {
            console.error('Erro ao suspender usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map