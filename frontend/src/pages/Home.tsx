import React from 'react'
import ThemeToggle from '../components/ThemeToggle'

// Página principal (Home) - apresentação do sistema
export default function Home() {
  // Removido: estilos inline do body. O ThemeProvider já controla o tema global.

  return (
    <div className="home-bg">
      {/* Navbar moderna com fundo escuro */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top home-navbar">
        <div className="container py-2">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/">
            <div className="home-navbar-icon">
              <i className="bi bi-kanban-fill text-white fs-4"></i>
            </div>
            <span className="fs-4 home-navbar-title">AWA</span>
          </a>
          <div className="d-flex gap-2 align-items-center">
            <a className="btn px-3 d-none d-sm-inline-block home-navbar-login" href="/login">
              <i className="bi bi-box-arrow-in-right me-2"></i>Entrar
            </a>
            <a className="btn px-4 fw-semibold shadow-sm home-navbar-register" href="/registro">
              <i className="bi bi-person-plus me-2"></i>Criar conta
            </a>
            {/* Theme toggle no topo da Home */}
            <div className="ms-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section com design moderno */}
  <section className="py-5 home-hero-bg">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill fw-semibold home-hero-badge">
                  <i className="bi bi-star-fill me-1"></i>
                  Plataforma de Atendimento Inteligente
                </span>
              </div>
              <h1 className="display-3 fw-bold mb-4 lh-1 home-hero-title">
                Atenda mais rápido,<br />
                organize melhor
              </h1>
              <p className="lead mb-4 fs-5 home-hero-desc">
                Transforme seu atendimento com uma plataforma que aumenta a produtividade,
                organiza conversas e dá controle total sobre o fluxo de trabalho.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 mb-5">
                <a className="btn btn-lg px-4 fw-semibold shadow home-hero-btn-orange" href="/registro">
                  <i className="bi bi-rocket-takeoff me-2"></i>Começar Gratuitamente
                </a>
                <a className="btn btn-lg px-4 home-hero-btn-outline" href="#features">
                  <i className="bi bi-play-circle me-2"></i>Ver Recursos
                </a>
              </div>
              <div className="d-flex gap-4 flex-wrap">
                <div className="home-hero-metric">
                  <div className="fs-2 fw-bold home-hero-metric-value">99%</div>
                  <div className="small home-hero-metric-label">Satisfação</div>
                </div>
                <div className="home-hero-metric">
                  <div className="fs-2 fw-bold home-hero-metric-value">-50%</div>
                  <div className="small home-hero-metric-label">Tempo de Resposta</div>
                </div>
                <div className="home-hero-metric">
                  <div className="fs-2 fw-bold home-hero-metric-value">+3x</div>
                  <div className="small home-hero-metric-label">Produtividade</div>
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="position-relative">
                {/* Card principal com animação suave */}
                <div className="rounded-4 shadow-lg p-4 home-hero-card">
                  {/* Efeito de brilho no topo */}
                  <div className="home-hero-card-glow"></div>

                  {/* Card 1 - Mensagem recebida */}
                  <div className="rounded-3 p-3 mb-3 home-hero-card-msg">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center home-hero-card-msg-icon-green">
                        <i className="bi bi-check2-circle text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2 home-hero-card-msg-bar1"></div>
                        <div className="rounded home-hero-card-msg-bar2"></div>
                      </div>
                      <div className="rounded-pill px-2 py-1 home-hero-card-msg-badge-green">2m</div>
                    </div>
                  </div>

                  {/* Card 2 - Mensagem em andamento */}
                  <div className="rounded-3 p-3 mb-3 home-hero-card-msg">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center home-hero-card-msg-icon-blue">
                        <i className="bi bi-clock text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2 home-hero-card-msg-bar1"></div>
                        <div className="rounded home-hero-card-msg-bar2"></div>
                      </div>
                      <div className="rounded-pill px-2 py-1 home-hero-card-msg-badge-blue">5m</div>
                    </div>
                  </div>

                  {/* Card 3 - Nova mensagem */}
                  <div className="rounded-3 p-3 home-hero-card-msg">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center home-hero-card-msg-icon-orange">
                        <i className="bi bi-lightning-charge-fill text-white"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="rounded mb-2 home-hero-card-msg-bar1"></div>
                        <div className="rounded home-hero-card-msg-bar2"></div>
                      </div>
                      <div className="rounded-pill px-2 py-1 home-hero-card-msg-badge-orange">agora</div>
                    </div>
                  </div>

                  {/* Indicador de atividade */}
                  <div className="mt-3 d-flex align-items-center gap-2 px-2 home-hero-card-activity">
                    <div className="rounded-circle home-hero-card-activity-dot"></div>
                    <span className="home-hero-card-activity-label">3 conversas ativas</span>
                  </div>
                </div>

                {/* Badge flutuante */}
                <div className="position-absolute rounded-3 px-3 py-2 shadow-lg home-hero-card-badge">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-star-fill text-white"></i>
                    <span className="text-white fw-bold home-hero-card-badge-label">99% satisfação</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section com cards modernos */}
  <section id="features" className="py-5 home-features-bg">
        <div className="container py-5">
          <div className="text-center mb-5">
            <span className="badge px-3 py-2 rounded-pill mb-3 home-features-badge">
              Recursos Principais
            </span>
            <h2 className="display-5 fw-bold mb-3 home-features-title">Tudo que você precisa para atender melhor</h2>
            <p className="lead mx-auto home-features-desc">
              Ferramentas poderosas que transformam a forma como você se comunica com seus clientes
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-orange">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-orange">
                    <i className="bi bi-lightning-charge-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Velocidade de Resposta</h5>
                  <p className="card-text home-feature-desc">
                    Reduza drasticamente o tempo de primeira resposta com automações inteligentes e
                    organização eficiente das conversas.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-blue">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-blue">
                    <i className="bi bi-chat-dots-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Organização Total</h5>
                  <p className="card-text home-feature-desc">
                    Mantenha todas as mensagens organizadas por cliente e contexto.
                    Encontre históricos em segundos.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-gray">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-gray">
                    <i className="bi bi-diagram-3-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Controle de Fluxo</h5>
                  <p className="card-text home-feature-desc">
                    Visualize todas as etapas do atendimento, priorize tarefas e
                    elimine gargalos na operação.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-muted">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-muted">
                    <i className="bi bi-people-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Colaboração em Equipe</h5>
                  <p className="card-text home-feature-desc">
                    Distribua atendimentos, delegue tarefas e mantenha toda a equipe
                    sincronizada em tempo real.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-yellow">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-yellow">
                    <i className="bi bi-graph-up-arrow text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Análises e Métricas</h5>
                  <p className="card-text home-feature-desc">
                    Dashboards completos com indicadores de performance para
                    decisões baseadas em dados reais.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow hover-lift home-feature-card home-feature-card-green">
                <div className="card-body p-4">
                  <div className="rounded-3 d-inline-flex p-3 mb-3 home-feature-icon home-feature-icon-green">
                    <i className="bi bi-rocket-takeoff-fill text-white fs-2"></i>
                  </div>
                  <h5 className="card-title fw-bold mb-3 home-feature-title">Setup Rápido</h5>
                  <p className="card-text home-feature-desc">
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
  <section className="py-5 home-cta-bg">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h2 className="display-5 fw-bold mb-3 home-cta-title">Pronto para transformar seu atendimento?</h2>
              <p className="lead mb-0 home-cta-desc">
                Junte-se a centenas de empresas que já melhoraram seus resultados com AWA
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <a className="btn btn-lg px-5 py-3 fw-semibold shadow home-cta-btn-orange" href="/registro">
                <i className="bi bi-arrow-right-circle me-2"></i>Começar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
  <footer className="py-4 home-footer">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
              <p className="mb-0 home-footer-text">© 2025 AWA - Todos os direitos reservados</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <p className="mb-0 home-footer-text">
                Um produto
                <a href="https://nynch.com.br" target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none ms-1 home-footer-link">
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
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.175);
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
