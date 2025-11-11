import React, { useState } from 'react';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresaNome: string;
  suspenso?: boolean;
}

interface UsuariosListProps {
  usuarios: Usuario[];
  onEdit?: (usuario: Usuario) => void;
  onSuspend?: (usuario: Usuario) => void;
  onReactivate?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void;
}

export default function UsuariosList({ usuarios, onEdit, onSuspend, onReactivate, onDelete }: UsuariosListProps) {
  const [busca, setBusca] = useState('');
  if (!usuarios || usuarios.length === 0) {
    return <div className="text-center py-4 muted-text">Nenhum usuário encontrado.</div>;
  }
  const superuserEmail = 'tiagomiraglia@nynch.com.br';
  // Ordena alfabeticamente
  let lista = [...usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
  // Filtra por busca
  if (busca.trim()) {
    const termo = busca.trim().toLowerCase();
    lista = lista.filter(u =>
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      (u.empresaNome && u.empresaNome.toLowerCase().includes(termo))
    );
  }
  return (
    <div className="table-responsive">
      <div className="mb-3">
        <input
          type="text"
          className="form-control input-theme"
          placeholder="Pesquisar usuário por nome, e-mail ou empresa..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>
      <table className="table table-bordered table-theme">
        <thead>
          <tr>
            <th className="table-theme-th">Nome</th>
            <th className="table-theme-th">E-mail</th>
            <th className="table-theme-th">Empresa</th>
            <th className="text-center table-theme-th">Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((usuario) => (
            <tr key={usuario.id} className="table-theme-tr">
              <td className="table-theme-td table-theme-td-nome">
                {usuario.nome}
                {usuario.suspenso && (
                  <i
                    className="bi bi-pause-circle ms-2 icon-muted"
                    title="Usuário suspenso"
                  ></i>
                )}
                {usuario.email === superuserEmail && (
                  <span className="badge ms-2 badge-master" title="Master">
                    <i className="bi bi-shield-lock-fill me-1"></i>Master
                  </span>
                )}
              </td>
              <td className="table-theme-td">
                {usuario.email}
                {usuario.email === superuserEmail && (
                  <i className="bi bi-star-fill ms-1 icon-gold" title="Dono do SaaS"></i>
                )}
              </td>
              <td className="table-theme-td">
                {usuario.email === superuserEmail ? '' : usuario.empresaNome}
              </td>
              <td className="text-center table-theme-td">
                <button 
                  type="button" 
                  className="btn btn-link btn-action btn-edit" 
                  title="Editar" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit && onEdit(usuario);
                  }}
                >
                  <i className="bi bi-pencil-square icon-action icon-blue"></i>
                </button>
                {usuario.suspenso ? (
                  <button 
                    type="button" 
                    className="btn btn-link btn-action btn-reactivate" 
                    title="Reativar" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReactivate && onReactivate(usuario);
                    }}
                  >
                    <i className="bi bi-play-circle icon-action icon-green"></i>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-link btn-action btn-suspend" 
                    title="Suspender" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSuspend && onSuspend(usuario);
                    }}
                  >
                    <i className="bi bi-pause-circle icon-action icon-orange"></i>
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-link btn-action btn-delete" 
                  title="Excluir" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete && onDelete(usuario);
                  }}
                >
                  <i className="bi bi-trash icon-action icon-red"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lista.length === 0 && (
        <div className="text-center py-4 muted-text table-theme-empty">
          Nenhum usuário encontrado para a busca.
        </div>
      )}
    </div>
  );
}
