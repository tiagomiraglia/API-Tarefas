import React, { useEffect, useState } from 'react';
import {
  getAbas,
  createAba,
  updateAba,
  deleteAba,
  createColuna,
  updateColuna,
  deleteColuna,
  setColunaWhats
} from '../utils/kanbanApi';
import { showToast } from '../utils/toast';

interface Aba {
  id: number;
  nome: string;
  ordem: number;
  colunas: Coluna[];
}

interface Coluna {
  id: number;
  nome: string;
  ordem: number;
  aba_id: number;
  recebe_whats: boolean;
}

interface Props {
  token: string;
  empresaId?: number;
}

const KanbanAdmin: React.FC<Props> = ({ token, empresaId }) => {
  const [abas, setAbas] = useState<Aba[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAba, setNewAba] = useState('');
  const [newColuna, setNewColuna] = useState<{ [key: number]: string }>({});
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchAbas = async () => {
    setLoading(true);
    try {
      const { data } = await getAbas(token, empresaId);
      setAbas(data as Aba[]);
    } catch (e) {
      showToast('Erro ao carregar abas', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAbas();
    // eslint-disable-next-line
  }, []);

  const handleAddAba = async () => {
    if (!newAba.trim()) return;
    try {
      await createAba(token, { nome: newAba });
      setNewAba('');
      fetchAbas();
      showToast('Aba criada com sucesso!', 'success');
    } catch {
      showToast('Erro ao criar aba', 'error');
    }
  };

  const handleDeleteAba = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover a aba "${nome}"? Todas as colunas serão removidas.`)) {
      setLoadingAction(true);
      try {
        await deleteAba(token, id);
        fetchAbas();
        showToast('Aba removida', 'success');
      } catch {
        showToast('Erro ao remover aba', 'error');
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleAddColuna = async (abaId: number) => {
    const nome = newColuna[abaId];
    if (!nome?.trim()) return;
    try {
      await createColuna(token, { nome, aba_id: abaId });
      setNewColuna((prev) => ({ ...prev, [abaId]: '' }));
      fetchAbas();
      showToast('Coluna criada!', 'success');
    } catch {
      showToast('Erro ao criar coluna', 'error');
    }
  };

  const handleDeleteColuna = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover a coluna "${nome}"?`)) {
      setLoadingAction(true);
      try {
        await deleteColuna(token, id);
        fetchAbas();
        showToast('Coluna removida', 'success');
      } catch {
        showToast('Erro ao remover coluna', 'error');
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleSetWhats = async (colunaId: number) => {
    setLoadingAction(true);
    try {
      await setColunaWhats(token, colunaId);
      fetchAbas();
      showToast('Coluna configurada para WhatsApp!', 'success');
    } catch {
      showToast('Erro ao configurar coluna', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="kanban-admin-container">
      <h2 className="mb-3 fw-bold kanban-admin-title">
        <i className="bi bi-kanban me-2 kanban-admin-title-icon"></i>
        Kanban - Configuração
      </h2>

      <h3 className="mb-2 fw-bold kanban-admin-subtitle">Abas e Colunas</h3>
      
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm kanban-admin-spinner" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : (
        <div className="kanban-admin-card">
          <div className="row g-2 align-items-end mb-2">
            <div className="col">
              <input
                className="form-control form-control-sm kanban-admin-input"
                placeholder="Nome da nova aba"
                value={newAba}
                onChange={e => setNewAba(e.target.value)}
              />
            </div>
            <div className="col-auto">
              <button 
                className={`btn btn-sm fw-semibold kanban-admin-btn-orange${loadingAction ? ' kanban-admin-btn-disabled' : ''}`}
                onClick={handleAddAba} 
                disabled={loadingAction}
              >
                <i className="bi bi-plus-lg me-1"></i>Adicionar Aba
              </button>
            </div>
          </div>
          <div className="kanban-admin-table-wrap">
            <table className="kanban-admin-table">
              <thead className="kanban-admin-table-head">
                <tr>
                  <th className="kanban-admin-th">Aba</th>
                  <th className="kanban-admin-th">Coluna</th>
                  <th className="kanban-admin-th">WhatsApp</th>
                  <th className="kanban-admin-th">Ações</th>
                </tr>
              </thead>
              <tbody className="kanban-admin-table-body">
                {abas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="kanban-admin-table-empty">Nenhuma aba cadastrada.</td>
                  </tr>
                )}
                {abas.map(aba => (
                  aba.colunas.length === 0 ? (
                    <tr key={"aba-"+aba.id} className="kanban-admin-tr">
                      <td className="kanban-admin-td kanban-admin-td-aba">
                        <span className="kanban-admin-aba-nome">{aba.nome}</span>
                        <button 
                          onClick={() => handleDeleteAba(aba.id, aba.nome)}
                          className="kanban-admin-btn-trash"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                      <td colSpan={3} className="kanban-admin-td kanban-admin-td-empty">Nenhuma coluna</td>
                    </tr>
                  ) : (
                    aba.colunas.map((coluna, idx) => (
                      <tr key={coluna.id} className="kanban-admin-tr">
                        {idx === 0 && (
                          <td rowSpan={aba.colunas.length} className="kanban-admin-td kanban-admin-td-aba">
                            <span className="kanban-admin-aba-nome">{aba.nome}</span>
                            <button 
                              onClick={() => handleDeleteAba(aba.id, aba.nome)}
                              className="kanban-admin-btn-trash"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        )}
                        <td className="kanban-admin-td kanban-admin-td-coluna">{coluna.nome}</td>
                        <td className="kanban-admin-td kanban-admin-td-whats">
                          {coluna.recebe_whats ? (
                            <span className="badge kanban-admin-badge-whats">
                              <i className="bi bi-whatsapp me-1"></i>Sim
                            </span>
                          ) : (
                            <span className="kanban-admin-badge-nao">Não</span>
                          )}
                        </td>
                        <td className="kanban-admin-td kanban-admin-td-actions">
                          <div className="kanban-admin-actions">
                            <button 
                              onClick={() => handleDeleteColuna(coluna.id, coluna.nome)} 
                              disabled={loadingAction}
                              className={`kanban-admin-btn-trash-coluna${loadingAction ? ' kanban-admin-btn-disabled' : ''}`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <button 
                              onClick={() => handleSetWhats(coluna.id)} 
                              disabled={loadingAction}
                              className={`kanban-admin-btn-whats${loadingAction ? ' kanban-admin-btn-disabled' : ''}`}
                            >
                              <i className="bi bi-whatsapp"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ))}
              </tbody>
            </table>
          </div>
          {abas.map(aba => (
              <div key={`add-col-${aba.id}`} className="row g-2 align-items-end mt-2 kanban-admin-add-coluna">
                <div className="col">
                  <label className="form-label mb-1 kanban-admin-label">Nova coluna para "{aba.nome}"</label>
                  <input
                    className="form-control form-control-sm kanban-admin-input"
                    placeholder="Digite o nome da coluna"
                    value={newColuna[aba.id] || ''}
                    onChange={e => setNewColuna(prev => ({ ...prev, [aba.id]: e.target.value }))}
                  />
                </div>
                <div className="col-auto">
                  <button 
                    className={`btn btn-sm fw-semibold kanban-admin-btn-green${loadingAction ? ' kanban-admin-btn-disabled' : ''}`}
                    onClick={() => handleAddColuna(aba.id)} 
                    disabled={loadingAction}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default KanbanAdmin;
