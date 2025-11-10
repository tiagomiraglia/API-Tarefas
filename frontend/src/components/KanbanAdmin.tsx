import React, { useEffect, useState } from 'react';
import ConfirmModalKanban from './ConfirmModalKanban';
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
  const [modal, setModal] = useState<{ show: boolean; title?: string; message: string; onConfirm: () => void }>({ show: false, message: '', onConfirm: () => {} });
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

  const handleDeleteAba = (id: number, nome: string) => {
    setModal({
      show: true,
      title: 'Remover Aba',
      message: `Tem certeza que deseja remover a aba "${nome}"? Todas as colunas serão removidas.`,
      onConfirm: async () => {
        setModal(m => ({ ...m, show: false }));
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
    });
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

  const handleDeleteColuna = (id: number, nome: string) => {
    setModal({
      show: true,
      title: 'Remover Coluna',
      message: `Tem certeza que deseja remover a coluna "${nome}"?`,
      onConfirm: async () => {
        setModal(m => ({ ...m, show: false }));
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
    });
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
    <div style={{ color: '#cbd5e1' }}>
      <h2 className="mb-3 fw-bold" style={{ color: '#f8fafc' }}>
        <i className="bi bi-kanban me-2" style={{ color: '#f97316' }}></i>
        Kanban - Configuração
      </h2>

      <h3 className="mb-2 fw-bold" style={{ color: '#f8fafc', fontSize: '1.1rem' }}>Abas e Colunas</h3>
      
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#f97316' }}>
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#1a1d29', 
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid #2d3142'
        }}>
          <div className="row g-2 align-items-end mb-2">
            <div className="col">
              <input
                className="form-control form-control-sm"
                placeholder="Nome da nova aba"
                value={newAba}
                onChange={e => setNewAba(e.target.value)}
                style={{
                  background: '#0f1115',
                  border: '1px solid #2d3142',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div className="col-auto">
              <button 
                className="btn btn-sm fw-semibold" 
                onClick={handleAddAba} 
                disabled={loadingAction}
                style={{
                  background: loadingAction ? '#64748b' : '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !loadingAction && (e.currentTarget.style.background = '#ea580c')}
                onMouseOut={(e) => !loadingAction && (e.currentTarget.style.background = '#f97316')}
              >
                <i className="bi bi-plus-lg me-1"></i>Adicionar Aba
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', background: '#1a1d29', borderRadius: '8px', border: '1px solid #2d3142' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '0.875rem', 
              background: '#1a1d29',
              marginBottom: '0'
            }}>
              <thead style={{ background: '#0f1115' }}>
                <tr>
                  <th style={{
                    width: '25%', 
                    color: '#94a3b8', 
                    borderBottom: '1px solid #2d3142',
                    borderRight: '1px solid #2d3142',
                    padding: '0.75rem 0.5rem', 
                    fontWeight: '600',
                    textAlign: 'left'
                  }}>Aba</th>
                  <th style={{
                    width: '35%', 
                    color: '#94a3b8', 
                    borderBottom: '1px solid #2d3142',
                    borderRight: '1px solid #2d3142',
                    padding: '0.75rem 0.5rem', 
                    fontWeight: '600',
                    textAlign: 'left'
                  }}>Coluna</th>
                  <th style={{
                    width: '15%', 
                    color: '#94a3b8', 
                    borderBottom: '1px solid #2d3142',
                    borderRight: '1px solid #2d3142',
                    padding: '0.75rem 0.5rem', 
                    fontWeight: '600', 
                    textAlign: 'center'
                  }}>WhatsApp</th>
                  <th style={{
                    width: '25%', 
                    color: '#94a3b8', 
                    borderBottom: '1px solid #2d3142',
                    padding: '0.75rem 0.5rem', 
                    fontWeight: '600', 
                    textAlign: 'center'
                  }}>Ações</th>
                </tr>
              </thead>
              <tbody style={{ background: '#1a1d29' }}>
                {abas.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ 
                      color: '#64748b', 
                      background: '#1a1d29', 
                      padding: '1rem', 
                      textAlign: 'center',
                      borderTop: 'none'
                    }}>Nenhuma aba cadastrada.</td>
                  </tr>
                )}
                {abas.map(aba => (
                  aba.colunas.length === 0 ? (
                    <tr key={"aba-"+aba.id} style={{ background: '#1a1d29' }}>
                      <td style={{ 
                        borderBottom: '1px solid #2d3142',
                        borderRight: '1px solid #2d3142',
                        padding: '0.75rem 0.5rem',
                        background: '#1a1d29'
                      }}>
                        <span style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: '600' }}>{aba.nome}</span>
                        <button 
                          onClick={() => handleDeleteAba(aba.id, aba.nome)}
                          style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.75rem',
                            marginLeft: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                      <td colSpan={3} style={{ 
                        color: '#64748b', 
                        borderBottom: '1px solid #2d3142',
                        padding: '0.75rem 0.5rem', 
                        textAlign: 'center',
                        background: '#1a1d29'
                      }}>Nenhuma coluna</td>
                    </tr>
                  ) : (
                    aba.colunas.map((coluna, idx) => (
                      <tr key={coluna.id} style={{ background: '#1a1d29' }}>
                        {idx === 0 && (
                          <td rowSpan={aba.colunas.length} style={{ 
                            borderBottom: '1px solid #2d3142',
                            borderRight: '1px solid #2d3142',
                            padding: '0.75rem 0.5rem',
                            verticalAlign: 'middle',
                            background: '#1a1d29'
                          }}>
                            <span style={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: '600' }}>{aba.nome}</span>
                            <button 
                              onClick={() => handleDeleteAba(aba.id, aba.nome)}
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '4px',
                                padding: '0.15rem 0.4rem',
                                fontSize: '0.75rem',
                                marginLeft: '0.5rem',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        )}
                        <td style={{ 
                          color: '#cbd5e1', 
                          borderBottom: '1px solid #2d3142',
                          borderRight: '1px solid #2d3142',
                          padding: '0.75rem 0.5rem',
                          background: '#1a1d29'
                        }}>{coluna.nome}</td>
                        <td style={{ 
                          borderBottom: '1px solid #2d3142',
                          borderRight: '1px solid #2d3142',
                          padding: '0.75rem 0.5rem', 
                          textAlign: 'center',
                          background: '#1a1d29'
                        }}>
                          {coluna.recebe_whats ? (
                            <span className="badge" style={{ background: '#16a34a', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              <i className="bi bi-whatsapp me-1"></i>Sim
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Não</span>
                          )}
                        </td>
                        <td style={{ 
                          borderBottom: '1px solid #2d3142',
                          padding: '0.75rem 0.5rem', 
                          textAlign: 'center',
                          background: '#1a1d29'
                        }}>
                          <div style={{ display: 'inline-flex', gap: '0' }}>
                            <button 
                              onClick={() => handleDeleteColuna(coluna.id, coluna.nome)} 
                              disabled={loadingAction}
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '4px 0 0 4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                cursor: loadingAction ? 'not-allowed' : 'pointer',
                                opacity: loadingAction ? 0.5 : 1
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <button 
                              onClick={() => handleSetWhats(coluna.id)} 
                              disabled={loadingAction}
                              style={{
                                background: 'transparent',
                                color: '#16a34a',
                                border: '1px solid #16a34a',
                                borderRadius: '0 4px 4px 0',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                borderLeft: 'none',
                                cursor: loadingAction ? 'not-allowed' : 'pointer',
                                opacity: loadingAction ? 0.5 : 1
                              }}
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
              <div key={`add-col-${aba.id}`} className="row g-2 align-items-end mt-2" style={{ 
                background: '#0f1115', 
                padding: '0.75rem', 
                borderRadius: '6px',
                border: '1px solid #2d3142'
              }}>
                <div className="col">
                  <label className="form-label mb-1" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>
                    Nova coluna para "{aba.nome}"
                  </label>
                  <input
                    className="form-control form-control-sm"
                    placeholder="Digite o nome da coluna"
                    value={newColuna[aba.id] || ''}
                    onChange={e => setNewColuna(prev => ({ ...prev, [aba.id]: e.target.value }))}
                    style={{
                      background: '#1a1d29',
                      border: '1px solid #2d3142',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '0.4rem 0.7rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div className="col-auto">
                  <button 
                    className="btn btn-sm fw-semibold" 
                    onClick={() => handleAddColuna(aba.id)} 
                    disabled={loadingAction}
                    style={{
                      background: loadingAction ? '#64748b' : '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => !loadingAction && (e.currentTarget.style.background = '#15803d')}
                    onMouseOut={(e) => !loadingAction && (e.currentTarget.style.background = '#16a34a')}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}
      
      <ConfirmModalKanban
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({ ...m, show: false }))}
      />
    </div>
  );
};

export default KanbanAdmin;
