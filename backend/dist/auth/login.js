"use strict";
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();
const router = express.Router();
// Endpoint de login
router.post('/', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'E-mail e senha obrigatórios.' });
    try {
        // Busca usuário e plano
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0)
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        // Atualiza last_login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        // Garante que o campo plan exista (padrão: basic)
        const plan = user.plan || 'basic';
        // Gera token JWT com plano
        const token = jwt.sign({ id: user.id, email: user.email, plan }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan, last_login: new Date() } });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao autenticar', details: err.message });
    }
});
module.exports = router;
//# sourceMappingURL=login.js.map