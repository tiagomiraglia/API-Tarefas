import axios from 'axios';

const API_URL = '/api/permissoes-kanban';

export const getPermissoesByUsuario = (token: string, usuarioId: number) =>
  axios.get(`${API_URL}/usuario/${usuarioId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getPermissoesByAbaColuna = (token: string, abaId?: number, colunaId?: number) =>
  axios.get(`${API_URL}/listar`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { abaId, colunaId },
  });

export const createPermissao = (token: string, data: { usuario_id: number; aba_id: number; coluna_id?: number; tipo: string }) =>
  axios.post(`${API_URL}/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });



// Novo: remover permissão via corpo (usuario_id, aba_id, coluna_id)
export const deletePermissao = (token: string, data: { usuario_id: number; aba_id: number; coluna_id?: number }) =>
  axios.delete(`${API_URL}/`, {
    headers: { Authorization: `Bearer ${token}` },
    data
  } as any);
