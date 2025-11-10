import React, { useEffect, useState } from 'react';

export interface Aviso {
  id: number;
  mensagem: string;
  ativo: boolean;
  data_criacao: string;
  data_expiracao: string | null;
  destinatario_id?: number | null;
  destinatario_nivel?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL;

interface AvisosListProps {
  onEdit: (aviso: Aviso) => void;
  onSuspend: (aviso: Aviso) => void;
  onDelete: (aviso: Aviso) => void;
  refresh?: number;
}

interface Visualizacao {
  usuario: { id: number; nome: string; email: string; nivel: string };
  visualizado_em: string;
}


import api from '../utils/api';

function AvisosList(props: AvisosListProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisualizados, setShowVisualizados] = useState<number|null>(null);
  const [visualizacoes, setVisualizacoes] = useState<Visualizacao[]>([]);
  const [loadingVisualizados, setLoadingVisualizados] = useState(false);
  const [destinatarioNomes, setDestinatarioNomes] = useState<{[id: number]: string}>({});

  useEffect(() => {
    setLoading(true);
  fetch(`${API_URL}/api/avisos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(async data => {
        setAvisos(data.avisos || []);
        // Buscar nomes dos destinatários usuários
        const avisosComUsuario = (data.avisos || []).filter((a: any) => a.destinatario_id);
        const nomes: {[id: number]: string} = {};
        await Promise.all(avisosComUsuario.map(async (a: any) => {
          if (!nomes[a.destinatario_id]) {
            try {
              const res = await api.get(`/api/usuarios/${a.destinatario_id}`);
              const userData = (res.data as any).user;
              nomes[a.destinatario_id] = userData && userData.nome ? userData.nome : `Usuário ID ${a.destinatario_id}`;
            } catch {
              nomes[a.destinatario_id] = `Usuário ID ${a.destinatario_id}`;
            }
          }
        }));
        setDestinatarioNomes(nomes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [props.refresh]);

  if (loading) return <div className="text-center py-3">Carregando avisos...</div>;
  if (!avisos.length) return <div className="text-center py-3 text-muted">Nenhum aviso cadastrado.</div>;

  return (
    <div className="table-responsive" style={{ maxHeight: 260, overflowY: 'auto', background: '#0f1115', borderRadius: '12px', border: '1px solid #334155' }}>
      <table className="table align-middle" style={{ background: '#0f1115', color: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
        <thead style={{ background: '#1a1d29', color: '#f8fafc' }}>
          <tr>
            <th style={{ background: '#1a1d29', color: '#f8fafc', border: 'none' }}>Mensagem</th>
            <th style={{ background: '#1a1d29', color: '#f8fafc', border: 'none' }}>Ativo</th>
            <th style={{ background: '#1a1d29', color: '#f8fafc', border: 'none' }}>Data de Criação</th>
            <th style={{ background: '#1a1d29', color: '#f8fafc', border: 'none' }}>Data de Expiração</th>
            <th style={{ background: '#1a1d29', color: '#f8fafc', border: 'none' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {avisos.map(aviso => (
            <tr key={aviso.id} style={{ background: '#0f1115', color: '#f8fafc' }}>
              <td style={{ maxWidth: 260, background: '#0f1115', color: '#f8fafc', border: 'none' }}>
                <span
                  className="text-truncate d-inline-block"
                  style={{ maxWidth: 240 }}
                  title={aviso.mensagem}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-tooltip-id={`destino-${aviso.id}`}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    // @ts-ignore
                    if ((window as any).bootstrap && (window as any).bootstrap.Tooltip) {
                      // @ts-ignore
                      new (window as any).bootstrap.Tooltip(el);
                    }
                  }}
                >
                  {aviso.mensagem}
                </span>
                <span
                  className="ms-1 text-info"
                  style={{ cursor: 'pointer' }}
                  title={
                    aviso.destinatario_id
                      ? `Usuário: ${destinatarioNomes[aviso.destinatario_id] || `ID ${aviso.destinatario_id}`}`
                      : aviso.destinatario_nivel
                        ? `Grupo: ${aviso.destinatario_nivel === 'admin' ? 'Administradores' : aviso.destinatario_nivel === 'usuario' ? 'Usuários' : aviso.destinatario_nivel}`
                        : 'Global (todos)'
                  }
                >
                  <i className="bi bi-info-circle"></i>
                </span>
              </td>
              <td style={{ background: '#0f1115', color: '#f8fafc', border: 'none' }}>{aviso.ativo ? 'Sim' : 'Não'}</td>
              <td style={{ background: '#0f1115', color: '#f8fafc', border: 'none' }}>{new Date(aviso.data_criacao).toLocaleString()}</td>
              <td style={{ background: '#0f1115', color: '#f8fafc', border: 'none' }}>{aviso.data_expiracao ? new Date(aviso.data_expiracao).toLocaleString() : '-'}</td>
              <td style={{ background: '#0f1115', color: '#f8fafc', border: 'none' }}>
                <button className="btn btn-sm btn-primary me-2" onClick={() => props.onEdit(aviso)} title="Editar"><i className="bi bi-pencil"></i></button>
                <button
                  className={`btn btn-sm ${aviso.ativo ? 'btn-outline-warning' : 'btn-outline-success'} me-2`}
                  onClick={() => props.onSuspend(aviso)}
                  title={aviso.ativo ? 'Suspender' : 'Ativar'}
                >
                  <i className={`bi ${aviso.ativo ? 'bi-pause' : 'bi-play'}${aviso.ativo ? '' : ' text-success'}`}></i>
                </button>
                <button className="btn btn-sm btn-danger me-2" onClick={() => props.onDelete(aviso)} title="Excluir"><i className="bi bi-trash"></i></button>
                <button className="btn btn-sm btn-info" title="Visualizações"
                  onClick={async () => {
                    setShowVisualizados(aviso.id);
                    setLoadingVisualizados(true);
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_URL}/api/avisos/visualizacao/${aviso.id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setVisualizacoes(data.visualizacoes || []);
                    setLoadingVisualizados(false);
                  }}
                >
                  <i className="bi bi-people"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal visualizações */}
      {showVisualizados && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title fw-bold">Visualizações do Aviso</h6>
                <button type="button" className="btn-close" onClick={() => setShowVisualizados(null)}></button>
              </div>
              <div className="modal-body p-2">
                {loadingVisualizados ? (
                  <div className="text-center py-3">Carregando...</div>
                ) : visualizacoes.length ? (
                  <ul className="list-group list-group-flush">
                    {visualizacoes.map(v => (
                      <li key={v.usuario.id} className="list-group-item px-2 py-2 d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle text-secondary flex-shrink-0" style={{ fontSize: 18 }}></i>
                        <div className="flex-grow-1">
                          <span className="fw-semibold text-dark" style={{ fontSize: 15 }}>{v.usuario.nome}</span>
                          <span className="d-block text-muted small">{v.usuario.email}</span>
                          <span className="badge bg-light text-dark border ms-1" style={{ fontSize: 11 }}>{v.usuario.nivel}</span>
                        </div>
                        <span className="text-muted small flex-shrink-0" style={{ fontSize: 12, minWidth: 90, textAlign: 'right' }} title={new Date(v.visualizado_em).toLocaleString()}>
                          {new Date(v.visualizado_em).toLocaleDateString()}<br />{new Date(v.visualizado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted">Ninguém visualizou este aviso ainda.</div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowVisualizados(null)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvisosList;
