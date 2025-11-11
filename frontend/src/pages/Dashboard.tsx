import NavbarAdmin from '../components/NavbarAdmin';
import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';
import { api } from '../services/api';
import UsuariosList from '../components/UsuariosList';

interface UsuarioTime {
  id: number;
  nome: string;
  email: string;
  suspenso?: boolean;
  empresaNome: string;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<UsuarioTime[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenUserMenu(false);
      }
    }
    if (openUserMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openUserMenu]);

  async function fetchUsuarios() {
    setLoadingUsuarios(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data.users || []);
    } finally {
      setLoadingUsuarios(false);
    }
  }

  async function handleSuspendUsuario(usuario: UsuarioTime) {
    if (window.confirm(`Deseja realmente suspender ${usuario.nome}?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/usuarios/${usuario.id}/suspender`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Usuário suspenso com sucesso!', 'success');
          await fetchUsuarios();
        } else {
          const err = await res.json();
          showToast(err.message || 'Erro ao suspender usuário', 'error');
        }
      } catch {
        showToast('Erro de conexão', 'error');
      }
    }
  }

  async function handleReactivateUsuario(usuario: UsuarioTime) {
    if (window.confirm(`Deseja realmente reativar ${usuario.nome}?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/usuarios/${usuario.id}/reativar`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Usuário reativado com sucesso!', 'success');
          await fetchUsuarios();
        } else {
          const err = await res.json();
          showToast(err.message || 'Erro ao reativar usuário', 'error');
        }
      } catch {
        showToast('Erro de conexão', 'error');
      }
    }
  }

  async function handleDelete(usuario: UsuarioTime) {
    if (window.confirm(`Excluir ${usuario.nome}? Esta ação é irreversível.`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/usuarios/${usuario.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Usuário excluído', 'success');
          setUsuarios(us => us.filter(u => u.id !== usuario.id));
        } else {
          const err = await res.json();
          showToast(err.message || 'Erro ao excluir usuário', 'error');
        }
      } catch {
        showToast('Erro de conexão', 'error');
      }
    }
  }

  useEffect(() => {
    fetchUsuarios();
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
    return () => {};
  }, []);

  return (
    <>
      <NavbarAdmin user={usuario} />
      <div className="dashboard-bg">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header mb-5">
            <h1 className="dashboard-title fw-bold mb-2">Dashboard Administrativo</h1>
            <p className="dashboard-desc">Visão geral e gerenciamento do sistema</p>
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
                <div className="dashboard-card-value h1 fw-bold mb-2">--</div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge dashboard-card-badge-info">Em breve</span>
                </div>
              </div>
            </div>
            {/* Card Atendimentos */}
            <div className="col-lg-3 col-md-6">
              <div className="dashboard-card dashboard-card-green">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="dashboard-card-label">Atendimentos</div>
                  <div className="dashboard-card-icon-bg">
                    <i className="bi bi-headset dashboard-card-icon"></i>
                  </div>
                </div>
                <div className="dashboard-card-value h1 fw-bold mb-2">--</div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge dashboard-card-badge-info">Em breve</span>
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
                <div className="dashboard-card-value h1 fw-bold mb-2">--</div>
                <div className="dashboard-card-info">
                  <span className="dashboard-card-badge dashboard-card-badge-info">Em breve</span>
                </div>
              </div>
            </div>
          </div>
          {/* Users Table */}
          <div className="dashboard-users-table">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h5 className="dashboard-users-title fw-bold mb-1">
                  <i className="bi bi-people me-2 dashboard-users-title-icon"></i>
                  Gerenciar Usuários
                </h5>
                <p className="dashboard-users-desc">
                  Adicione e gerencie os usuários da sua equipe
                </p>
              </div>
            </div>
            <UsuariosList 
              usuarios={usuarios}
              onSuspend={handleSuspendUsuario}
              onReactivate={handleReactivateUsuario}
              onDelete={handleDelete} 
            />
            {loadingUsuarios && <div className="dashboard-users-loading text-center mt-3">Carregando usuários...</div>}
          </div>
        </div>
      </div>
  </>
);
}
