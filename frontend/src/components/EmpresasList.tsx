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
    return <div className="text-center py-4 muted-text">Nenhuma empresa encontrada.</div>;
  }
  // Ordena alfabeticamente por nome
  const lista = [...empresas].sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <div className="table-responsive">
      <table className="table table-bordered w-100 table-theme">
        <thead>
          <tr>
            <th className="table-theme-th">Nome</th>
            <th className="table-theme-th">CNPJ</th>
            <th className="table-theme-th">Status</th>
            <th className="text-center table-theme-th">Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((empresa) => (
            <tr key={empresa.id} className="table-theme-tr">
              <td className="table-theme-td table-theme-td-nome">{empresa.nome}</td>
              <td className="table-theme-td">{empresa.cnpj}</td>
              <td className="table-theme-td">
                {empresa.status === 'suspenso' ? (
                  <span className="status-badge status-badge-suspensa">Suspensa</span>
                ) : (
                  <span className="status-badge status-badge-ativa">Ativa</span>
                )}
              </td>
              <td className="text-center table-theme-td">
                <button className="btn btn-link p-1 me-2" title="Editar" onClick={() => onEdit(empresa)}>
                  <i className="bi bi-pencil-square fs-5 icon-blue"></i>
                </button>
                {empresa.status === 'suspenso' ? (
                  <button className="btn btn-link p-1 me-2" title="Reativar" onClick={() => onReactivate(empresa)}>
                    <i className="bi bi-play-circle fs-5 icon-green"></i>
                  </button>
                ) : (
                  <button className="btn btn-link p-1 me-2" title="Suspender" onClick={() => onSuspend(empresa)}>
                    <i className="bi bi-pause-circle fs-5 icon-orange"></i>
                  </button>
                )}
                <button className="btn btn-link p-1" title="Excluir" onClick={() => onDelete(empresa)}>
                  <i className="bi bi-trash fs-5 icon-red"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
