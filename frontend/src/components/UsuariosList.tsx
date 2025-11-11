import React, { useState } from 'react';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresaNome: string;
  suspenso?: boolean;
  is_superuser?: boolean;
  nivel?: string;
}

interface UsuariosListProps {
  usuarios: Usuario[];
  onEdit?: (usuario: Usuario) => void;
  onSuspend?: (usuario: Usuario) => void;
  onReactivate?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void;
  canModifyUser?: (usuario: Usuario) => boolean;
  showEmpresaColumn?: boolean;
}

export default function UsuariosList({ usuarios, onEdit, onSuspend, onReactivate, onDelete, canModifyUser, showEmpresaColumn = true }: UsuariosListProps) {
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
    <div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control input-theme"
          placeholder="Pesquisar usuário por nome, e-mail ou empresa..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>
      <div className="table-theme-flex">
        <div className="table-theme-header">
          <div className="table-theme-th">Nome</div>
          <div className="table-theme-th">E-mail</div>
          {showEmpresaColumn && <div className="table-theme-th">Empresa</div>}
          <div className="table-theme-th text-center">Ações</div>
        </div>
        <div className="table-theme-body">
          {lista.map((usuario) => {
            const podeModificar = canModifyUser ? canModifyUser(usuario) : true;
            return (
              <div key={usuario.id} className="table-theme-row">
                <div className="table-theme-td table-theme-td-nome">
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
                  {usuario.is_superuser && usuario.email !== superuserEmail && (
                    <span className="badge ms-2 badge-master" title="Superuser">
                      <i className="bi bi-shield-lock-fill me-1"></i>Superuser
                    </span>
                  )}
                  {usuario.nivel === 'admin' && !usuario.is_superuser && (
                    <span className="badge ms-2" style={{ background: '#f97316', color: 'white' }} title="Admin">
                      <i className="bi bi-person-check-fill me-1"></i>Admin
                    </span>
                  )}
                </div>
                <div className="table-theme-td">
                  {usuario.email}
                  {usuario.email === superuserEmail && (
                    <i className="bi bi-star-fill ms-1 icon-gold" title="Dono do SaaS"></i>
                  )}
                </div>
                {showEmpresaColumn && (
                  <div className="table-theme-td">
                    {usuario.email === superuserEmail ? 'SaaS' : usuario.empresaNome}
                  </div>
                )}
                <div className="table-theme-td text-center">
                  <button 
                    type="button" 
                    className="btn btn-link btn-action btn-edit" 
                    title="Editar"
                    disabled={!podeModificar}
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
                      disabled={!podeModificar}
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
                      disabled={!podeModificar}
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
                    disabled={!podeModificar}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete && onDelete(usuario);
                    }}
                  >
                    <i className="bi bi-trash icon-action icon-red"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {lista.length === 0 && (
        <div className="text-center py-4 muted-text table-theme-empty">
          Nenhum usuário encontrado para a busca.
        </div>
      )}
    </div>
  );
}
