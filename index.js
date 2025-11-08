const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let tarefas = [];
let idAtual = 1;

// Listar todas as tarefas
        aplicativo.get('/tarefas', (req, res) => {
          res.json(listaDeTarefas);
        });

// Criar uma nova tarefa
        aplicativo.post('/tarefas', (req, res) => {
          const { nome, descricao } = req.body;
          if (!nome) {
            return res.status(400).json({ erro: 'Nome é obrigatório.' });
          }
          const tarefa = { id: idAtual++, nome, descricao: descricao || '' };
          listaDeTarefas.push(tarefa);
          res.status(201).json(tarefa);
        });

// Atualizar uma tarefa
        aplicativo.put('/tarefas/:id', (req, res) => {
          const { id } = req.params;
          const { nome, descricao } = req.body;
          const tarefa = listaDeTarefas.find(t => t.id == id);
          if (!tarefa) {
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });
          }
          if (nome) tarefa.nome = nome;
          if (descricao) tarefa.descricao = descricao;
          res.json(tarefa);
        });

// Deletar uma tarefa
        aplicativo.delete('/tarefas/:id', (req, res) => {
          const { id } = req.params;
          const indice = listaDeTarefas.findIndex(t => t.id == id);
          if (indice === -1) {
            return res.status(404).json({ erro: 'Tarefa não encontrada.' });
          }
          listaDeTarefas.splice(indice, 1);
          res.status(204).send();
        });

app.listen(port, () => {
          console.log(`API de tarefas rodando em http://localhost:${porta}`);
});
