
# API de Tarefas

API RESTful simples para cadastro de tarefas usando Node.js e Express.

## Funcionalidades
- Cadastro, listagem, atualização e remoção de tarefas
- Rotas e campos em português
- Estrutura simples e fácil de entender

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

## Estrutura de uma tarefa
```json
{
  "id": 1,
  "nome": "Exemplo de tarefa",
  "descricao": "Descrição opcional"
}
```

## Licença
MIT