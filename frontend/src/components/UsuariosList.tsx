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
    return <div className="text-center py-4" style={{ color: '#64748b' }}>Nenhum usuário encontrado.</div>;
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
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Pesquisar usuário por nome, e-mail ou empresa..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '8px',
            color: '#f8fafc',
            padding: '0.625rem 0.875rem'
          }}
        />
      </div>
      <table className="table table-bordered" style={{ borderColor: '#2d3142', marginBottom: 0 }}>
        <thead style={{ background: '#0f1115 !important', borderColor: '#2d3142' }}>
          <tr style={{ borderColor: '#2d3142', background: '#0f1115' }}>
            <th style={{ color: '#94a3b8', borderColor: '#2d3142', fontWeight: '600', padding: '0.875rem', fontSize: '0.875rem', background: '#0f1115' }}>Nome</th>
            <th style={{ color: '#94a3b8', borderColor: '#2d3142', fontWeight: '600', padding: '0.875rem', fontSize: '0.875rem', background: '#0f1115' }}>E-mail</th>
            <th style={{ color: '#94a3b8', borderColor: '#2d3142', fontWeight: '600', padding: '0.875rem', fontSize: '0.875rem', background: '#0f1115' }}>Empresa</th>
            <th className="text-center" style={{ color: '#94a3b8', borderColor: '#2d3142', fontWeight: '600', padding: '0.875rem', fontSize: '0.875rem', background: '#0f1115' }}>Ações</th>
          </tr>
        </thead>
        <tbody style={{ background: '#1a1d29 !important', borderColor: '#2d3142' }}>
          {lista.map((usuario) => (
            <tr key={usuario.id} style={{ borderColor: '#2d3142', background: '#1a1d29' }}>
              <td style={{ color: '#f8fafc', borderColor: '#2d3142', padding: '0.875rem', fontSize: '0.9375rem', background: '#1a1d29' }}>
                {usuario.nome}
                {usuario.suspenso && (
                  <i
                    className="bi bi-pause-circle ms-2"
                    title="Usuário suspenso"
                    style={{ verticalAlign: 'middle', fontSize: '1.1em', color: '#64748b' }}
                  ></i>
                )}
                {usuario.email === superuserEmail && (
                  <span className="badge ms-2" title="Master" style={{ background: '#f97316', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    <i className="bi bi-shield-lock-fill me-1"></i>Master
                  </span>
                )}
              </td>
              <td style={{ color: '#cbd5e1', borderColor: '#2d3142', padding: '0.875rem', fontSize: '0.9375rem', background: '#1a1d29' }}>
                {usuario.email}
                {usuario.email === superuserEmail && (
                  <i className="bi bi-star-fill ms-1" title="Dono do SaaS" style={{ color: '#fbbf24' }}></i>
                )}
              </td>
              <td style={{ color: '#cbd5e1', borderColor: '#2d3142', padding: '0.875rem', fontSize: '0.9375rem', background: '#1a1d29' }}>
                {usuario.email === superuserEmail ? '' : usuario.empresaNome}
              </td>
              <td className="text-center" style={{ borderColor: '#2d3142', padding: '0.875rem', background: '#1a1d29' }}>
                <button 
                  type="button" 
                  className="btn btn-link p-1 me-2" 
                  title="Editar" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clicou em editar:', usuario);
                    onEdit && onEdit(usuario);
                  }}
                >
                  <i className="bi bi-pencil-square fs-5" style={{ color: '#3b82f6' }}></i>
                </button>
                {usuario.suspenso ? (
                  <button 
                    type="button" 
                    className="btn btn-link p-1 me-2" 
                    title="Reativar" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicou em reativar:', usuario);
                      onReactivate && onReactivate(usuario);
                    }}
                  >
                    <i className="bi bi-play-circle fs-5" style={{ color: '#16a34a' }}></i>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-link p-1 me-2" 
                    title="Suspender" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicou em suspender:', usuario);
                      onSuspend && onSuspend(usuario);
                    }}
                  >
                    <i className="bi bi-pause-circle fs-5" style={{ color: '#f97316' }}></i>
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-link p-1" 
                  title="Excluir" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clicou em excluir:', usuario);
                    onDelete && onDelete(usuario);
                  }}
                >
                  <i className="bi bi-trash fs-5" style={{ color: '#ef4444' }}></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lista.length === 0 && (
        <div className="text-center py-4" style={{ color: '#64748b', background: '#1a1d29', border: '1px solid #2d3142', borderTop: 'none' }}>
          Nenhum usuário encontrado para a busca.
        </div>
      )}
    </div>
  );
}
