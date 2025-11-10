// ...existing code...

import { Request, Response } from 'express';
import { sendMail } from '../utils/mailer';
import pool from '../database/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthController {
  
  // POST /api/auth/registro
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha } = req.body;
      // Validação básica
      if (!nome || !email || !senha) {
        res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
        return;
      }

      // Gera código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      // Salva código no banco (expira em 15 min)
      await pool.query(
        "INSERT INTO codigos_verificacao (email, codigo, data_expiracao) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
        [email, codigo]
      );

      // Envia e-mail com o código
      const subject = 'Código de verificação - Plataforma Nynch';
      const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Olá, ${nome}!</h2>
          <p>Seu código de verificação é:</p>
          <div style="font-size:2rem; font-weight:bold; letter-spacing:6px; margin:16px 0;">${codigo}</div>
          <p>Digite este código para validar seu cadastro. O código expira em 15 minutos.</p>
          <p style="margin-top:24px; font-size:13px; color:#888;">Se não foi você, ignore este e-mail.<br>Equipe Nynch</p>
        </div>
      `;
      try {
        await sendMail(email, subject, html);
      } catch (mailErr) {
        console.error('Erro ao enviar e-mail:', mailErr);
      }

      res.status(201).json({
        message: 'Código de verificação enviado para o e-mail.',
        user: { nome, email, is_superuser: false }
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        res.status(400).json({ message: 'Email e senha são obrigatórios' });
        return;
      }

      // Buscar usuário no banco (agora inclui campos de senha temporária)
  const result = await pool.query('SELECT id, nome, email, senha, is_superuser, empresa_id, nivel, suspenso, temp_password, temp_password_expires_at, needs_password_reset, permissoes FROM "Usuario" WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        res.status(401).json({ message: 'Usuário ou senha inválidos' });
        return;
      }
      const user = result.rows[0];

      // Bloquear login se suspenso
      if (user.suspenso) {
        res.status(403).json({ message: 'Usuário suspenso. Entre em contato com o suporte.' });
        return;
      }

      let senhaOk = false;
      let usouSenhaTemporaria = false;

      // Verifica senha definitiva
      if (user.senha) {
        senhaOk = await bcrypt.compare(senha, user.senha);
      }

      // Se não bateu, tenta senha temporária (se existir e não expirada)
      if (!senhaOk && user.temp_password && user.temp_password_expires_at && user.needs_password_reset) {
        const agora = new Date();
        const expira = new Date(user.temp_password_expires_at);
        if (expira > agora) {
          senhaOk = await bcrypt.compare(senha, user.temp_password);
          if (senhaOk) usouSenhaTemporaria = true;
        }
      }

      if (!senhaOk) {
        res.status(401).json({ message: 'Usuário ou senha inválidos' });
        return;
      }

      // Se usou senha temporária, exigir troca de senha
      if (usouSenhaTemporaria) {
        res.status(200).json({
          message: 'Senha temporária válida. É necessário criar uma nova senha.',
          requirePasswordReset: true,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            is_superuser: user.is_superuser,
            empresa_id: user.empresa_id,
            nivel: user.nivel,
            permissoes: user.permissoes || {}
          }
        });
        return;
      }

      // Atualizar o campo ultimo_login para o horário atual
      await pool.query('UPDATE "Usuario" SET ultimo_login = NOW() WHERE id = $1', [user.id]);

      // Gerar token JWT (inclui empresa_id e nivel)
      const token = jwt.sign({
        id: user.id,
        email: user.email,
        nome: user.nome,
        is_superuser: user.is_superuser,
        empresa_id: user.empresa_id,
        nivel: user.nivel
      }, process.env.JWT_SECRET as string, { expiresIn: '12h' });

      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          is_superuser: user.is_superuser,
          empresa_id: user.empresa_id,
          nivel: user.nivel,
          permissoes: user.permissoes || {}
        },
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar lógica de logout
      // - Invalidar token (se usando blacklist)
      
      res.json({ message: 'Logout realizado com sucesso!' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // GET /api/auth/perfil
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar lógica para obter perfil
      // - Verificar token JWT
      // - Buscar dados do usuário
      res.json({
        user: {
          id: Date.now(), // Temporário
          nome: 'Usuário Teste',
          email: 'teste@email.com'
        }
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // POST /api/auth/verificar-codigo
  async verificarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo } = req.body;
      if (!email || !codigo) {
        res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
        return;
      }
      const result = await pool.query(
        `SELECT * FROM codigos_verificacao WHERE email = $1 AND codigo = $2 AND data_expiracao > NOW() ORDER BY data_expiracao DESC LIMIT 1`,
        [email, codigo]
      );
      if (result.rows.length === 0) {
        res.status(400).json({ message: 'Código inválido ou expirado.' });
        return;
      }
      // Opcional: remover código após uso
      await pool.query('DELETE FROM codigos_verificacao WHERE email = $1 AND codigo = $2', [email, codigo]);
      res.json({ message: 'Código validado com sucesso!' });
    } catch (error) {
      console.error('Erro ao validar código:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
  // POST /api/auth/recuperacao
  async recuperacao(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'E-mail é obrigatório.' });
        return;
      }
      // Verifica se o usuário existe
      const result = await pool.query('SELECT nome FROM "Usuario" WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'E-mail não encontrado.' });
        return;
      }
      const nome = result.rows[0].nome;
      // Gera código de recuperação
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      await pool.query(
        "INSERT INTO codigos_verificacao (email, codigo, data_expiracao) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
        [email, codigo]
      );
      // Envia e-mail com o código
      const subject = 'Recuperação de senha - Plataforma Nynch';
      const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Olá, ${nome}!</h2>
          <p>Você solicitou a recuperação de senha.</p>
          <p>Seu código de recuperação é:</p>
          <div style="font-size:2rem; font-weight:bold; letter-spacing:6px; margin:16px 0;">${codigo}</div>
          <p>Digite este código na plataforma para redefinir sua senha. O código expira em 15 minutos.</p>
          <p style="margin-top:24px; font-size:13px; color:#888;">Se não foi você, ignore este e-mail.<br>Equipe Nynch</p>
        </div>
      `;
      try {
        await sendMail(email, subject, html);
      } catch (mailErr) {
        console.error('Erro ao enviar e-mail:', mailErr);
      }
      res.json({ message: 'E-mail de recuperação enviado!' });
    } catch (error) {
      console.error('Erro na recuperação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  // POST /api/auth/resetar-senha
  async resetarSenha(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo, novaSenha } = req.body;
      if (!email || !codigo || !novaSenha) {
        res.status(400).json({ error: 'E-mail, código e nova senha são obrigatórios.' });
        return;
      }
      // Verifica código válido
      const result = await pool.query(
        `SELECT * FROM codigos_verificacao WHERE email = $1 AND codigo = $2 AND data_expiracao > NOW() ORDER BY data_expiracao DESC LIMIT 1`,
        [email, codigo]
      );
      if (result.rows.length === 0) {
        res.status(400).json({ error: 'Código inválido ou expirado.' });
        return;
      }
      // Atualiza senha
      const hash = await bcrypt.hash(novaSenha, 10);
      await pool.query('UPDATE "Usuario" SET senha = $1 WHERE email = $2', [hash, email]);
      // Remove código após uso
      await pool.query('DELETE FROM codigos_verificacao WHERE email = $1 AND codigo = $2', [email, codigo]);
      res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // POST /api/auth/resetar-senha-temporaria
  async resetarSenhaTemporaria(req: Request, res: Response): Promise<void> {
    try {
      const { userId, novaSenha } = req.body;
      if (!userId || !novaSenha) {
        res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios.' });
        return;
      }
      // Busca usuário
      const result = await pool.query('SELECT id, temp_password, needs_password_reset FROM "Usuario" WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      const user = result.rows[0];
      if (!user.temp_password || !user.needs_password_reset) {
        res.status(400).json({ error: 'Usuário não está em processo de troca de senha temporária.' });
        return;
      }
      // Atualiza senha definitiva, remove senha temporária e flag
      const hash = await bcrypt.hash(novaSenha, 10);
      await pool.query('UPDATE "Usuario" SET senha = $1, temp_password = NULL, temp_password_expires_at = NULL, needs_password_reset = false WHERE id = $2', [hash, userId]);
      res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
      console.error('Erro ao redefinir senha temporária:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}