import TeamUserForm from '../components/TeamUserForm';
import { useState, useEffect, useRef } from 'react';
import ListaUsuarios, { UsuarioTime } from '../components/ListaUsuarios';
import ConfirmModal from '../components/ConfirmModal';
import { showToast } from '../utils/toast';
import KanbanAdmin from '../components/KanbanAdmin';
import KanbanMonitoramento from '../components/KanbanMonitoramento';
import WhatsAppIntegration from '../components/WhatsAppIntegration';
import Modal from '../components/Modal';
import ModalPermissoesKanban from '../components/ModalPermissoesKanban';
// import removido: WhatsAppAdminConnection
import WhatsappBaileysCard from '../components/WhatsappBaileysCard';
import UserAvatar from '../components/UserAvatar';
import AvisoForm from '../components/AvisoForm';
import AvisosList from '../components/AvisosList';
import AvisoAtivoModal from '../components/AvisoAtivoModal';
import useAvisoAtivoCount from '../components/useAvisoAtivoCount';
import { Aviso } from '../components/AvisosList';
import ModalEditarUsuario from '../components/ModalEditarUsuario';

export default function Dashboard() {
  const nome = localStorage.getItem('nome') || 'Usuário';
  const userFoto = localStorage.getItem('foto');
  const nivel = localStorage.getItem('nivel') || 'user';
  const avisoAtivoCount = useAvisoAtivoCount();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioTime[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    message: string;
    title?: string;
    onConfirm: () => void;
  }>({ show: false, message: '', title: '', onConfirm: () => {} });
  const [showKanban, setShowKanban] = useState(false);
  const [showMonitoramento, setShowMonitoramento] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<UsuarioTime|null>(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [showAvisos, setShowAvisos] = useState(false);
  const [showAvisoAtivo, setShowAvisoAtivo] = useState(false);
  const [editAviso, setEditAviso] = useState<Aviso | null>(null);
  const [refreshAvisos, setRefreshAvisos] = useState(0);
  const [showModalEditarUsuario, setShowModalEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.users || []);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  }

  async function handleAddUser(data: { nome: string; email: string; permissoes: any }) {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/usuarios/time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          permissoes: data.permissoes
        })
      });
      if (res.ok) {
        showToast('Convite enviado para o usuário!', 'success');
        setShowForm(false);
        fetchUsuarios();
      } else {
        const err = await res.json();
        showToast(err.message || 'Erro ao adicionar usuário.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao adicionar usuário.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleEditUsuario(usuario: any) {
    setUsuarioEditando(usuario);
    setShowModalEditarUsuario(true);
  }

  async function handleSaveEditUsuario(id: number, nome: string, email: string) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email })
      });
      if (res.ok) {
        showToast('Usuário atualizado com sucesso!', 'success');
        setShowModalEditarUsuario(false);
        setUsuarioEditando(null);
        await fetchUsuarios();
      } else {
        const err = await res.json();
        showToast(err.message || 'Erro ao atualizar usuário', 'error');
      }
    } catch {
      showToast('Erro de conexão ao atualizar usuário', 'error');
    }
  }

  function handleSuspendUsuario(usuario: UsuarioTime) {
    setConfirmModal({
      show: true,
      title: 'Confirmação',
      message: `Deseja realmente suspender ${usuario.nome}?`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, show: false }));
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
    });
  }

  function handleReactivateUsuario(usuario: UsuarioTime) {
    setConfirmModal({
      show: true,
      title: 'Confirmação',
      message: `Deseja realmente reativar ${usuario.nome}?`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, show: false }));
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
    });
  }

  function handleDelete(usuario: UsuarioTime) {
    setConfirmModal({
      show: true,
      title: 'Excluir usuário',
      message: `Excluir ${usuario.nome}? Esta ação é irreversível.`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, show: false }));
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
    });
  }

  function handleEditarPermissoes(usuario: UsuarioTime) {
    setUsuarioPermissoes(usuario);
  }

  useEffect(() => {
    fetchUsuarios();
    // Aplica estilo dark
    document.body.style.background = '#0f172a';
    document.body.style.minHeight = '100vh';
    return () => {
      document.body.style.background = '';
      document.body.style.minHeight = '';
    };
  }, []);

  return (
    <>
      <div style={{ display: 'flex', background: '#0f172a', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ 
          width: '280px', 
          background: '#1e293b', 
          borderRight: '1px solid #334155',
          padding: '1.5rem 1rem',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Logo/Brand */}
          <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #334155' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-lightning-charge-fill" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <div className="fw-bold" style={{ color: '#f8fafc', fontSize: '1.1rem' }}>Nynch</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Dashboard Admin</div>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="mb-4 pb-3 position-relative" style={{ borderBottom: '1px solid #334155' }} ref={menuRef}>
            <button
              className="btn w-100 p-0 border-0 text-start d-flex align-items-center gap-2"
              onClick={() => setOpenUserMenu(o => !o)}
              style={{ background: 'transparent' }}
            >
              <UserAvatar name={nome} foto={typeof userFoto === 'string' ? userFoto : undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fw-semibold text-truncate" style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{nome}</div>
                <div className="text-truncate" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {nivel === 'superuser' ? 'Superusuário' : nivel === 'admin' ? 'Administrador' : 'Usuário'}
                </div>
              </div>
              <i className={`bi ${openUserMenu ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#cbd5e1' }}></i>
            </button>

            {openUserMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #334155',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <a href="/configuracoes" className="d-block px-3 py-2" style={{ 
                  color: '#cbd5e1', 
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}>
                  <i className="bi bi-gear me-2"></i>Configurações
                </a>
                <div style={{ height: '1px', background: '#334155', margin: '0.25rem 0' }}></div>
                <a href="/logout" className="d-block px-3 py-2" style={{ 
                  color: '#ef4444', 
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#334155';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}>
                  <i className="bi bi-box-arrow-right me-2"></i>Sair
                </a>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="mb-4">
            <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
              Navegação
            </div>
            
            <button 
              className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
              style={{ 
                background: '#f9731620',
                color: '#f97316',
                border: '1px solid #f97316',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontWeight: '500'
              }}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </button>

            <button 
              className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
              onClick={() => setShowForm(true)}
              style={{ 
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <i className="bi bi-person-plus"></i>
              <span>Adicionar Usuário</span>
            </button>

            <button 
              className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
              onClick={() => setShowKanban(true)}
              style={{ 
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <i className="bi bi-kanban"></i>
              <span>Gerenciar Kanban</span>
            </button>

            <button 
              className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
              onClick={() => setShowMonitoramento(true)}
              style={{ 
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <i className="bi bi-graph-up-arrow"></i>
              <span>Monitoramento Kanban</span>
            </button>

            <button 
              className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
              onClick={() => setShowWhatsApp(true)}
              style={{ 
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <i className="bi bi-whatsapp"></i>
              <span>WhatsApp Kanban</span>
            </button>

            {/* Avisos */}
            {nivel === 'superuser' ? (
              <button 
                className="btn w-100 text-start mb-2 d-flex align-items-center gap-2"
                onClick={() => setShowAvisos(true)}
                style={{ 
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <i className="bi bi-exclamation-triangle"></i>
                <span>Avisos Globais</span>
              </button>
            ) : (
              <button 
                className={`btn w-100 text-start mb-2 d-flex align-items-center gap-2 position-relative`}
                onClick={() => {
                  setShowAvisoAtivo(true);
                  setTimeout(() => { if (window.atualizarAvisoAtivoCount) window.atualizarAvisoAtivoCount(); }, 300);
                }}
                style={{ 
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <i className="bi bi-envelope-paper"></i>
                <span>Avisos</span>
                {avisoAtivoCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '0.125rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {avisoAtivoCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Metrics */}
          <div className="mt-auto pt-4" style={{ borderTop: '1px solid #334155' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
              Métricas Rápidas
            </div>
            <div className="mb-3 px-2">
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Usuários</div>
              <div className="h4 fw-bold mb-0" style={{ color: '#f97316' }}>{usuarios.length}</div>
            </div>
            <div className="mb-3 px-2">
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Mensagens</div>
              <div className="h5 fw-bold mb-0" style={{ color: '#3b82f6' }}>--</div>
            </div>
            <div className="mb-3 px-2">
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Atendimentos</div>
              <div className="h5 fw-bold mb-0" style={{ color: '#16a34a' }}>--</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '2.5rem 3rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className="mb-5">
              <h1 className="fw-bold mb-2" style={{ color: '#f8fafc', fontSize: '2.25rem', letterSpacing: '-0.02em' }}>
                Dashboard Administrativo
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Visão geral e gerenciamento do sistema</p>
            </div>

            {/* Stats Grid */}
            <div className="row g-4 mb-5">
              {/* Card Usuários */}
              <div className="col-lg-3 col-md-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                  borderRadius: '20px', 
                  padding: '2rem',
                  boxShadow: '0 8px 16px rgba(249, 115, 22, 0.2)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(249, 115, 22, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(249, 115, 22, 0.2)';
                }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Usuários Ativos
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      borderRadius: '14px', 
                      width: '56px', 
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="bi bi-people" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <div className="h1 fw-bold mb-2" style={{ color: '#fff', fontSize: '2.5rem' }}>{usuarios.length}</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      <i className="bi bi-arrow-up me-1"></i>100%
                    </span>
                    <span>No seu time</span>
                  </div>
                </div>
              </div>

              {/* Card Mensagens */}
              <div className="col-lg-3 col-md-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  borderRadius: '20px', 
                  padding: '2rem',
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
                }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mensagens Hoje
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      borderRadius: '14px', 
                      width: '56px', 
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="bi bi-chat-dots" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <div className="h1 fw-bold mb-2" style={{ color: '#fff', fontSize: '2.5rem' }}>--</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Em breve
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Atendimentos */}
              <div className="col-lg-3 col-md-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                  borderRadius: '20px', 
                  padding: '2rem',
                  boxShadow: '0 8px 16px rgba(22, 163, 74, 0.2)',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(22, 163, 74, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(22, 163, 74, 0.2)';
                }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Atendimentos
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      borderRadius: '14px', 
                      width: '56px', 
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="bi bi-headset" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <div className="h1 fw-bold mb-2" style={{ color: '#fff', fontSize: '2.5rem' }}>--</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Em breve
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Tempo Médio */}
              <div className="col-lg-3 col-md-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                  borderRadius: '20px', 
                  padding: '2rem',
                  boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.2)';
                }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Tempo Médio
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      borderRadius: '14px', 
                      width: '56px', 
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <i className="bi bi-clock-history" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <div className="h1 fw-bold mb-2" style={{ color: '#fff', fontSize: '2.5rem' }}>--</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Em breve
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Connection removido */}

            {/* WhatsApp Multi-Session Management */}
            <div className="mb-5">
              <WhatsappBaileysCard />
            </div>

            {/* Users Table */}
            <div style={{ 
              background: '#1e293b', 
              borderRadius: '24px', 
              padding: '2.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              border: '1px solid #334155'
            }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#f8fafc', fontSize: '1.5rem' }}>
                    <i className="bi bi-people me-2" style={{ color: '#f97316' }}></i>
                    Gerenciar Usuários
                  </h5>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 0 }}>
                    Adicione e gerencie os usuários da sua equipe
                  </p>
                </div>
                <button 
                  className="btn"
                  onClick={() => setShowForm(true)}
                  style={{ 
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>Novo Usuário
                </button>
              </div>
              <ListaUsuarios 
                usuarios={usuarios}
                onEdit={handleEditUsuario}
                onEditarPermissoes={handleEditarPermissoes} 
                onSuspender={(usuario) => {
                  if (usuario.suspenso) {
                    handleReactivateUsuario(usuario);
                  } else {
                    handleSuspendUsuario(usuario);
                  }
                }} 
                onDelete={handleDelete} 
              />
              {loadingUsuarios && <div className="text-center mt-3" style={{ color: '#cbd5e1' }}>Carregando usuários...</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal show={showKanban} onClose={() => setShowKanban(false)} title="Gerenciar Kanban" size="lg">
        <KanbanAdmin token={localStorage.getItem('token') || ''} empresaId={localStorage.getItem('empresa_id') ? Number(localStorage.getItem('empresa_id')) : undefined} />
      </Modal>

      <Modal show={showMonitoramento} onClose={() => setShowMonitoramento(false)} title="Monitoramento Inteligente" size="xl">
        <KanbanMonitoramento />
      </Modal>

      <Modal show={showWhatsApp} onClose={() => setShowWhatsApp(false)} title="WhatsApp Kanban" size="xl">
        <WhatsAppIntegration />
      </Modal>

      {showForm && (
        <TeamUserForm onSubmit={handleAddUser} onClose={() => setShowForm(false)} loading={loading} />
      )}

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onCancel={() => setConfirmModal(m => ({ ...m, show: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      {/* Modal Avisos Globais (superusuário) */}
      {nivel === 'superuser' && (
        <Modal show={showAvisos} onClose={() => { setShowAvisos(false); setEditAviso(null); }} title="Avisos Globais" size="lg">
          <div className="mb-4">
            <AvisoForm
              key={editAviso ? editAviso.id : 'novo'}
              aviso={editAviso}
              onSaved={() => { setEditAviso(null); setRefreshAvisos(r => r + 1); }}
              onCancel={() => setEditAviso(null)}
            />
          </div>
          <AvisosList
            refresh={refreshAvisos}
            onEdit={(aviso: Aviso) => setEditAviso(aviso)}
            onSuspend={async (aviso: Aviso) => {
              if (!window.confirm('Suspender este aviso?')) return;
              const token = localStorage.getItem('token');
              await fetch(`/api/avisos/${aviso.id}/suspender`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
              });
              setRefreshAvisos(r => r + 1);
            }}
            onDelete={async (aviso: Aviso) => {
              if (!window.confirm('Excluir este aviso?')) return;
              const token = localStorage.getItem('token');
              await fetch(`/api/avisos/${aviso.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              setRefreshAvisos(r => r + 1);
            }}
          />
        </Modal>
      )}

      {/* Modal Aviso Ativo (usuários) */}
      {nivel !== 'superuser' && (
        <AvisoAtivoModal show={showAvisoAtivo} onClose={() => setShowAvisoAtivo(false)} />
      )}

      {/* Modal Editar Usuário */}
      <ModalEditarUsuario
        show={showModalEditarUsuario}
        usuario={usuarioEditando}
        onSave={handleSaveEditUsuario}
        onClose={() => {
          setShowModalEditarUsuario(false);
          setUsuarioEditando(null);
        }}
      />

      {/* Modal Permissões Kanban */}
      {usuarioPermissoes && (
        <ModalPermissoesKanban
          show={!!usuarioPermissoes}
          usuarioId={usuarioPermissoes.id}
          usuarioNome={usuarioPermissoes.nome}
          empresaId={Number(localStorage.getItem('empresa_id'))}
          onClose={() => setUsuarioPermissoes(null)}
          onRefresh={() => fetchUsuarios()}
        />
      )}
    </>
  );
}
