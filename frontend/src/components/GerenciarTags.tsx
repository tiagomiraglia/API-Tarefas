import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';
import { useConfirmModal } from './ConfirmModal';

interface Tag {
  id: number;
  nome: string;
  cor: string;
  icone: string;
  ativo: boolean;
  ordem: number;
}

interface EmpresaConfig {
  usar_orcamento: boolean;
  usar_status_visual: boolean;
  tags_personalizadas: boolean;
}

export default function GerenciarTags() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [tags, setTags] = useState<Tag[]>([]);
  const [config, setConfig] = useState<EmpresaConfig>({
    usar_orcamento: false,
    usar_status_visual: true,
    tags_personalizadas: false
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Tag | null>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#6366f1');
  const [icone, setIcone] = useState('tag');
  const [ordem, setOrdem] = useState(0);

  const { showConfirm } = useConfirmModal();

  const ICONES_DISPONIVEIS = [
    { id: 'tag', nome: 'Tag', icon: 'bi-tag' },
    { id: 'exclamation-triangle-fill', nome: 'Urgente', icon: 'bi-exclamation-triangle-fill' },
    { id: 'currency-dollar', nome: 'Dinheiro', icon: 'bi-currency-dollar' },
    { id: 'tools', nome: 'Ferramentas', icon: 'bi-tools' },
    { id: 'question-circle', nome: 'Dúvida', icon: 'bi-question-circle' },
    { id: 'emoji-frown', nome: 'Reclamação', icon: 'bi-emoji-frown' },
    { id: 'clock-history', nome: 'Histórico', icon: 'bi-clock-history' },
    { id: 'calendar-event', nome: 'Evento', icon: 'bi-calendar-event' },
    { id: 'file-earmark-check', nome: 'Arquivo', icon: 'bi-file-earmark-check' },
    { id: 'star-fill', nome: 'Estrela', icon: 'bi-star-fill' },
    { id: 'heart-fill', nome: 'Coração', icon: 'bi-heart-fill' },
    { id: 'flag-fill', nome: 'Bandeira', icon: 'bi-flag-fill' },
    { id: 'lightning-fill', nome: 'Raio', icon: 'bi-lightning-fill' },
    { id: 'shield-fill', nome: 'Escudo', icon: 'bi-shield-fill' },
  ];

  const CORES_DISPONIVEIS = [
    { nome: 'Índigo', valor: '#6366f1' },
    { nome: 'Vermelho', valor: '#ef4444' },
    { nome: 'Verde', valor: '#10b981' },
    { nome: 'Azul', valor: '#3b82f6' },
    { nome: 'Roxo', valor: '#8b5cf6' },
    { nome: 'Laranja', valor: '#f59e0b' },
    { nome: 'Ciano', valor: '#06b6d4' },
    { nome: 'Rosa', valor: '#ec4899' },
    { nome: 'Verde-água', valor: '#14b8a6' },
    { nome: 'Amarelo', valor: '#eab308' },
  ];

  useEffect(() => {
    carregarTags();
    carregarConfig();
  }, []);

  async function carregarTags() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      showToast('Erro ao carregar tags', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function carregarConfig() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/empresa/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config_kanban);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async function salvarConfig(novaConfig: Partial<EmpresaConfig>) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/empresa/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(novaConfig)
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config_kanban);
        showToast('Configurações atualizadas!', 'success');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showToast('Erro ao salvar configurações', 'error');
    }
  }

  function abrirModal(tag?: Tag) {
    if (tag) {
      setEditando(tag);
      setNome(tag.nome);
      setCor(tag.cor);
      setIcone(tag.icone);
      setOrdem(tag.ordem);
    } else {
      setEditando(null);
      setNome('');
      setCor('#6366f1');
      setIcone('tag');
      setOrdem(tags.length);
    }
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditando(null);
    setNome('');
    setCor('#6366f1');
    setIcone('tag');
    setOrdem(0);
  }

  async function salvarTag() {
    if (!nome.trim()) {
      showToast('Nome é obrigatório', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${baseURL}/api/tags/${editando.id}`
        : `${baseURL}/api/tags`;
      
      const res = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, cor, icone, ordem })
      });

      if (res.ok) {
        showToast(editando ? 'Tag atualizada!' : 'Tag criada!', 'success');
        carregarTags();
        fecharModal();
      } else {
        throw new Error('Erro ao salvar tag');
      }
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      showToast('Erro ao salvar tag', 'error');
    }
  }

  async function excluirTag(id: number) {
    const confirmed = await showConfirm(
      'Deseja realmente desativar esta tag?',
      'Confirmar Desativação'
    );
    
    if (confirmed) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${baseURL}/api/tags/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          showToast('Tag desativada!', 'success');
          carregarTags();
        }
      } catch (error) {
        console.error('Erro ao excluir tag:', error);
        showToast('Erro ao excluir tag', 'error');
      }
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-tags-fill me-2"></i>
            Gerenciar Tags do Sistema
          </h2>

          {/* Configurações Globais */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-gear-fill me-2"></i>
                Configurações do Kanban
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="usar_orcamento"
                      checked={config.usar_orcamento}
                      onChange={(e) => salvarConfig({ usar_orcamento: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="usar_orcamento">
                      <strong>Habilitar Orçamentos</strong>
                      <br />
                      <small className="text-muted">Permite adicionar valor de orçamento nos cartões</small>
                    </label>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="usar_status_visual"
                      checked={config.usar_status_visual}
                      onChange={(e) => salvarConfig({ usar_status_visual: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="usar_status_visual">
                      <strong>Status Visual nos Cards</strong>
                      <br />
                      <small className="text-muted">Mostra badge colorido de status no cartão</small>
                    </label>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="tags_personalizadas"
                      checked={config.tags_personalizadas}
                      onChange={(e) => salvarConfig({ tags_personalizadas: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="tags_personalizadas">
                      <strong>Sistema de Tags</strong>
                      <br />
                      <small className="text-muted">Habilita uso de tags/etiquetas</small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Tags */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Tags Cadastradas</h5>
              <button 
                className="btn btn-success"
                onClick={() => abrirModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nova Tag
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-tags" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3">Nenhuma tag cadastrada</p>
                  <button className="btn btn-primary" onClick={() => abrirModal()}>
                    Criar primeira tag
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Ordem</th>
                        <th>Preview</th>
                        <th>Nome</th>
                        <th>Cor</th>
                        <th>Ícone</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map(tag => (
                        <tr key={tag.id}>
                          <td>{tag.ordem}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: tag.cor,
                                color: '#fff',
                                fontSize: '0.85rem',
                                padding: '0.5rem 0.75rem'
                              }}
                            >
                              <i className={`bi bi-${tag.icone} me-1`}></i>
                              {tag.nome}
                            </span>
                          </td>
                          <td>{tag.nome}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: tag.cor,
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }}
                              ></div>
                              {tag.cor}
                            </div>
                          </td>
                          <td>
                            <i className={`bi bi-${tag.icone}`} style={{ fontSize: '1.25rem' }}></i>
                          </td>
                          <td>
                            <span className={`badge ${tag.ativo ? 'bg-success' : 'bg-secondary'}`}>
                              {tag.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => abrirModal(tag)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => excluirTag(tag.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criar/Editar Tag */}
      {showModal && (
        <div className="modal show d-block gerenciar-tags-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content gerenciar-tags-modal-content">
              <div className="modal-header gerenciar-tags-modal-header">
                <h5 className="modal-title gerenciar-tags-modal-title">
                  {editando ? 'Editar Tag' : 'Nova Tag'}
                </h5>
                <button className="btn-close gerenciar-tags-modal-close" onClick={fecharModal}></button>
              </div>
              <div className="modal-body gerenciar-tags-modal-body">
                {/* Nome */}
                <div className="mb-3">
                  <label className="form-label gerenciar-tags-modal-label">Nome da Tag</label>
                  <input
                    type="text"
                    className="form-control gerenciar-tags-modal-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Urgente, Orçamento, Suporte..."
                  />
                </div>

                {/* Cor */}
                <div className="mb-3">
                  <label className="form-label gerenciar-tags-modal-label">Cor</label>
                  <div className="row g-2">
                    {CORES_DISPONIVEIS.map(corOpcao => (
                      <div key={corOpcao.valor} className="col-4">
                        <button
                          className={`btn w-100 gerenciar-tags-btn-cor${cor === corOpcao.valor ? ' gerenciar-tags-btn-cor-active' : ''}`}
                          data-cor={corOpcao.valor}
                          onClick={() => setCor(corOpcao.valor)}
                        >
                          {corOpcao.nome}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ícone */}
                <div className="mb-3">
                  <label className="form-label gerenciar-tags-modal-label">Ícone</label>
                  <div className="row g-2">
                    {ICONES_DISPONIVEIS.map(iconeOpcao => (
                      <div key={iconeOpcao.id} className="col-3">
                        <button
                          className={`btn btn-outline-secondary w-100 gerenciar-tags-btn-icone${icone === iconeOpcao.id ? ' gerenciar-tags-btn-icone-active' : ''}`}
                          onClick={() => setIcone(iconeOpcao.id)}
                        >
                          <i className={`bi ${iconeOpcao.icon} gerenciar-tags-btn-icone-icon`}></i>
                          <div className="gerenciar-tags-btn-icone-label">{iconeOpcao.nome}</div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordem */}
                <div className="mb-3">
                  <label className="form-label gerenciar-tags-modal-label">Ordem de Exibição</label>
                  <input
                    type="number"
                    className="form-control gerenciar-tags-modal-input"
                    value={ordem}
                    onChange={(e) => setOrdem(Number(e.target.value))}
                    min="0"
                  />
                  <small className="text-muted">Ordem em que a tag aparece na lista</small>
                </div>

                {/* Preview */}
                <div className="mb-3">
                  <label className="form-label gerenciar-tags-modal-label">Preview</label>
                  <div>
                    <span
                      className="badge gerenciar-tags-badge-preview"
                      data-cor={cor}
                    >
                      <i className={`bi bi-${icone} me-2 gerenciar-tags-badge-preview-icon`}></i>
                      {nome || 'Nome da Tag'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer gerenciar-tags-modal-footer">
                <button className="btn btn-secondary gerenciar-tags-btn-cancel" onClick={fecharModal}>
                  Cancelar
                </button>
                <button className="btn btn-success gerenciar-tags-btn-save" onClick={salvarTag}>
                  <i className="bi bi-check-circle me-2"></i>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
