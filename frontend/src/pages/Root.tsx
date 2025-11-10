import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmpresasList from '../components/EmpresasList';
import UsuariosList from '../components/UsuariosList';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PerfilModal from '../components/PerfilModal';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { showToast } from '../utils/toast';

export default function Root() {
  const navigate = useNavigate();
  
  // Estados
  const [rootData, setRootData] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [showPerfil, setShowPerfil] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'estatisticas' | 'configuracoes' | 'empresas' | 'usuarios'>('dashboard');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showModalEditarUsuario, setShowModalEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);

  // Função global para buscar usuários
  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios((data.users || []).map((u: any) => ({
          ...u,
          empresaNome: u.empresa_nome || ''
        })));
      }
    } catch {}
  };

  // Handlers de ação para empresas
  async function handleEditEmpresa(empresa: any) {
    const novoNome = prompt('Novo nome da empresa:', empresa.nome);
    if (!novoNome || novoNome.trim() === empresa.nome) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome: novoNome, cnpj: empresa.cnpj })
      });
      if (res.ok) {
        setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, nome: novoNome } : e));
        showToast('Empresa editada com sucesso!', 'success');
      } else {
        showToast('Erro ao editar empresa.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao editar empresa.', 'error');
    }
  }

  async function handleSuspendEmpresa(empresa: any) {
    if (!window.confirm(`Suspender a empresa ${empresa.nome}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${empresa.id}/suspender`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, status: 'suspenso' } : e));
        showToast('Empresa suspensa com sucesso!', 'success');
      } else {
        showToast('Erro ao suspender empresa.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao suspender empresa.', 'error');
    }
  }

  async function handleReactivateEmpresa(empresa: any) {
    if (!window.confirm(`Reativar a empresa ${empresa.nome}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${empresa.id}/reativar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, status: 'ativo' } : e));
        showToast('Empresa reativada com sucesso!', 'success');
      } else {
        showToast('Erro ao reativar empresa.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao reativar empresa.', 'error');
    }
  }

  async function handleDeleteEmpresa(empresa: any) {
    if (!window.confirm(`Tem certeza que deseja excluir a empresa ${empresa.nome}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmpresas((es: any[]) => es.filter((e: any) => e.id !== empresa.id));
        showToast('Empresa excluída com sucesso!', 'success');
      } else {
        showToast('Erro ao excluir empresa.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao excluir empresa.', 'error');
    }
  }
  async function handleReactivateUsuario(usuario: any) {
    if (!window.confirm(`Reativar o usuário ${usuario.nome}?`)) return;
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
        showToast('Erro ao reativar usuário.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao reativar usuário.', 'error');
    }
  }
  // Handlers de ação para usuários
  async function handleEditUsuario(usuario: any) {
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
        showToast('Usuário editado com sucesso!', 'success');
        setShowModalEditarUsuario(false);
        setUsuarioEditando(null);
        await fetchUsuarios();
      } else {
        showToast('Erro ao editar usuário.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao editar usuário.', 'error');
    }
  }

  async function handleSuspendUsuario(usuario: any) {
    if (!window.confirm(`Suspender o usuário ${usuario.nome}?`)) return;
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
        showToast('Erro ao suspender usuário.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao suspender usuário.', 'error');
    }
  }

  async function handleDeleteUsuario(usuario: any) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Usuário excluído com sucesso!', 'success');
        await fetchUsuarios();
      } else {
        showToast('Erro ao excluir usuário.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao excluir usuário.', 'error');
    }
  }

  // Buscar dados reais do backend ao selecionar tab
  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/empresas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEmpresas(data.empresas || []);
        }
      } catch {}
    }
    if (tab === 'empresas') fetchEmpresas();
    if (tab === 'usuarios') fetchUsuarios();
  }, [tab]);

  useEffect(() => {
    async function fetchRoot() {
      setErro('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/root', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          setErro('Acesso negado ou sessão expirada.');
          navigate('/dashboard-admin');
          return;
        }
        const data = await res.json();
        if (!data?.user?.is_superuser) {
          navigate('/dashboard-admin');
          return;
        }
        setRootData(data);
      } catch (err) {
        setErro('Erro ao buscar dados do painel root.');
        navigate('/dashboard-admin');
      }
    }
    fetchRoot();
  }, [navigate]);

  // Handler para abrir modal ao clicar em Meu Perfil
  function handlePerfilMenu(e: any) {
    e.preventDefault();
    setShowPerfil(true);
  }

  return (
    <>
      <Navbar userName={rootData?.user?.nome} userFoto={rootData?.user?.foto} onPerfilClick={handlePerfilMenu} />
      <Sidebar active="/root" onTabChange={setTab} />
      <PerfilModal user={rootData?.user} show={showPerfil} onClose={() => setShowPerfil(false)} />
      <div style={{ 
        position: 'fixed',
        top: 56,
        left: 220,
        right: 0,
        bottom: 0,
        background: '#0f1115',
        overflow: 'auto'
      }}>
        <div style={{ padding: '2rem', minHeight: '100%' }}>
          <div style={{ 
            background: '#1a1d29', 
            border: '1px solid #2d3142',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            padding: '2rem'
          }}>
            <h2 className="mb-4 text-center fw-bold" style={{ color: '#f8fafc' }}>
              <i className="bi bi-shield-lock me-2" style={{ color: '#f97316' }}></i>Root
            </h2>
              {erro && (
                <div 
                  className="alert text-center mb-4" 
                  style={{ 
                    background: '#ef444420', 
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '8px'
                  }}
                >
                  {erro}
                </div>
              )}
              {rootData ? (
                <>
                  <p className="text-center mb-4" style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                    Bem-vindo, <b style={{ color: '#f8fafc' }}>{rootData.user?.nome || 'superusuário'}</b>!<br />
                    Você tem visão global e controle total do sistema SaaS.
                  </p>
                  {/* Dropdown Clientes removido */}
                  {/* Formulário de aviso global removido daqui, agora só no painel de avisos do Navbar */}
                  {tab === 'empresas' && (
                    <EmpresasList
                      empresas={empresas}
                      onEdit={handleEditEmpresa}
                      onSuspend={handleSuspendEmpresa}
                      onReactivate={handleReactivateEmpresa}
                      onDelete={handleDeleteEmpresa}
                    />
                  )}
                  {tab === 'usuarios' && (
                    <UsuariosList
                      usuarios={usuarios}
                      onEdit={handleEditUsuario}
                      onSuspend={handleSuspendUsuario}
                      onReactivate={handleReactivateUsuario}
                      onDelete={handleDeleteUsuario}
                    />
                  )}
                  {tab === 'dashboard' && (
                    <div className="row g-4">
                      <div className="col-md-4">
                        <div 
                          className="card border-0 h-100" 
                          style={{ 
                            background: '#0f1115',
                            border: '1px solid #2d3142',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                          }}
                        >
                          <div className="card-body text-center" style={{ padding: '2rem' }}>
                            <i className="bi bi-person-check fs-2 mb-3" style={{ color: '#3b82f6', display: 'block' }}></i>
                            <h6 className="fw-bold mb-3" style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                              Novos Usuários (mês)
                            </h6>
                            <div className="display-6 mb-2" style={{ color: '#3b82f6', fontWeight: 700 }}>
                              --
                            </div>
                            <div style={{ 
                              color: '#64748b', 
                              fontSize: '0.875rem',
                              background: '#3b82f620',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              Em breve
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div 
                          className="card border-0 h-100" 
                          style={{ 
                            background: '#0f1115',
                            border: '1px solid #2d3142',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                          }}
                        >
                          <div className="card-body text-center" style={{ padding: '2rem' }}>
                            <i className="bi bi-building-add fs-2 mb-3" style={{ color: '#f97316', display: 'block' }}></i>
                            <h6 className="fw-bold mb-3" style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                              Novas Empresas (mês)
                            </h6>
                            <div className="display-6" style={{ color: '#f97316', fontWeight: 700 }}>
                              {rootData?.stats?.novasEmpresasMes ?? '--'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div 
                          className="card border-0 h-100" 
                          style={{ 
                            background: '#0f1115',
                            border: '1px solid #2d3142',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                          }}
                        >
                          <div className="card-body text-center" style={{ padding: '2rem' }}>
                            <i className="bi bi-cash-coin fs-2 mb-3" style={{ color: '#16a34a', display: 'block' }}></i>
                            <h6 className="fw-bold mb-3" style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                              Faturamento (mês)
                            </h6>
                            <div className="display-6 mb-2" style={{ color: '#16a34a', fontWeight: 700 }}>
                              --
                            </div>
                            <div style={{ 
                              color: '#64748b', 
                              fontSize: '0.875rem',
                              background: '#16a34a20',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              Em breve
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {tab === 'estatisticas' && (
                    <div className="text-center py-5">
                      <span style={{ color: '#64748b', fontSize: '1rem' }}>Estatísticas globais em breve...</span>
                    </div>
                  )}
                  {tab === 'configuracoes' && (
                    <div className="text-center py-5">
                      <span style={{ color: '#64748b', fontSize: '1rem' }}>Configurações do sistema em breve...</span>
                    </div>
                  )}
                </>
              ) : !erro && (
                <div className="text-center py-5">
                  <span className="spinner-border" style={{ color: '#f97316' }}></span>
                </div>
              )}
          </div>
        </div>
      </div>

      <ModalEditarUsuario
        show={showModalEditarUsuario}
        usuario={usuarioEditando}
        onClose={() => {
          setShowModalEditarUsuario(false);
          setUsuarioEditando(null);
        }}
        onSave={handleSaveEditUsuario}
      />
    </>
  );
}
