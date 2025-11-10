import React, { useEffect, useState } from 'react';
import { marcarAvisosComoVistos } from './useAvisoAtivoCount';

interface AvisoAtivo {
  id: number;
  mensagem: string;
  ativo: boolean;
  data_criacao: string;
  data_expiracao: string | null;
  destinatario_id?: number | null;
  destinatario_nivel?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL;

interface AvisoAtivoModalProps {
  show: boolean;
  onClose: () => void;
}


export default function AvisoAtivoModal({ show, onClose }: AvisoAtivoModalProps) {
  const [avisos, setAvisos] = useState<AvisoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [avisosVistos, setAvisosVistos] = useState<number[]>([]);
  const [avisoSelecionado, setAvisoSelecionado] = useState<AvisoAtivo|null>(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    const userId = Number(localStorage.getItem('user_id') || localStorage.getItem('usuario_id'));
    // Carrega avisos vistos do localStorage
    let vistos: number[] = [];
    try {
      vistos = JSON.parse(localStorage.getItem(`avisos_vistos_${userId}`) || '[]');
    } catch { vistos = []; }
    setAvisosVistos(vistos);
    fetch(`${API_URL}/api/avisos/ativo`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(async data => {
        // Exibe todos avisos retornados pelo backend, sem filtro extra
        const avisos = Array.isArray(data.avisos) ? data.avisos : [];
        setAvisos(avisos);
        if (avisos.length) {
          const ids = avisos.map((a: { id: number }) => a.id);
          marcarAvisosComoVistos(ids);
          // Atualiza local avisos vistos
          setAvisosVistos(Array.from(new Set([...vistos, ...ids])));
          // Registrar visualização no backend
          await fetch(`${API_URL}/api/avisos/visualizacao`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avisoIds: ids })
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [show]);

  return (
    <div className={`modal fade${show ? ' show d-block' : ''}`} tabIndex={-1} style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content">
          <div className="modal-header py-2">
            <h6 className="modal-title fw-bold">Avisos Globais</h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-2">
            {loading ? (
              <div className="text-center py-3">Carregando avisos...</div>
            ) : avisos.length ? (
              <ul className="list-group list-group-flush">
                {avisos.map(aviso => {
                  const lido = avisosVistos.includes(aviso.id);
                  return (
                    <li
                      key={aviso.id}
                      className={`list-group-item px-2 py-2 d-flex align-items-center gap-2${lido ? ' aviso-lido' : ' aviso-nao-lido'}`}
                      style={{
                        minHeight: 48,
                        background: lido ? '#f8f9fa' : '#fffbe6',
                        opacity: lido ? 0.7 : 1,
                        borderLeft: lido ? '4px solid #dee2e6' : '4px solid #ffc107',
                        boxShadow: lido ? 'none' : '0 0 0 2px #ffe066 inset',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title={lido ? 'Você já leu este aviso' : 'Clique para ler o aviso completo'}
                      onClick={() => {
                        setAvisoSelecionado(aviso);
                        if (!lido) {
                          // Marca como lido ao abrir
                          const userId = Number(localStorage.getItem('user_id') || localStorage.getItem('usuario_id'));
                          let vistos: number[] = [];
                          try {
                            vistos = JSON.parse(localStorage.getItem(`avisos_vistos_${userId}`) || '[]');
                          } catch { vistos = []; }
                          if (!vistos.includes(aviso.id)) {
                            const novos = Array.from(new Set([...vistos, aviso.id]));
                            localStorage.setItem(`avisos_vistos_${userId}`, JSON.stringify(novos));
                            setAvisosVistos(novos);
                          }
                        }
                      }}
                    >
                      <i className={`bi ${lido ? 'bi-envelope-open' : 'bi-envelope-fill'} text-warning flex-shrink-0`} style={{ fontSize: 18 }}></i>
                      <div className="flex-grow-1 text-truncate" title={aviso.mensagem} style={{ maxWidth: 200 }}>
                        <span className={`fw-semibold text-truncate${lido ? ' text-secondary' : ' text-dark'}`} style={{ fontSize: 15 }}>
                          {aviso.mensagem}
                          {!lido && (
                            <span className="badge bg-warning text-dark ms-2 align-middle" style={{ fontSize: 11, verticalAlign: 'middle' }} title="Novo aviso">Novo</span>
                          )}
                        </span>
                        {aviso.data_expiracao && (
                          <span className="d-block text-danger small text-truncate" style={{ fontSize: 12 }}>Expira: {new Date(aviso.data_expiracao).toLocaleString()}</span>
                        )}
                      </div>
                      <span className="text-muted small flex-shrink-0" style={{ fontSize: 12, minWidth: 90, textAlign: 'right' }} title={new Date(aviso.data_criacao).toLocaleString()}>
                        {new Date(aviso.data_criacao).toLocaleDateString()}<br />{new Date(aviso.data_criacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  );
                })}
      {/* Modal de aviso completo */}
      {avisoSelecionado && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title fw-bold">Aviso</h6>
                <button type="button" className="btn-close" onClick={() => setAvisoSelecionado(null)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="mb-2">
                  <span className="fw-semibold text-dark" style={{ fontSize: 16 }}>{avisoSelecionado.mensagem}</span>
                </div>
                <div className="mb-2 text-muted small">
                  <span><i className="bi bi-calendar-event me-1"></i> {new Date(avisoSelecionado.data_criacao).toLocaleString()}</span>
                  {avisoSelecionado.data_expiracao && (
                    <span className="ms-3"><i className="bi bi-hourglass-split me-1"></i> Expira: {new Date(avisoSelecionado.data_expiracao).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAvisoSelecionado(null)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
              </ul>
            ) : (
              <div className="text-muted">Nenhum aviso ativo no momento.</div>
            )}
          </div>
          <div className="modal-footer py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
