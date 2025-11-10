import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Coluna {
  id: number;
  nome: string;
  aba_id: number;
}

interface Aba {
  id: number;
  nome: string;
  colunas?: Coluna[];
}

interface Permissao {
  id: number;
  usuario_id: number;
  aba_id?: number;
  coluna_id?: number;
  tipo: string;
  aba?: Aba;
  coluna?: Coluna;
}

interface Props {
  show: boolean;
  usuarioId: number;
  usuarioNome: string;
  empresaId: number;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ModalPermissoesKanban({ show, usuarioId, usuarioNome, empresaId, onClose, onRefresh }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [abas, setAbas] = useState<Aba[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [novaPermissao, setNovaPermissao] = useState({
    aba_id: '',
    coluna_id: '',
    tipo: 'visualizar'
  });

  useEffect(() => {
    if (show && usuarioId) {
      fetchPermissoes();
      fetchAbas();
    }
  }, [show, usuarioId, refreshKey]);

  async function fetchPermissoes() {
    try {
      const token = localStorage.getItem('token');
      console.log('Buscando permissões para usuário:', usuarioId);
      const res = await fetch(`${baseURL}/api/permissoes-kanban/usuario/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Permissões recebidas:', data);
        console.log('Total de permissões:', data.length);
        // O backend retorna array direto
        setPermissoes(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao buscar permissões, status:', res.status);
        setPermissoes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      setPermissoes([]);
    }
  }

  async function fetchAbas() {
    try {
      const token = localStorage.getItem('token');
      const params = empresaId ? `?empresaId=${empresaId}` : '';
      const res = await fetch(`${baseURL}/api/kanban/abas${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // A API já retorna abas com colunas nested
        setAbas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar abas:', error);
      showToast('Erro ao carregar abas do Kanban', 'error');
    }
  }

  async function handleAddPermissao() {
    if (!novaPermissao.aba_id) {
      showToast('Selecione uma aba', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        usuario_id: usuarioId,
        aba_id: Number(novaPermissao.aba_id)
      };

      // Se coluna específica selecionada, adiciona ao payload
      if (novaPermissao.coluna_id) {
        payload.coluna_id = Number(novaPermissao.coluna_id);
      }

      console.log('Enviando permissão:', payload);

      const res = await fetch(`${baseURL}/api/permissoes-kanban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Resposta status:', res.status);
      const data = await res.json();
      console.log('Resposta data:', data);

      if (res.ok) {
        showToast('Permissão adicionada com sucesso!', 'success');
        setNovaPermissao({ aba_id: '', coluna_id: '', tipo: 'visualizar' });
        // Força recarregar a lista de permissões
        console.log('Recarregando permissões após adicionar...');
        setRefreshKey(prev => prev + 1);
        if (onRefresh) onRefresh();
      } else {
        showToast(data.message || 'Erro ao adicionar permissão', 'error');
      }
    } catch (error) {
      console.error('Erro ao adicionar permissão:', error);
      showToast('Erro de conexão', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemovePermissao(permissao: Permissao) {
    if (!window.confirm('Deseja realmente remover esta permissão?')) return;

    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        usuario_id: usuarioId,
        aba_id: permissao.aba_id
      };

      // Se for permissão de coluna específica
      if (permissao.coluna_id) {
        payload.coluna_id = permissao.coluna_id;
      }

      const res = await fetch(`${baseURL}/api/permissoes-kanban/${permissao.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Permissão removida com sucesso!', 'success');
        console.log('Recarregando permissões após remover...');
        setRefreshKey(prev => prev + 1);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        showToast(err.message || 'Erro ao remover permissão', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão', 'error');
    }
  }

  if (!show) return null;

  return (
    <div 
      className="modal d-block" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content" 
          style={{ 
            background: '#1a1d29', 
            border: '1px solid #2d3142',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            maxHeight: '85vh'
          }}
        >
          <div 
            className="modal-header" 
            style={{ 
              borderBottom: '1px solid #2d3142',
              padding: '1.5rem',
              background: '#0f1115',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}
          >
            <div>
              <h5 className="modal-title fw-bold mb-1" style={{ color: '#f8fafc' }}>
                <i className="bi bi-shield-lock me-2" style={{ color: '#f97316' }}></i>
                Permissões Kanban
              </h5>
              <p className="mb-0" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                {usuarioNome}
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              style={{
                filter: 'invert(1)',
                opacity: 0.8
              }}
            ></button>
          </div>

          <div className="modal-body" style={{ padding: '1.5rem', background: '#1a1d29' }}>
            {/* Adicionar Nova Permissão */}
            <div 
              style={{ 
                background: '#0f1115', 
                border: '1px solid #2d3142',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <h6 className="fw-bold mb-3" style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                <i className="bi bi-plus-circle me-2" style={{ color: '#f97316' }}></i>
                Adicionar Nova Permissão
              </h6>
              
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                    Aba *
                  </label>
                  <select 
                    className="form-select"
                    value={novaPermissao.aba_id}
                    onChange={(e) => setNovaPermissao({ ...novaPermissao, aba_id: e.target.value, coluna_id: '' })}
                    style={{
                      background: '#1a1d29',
                      border: '1px solid #2d3142',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem'
                    }}
                  >
                    <option value="">Selecione uma aba</option>
                    {abas.map(aba => (
                      <option key={aba.id} value={aba.id}>{aba.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                    Coluna (opcional)
                  </label>
                  <select 
                    className="form-select"
                    value={novaPermissao.coluna_id}
                    onChange={(e) => setNovaPermissao({ ...novaPermissao, coluna_id: e.target.value })}
                    disabled={!novaPermissao.aba_id}
                    style={{
                      background: '#1a1d29',
                      border: '1px solid #2d3142',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem'
                    }}
                  >
                    <option value="">Todas as colunas</option>
                    {abas.find(a => a.id === Number(novaPermissao.aba_id))?.colunas?.map(coluna => (
                      <option key={coluna.id} value={coluna.id}>{coluna.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                  Tipo de Permissão
                </label>
                <select 
                  className="form-select"
                  value={novaPermissao.tipo}
                  onChange={(e) => setNovaPermissao({ ...novaPermissao, tipo: e.target.value })}
                  style={{
                    background: '#1a1d29',
                    border: '1px solid #2d3142',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.625rem 0.875rem'
                  }}
                >
                  <option value="visualizar">Visualizar</option>
                  <option value="editar">Editar</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button 
                className="btn w-100"
                onClick={handleAddPermissao}
                disabled={loading || !novaPermissao.aba_id}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.625rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#ea580c'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f97316'}
              >
                {loading ? 'Adicionando...' : 'Adicionar Permissão'}
              </button>
            </div>

            {/* Lista de Permissões Existentes */}
            <div>
              <h6 className="fw-bold mb-3" style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                <i className="bi bi-list-check me-2" style={{ color: '#3b82f6' }}></i>
                Permissões Atuais ({permissoes.length})
              </h6>

              {permissoes.length === 0 ? (
                <div 
                  className="text-center py-5"
                  style={{
                    background: '#0f1115',
                    border: '1px solid #2d3142',
                    borderRadius: '12px'
                  }}
                >
                  <i className="bi bi-shield-lock" style={{ fontSize: '3rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}></i>
                  <p style={{ color: '#64748b', marginBottom: 0 }}>Nenhuma permissão configurada</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {permissoes.map((permissao) => (
                    <div 
                      key={permissao.id}
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#1a1d29';
                        e.currentTarget.style.borderColor = '#475569';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#0f1115';
                        e.currentTarget.style.borderColor = '#2d3142';
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem' }}>
                            {permissao.aba?.nome || 'Aba deletada'}
                          </span>
                          {permissao.coluna && (
                            <>
                              <i className="bi bi-chevron-right" style={{ color: '#64748b', fontSize: '0.75rem' }}></i>
                              <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                                {permissao.coluna.nome}
                              </span>
                            </>
                          )}
                        </div>
                        <div>
                          <span 
                            style={{
                              background: permissao.tipo === 'admin' ? '#f97316' : permissao.tipo === 'editar' ? '#3b82f6' : '#16a34a',
                              color: '#fff',
                              padding: '0.25rem 0.625rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {permissao.tipo}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="btn"
                        onClick={() => handleRemovePermissao(permissao)}
                        title="Remover permissão"
                        style={{
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef444420',
                          borderRadius: '8px',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#ef444420';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#ef444420';
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div 
            className="modal-footer" 
            style={{ 
              borderTop: '1px solid #2d3142',
              padding: '1.25rem 1.5rem',
              background: '#0f1115',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}
          >
            <button 
              type="button" 
              className="btn"
              onClick={onClose}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #64748b',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#64748b';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
