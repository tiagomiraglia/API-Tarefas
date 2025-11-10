
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { generateToken, now } = require('./utils');
const { sendMail } = require('./mail');

const router = express.Router();

// Validação do token de cadastro
router.post('/validate', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: 'Dados obrigatórios.' });
  try {
    // Busca usuário pendente
    const [pendings] = await pool.query('SELECT * FROM pending_users WHERE email = ? AND token = ?', [email, token]);
    if (pendings.length === 0) return res.status(400).json({ error: 'Token inválido ou expirado.' });
    const pending = pendings[0];
    // Verifica expiração
    if (new Date(pending.token_expires) < new Date()) {
      await pool.query('DELETE FROM pending_users WHERE id = ?', [pending.id]);
      return res.status(400).json({ error: 'Token expirado. Faça o cadastro novamente.' });
    }
    // Cria banco exclusivo do cliente
    const dbName = `cliente_${pending.id}`;
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    // Cria usuário definitivo
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [pending.name, pending.email, pending.password]);
    // Remove pendente
    await pool.query('DELETE FROM pending_users WHERE id = ?', [pending.id]);
    res.json({ message: 'Cadastro validado com sucesso!', db: dbName });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao validar cadastro', details: err.message });
  }
});

// Cadastro de novo cliente (pendente de validação)
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados obrigatórios.' });
  try {
    // Verifica se já existe usuário ou pendente
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    const [pendings] = await pool.query('SELECT id FROM pending_users WHERE email = ?', [email]);
    if (users.length > 0 || pendings.length > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado ou pendente de validação.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const token = generateToken(6);
    const tokenExpires = now();
    await pool.query(
      'INSERT INTO pending_users (name, email, password, token, token_expires) VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 30 MINUTE))',
      [name, email, hash, token, tokenExpires]
    );
    // Envia e-mail com token
    await sendMail({
      to: email,
      subject: 'Validação de cadastro - Atendimento WhatsApp',
      text: `Seu código de validação: ${token}`,
      html: `<p>Seu código de validação: <b>${token}</b></p>`
    });
    res.json({ message: 'Cadastro iniciado. Verifique seu e-mail para validar.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar', details: err.message });
  }
});

module.exports = router;
