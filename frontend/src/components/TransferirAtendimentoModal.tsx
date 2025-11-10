import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  cartaoId: number;
  cartaoTitulo: string;
  atendenteAtual?: {
    id: number;
    nome: string;
  } | null;
  onSuccess: () => void;
}

export default function TransferirAtendimentoModal({ show, onClose, cartaoId, cartaoTitulo, atendenteAtual, onSuccess }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferindo, setTransferindo] = useState(false);

  useEffect(() => {
    if (show) {
      fetchUsuarios();
      setSelectedUsuario(null);
      setObservacao('');
    }
  }, [show]);

  async function fetchUsuarios() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar usuários');
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filtra o atendente atual da lista
        const usuariosFiltrados = atendenteAtual 
          ? data.filter((u: Usuario) => u.id !== atendenteAtual.id)
          : data;
        setUsuarios(usuariosFiltrados);
      } else if (data.users && Array.isArray(data.users)) {
        const usuariosFiltrados = atendenteAtual 
          ? data.users.filter((u: Usuario) => u.id !== atendenteAtual.id)
          : data.users;
        setUsuarios(usuariosFiltrados);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showToast('Erro ao carregar atendentes', 'error');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransferir() {
    if (!selectedUsuario) {
      showToast('Selecione um atendente', 'error');
      return;
    }

    try {
      setTransferindo(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/transferencias/cartoes/${cartaoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          de_atendente_id: atendenteAtual?.id || null,
          para_atendente_id: selectedUsuario,
          observacao: observacao || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao transferir atendimento');
      }

      showToast('✅ Atendimento transferido com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao transferir:', error);
      showToast(error.message || 'Erro ao transferir atendimento', 'error');
    } finally {
      setTransferindo(false);
    }
  }

  if (!show) return null;

  const usuarioSelecionado = usuarios.find(u => u.id === selectedUsuario);

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ backgroundColor: '#1a1d29', border: '1px solid #2d3142' }}>
          <div className="modal-header" style={{ borderBottom: '1px solid #2d3142' }}>
            <h5 className="modal-title" style={{ color: '#fff' }}>
              <i className="bi bi-arrow-left-right me-2"></i>
              Transferir Atendimento
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={transferindo}
            ></button>
          </div>
          
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Info do Cartão */}
                <div className="alert alert-info mb-4" style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa'
                }}>
                  <div><strong>Cartão:</strong> {cartaoTitulo}</div>
                  {atendenteAtual && (
                    <div className="mt-2">
                      <strong>Atendente Atual:</strong> {atendenteAtual.nome}
                    </div>
                  )}
                </div>

                {/* Seleção de Atendente */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#fff' }}>
                    <i className="bi bi-person-circle me-2"></i>
                    Transferir para
                  </label>
                  {usuarios.length === 0 ? (
                    <div className="alert alert-warning" style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24'
                    }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Não há outros atendentes disponíveis
                    </div>
                  ) : (
                    <select 
                      className="form-select form-select-lg"
                      style={{ 
                        backgroundColor: '#2d3142', 
                        color: '#fff',
                        border: '2px solid #3d4152',
                        fontSize: '1rem',
                        padding: '0.75rem'
                      }}
                      value={selectedUsuario || ''}
                      onChange={(e) => setSelectedUsuario(Number(e.target.value))}
                    >
                      <option value="">Selecione um atendente...</option>
                      {usuarios.map(usuario => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Observação */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#fff' }}>
                    <i className="bi bi-chat-left-text me-2"></i>
                    Observação (opcional)
                  </label>
                  <textarea 
                    className="form-control"
                    style={{ 
                      backgroundColor: '#2d3142', 
                      color: '#fff',
                      border: '1px solid #3d4152',
                      minHeight: '80px'
                    }}
                    placeholder="Ex: Cliente solicitou falar com gerente..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    maxLength={500}
                  />
                  <small className="text-muted">
                    {observacao.length}/500 caracteres
                  </small>
                </div>

                {/* Preview da Transferência */}
                {selectedUsuario && (
                  <div className="alert alert-success" style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80'
                  }}>
                    <strong><i className="bi bi-check-circle me-2"></i>Pronto para transferir!</strong>
                    <div className="mt-2">
                      {atendenteAtual && (
                        <>
                          <span style={{ color: '#94a3b8' }}>{atendenteAtual.nome}</span>
                          {' → '}
                        </>
                      )}
                      <span style={{ color: '#4ade80', fontWeight: '600' }}>
                        {usuarioSelecionado?.nome}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="modal-footer" style={{ borderTop: '1px solid #2d3142' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={transferindo}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleTransferir}
              disabled={!selectedUsuario || transferindo || usuarios.length === 0}
            >
              {transferindo ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Transferindo...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-left-right me-2"></i>
                  Transferir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
