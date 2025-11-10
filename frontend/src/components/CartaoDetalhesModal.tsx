import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';
import ChatWhatsApp from './ChatWhatsApp';

interface Cartao {
  id: number;
  titulo: string;
  descricao: string | null;
  coluna_id: number;
  ordem: number;
  cor: string;
  status_atendimento?: string | null;
  valor_orcamento?: string | null;
  anotacoes?: string | null;
  etiquetas?: any;
  usuario_atribuido?: {
    id: number;
    nome: string;
    foto: string | null;
  } | null;
  whatsapp?: {
    id: number;
    conversa_id: string;
    conversa_nome: string | null;
  } | null;
  _count?: {
    anexos: number;
    historico: number;
  };
}

interface Tag {
  id: number;
  nome: string;
  cor: string;
  icone: string;
  ativo: boolean;
}

interface EmpresaConfig {
  usar_orcamento: boolean;
  usar_status_visual: boolean;
  tags_personalizadas: boolean;
}

interface Props {
  show: boolean;
  onClose: () => void;
  cartao: Cartao;
  onUpdate?: () => void;
  onTransferir?: (cartao: Cartao) => void;
}

const STATUS_ATENDIMENTO = [
  { id: 'novo', nome: 'Novo', cor: '#6366f1' },
  { id: 'em_atendimento', nome: 'Em Atendimento', cor: '#f59e0b' },
  { id: 'aguardando_cliente', nome: 'Aguardando Cliente', cor: '#8b5cf6' },
  { id: 'aguardando_interno', nome: 'Aguardando Interno', cor: '#06b6d4' },
  { id: 'resolvido', nome: 'Resolvido', cor: '#10b981' },
  { id: 'cancelado', nome: 'Cancelado', cor: '#ef4444' },
];

