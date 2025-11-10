# Backend Atendimento WhatsApp com IA

Backend Node.js para microserviço de atendimento WhatsApp com IA (Mistral), inspirado em Zenvia, Take Blip e Twilio Flex.

## Funcionalidades
- Endpoints REST para integração com WhatsApp (simulado)
- Integração com API da Mistral para respostas automáticas
- Autenticação JWT
- Histórico de conversas
- Estrutura modular e escalável

## Scripts
- `npm run dev` — inicia com nodemon
- `npm start` — inicia em modo produção
- `npm run lint` — lint do código

## Como iniciar
1. Instale as dependências:
   ```sh
   npm install
   ```
2. Crie um arquivo `.env` com:
   ```env
   PORT=4000
   JWT_SECRET=sua_senha_segura
   MISTRAL_API_KEY=sua_api_key
   ```
3. Rode o backend:
   ```sh
   npm run dev
   ```

---

Para dúvidas, consulte a documentação do projeto ou abra uma issue.
