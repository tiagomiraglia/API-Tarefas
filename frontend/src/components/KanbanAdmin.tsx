import React, { useEffect, useState } from 'react';
import {
  getAbas,
  createAba,
  updateAba,
  deleteAba,
  createColuna,
  updateColuna,
  deleteColuna,
  setColunaWhats,
  salvarModelo,
  listarModelos,
  carregarModelo,
  deletarModelo
} from '../utils/kanbanApi';
import { showToast } from '../utils/toast';
import { useConfirmModal } from './ConfirmModal';

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

  // Estados para modelos
  const [showSalvarModeloModal, setShowSalvarModeloModal] = useState(false);
  const [showCarregarModeloModal, setShowCarregarModeloModal] = useState(false);
  const [modelos, setModelos] = useState<any[]>([]);
  const [modeloNome, setModeloNome] = useState('');
  const [modeloDescricao, setModeloDescricao] = useState('');
  const [loadingModelos, setLoadingModelos] = useState(false);

  const { showConfirm } = useConfirmModal();

  const fetchAbas = async () => {
    setLoading(true);
    try {
      const { data } = await getAbas(token, empresaId);
      setAbas(data as Aba[]);
    } catch (error: any) {
      // Quando a rota não existe (404), apenas log no console
      // Não mostrar toast para não incomodar o usuário
      if (error.response?.status === 404) {
        console.log('Sistema de Kanban temporariamente indisponível');
        setAbas([]); // Define array vazio para mostrar estado vazio
      } else {
        // Só mostra toast para outros tipos de erro
        console.log('Erro ao carregar abas:', error);
        showToast('Erro ao carregar abas', 'error');
      }
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
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast('Sistema de Kanban temporariamente indisponível', 'info');
      } else {
        showToast('Erro ao criar aba', 'error');
      }
    }
  };

  const handleDeleteAba = async (id: number, nome: string) => {
    const confirmed = await showConfirm(
      `Tem certeza que deseja remover a aba "${nome}"? Todas as colunas serão removidas.`,
      'Confirmar Exclusão'
    );
    
    if (confirmed) {
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
    const confirmed = await showConfirm(
      `Tem certeza que deseja remover a coluna "${nome}"?`,
      'Confirmar Exclusão'
    );
    
    if (confirmed) {
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

  // ========== FUNÇÕES PARA MODELOS ==========

  const fetchModelos = async () => {
    setLoadingModelos(true);
    try {
      const { data } = await listarModelos(token);
      setModelos(data);
    } catch (error) {
      showToast('Erro ao carregar modelos', 'error');
    } finally {
      setLoadingModelos(false);
    }
  };

  const handleSalvarModelo = async () => {
    if (!modeloNome.trim()) {
      showToast('Nome do modelo é obrigatório', 'error');
      return;
    }

    if (abas.length === 0) {
      showToast('Não há abas para salvar no modelo', 'error');
      return;
    }

    try {
      await salvarModelo(token, {
        nome: modeloNome,
        descricao: modeloDescricao,
        abas: abas
      });
      showToast('Modelo salvo com sucesso!', 'success');
      setShowSalvarModeloModal(false);
      setModeloNome('');
      setModeloDescricao('');
      fetchModelos();
    } catch (error) {
      showToast('Erro ao salvar modelo', 'error');
    }
  };

  const handleCarregarModelo = async (modeloId: number) => {
    try {
      const { data } = await carregarModelo(token, modeloId);
      
      // Aplicar o modelo atualizando as abas
      const confirmed = await showConfirm(
        `Tem certeza que deseja carregar o modelo "${data.modelo.nome}"? Isso substituirá a configuração atual.`,
        'Confirmar Carregamento'
      );
      
      if (confirmed) {
        // Primeiro deletar todas as abas e colunas atuais
        for (const aba of abas) {
          await deleteAba(token, aba.id);
        }
        
        // Criar as novas abas e colunas
        for (const abaData of data.abas) {
          const abaResponse = await createAba(token, { nome: abaData.nome, ordem: abaData.ordem });
          const novaAba = abaResponse.data;
          
          if (abaData.colunas && abaData.colunas.length > 0) {
            for (const colunaData of abaData.colunas) {
              await createColuna(token, {
                nome: colunaData.nome,
                aba_id: novaAba.id,
                ordem: colunaData.ordem,
                recebe_whats: colunaData.recebe_whats
              });
            }
          }
        }
        
        fetchAbas();
        setShowCarregarModeloModal(false);
        showToast('Modelo carregado com sucesso!', 'success');
      }
    } catch (error) {
      showToast('Erro ao carregar modelo', 'error');
    }
  };

  const handleDeletarModelo = async (modeloId: number, nome: string) => {
    const confirmed = await showConfirm(
      `Tem certeza que deseja deletar o modelo "${nome}"?`,
      'Confirmar Exclusão'
    );
    
    if (confirmed) {
      try {
        await deletarModelo(token, modeloId);
        showToast('Modelo deletado com sucesso!', 'success');
        fetchModelos();
      } catch (error) {
        showToast('Erro ao deletar modelo', 'error');
      }
    }
  };

  return (
    <div className="kanban-admin-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-outline-primary kanban-admin-btn-modelo"
            onClick={() => {
              fetchModelos();
              setShowCarregarModeloModal(true);
            }}
          >
            <i className="bi bi-download me-1"></i>Carregar Modelo
          </button>
          <button 
            className="btn btn-sm btn-success kanban-admin-btn-modelo"
            onClick={() => setShowSalvarModeloModal(true)}
          >
            <i className="bi bi-upload me-1"></i>Salvar Modelo
          </button>
        </div>
      </div>

      <h3 className="mb-2 fw-bold kanban-admin-subtitle">Abas e Colunas</h3>
      
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm kanban-admin-spinner" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : abas.length === 0 ? (
        <div className="kanban-admin-card">
          <div className="text-center py-5">
            <i className="bi bi-kanban text-muted fs-1 mb-3 d-block"></i>
            <h5 className="text-muted mb-3">Sistema de Kanban Temporariamente Indisponível</h5>
            <p className="text-muted mb-4">O sistema de organização de tarefas está sendo atualizado. Em breve estará disponível novamente.</p>
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Entre em contato com o administrador do sistema para mais informações.
            </div>
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

      {/* Modal Salvar Modelo */}
      {showSalvarModeloModal && (
        <div className="kanban-modal-overlay">
          <div className="kanban-modal-content">
            <div className="kanban-modal-header">
              <h5 className="kanban-modal-title">
                <i className="bi bi-save kanban-modal-title-icon me-2"></i>
                Salvar Modelo
              </h5>
              <button 
                type="button" 
                className="kanban-modal-close" 
                onClick={() => setShowSalvarModeloModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="kanban-modal-body">
              <div className="mb-3">
                <label className="kanban-modal-label">Nome do Modelo *</label>
                <input
                  type="text"
                  className="kanban-modal-input"
                  value={modeloNome}
                  onChange={(e) => setModeloNome(e.target.value)}
                  placeholder="Ex: Modelo Vendas"
                />
              </div>
              <div className="mb-3">
                <label className="kanban-modal-label">Descrição (opcional)</label>
                <textarea
                  className="kanban-modal-textarea"
                  value={modeloDescricao}
                  onChange={(e) => setModeloDescricao(e.target.value)}
                  placeholder="Descreva o propósito deste modelo..."
                />
              </div>
            </div>
            <div className="kanban-modal-footer">
              <button 
                type="button" 
                className="kanban-modal-btn-secondary" 
                onClick={() => setShowSalvarModeloModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="kanban-modal-btn-primary" 
                onClick={handleSalvarModelo}
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carregar Modelo */}
      {showCarregarModeloModal && (
        <div className="kanban-modal-overlay">
          <div className="kanban-modal-content">
            <div className="kanban-modal-header">
              <h5 className="kanban-modal-title">
                <i className="bi bi-download kanban-modal-title-icon me-2"></i>
                Carregar Modelo
              </h5>
              <button 
                type="button" 
                className="kanban-modal-close" 
                onClick={() => setShowCarregarModeloModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="kanban-modal-body">
              {loadingModelos ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : modelos.length === 0 ? (
                <p className="text-muted">Nenhum modelo salvo encontrado.</p>
              ) : (
                <div className="kanban-modal-list-group">
                  {modelos.map((modelo) => (
                    <div key={modelo.id} className="kanban-modal-list-item">
                      <div>
                        <div className="kanban-modal-item-title">{modelo.nome}</div>
                        {modelo.descricao && (
                          <div className="kanban-modal-item-desc">{modelo.descricao}</div>
                        )}
                        <div className="kanban-modal-item-meta">
                          {modelo.itens ? modelo.itens.filter((item: any) => item.tipo === 'aba').length : 0} abas, 
                          {modelo.itens ? modelo.itens.filter((item: any) => item.tipo === 'coluna').length : 0} colunas • 
                          Criado em {new Date(modelo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="kanban-modal-item-actions">
                        <button 
                          className="kanban-modal-btn-load"
                          onClick={() => handleCarregarModelo(modelo.id)}
                        >
                          <i className="bi bi-download me-1"></i>Carregar
                        </button>
                        <button 
                          className="kanban-modal-btn-delete"
                          onClick={() => handleDeletarModelo(modelo.id, modelo.nome)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="kanban-modal-footer">
              <button 
                type="button" 
                className="kanban-modal-btn-secondary" 
                onClick={() => setShowCarregarModeloModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanAdmin;
