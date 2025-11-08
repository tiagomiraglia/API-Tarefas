<<<<<<< HEAD
# API de Tarefas

API RESTful simples para cadastro de tarefas usando Node.js e Express.

## Como usar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Acesse a API em `http://localhost:3000`


## Rotas

- `GET /tarefas` — Lista todas as tarefas
- `POST /tarefas` — Cria uma nova tarefa (campos: `nome`, `descricao`)
- `PUT /tarefas/:id` — Atualiza uma tarefa
- `DELETE /tarefas/:id` — Remove uma tarefa

## Exemplo de corpo para criar tarefa
```json
{
   "nome": "Estudar Node.js",
   "descricao": "Ler documentação do Express"
}
```

## Licença
MIT
=======
# API-Tarefas
API básica para tarefas
>>>>>>> f9b40ebaefe1afa13ed616329b4344b4d2c3363d
