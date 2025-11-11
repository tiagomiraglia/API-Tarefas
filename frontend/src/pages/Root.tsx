import React, { useEffect, useState } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import EmpresasList from '../components/EmpresasList';
import UsuariosList from '../components/UsuariosList';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PerfilModal from '../components/PerfilModal';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { showToast } from '../utils/toast';
import { api } from '../services/api';

export default function Root() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
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
      const res = await api.get('/usuarios');
      const data = res.data;
      setUsuarios((data.users || []).map((u: any) => ({
        ...u,
        empresaNome: u.empresa_nome || ''
      })));
    } catch {}
  };

  // Handlers de ação para empresas
  async function handleEditEmpresa(empresa: any) {
    const novoNome = prompt('Novo nome da empresa:', empresa.nome);
    if (!novoNome || novoNome.trim() === empresa.nome) return;
    try {
      const res = await api.put(`/empresas/${empresa.id}`, { nome: novoNome, cnpj: empresa.cnpj });
      setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, nome: novoNome } : e));
      showToast('Empresa editada com sucesso!', 'success');
    } catch {
      showToast('Erro ao editar empresa.', 'error');
    }
  }

  async function handleSuspendEmpresa(empresa: any) {
    if (!window.confirm(`Suspender a empresa ${empresa.nome}?`)) return;
    try {
      await api.patch(`/empresas/${empresa.id}/suspender`);
      setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, status: 'suspenso' } : e));
      showToast('Empresa suspensa com sucesso!', 'success');
    } catch {
      showToast('Erro ao suspender empresa.', 'error');
    }
  }

  async function handleReactivateEmpresa(empresa: any) {
    if (!window.confirm(`Reativar a empresa ${empresa.nome}?`)) return;
    try {
      await api.patch(`/empresas/${empresa.id}/reativar`);
      setEmpresas((es: any[]) => es.map((e: any) => e.id === empresa.id ? { ...e, status: 'ativo' } : e));
      showToast('Empresa reativada com sucesso!', 'success');
    } catch {
      showToast('Erro ao reativar empresa.', 'error');
    }
  }

  async function handleDeleteEmpresa(empresa: any) {
    if (!window.confirm(`Tem certeza que deseja excluir a empresa ${empresa.nome}?`)) return;
    try {
      await api.delete(`/empresas/${empresa.id}`);
      setEmpresas((es: any[]) => es.filter((e: any) => e.id !== empresa.id));
      showToast('Empresa excluída com sucesso!', 'success');
    } catch {
      showToast('Erro ao excluir empresa.', 'error');
    }
  }
  async function handleReactivateUsuario(usuario: any) {
    if (!window.confirm(`Reativar o usuário ${usuario.nome}?`)) return;
    try {
      await api.patch(`/usuarios/${usuario.id}/reativar`);
      showToast('Usuário reativado com sucesso!', 'success');
      await fetchUsuarios();
    } catch {
      showToast('Erro ao reativar usuário.', 'error');
    }
  }
  // Handlers de ação para usuários
  async function handleEditUsuario(usuario: any) {
    setUsuarioEditando(usuario);
    setShowModalEditarUsuario(true);
  }

  async function handleSaveEditUsuario(id: number, nome: string, email: string) {
    try {
      await api.put(`/usuarios/${id}`, { nome, email });
      showToast('Usuário editado com sucesso!', 'success');
      setShowModalEditarUsuario(false);
      setUsuarioEditando(null);
      await fetchUsuarios();
    } catch {
      showToast('Erro ao editar usuário.', 'error');
    }
  }

  async function handleSuspendUsuario(usuario: any) {
    if (!window.confirm(`Suspender o usuário ${usuario.nome}?`)) return;
    try {
      await api.patch(`/usuarios/${usuario.id}/suspender`);
      showToast('Usuário suspenso com sucesso!', 'success');
      await fetchUsuarios();
    } catch {
      showToast('Erro ao suspender usuário.', 'error');
    }
  }

  async function handleDeleteUsuario(usuario: any) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return;
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      showToast('Usuário excluído com sucesso!', 'success');
      await fetchUsuarios();
    } catch {
      showToast('Erro ao excluir usuário.', 'error');
    }
  }

  // Buscar dados reais do backend ao selecionar tab
  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const res = await api.get('/empresas');
        const data = res.data;
        setEmpresas(data.empresas || []);
      } catch {}
    }
    if (tab === 'empresas') fetchEmpresas();
    if (tab === 'usuarios') fetchUsuarios();
  }, [tab]);

  useEffect(() => {
    async function fetchRoot() {
      setErro('');
      try {
        const res = await api.get('/root');
        const data = res.data;
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

  // Atualiza rootData após salvar perfil
  async function handlePerfilModalClose() {
    setShowPerfil(false);
    // Recarrega dados do usuário para atualizar foto
    try {
      const res = await api.get('/root');
      const data = res.data;
      setRootData(data);
    } catch {}
  }

  return (
    <>
      <Navbar 
        userName={rootData?.user?.nome} 
        userFoto={rootData?.user?.foto} 
        onPerfilClick={handlePerfilMenu}
        activeTab={tab}
        onTabChange={setTab}
      />
  <PerfilModal user={rootData?.user} show={showPerfil} onClose={handlePerfilModalClose} />
      <div className="root-content">
        <div className="root-content-inner">
          <div className="root-card">
            <h2 className="mb-4 text-center fw-bold root-title">
              <i className="bi bi-shield-lock me-2 root-title-icon"></i>Root
            </h2>
              {erro && (
                <div className="alert text-center mb-4 root-error">
                  {erro}
                </div>
              )}
              {rootData ? (
                <>
                  {/* Saudação removida para evitar duplicidade de nome na tela. */}
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
                        <div className="root-dashboard-card">
                          <div className="card-body text-center root-dashboard-card-body">
                            <i className="bi bi-person-check fs-2 mb-3 root-dashboard-icon"></i>
                            <h6 className="fw-bold mb-3 root-dashboard-label">
                              Novos Usuários (mês)
                            </h6>
                            <div className="display-6 mb-2 root-dashboard-value">
                              --
                            </div>
                            <div className="root-dashboard-soon">Em breve</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="root-dashboard-card">
                          <div className="card-body text-center root-dashboard-card-body">
                            <i className="bi bi-building-add fs-2 mb-3 root-dashboard-icon root-dashboard-icon-orange"></i>
                            <h6 className="fw-bold mb-3 root-dashboard-label">
                              Novas Empresas (mês)
                            </h6>
                            <div className="display-6 root-dashboard-value root-dashboard-value-orange">
                              {rootData?.stats?.novasEmpresasMes ?? '--'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="root-dashboard-card">
                          <div className="card-body text-center root-dashboard-card-body">
                            <i className="bi bi-cash-coin fs-2 mb-3 root-dashboard-icon root-dashboard-icon-green"></i>
                            <h6 className="fw-bold mb-3 root-dashboard-label">
                              Faturamento (mês)
                            </h6>
                            <div className="display-6 mb-2 root-dashboard-value root-dashboard-value-green">
                              --
                            </div>
                            <div className="root-dashboard-soon root-dashboard-soon-green">Em breve</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {tab === 'estatisticas' && (
                    <div className="text-center py-5">
                      <span className="root-muted">Estatísticas globais em breve...</span>
                    </div>
                  )}
                  {tab === 'configuracoes' && (
                    <div className="text-center py-5">
                      <span className="root-muted">Configurações do sistema em breve...</span>
                    </div>
                  )}
                </>
              ) : !erro && (
                <div className="text-center py-5">
                  <span className="spinner-border root-spinner"></span>
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
