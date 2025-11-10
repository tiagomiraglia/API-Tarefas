import React, { useState, useEffect } from 'react';
import { getEstatisticasTransferencias, type EstatisticasTransferencias } from '../services/api';
import './EstatisticasTransferencias.css';

const EstatisticasTransferenciasComponent: React.FC = () => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasTransferencias | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEstatisticasTransferencias();
      setEstatisticas(data);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
      setError(err.response?.data?.message || 'Erro ao carregar estatísticas de transferências.');
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <div className="mt-2">Carregando estatísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (!estatisticas) {
    return null;
  }

  const exportarRelatorio = (formato: 'csv' | 'json' | 'html') => {
    // Implementar exportação
    alert(`Exportar em formato ${formato.toUpperCase()} (implementação pendente)`);
  };

  return (
    <div className="estatisticas-transferencias">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Estatísticas de Transferências
        </h3>
        
        {/* Botões de Exportação */}
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-outline-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="bi bi-download me-2"></i>
            Exportar Relatório
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button
                className="dropdown-item"
                onClick={() => exportarRelatorio('csv')}
              >
                <i className="bi bi-filetype-csv me-2"></i>
                CSV (Excel)
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => exportarRelatorio('json')}
              >
                <i className="bi bi-filetype-json me-2"></i>
                JSON (Dados)
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => exportarRelatorio('html')}
              >
                <i className="bi bi-file-earmark-text me-2"></i>
                HTML (Relatório Visual)
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="stat-icon mb-3">
                <i className="bi bi-arrow-left-right text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2 className="mb-1">{estatisticas.total}</h2>
              <p className="text-muted mb-0">Total de Transferências</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="stat-icon mb-3">
                <i className="bi bi-calendar-week text-success" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2 className="mb-1">{estatisticas.ultimos7Dias}</h2>
              <p className="text-muted mb-0">Últimos 7 Dias</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <div className="stat-icon mb-3">
                <i className="bi bi-calendar-month text-info" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h2 className="mb-1">{estatisticas.ultimos30Dias}</h2>
              <p className="text-muted mb-0">Últimos 30 Dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas de Ranking */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-primary text-white">
              <i className="bi bi-send me-2"></i>
              Atendentes que Mais Transferem
            </div>
            <div className="card-body">
              {estatisticas.porUsuarioOrigem.length === 0 ? (
                <p className="text-muted text-center mb-0">Nenhum dado disponível</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Atendente</th>
                        <th className="text-end">Total Enviadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estatisticas.porUsuarioOrigem.slice(0, 5).map((item, index) => (
                        <tr key={item.usuario_id}>
                          <td>
                            <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-light'} text-dark`}>
                              {index + 1}
                            </span>
                          </td>
                          <td>{item.nome}</td>
                          <td className="text-end">
                            <span className="badge bg-primary">{item.total_enviadas}</span>
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

        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-success text-white">
              <i className="bi bi-inbox me-2"></i>
              Atendentes que Mais Recebem
            </div>
            <div className="card-body">
              {estatisticas.porUsuarioDestino.length === 0 ? (
                <p className="text-muted text-center mb-0">Nenhum dado disponível</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Atendente</th>
                        <th className="text-end">Total Recebidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estatisticas.porUsuarioDestino.slice(0, 5).map((item, index) => (
                        <tr key={item.usuario_id}>
                          <td>
                            <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-light'} text-dark`}>
                              {index + 1}
                            </span>
                          </td>
                          <td>{item.nome}</td>
                          <td className="text-end">
                            <span className="badge bg-success">{item.total_recebidas}</span>
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

      {/* Últimas Transferências */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-info text-white">
          <i className="bi bi-clock-history me-2"></i>
          Últimas Transferências
        </div>
        <div className="card-body">
          {estatisticas.ultimasTransferencias.length === 0 ? (
            <p className="text-muted text-center mb-0">Nenhuma transferência registrada</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Cartão</th>
                    <th>De</th>
                    <th>Para</th>
                    <th>Observação</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {estatisticas.ultimasTransferencias.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.cartao_titulo}</strong>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark">{item.usuario_origem}</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{item.usuario_destino}</span>
                      </td>
                      <td>
                        {item.observacao ? (
                          <small className="text-muted">{item.observacao}</small>
                        ) : (
                          <small className="text-muted fst-italic">Sem observação</small>
                        )}
                      </td>
                      <td>
                        <small>{formatarData(item.created_at)}</small>
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
  );
};

export default EstatisticasTransferenciasComponent;
