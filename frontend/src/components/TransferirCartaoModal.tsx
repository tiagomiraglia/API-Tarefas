import React, { useState, useEffect } from 'react';
import { transferirCartao } from '../services/api';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto?: string;
  nivel?: string;
}

interface TransferirCartaoModalProps {
  show: boolean;
  onHide: () => void;
  cartaoId: number;
  cartaoTitulo: string;
  onTransferenciaRealizada: () => void;
}

const TransferirCartaoModal: React.FC<TransferirCartaoModalProps> = ({
  show,
  onHide,
  cartaoId,
  cartaoTitulo,
  onTransferenciaRealizada
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioDestinoId, setUsuarioDestinoId] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      carregarUsuarios();
      setUsuarioDestinoId(null);
      setObservacao('');
      setError(null);
      setSuccess(false);
    }
  }, [show]);

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const response = await api.get<Usuario[]>('/usuarios');
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleTransferir = async () => {
    if (!usuarioDestinoId) {
      setError('Por favor, selecione um atendente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await transferirCartao(cartaoId, usuarioDestinoId, observacao || undefined);
      setSuccess(true);
      
      setTimeout(() => {
        onTransferenciaRealizada();
        onHide();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao transferir cartão:', err);
      setError(err.response?.data?.message || 'Erro ao transferir cartão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-arrow-left-right me-2"></i>
              Transferir Atendimento
            </h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {success ? (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                Cartão transferido com sucesso!
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <strong>Cartão:</strong> {cartaoTitulo}
                </div>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    <strong>Transferir para:</strong> <span className="text-danger">*</span>
                  </label>
                  {loadingUsuarios ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Carregando...</span>
                      </div>
                      <div className="mt-2 text-muted">Carregando atendentes...</div>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={usuarioDestinoId || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUsuarioDestinoId(Number(e.target.value))}
                      disabled={loading}
                    >
                      <option value="">Selecione um atendente</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Observação (opcional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={observacao}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacao(e.target.value)}
                    placeholder="Ex: Cliente solicitou falar com outro atendente..."
                    disabled={loading}
                    maxLength={500}
                  />
                  <div className="form-text">
                    {observacao.length}/500 caracteres
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>
              Cancelar
            </button>
            {!success && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTransferir}
                disabled={loading || loadingUsuarios || !usuarioDestinoId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Transferindo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right me-2"></i>
                    Transferir
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferirCartaoModal;
