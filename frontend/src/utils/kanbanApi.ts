import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_URL = `${BASE_URL}/api/kanban`;

export const getAbas = (token: string, empresaId?: number) =>
  axios.get(`${API_URL}/abas`, {
    headers: { Authorization: `Bearer ${token}` },
    params: empresaId ? { empresaId } : undefined,
  });

export const createAba = (token: string, data: { nome: string; ordem?: number }) =>
  axios.post(`${API_URL}/abas`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateAba = (token: string, id: number, data: { nome?: string; ordem?: number }) =>
  axios.put(`${API_URL}/abas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteAba = (token: string, id: number) =>
  axios.delete(`${API_URL}/abas/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createColuna = (token: string, data: { nome: string; ordem?: number; aba_id: number; recebe_whats?: boolean }) =>
  axios.post(`${API_URL}/colunas`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateColuna = (token: string, id: number, data: { nome?: string; ordem?: number; recebe_whats?: boolean }) =>
  axios.put(`${API_URL}/colunas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteColuna = (token: string, id: number) =>
  axios.delete(`${API_URL}/colunas/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const setColunaWhats = (token: string, colunaId: number) =>
  axios.post(`${API_URL}/colunas/set-whats`, { colunaId }, {
    headers: { Authorization: `Bearer ${token}` },
  });
