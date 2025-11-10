import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Coluna {
  id: number;
  nome: string;
  ordem: number;
  recebe_whats: boolean;
  _count: {
    cartoes: number;
  };
}

interface Aba {
  id: number;
  nome: string;
  ordem: number;
  colunas: Coluna[];
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto: string | null;
  nivel: string;
  permissoesKanban: {
    abas: Array<{
      id: number;
      colunas: number[];
    }>;
  };
}

interface Estatisticas {
  totalAbas: number;
  totalColunas: number;
  totalCartoes: number;
  totalUsuarios: number;
  usuariosComAcesso: number;
}

interface MonitoramentoData {
  estrutura: Aba[];
  usuarios: Usuario[];
  estatisticas: Estatisticas;
}

export default function KanbanMonitoramento() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [data, setData] = useState<MonitoramentoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [abaExpandida, setAbaExpandida] = useState<number | null>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);

  useEffect(() => {
    fetchMonitoramento();
  }, []);

  async function fetchMonitoramento() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/kanban/monitoramento`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const responseData = await res.json();
        setData(responseData);
      } else {
        showToast('Erro ao carregar monitoramento', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar monitoramento:', error);
      showToast('Erro de conexão', 'error');
    } finally {
      setLoading(false);
    }
  }

  function getUsuariosComAcessoAba(abaId: number): Usuario[] {
    if (!data) return [];
    return data.usuarios.filter(usuario => {
      // Admin/superadmin tem acesso total
      if (usuario.nivel === 'admin' || usuario.nivel === 'superadmin') return true;
      // Verifica se tem permissão específica para a aba
      return usuario.permissoesKanban.abas?.some(aba => aba.id === abaId);
    });
  }

  function getUsuariosComAcessoColuna(abaId: number, colunaId: number): Usuario[] {
    if (!data) return [];
    return data.usuarios.filter(usuario => {
      // Admin/superadmin tem acesso total
      if (usuario.nivel === 'admin' || usuario.nivel === 'superadmin') return true;
      // Verifica se tem permissão específica para a coluna
      const abaPermissao = usuario.permissoesKanban.abas?.find(aba => aba.id === abaId);
      if (!abaPermissao) return false;
      // Se colunas vazio, tem acesso a todas as colunas da aba
      if (!abaPermissao.colunas || abaPermissao.colunas.length === 0) return true;
      // Verifica se tem acesso específico à coluna
      return abaPermissao.colunas.includes(colunaId);
    });
  }

  function getPermissoesUsuario(usuario: Usuario) {
    if (usuario.nivel === 'admin' || usuario.nivel === 'superadmin') {
      return 'Acesso Total';
    }
    const totalAbas = usuario.permissoesKanban.abas?.length || 0;
    if (totalAbas === 0) return 'Sem acesso';
    return `${totalAbas} aba${totalAbas > 1 ? 's' : ''}`;
  }

  if (loading && !data) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        background: '#1a1d29',
        borderRadius: '16px'
      }}>
        <div className="spinner-border" style={{ color: '#f97316' }} role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const usuarioFiltrado = usuarioSelecionado 
    ? data.usuarios.find(u => u.id === usuarioSelecionado)
    : null;

  return (
    <div style={{ 
      background: '#1a1d29', 
      borderRadius: '16px', 
      border: '1px solid #2d3142',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: '#0f1115',
        padding: '1.5rem',
        borderBottom: '1px solid #2d3142',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ color: '#f8fafc', margin: 0, fontWeight: '700', fontSize: '1.5rem' }}>
            <i className="bi bi-graph-up-arrow me-2" style={{ color: '#f97316' }}></i>
            Monitoramento Kanban
          </h4>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Visão geral da estrutura e permissões de acesso
          </p>
        </div>
        <button
          onClick={fetchMonitoramento}
          disabled={loading}
          style={{
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.625rem 1.25rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#ea580c')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#f97316')}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Atualizando...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Atualizar
            </>
          )}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Estatísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>
              {data.estatisticas.totalAbas}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Abas Criadas
            </div>
          </div>
          <div style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
              {data.estatisticas.totalColunas}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Colunas Criadas
            </div>
          </div>
          <div style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>
              {data.estatisticas.totalCartoes}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Cartões Ativos
            </div>
          </div>
          <div style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
              {data.estatisticas.usuariosComAcesso}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Usuários com Acesso
            </div>
          </div>
        </div>

        {/* Filtro de Usuário */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
            Filtrar por Usuário
          </label>
          <select
            value={usuarioSelecionado || ''}
            onChange={(e) => setUsuarioSelecionado(e.target.value ? Number(e.target.value) : null)}
            style={{
              background: '#0f1115',
              border: '1px solid #2d3142',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <option value="">Todos os usuários</option>
            {data.usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.email})
              </option>
            ))}
          </select>
        </div>

        {/* Mensagem para Admin Único */}
        {data.estatisticas.totalUsuarios === 1 && (
          <div style={{
            background: '#0f1115',
            border: '1px solid #f97316',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <i className="bi bi-info-circle" style={{ fontSize: '2rem', color: '#f97316' }}></i>
            <div>
              <div style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '0.25rem' }}>
                Uso Individual Detectado
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                Você é o único usuário. Tem acesso completo a todo o Kanban sem restrições.
              </div>
            </div>
          </div>
        )}

        {/* Estrutura do Kanban */}
        <div>
          <h5 style={{ color: '#f8fafc', marginBottom: '1rem', fontWeight: '600' }}>
            <i className="bi bi-diagram-3 me-2" style={{ color: '#3b82f6' }}></i>
            Estrutura e Permissões
          </h5>

          {data.estrutura.length === 0 ? (
            <div style={{
              background: '#0f1115',
              border: '1px solid #2d3142',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <i className="bi bi-kanban" style={{ fontSize: '3rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}></i>
              <p style={{ color: '#64748b', margin: 0 }}>Nenhuma aba criada no Kanban</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.estrutura.map(aba => {
                const usuariosAba = usuarioFiltrado 
                  ? (usuarioFiltrado.nivel === 'admin' || usuarioFiltrado.nivel === 'superadmin' || 
                     usuarioFiltrado.permissoesKanban.abas?.some(a => a.id === aba.id) ? [usuarioFiltrado] : [])
                  : getUsuariosComAcessoAba(aba.id);

                // Se tem filtro e usuário não tem acesso, não mostrar a aba
                if (usuarioFiltrado && usuariosAba.length === 0) return null;

                return (
                  <div
                    key={aba.id}
                    style={{
                      background: '#0f1115',
                      border: '1px solid #2d3142',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header da Aba */}
                    <div
                      onClick={() => setAbaExpandida(abaExpandida === aba.id ? null : aba.id)}
                      style={{
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#1a1d29'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <i 
                          className={`bi bi-chevron-${abaExpandida === aba.id ? 'down' : 'right'}`}
                          style={{ color: '#64748b', fontSize: '0.875rem' }}
                        ></i>
                        <div>
                          <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '1rem' }}>
                            {aba.nome}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {aba.colunas.length} coluna{aba.colunas.length !== 1 ? 's' : ''} • {usuariosAba.length} usuário{usuariosAba.length !== 1 ? 's' : ''} com acesso
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: '#f9731620',
                        color: '#f97316',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {aba.colunas.reduce((acc, col) => acc + col._count.cartoes, 0)} cartões
                      </div>
                    </div>

                    {/* Conteúdo Expandido */}
                    {abaExpandida === aba.id && (
                      <div style={{
                        borderTop: '1px solid #2d3142',
                        padding: '1.25rem'
                      }}>
                        {/* Usuários com Acesso */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                            <i className="bi bi-people me-2" style={{ color: '#8b5cf6' }}></i>
                            Usuários com Acesso
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {usuariosAba.map(usuario => (
                              <div
                                key={usuario.id}
                                style={{
                                  background: '#1a1d29',
                                  border: '1px solid #2d3142',
                                  borderRadius: '8px',
                                  padding: '0.5rem 0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {usuario.foto ? (
                                  <img 
                                    src={usuario.foto} 
                                    alt={usuario.nome}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#f97316',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#fff'
                                  }}>
                                    {usuario.nome.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span style={{ color: '#cbd5e1' }}>{usuario.nome}</span>
                                {(usuario.nivel === 'admin' || usuario.nivel === 'superadmin') && (
                                  <span style={{
                                    background: '#f9731620',
                                    color: '#f97316',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600'
                                  }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Colunas */}
                        <div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                            <i className="bi bi-columns-gap me-2" style={{ color: '#3b82f6' }}></i>
                            Colunas
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {aba.colunas.map(coluna => {
                              const usuariosColuna = usuarioFiltrado
                                ? (usuarioFiltrado.nivel === 'admin' || usuarioFiltrado.nivel === 'superadmin' || 
                                   getUsuariosComAcessoColuna(aba.id, coluna.id).some(u => u.id === usuarioFiltrado.id) ? [usuarioFiltrado] : [])
                                : getUsuariosComAcessoColuna(aba.id, coluna.id);

                              return (
                                <div
                                  key={coluna.id}
                                  style={{
                                    background: '#1a1d29',
                                    border: '1px solid #2d3142',
                                    borderRadius: '8px',
                                    padding: '0.875rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                    <div style={{ color: '#cbd5e1', fontWeight: '500' }}>
                                      {coluna.nome}
                                    </div>
                                    {coluna.recebe_whats && (
                                      <span style={{
                                        background: '#16a34a20',
                                        color: '#16a34a',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}>
                                        <i className="bi bi-whatsapp"></i>
                                        WhatsApp
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                      {usuariosColuna.length} usuário{usuariosColuna.length !== 1 ? 's' : ''}
                                    </div>
                                    <div style={{
                                      background: '#3b82f620',
                                      color: '#3b82f6',
                                      padding: '0.25rem 0.625rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      {coluna._count.cartoes} cartões
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lista de Usuários */}
        {!usuarioSelecionado && (
          <div style={{ marginTop: '1.5rem' }}>
            <h5 style={{ color: '#f8fafc', marginBottom: '1rem', fontWeight: '600' }}>
              <i className="bi bi-people me-2" style={{ color: '#8b5cf6' }}></i>
              Todos os Usuários
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.usuarios.map(usuario => (
                <div
                  key={usuario.id}
                  style={{
                    background: '#0f1115',
                    border: '1px solid #2d3142',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {usuario.foto ? (
                      <img 
                        src={usuario.foto} 
                        alt={usuario.nome}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #2d3142'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#fff'
                      }}>
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: '600' }}>
                        {usuario.nome}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {usuario.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      background: (usuario.nivel === 'admin' || usuario.nivel === 'superadmin') ? '#f9731620' : '#3b82f620',
                      color: (usuario.nivel === 'admin' || usuario.nivel === 'superadmin') ? '#f97316' : '#3b82f6',
                      padding: '0.375rem 0.875rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {getPermissoesUsuario(usuario)}
                    </div>
                    <button
                      onClick={() => setUsuarioSelecionado(usuario.id)}
                      style={{
                        background: 'transparent',
                        color: '#64748b',
                        border: '1px solid #64748b',
                        borderRadius: '6px',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#64748b';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#64748b';
                      }}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
