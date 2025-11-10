import React from 'react'

// Página principal (Home) - apresentação do sistema
export default function Home() {
  // Aplicar estilos globais ao body
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#0f1115';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.background = '#0f1115';

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.background = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.background = '';
    };
  }, []);

  return (
    <div style={{background: '#0f1115', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, overflowX: 'hidden'}}>
      {/* Navbar moderna com fundo escuro */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top" style={{background: '#1a1d29', borderBottom: '1px solid #2d3142'}}>
        <div className="container py-2">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/">
            <div className="rounded-3 p-2" style={{background: '#f97316'}}>
              <i className="bi bi-kanban-fill text-white fs-4"></i>
            </div>
            <span className="fs-4" style={{color: '#f8fafc'}}>AWA</span>
          </a>
          <div className="d-flex gap-2">
            <a className="btn px-3 d-none d-sm-inline-block" style={{border: '1px solid #2d3142', color: '#cbd5e1'}} href="/login">
              <i className="bi bi-box-arrow-in-right me-2"></i>Entrar
            </a>
            <a className="btn px-4 fw-semibold shadow-sm" style={{background: '#f97316', color: '#fff', border: 'none'}} href="/registro">
              <i className="bi bi-person-plus me-2"></i>Criar conta
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section com design moderno */}
      <section className="py-5 bg-gradient" style={{background: 'linear-gradient(135deg, #1a1d29 0%, #0f1115 100%)'}}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{background: '#f97316', color: 'white'}}>
                  <i className="bi bi-star-fill me-1"></i>
                  Plataforma de Atendimento Inteligente
                </span>
              </div>
              <h1 className="display-3 fw-bold mb-4 lh-1" style={{color: '#f8fafc'}}>
                Atenda mais rápido,<br />
                organize melhor
              </h1>
              <p className="lead mb-4 fs-5" style={{color: '#cbd5e1'}}>
                Transforme seu atendimento com uma plataforma que aumenta a produtividade,
                organiza conversas e dá controle total sobre o fluxo de trabalho.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 mb-5">
                <a className="btn btn-lg px-4 fw-semibold shadow" style={{background: '#f97316', color: '#fff', border: 'none'}} href="/registro">
                  <i className="bi bi-rocket-takeoff me-2"></i>Começar Gratuitamente
                </a>
                <a className="btn btn-lg px-4" style={{border: '1px solid #2d3142', color: '#cbd5e1'}} href="#features">
                  <i className="bi bi-play-circle me-2"></i>Ver Recursos
                </a>
              </div>
              <div className="d-flex gap-4 flex-wrap">
                <div style={{color: '#f8fafc'}}>
                  <div className="fs-2 fw-bold" style={{color: '#f97316'}}>99%</div>
                  <div className="small" style={{color: '#cbd5e1'}}>Satisfação</div>
                </div>
                <div style={{color: '#f8fafc'}}>
                  <div className="fs-2 fw-bold" style={{color: '#f97316'}}>-50%</div>
                  <div className="small" style={{color: '#cbd5e1'}}>Tempo de Resposta</div>
                </div>
                <div style={{color: '#f8fafc'}}>
                  <div className="fs-2 fw-bold" style={{color: '#f97316'}}>+3x</div>
                  <div className="small" style={{color: '#cbd5e1'}}>Produtividade</div>
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="position-relative">
                {/* Card principal com animação suave */}
                <div className="rounded-4 shadow-lg p-4" style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #1a1d29 100%)',
                  border: '1px solid #334155',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Efeito de brilho no topo */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
                    opacity: 0.6
                  }}></div>

                  {/* Card 1 - Mensagem recebida */}
                  <div className="rounded-3 p-3 mb-3" style={{
                    background: 'linear-gradient(135deg, #0f1115 0%, #1a1d29 100%)',
                    border: '1px solid #2d3142'
                  }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}>
                        <i className="bi bi-check2-circle text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2" style={{
                          height: '12px',
                          width: '75%',
                          background: 'linear-gradient(90deg, #475569 0%, #64748b 100%)'
                        }}></div>
                        <div className="rounded" style={{
                          height: '10px',
                          width: '50%',
                          background: 'linear-gradient(90deg, #334155 0%, #475569 100%)',
                          opacity: 0.7
                        }}></div>
                      </div>
                      <div className="rounded-pill px-2 py-1" style={{
                        background: '#10b981',
                        fontSize: '0.7rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>2m</div>
                    </div>
                  </div>

                  {/* Card 2 - Mensagem em andamento */}
                  <div className="rounded-3 p-3 mb-3" style={{
                    background: 'linear-gradient(135deg, #0f1115 0%, #1a1d29 100%)',
                    border: '1px solid #2d3142'
                  }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}>
                        <i className="bi bi-clock text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2" style={{
                          height: '12px',
                          width: '85%',
                          background: 'linear-gradient(90deg, #475569 0%, #64748b 100%)'
                        }}></div>
                        <div className="rounded" style={{
                          height: '10px',
                          width: '60%',
                          background: 'linear-gradient(90deg, #334155 0%, #475569 100%)',
                          opacity: 0.7
                        }}></div>
                      </div>
                      <div className="rounded-pill px-2 py-1" style={{
                        background: '#3b82f6',
                        fontSize: '0.7rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>5m</div>
                    </div>
                  </div>

                  {/* Card 3 - Nova mensagem */}
                  <div className="rounded-3 p-3" style={{
                    background: 'linear-gradient(135deg, #0f1115 0%, #1a1d29 100%)',
                    border: '1px solid #2d3142'
                  }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                      }}>
                        <i className="bi bi-lightning-charge-fill text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2" style={{
                          height: '12px',
                          width: '70%',
                          background: 'linear-gradient(90deg, #475569 0%, #64748b 100%)'
                        }}></div>
                        <div className="rounded" style={{
                          height: '10px',
                          width: '45%',
                          background: 'linear-gradient(90deg, #334155 0%, #475569 100%)',
                          opacity: 0.7
                        }}></div>
                      </div>
                      <div className="rounded-pill px-2 py-1" style={{
                        background: '#f97316',
                        fontSize: '0.7rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>agora</div>
                    </div>
                  </div>

                  {/* Indicador de atividade */}
                  <div className="mt-3 d-flex align-items-center gap-2 px-2">
                    <div className="rounded-circle" style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500'}}>
                      3 conversas ativas
                    </span>
                  </div>
                </div>

                {/* Badge flutuante */}
                <div className="position-absolute rounded-3 px-3 py-2 shadow-lg" style={{
                  top: '-10px',
                  right: '-10px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: '2px solid #1a1d29'
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-star-fill text-white"></i>
                    <span className="text-white fw-bold" style={{fontSize: '0.9rem'}}>99% satisfação</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section com cards modernos */}
      <section id="features" className="py-5" style={{background: '#1a1d29'}}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <span className="badge px-3 py-2 rounded-pill mb-3" style={{background: '#f97316', color: 'white'}}>
              Recursos Principais
            </span>
            <h2 className="display-5 fw-bold mb-3" style={{color: '#f8fafc'}}>Tudo que você precisa para atender melhor</h2>
            <p className="lead mx-auto" style={{maxWidth: '700px', color: '#cbd5e1'}}>
              Ferramentas poderosas que transformam a forma como você se comunica com seus clientes
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #f97316'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#f97316'}}>
                    <i className="bi bi-lightning-charge-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Velocidade de Resposta</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Reduza drasticamente o tempo de primeira resposta com automações inteligentes e
                    organização eficiente das conversas.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #0ea5e9'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#0ea5e9'}}>
                    <i className="bi bi-chat-dots-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Organização Total</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Mantenha todas as mensagens organizadas por cliente e contexto.
                    Encontre históricos em segundos.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #64748b'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#64748b'}}>
                    <i className="bi bi-diagram-3-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Controle de Fluxo</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Visualize todas as etapas do atendimento, priorize tarefas e
                    elimine gargalos na operação.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #94a3b8'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#94a3b8'}}>
                    <i className="bi bi-people-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Colaboração em Equipe</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Distribua atendimentos, delegue tarefas e mantenha toda a equipe
                    sincronizada em tempo real.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #f59e0b'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#f59e0b'}}>
                    <i className="bi bi-graph-up-arrow text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Análises e Métricas</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Dashboards completos com indicadores de performance para
                    decisões baseadas em dados reais.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift" style={{background: '#0f1115', border: '1px solid #2d3142', borderLeft: '4px solid #10b981'}}>
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3" style={{background: '#10b981'}}>
                    <i className="bi bi-rocket-takeoff-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{color: '#f8fafc', fontSize: '1.25rem'}}>Setup Rápido</h5>
                  <p className="card-text" style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                    Comece a usar em minutos. Interface intuitiva e
                    implementação descomplicada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #1a1d29 0%, #0f1115 100%)'}}>
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-3" style={{color: '#f8fafc'}}>Pronto para transformar seu atendimento?</h2>
              <p className="lead mb-0" style={{color: '#cbd5e1'}}>
                Junte-se a centenas de empresas que já melhoraram seus resultados com AWA
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <a className="btn btn-lg px-5 py-3 fw-semibold shadow" style={{background: '#f97316', color: '#fff', border: 'none'}} href="/registro">
                <i className="bi bi-arrow-right-circle me-2"></i>Começar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4" style={{background: '#1a1d29', borderTop: '1px solid #2d3142'}}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
              <p className="mb-0" style={{color: '#94a3b8'}}>© 2025 AWA - Todos os direitos reservados</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <p className="mb-0" style={{color: '#94a3b8'}}>
                Um produto
                <a href="https://nynch.com.br" target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none ms-1" style={{color: '#f97316'}}>
                  Nynch.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}
