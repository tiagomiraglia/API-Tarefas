const express = require('express');
const axios = require('axios');
const router = express.Router();

// Integração com API da Mistral para IA
router.post('/reply', async (req, res) => {
  const { message } = req.body;
  try {
    // Exemplo de chamada à API da Mistral
    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-medium',
      messages: [{ role: 'user', content: message }],
    }, {
      headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
    });
    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar IA', details: err.message });
  }
});

module.exports = router;