export default function CartaoDetalhesModal({ show, onClose, cartao, onUpdate, onTransferir }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [descricaoEditavel, setDescricaoEditavel] = useState('');
  const [anotacoesTexto, setAnotacoesTexto] = useState('');
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<Tag[]>([]);
  const [statusAtual, setStatusAtual] = useState('em_atendimento');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [tempoAtendimento, setTempoAtendimento] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'anotacoes' | 'historico'>('chat');
  const [config, setConfig] = useState<EmpresaConfig>({
    usar_orcamento: false,
    usar_status_visual: true,
    tags_personalizadas: false
  });
  const [salvando, setSalvando] = useState(false);

  // Carregar configurações e tags ao abrir
  useEffect(() => {
    if (show) {
      carregarConfiguracoes();
      carregarTags();
      
      // Carregar dados do cartão
      setDescricaoEditavel(cartao.descricao || '');
      setAnotacoesTexto(cartao.anotacoes || '');
      setStatusAtual(cartao.status_atendimento || 'em_atendimento');
      setValorOrcamento(cartao.valor_orcamento || '');
      
      // Carregar tags do cartão (se houver)
      if (cartao.etiquetas && Array.isArray(cartao.etiquetas)) {
        setTagsSelecionadas(cartao.etiquetas);
      }
      
      // Iniciar temporizador
      const interval = setInterval(() => {
        setTempoAtendimento(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [show, cartao]);

  async function carregarConfiguracoes() {
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

  async function carregarTags() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTagsDisponiveis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  }

  async function salvarAlteracoes() {
    try {
      setSalvando(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${baseURL}/api/kanban/cartoes/${cartao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          descricao: descricaoEditavel,
          status_atendimento: statusAtual,
          valor_orcamento: valorOrcamento ? parseFloat(valorOrcamento) : null,
          anotacoes: anotacoesTexto,
          etiquetas: tagsSelecionadas
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      showToast('Alterações salvas com sucesso!', 'success');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      showToast('Erro ao salvar alterações', 'error');
    } finally {
      setSalvando(false);
    }
  }

  const formatTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const toggleTag = (tagId: number) => {
    setTagsSelecionadas(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleAdicionarAnotacao = () => {
    if (!novaAnotacao.trim()) return;
    
    const timestamp = new Date().toLocaleString('pt-BR');
    const novaLinha = `[${timestamp}] ${novaAnotacao}\n`;
    setAnotacoesTexto(prev => novaLinha + (prev || ''));
    setNovaAnotacao('');
  };

  if (!show) return null;

  const statusInfo = STATUS_ATENDIMENTO.find(s => s.id === statusAtual);

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-xl modal-dialog-scrollable"
        style={{ maxWidth: '95%', height: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ height: '100%' }}>
          {/* Header */}
          <div className="modal-header" style={{ 
            backgroundColor: '#1e293b',
            borderBottom: '2px solid #334155',
            padding: '1rem 1.5rem'
          }}>
            <div className="d-flex align-items-center gap-3 flex-grow-1">
              <div>
                <h5 className="modal-title mb-1" style={{ color: '#fff', fontSize: '1.25rem' }}>
                  {cartao.titulo}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {cartao.whatsapp && (
                    <span className="badge" style={{ 
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      fontSize: '0.75rem'
                    }}>
                      <i className="bi bi-whatsapp me-1"></i>
                      WhatsApp
                    </span>
                  )}
                  <span className="badge" style={{ 
                    backgroundColor: statusInfo?.cor,
                    color: '#fff',
                    fontSize: '0.75rem'
                  }}>
                    {statusInfo?.nome}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    <i className="bi bi-clock me-1"></i>
                    {formatTempo(tempoAtendimento)}
                  </span>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-0" style={{ display: 'flex', height: 'calc(100% - 140px)' }}>
            {/* Coluna Esquerda - Info e Tags */}
            <div style={{ 
              width: '350px',
              borderRight: '1px solid #e2e8f0',
              padding: '1.5rem',
              overflowY: 'auto',
              backgroundColor: '#f8fafc'
            }}>
              {/* Status */}
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary mb-2">
                  <i className="bi bi-flag-fill me-2"></i>
                  Status do Atendimento
                </label>
                <select 
                  className="form-select"
                  value={statusAtual}
                  onChange={(e) => setStatusAtual(e.target.value)}
                >
                  {STATUS_ATENDIMENTO.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Atendente */}
              {cartao.usuario_atribuido && (
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary mb-2">
                    <i className="bi bi-person-circle me-2"></i>
                    Atendente Responsável
                  </label>
                  <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}
                    >
                      {cartao.usuario_atribuido.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>
                      {cartao.usuario_atribuido.nome}
                    </span>
                  </div>
                  {onTransferir && (
                    <button 
                      className="btn btn-sm btn-outline-primary w-100 mt-2"
                      onClick={() => onTransferir(cartao)}
                    >
                      <i className="bi bi-arrow-left-right me-2"></i>
                      Transferir Atendimento
                    </button>
                  )}
                </div>
              )}

              {/* Tags */}
              {tagsDisponiveis.length > 0 && (
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary mb-2">
                    <i className="bi bi-tags-fill me-2"></i>
                    Etiquetas
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {tagsDisponiveis.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: tagsSelecionadas.includes(tag.id) ? tag.cor : '#fff',
                          color: tagsSelecionadas.includes(tag.id) ? '#fff' : tag.cor,
                          border: `2px solid ${tag.cor}`,
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '0.25rem 0.75rem'
                        }}
                      >
                        <i className={`bi bi-${tag.icone} me-1`}></i>
                        {tag.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Valor/Orçamento - só aparece se config ativa */}
              {config.usar_orcamento && (
                <div className="mb-4">
                  <label className="form-label fw-bold text-secondary mb-2">
                    <i className="bi bi-currency-dollar me-2"></i>
                    Valor do Orçamento
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">R$</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0,00"
                      value={valorOrcamento}
                      onChange={(e) => setValorOrcamento(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Descrição - Campo editável */}
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary mb-2">
                  <i className="bi bi-file-text me-2"></i>
                  Descrição
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Adicione uma descrição..."
                  value={descricaoEditavel}
                  onChange={(e) => setDescricaoEditavel(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Stats */}
              {cartao._count && (
                <div className="d-flex gap-3">
                  <div className="text-center flex-grow-1 p-2 bg-white rounded border">
                    <div style={{ fontSize: '1.5rem', color: '#6366f1', fontWeight: '700' }}>
                      {cartao._count.anexos}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Anexos</div>
                  </div>
                  <div className="text-center flex-grow-1 p-2 bg-white rounded border">
                    <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: '700' }}>
                      {cartao._count.historico}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Interações</div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita - Tabs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Tabs */}
              <ul className="nav nav-tabs" style={{ 
                borderBottom: '2px solid #e2e8f0',
                padding: '0 1.5rem',
                backgroundColor: '#fff'
              }}>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                    style={{
                      border: 'none',
                      borderBottom: activeTab === 'chat' ? '3px solid #6366f1' : 'none',
                      color: activeTab === 'chat' ? '#6366f1' : '#64748b',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    Conversa
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'anotacoes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('anotacoes')}
                    style={{
                      border: 'none',
                      borderBottom: activeTab === 'anotacoes' ? '3px solid #6366f1' : 'none',
                      color: activeTab === 'anotacoes' ? '#6366f1' : '#64748b',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-journal-text me-2"></i>
                    Anotações
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'historico' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historico')}
                    style={{
                      border: 'none',
                      borderBottom: activeTab === 'historico' ? '3px solid #6366f1' : 'none',
                      color: activeTab === 'historico' ? '#6366f1' : '#64748b',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-clock-history me-2"></i>
                    Histórico
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'chat' && cartao.whatsapp && (
                  <ChatWhatsApp
                    cartaoId={cartao.id}
                    conversaId={cartao.whatsapp.conversa_id}
                    conversaNome={cartao.whatsapp.conversa_nome}
                  />
                )}

                {activeTab === 'anotacoes' && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                    {/* Nova Anotação */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-pencil-square me-2"></i>
                        Nova Anotação
                      </label>
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        placeholder="Digite sua anotação sobre este atendimento..."
                        value={novaAnotacao}
                        onChange={(e) => setNovaAnotacao(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleAdicionarAnotacao}
                        disabled={!novaAnotacao.trim()}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Adicionar Anotação
                      </button>
                    </div>

                    {/* Lista de Anotações */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <label className="form-label fw-bold mb-2">
                        <i className="bi bi-list-ul me-2"></i>
                        Histórico de Anotações
                      </label>
                      {anotacoesTexto ? (
                        <pre style={{ 
                          fontSize: '0.85rem', 
                          whiteSpace: 'pre-wrap',
                          backgroundColor: '#f8fafc',
                          padding: '1rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0'
                        }}>
                          {anotacoesTexto}
                        </pre>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <i className="bi bi-journal-text" style={{ fontSize: '2rem' }}></i>
                          <p className="mt-2">Nenhuma anotação registrada</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-clock-history me-2"></i>
                      Timeline do Atendimento
                    </h6>
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-hourglass-split" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <div className="mt-2">Histórico em breve...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer com botão Salvar */}
          <div className="modal-footer" style={{ 
            borderTop: '2px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '1rem 1.5rem'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={salvando}
            >
              Fechar
            </button>
            <button 
              type="button" 
              className="btn btn-success"
              onClick={salvarAlteracoes}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
