import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const features = [
  {
    icon: 'bi-whatsapp',
    title: 'Atendimento WhatsApp com IA',
    desc: 'Automatize e escale seu atendimento via WhatsApp com inteligência artificial, integrando múltiplos atendentes e fluxos inteligentes.'
  },
  {
    icon: 'bi-kanban',
    title: 'Kanban de Vendas e Suporte',
    desc: 'Visualize o fluxo de cada cliente, organize oportunidades e tickets em um painel moderno e fácil de usar.'
  },
  {
    icon: 'bi-people',
    title: 'Multiusuário e Multi-Conexão',
    desc: 'Gerencie múltiplos números WhatsApp, operadores e permissões conforme o plano do seu cliente.'
  },
  {
    icon: 'bi-bar-chart-line',
    title: 'Relatórios e Insights',
    desc: 'Acompanhe métricas de atendimento, vendas e satisfação em tempo real.'
  },
  {
    icon: 'bi-shield-lock',
    title: 'Segurança e Privacidade',
    desc: 'Infraestrutura robusta, autenticação JWT e dados isolados por cliente.'
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <Container fluid className="py-3">
        <Row className="align-items-center mb-3">
          <Col md={6} className="text-center text-md-start">
            <h1 className="fw-bold mb-2" style={{ fontSize: 32, letterSpacing: -1 }}>
              Plataforma Nynch de Atendimento WhatsApp com IA
            </h1>
            <p className="lead mb-2" style={{ fontSize: 16, color: '#e0e7ff' }}>
              Inspirado em Zenvia, Take Blip e Twilio Flex.<br />
              Tenha o poder das grandes plataformas, com a flexibilidade e automação que seu negócio precisa.
            </p>
            <Button
              size="sm"
              variant="light"
              className="fw-bold px-3 py-1 shadow"
              style={{ color: '#6366f1', fontSize: 16, borderRadius: 8 }}
              onClick={() => window.location.href = '/login'}
            >
              <i className="bi bi-box-arrow-in-right me-2" />Acesse o Painel do Cliente
            </Button>
          </Col>
          <Col md={6} className="text-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp SaaS" style={{ maxWidth: 120, width: '100%', borderRadius: 16, boxShadow: '0 4px 16px #6366f133', background: '#fff', padding: 16 }} />
          </Col>
        </Row>
        <Row className="g-3 mb-3">
          {features.map((f, i) => (
            <Col md={4} key={i}>
              <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14, background: 'rgba(255,255,255,0.07)', color: '#fff', minHeight: 180 }}>
                <Card.Body className="text-center p-3">
                  <div className="mb-2"><i className={`bi ${f.icon}`} style={{ fontSize: 26, color: '#fff' }} /></div>
                  <h6 className="fw-bold mb-1" style={{ fontSize: 17 }}>{f.title}</h6>
                  <p style={{ color: '#e0e7ff', fontSize: 13 }}>{f.desc}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <h2 className="fw-bold mb-2" style={{ fontSize: 22 }}>Como funciona?</h2>
            <p className="lead" style={{ color: '#e0e7ff', fontSize: 14 }}>
              Cadastre-se, escolha seu plano, conecte seu WhatsApp e comece a atender clientes com automação, IA e gestão visual de vendas.<br />
              Tudo 100% online, seguro e escalável.
            </p>
          </Col>
        </Row>
        <Row className="justify-content-center mt-2">
          <Col md={6} className="text-center">
            <Button
              size="sm"
              variant="outline-light"
              className="fw-bold px-3 py-1 shadow"
              style={{ fontSize: 15, borderRadius: 8 }}
              onClick={() => window.location.href = '/login'}
            >
              <i className="bi bi-person-circle me-2" />Entrar no Painel do Cliente
            </Button>
          </Col>
        </Row>
        <Row className="justify-content-center mt-3">
          <Col md={10} className="text-center">
            <div style={{ color: '#c7d2fe', fontSize: 12 }}>
              <span className="me-2">Inspirado em:</span>
              <a href="https://www.zenvia.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 500 }}>Zenvia</a>
              <span className="mx-2">|</span>
              <a href="https://www.takeblip.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 500 }}>Take Blip</a>
              <span className="mx-2">|</span>
              <a href="https://www.twilio.com/flex" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 500 }}>Twilio Flex</a>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
