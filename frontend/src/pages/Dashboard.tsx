import NavbarAdmin from '../components/NavbarAdmin';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    mensagensHoje: 0,
    atendimentosHoje: 0,
    tempoMedio: '--'
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Busca dados do usuário logado via id salvo no localStorage
    async function fetchUsuario() {
      const id = localStorage.getItem('user_id') || localStorage.getItem('id');
      if (!id) return;
      try {
        const res = await api.get(`/usuarios/${id}`);
        setUsuario(res.data.user);
      } catch {}
    }
    fetchUsuario();
  }, []);

  useEffect(() => {
    // Busca usuários da empresa
    async function fetchUsuarios() {
      try {
        const res = await api.get('/usuarios');
        const data = res.data;
        // Filtrar apenas usuários ativos (não suspensos)
        const usuariosAtivos = (data.users || []).filter((u: any) => !u.suspenso);
        setUsuarios(usuariosAtivos);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    }
    fetchUsuarios();
  }, []);

  useEffect(() => {
    // Busca estatísticas do dashboard
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <>
      <NavbarAdmin user={usuario} />
      <div className="dashboard-bg">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header mb-5">
            <h1 className="dashboard-title fw-bold mb-2">Dashboard Administrativo</h1>
          </div>
          {/* Stats Grid */}
          <div className="row g-4 mb-5">
            {/* Card Usuários */}
            <div className="col-lg-3 col-md-6">
              <div className="dashboard-card dashboard-card-orange">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="dashboard-card-label">Usuários Ativos</div>
                  <div className="dashboard-card-icon-bg">
                    <i className="bi bi-people dashboard-card-icon"></i>
                  </div>
                </div>
                <div className="dashboard-card-value h1 fw-bold mb-2">{usuarios.length}</div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge">
                    <i className="bi bi-arrow-up dashboard-card-badge-icon"></i>100%
                  </span>
                  <span className="dashboard-card-info-text">No seu time</span>
                </div>
              </div>
            </div>
            {/* Card Mensagens */}
            <div className="col-lg-3 col-md-6">
              <div className="dashboard-card dashboard-card-blue">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="dashboard-card-label">Mensagens Hoje</div>
                  <div className="dashboard-card-icon-bg">
                    <i className="bi bi-chat-dots dashboard-card-icon"></i>
                  </div>
                </div>
                <div className="dashboard-card-value h1 fw-bold mb-2">
                  {loadingStats ? '...' : stats.mensagensHoje}
                </div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge">
                    <i className="bi bi-chat-text dashboard-card-badge-icon"></i>
                    {loadingStats ? '...' : 'hoje'}
                  </span>
                  <span className="dashboard-card-info-text">Mensagens recebidas</span>
                </div>
              </div>
            </div>
            {/* Card Atendimentos */}
            <div className="col-lg-3 col-md-6">
              <div className="dashboard-card dashboard-card-green">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="dashboard-card-label">Atendimentos Hoje</div>
                  <div className="dashboard-card-icon-bg">
                    <i className="bi bi-headset dashboard-card-icon"></i>
                  </div>
                </div>
                <div className="dashboard-card-value h1 fw-bold mb-2">
                  {loadingStats ? '...' : stats.atendimentosHoje}
                </div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge">
                    <i className="bi bi-plus-circle dashboard-card-badge-icon"></i>
                    {loadingStats ? '...' : 'novos'}
                  </span>
                  <span className="dashboard-card-info-text">Atendimentos criados</span>
                </div>
              </div>
            </div>
            {/* Card Tempo Médio */}
            <div className="col-lg-3 col-md-6">
              <div className="dashboard-card dashboard-card-purple">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="dashboard-card-label">Tempo Médio</div>
                  <div className="dashboard-card-icon-bg">
                    <i className="bi bi-clock-history dashboard-card-icon"></i>
                  </div>
                </div>
                <div className="dashboard-card-value h1 fw-bold mb-2">
                  {loadingStats ? '...' : stats.tempoMedio}
                </div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge">
                    <i className="bi bi-clock dashboard-card-badge-icon"></i>
                    {loadingStats ? '...' : 'médio'}
                  </span>
                  <span className="dashboard-card-info-text">Tempo de atendimento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </>
);
}
