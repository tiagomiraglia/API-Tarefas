import React, { useState, useEffect } from 'react';
import { getHistoricoTransferencias, type TransferenciaCartao } from '../services/api';
import './HistoricoTransferenciasModal.css';

interface HistoricoTransferenciasModalProps {
  show: boolean;
  onHide: () => void;
  cartaoId: number;
  cartaoTitulo: string;
}

const HistoricoTransferenciasModal: React.FC<HistoricoTransferenciasModalProps> = ({
  show,
  onHide,
  cartaoId,
  cartaoTitulo
}) => {
  const [transferencias, setTransferencias] = useState<TransferenciaCartao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && cartaoId) {
      carregarHistorico();
    }
  }, [show, cartaoId]);

  const carregarHistorico = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistoricoTransferencias(cartaoId);
      setTransferencias(data.transferencias || []);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.response?.data?.message || 'Erro ao carregar histórico de transferências.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarInicial = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-clock-history me-2"></i>
              Histórico de Transferências
            </h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="mb-3">
              <strong>Cartão:</strong> {cartaoTitulo}
            </div>

            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <div className="mt-2 text-muted">Carregando histórico...</div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}

            {!loading && !error && transferencias.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Este cartão ainda não possui transferências registradas.
              </div>
            )}

            {!loading && !error && transferencias.length > 0 && (
              <div className="timeline-container">
                {transferencias.map((transferencia, index) => (
                  <div key={transferencia.id} className="card mb-3 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3">
                        <div className="timeline-badge">
                          <span className="badge bg-primary rounded-circle p-2">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">
                                <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                                Transferência #{transferencia.id}
                              </h6>
                              <small className="text-muted">
                                <i className="bi bi-calendar me-1"></i>
                                {formatarData(transferencia.created_at)}
                              </small>
                            </div>
                          </div>

                          <div className="transferencia-usuarios mb-2">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <div className="avatar-circle bg-warning">
                                {transferencia.usuario_origem?.foto ? (
                                  <img 
                                    src={transferencia.usuario_origem.foto} 
                                    alt={transferencia.usuario_origem.nome}
                                    className="avatar-img"
                                  />
                                ) : (
                                  <span>{getAvatarInicial(transferencia.usuario_origem?.nome || 'N/A')}</span>
                                )}
                              </div>
                              <div>
                                <div className="fw-bold">{transferencia.usuario_origem?.nome}</div>
                                <small className="text-muted">{transferencia.usuario_origem?.email}</small>
                              </div>
                            </div>

                            <div className="text-center my-2">
                              <i className="bi bi-arrow-down text-primary fs-4"></i>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <div className="avatar-circle bg-success">
                                {transferencia.usuario_destino?.foto ? (
                                  <img 
                                    src={transferencia.usuario_destino.foto} 
                                    alt={transferencia.usuario_destino.nome}
                                    className="avatar-img"
                                  />
                                ) : (
                                  <span>{getAvatarInicial(transferencia.usuario_destino?.nome || 'N/A')}</span>
                                )}
                              </div>
                              <div>
                                <div className="fw-bold">{transferencia.usuario_destino?.nome}</div>
                                <small className="text-muted">{transferencia.usuario_destino?.email}</small>
                              </div>
                            </div>
                          </div>

                          {transferencia.observacao && (
                            <div className="alert alert-light mb-0 mt-2">
                              <small>
                                <i className="bi bi-chat-left-text me-2"></i>
                                <strong>Observação:</strong> {transferencia.observacao}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoTransferenciasModal;
