import api from './api';

// Atualiza o campo permissoes do usuário
export const patchPermissoesUsuario = (token: string, usuarioId: number, permissoes: any) =>
  api.patch(`/api/usuarios/${usuarioId}`, { permissoes }, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Busca usuário por ID (inclui permissoes)
export const getUsuarioById = (token: string, usuarioId: number) =>
  api.get(`/api/usuarios/${usuarioId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
