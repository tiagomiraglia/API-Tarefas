import React from 'react';

export interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  status?: string;
}

interface EmpresasListProps {
  empresas: Empresa[];
  onEdit: (empresa: Empresa) => void;
  onSuspend: (empresa: Empresa) => void;
  onDelete: (empresa: Empresa) => void;
  onReactivate: (empresa: Empresa) => void;
}

export default function EmpresasList({ empresas, onEdit, onSuspend, onDelete, onReactivate }: EmpresasListProps) {
  if (!empresas || empresas.length === 0) {
    return <div className="text-center py-4" style={{ color: '#64748b' }}>Nenhuma empresa encontrada.</div>;
  }
  // Ordena alfabeticamente por nome
  const lista = [...empresas].sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table className="table table-bordered w-100" style={{ borderColor: '#2d3142', marginBottom: 0 }}>
        <thead style={{ background: '#0f1115 !important', borderColor: '#2d3142' }}>
          <tr style={{ borderColor: '#2d3142', background: '#0f1115' }}>
            <th style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', padding: '0.875rem', borderColor: '#2d3142', background: '#0f1115' }}>Nome</th>
            <th style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', padding: '0.875rem', borderColor: '#2d3142', background: '#0f1115' }}>CNPJ</th>
            <th style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', padding: '0.875rem', borderColor: '#2d3142', background: '#0f1115' }}>Status</th>
            <th className="text-center" style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', padding: '0.875rem', borderColor: '#2d3142', background: '#0f1115' }}>Ações</th>
          </tr>
        </thead>
        <tbody style={{ background: '#1a1d29 !important', borderColor: '#2d3142' }}>
          {lista.map((empresa) => (
            <tr key={empresa.id} style={{ borderColor: '#2d3142', background: '#1a1d29' }}>
              <td style={{ color: '#f8fafc', fontSize: '0.9375rem', padding: '0.875rem', borderColor: '#2d3142', background: '#1a1d29' }}>{empresa.nome}</td>
              <td style={{ color: '#cbd5e1', fontSize: '0.9375rem', padding: '0.875rem', borderColor: '#2d3142', background: '#1a1d29' }}>{empresa.cnpj}</td>
              <td style={{ padding: '0.875rem', borderColor: '#2d3142', background: '#1a1d29' }}>
                {empresa.status === 'suspenso' ? (
                  <span style={{ 
                    background: '#f97316', 
                    color: '#fff', 
                    padding: '0.25rem 0.625rem', 
                    borderRadius: '6px', 
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>Suspensa</span>
                ) : (
                  <span style={{ 
                    background: '#16a34a', 
                    color: '#fff', 
                    padding: '0.25rem 0.625rem', 
                    borderRadius: '6px', 
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>Ativa</span>
                )}
              </td>
              <td className="text-center" style={{ padding: '0.875rem', borderColor: '#2d3142', background: '#1a1d29' }}>
                <button className="btn btn-link p-1 me-2" title="Editar" onClick={() => onEdit(empresa)}>
                  <i className="bi bi-pencil-square fs-5" style={{ color: '#3b82f6' }}></i>
                </button>
                {empresa.status === 'suspenso' ? (
                  <button className="btn btn-link p-1 me-2" title="Reativar" onClick={() => onReactivate(empresa)}>
                    <i className="bi bi-play-circle fs-5" style={{ color: '#16a34a' }}></i>
                  </button>
                ) : (
                  <button className="btn btn-link p-1 me-2" title="Suspender" onClick={() => onSuspend(empresa)}>
                    <i className="bi bi-pause-circle fs-5" style={{ color: '#f97316' }}></i>
                  </button>
                )}
                <button className="btn btn-link p-1" title="Excluir" onClick={() => onDelete(empresa)}>
                  <i className="bi bi-trash fs-5" style={{ color: '#ef4444' }}></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
