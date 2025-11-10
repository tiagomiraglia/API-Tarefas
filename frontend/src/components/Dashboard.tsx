

import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { listWhatsappConnections, disconnectWhatsapp } from '../services/api';
import { Row, Col, Card, Navbar, Badge, Button, Nav } from 'react-bootstrap';
import MenuSidebar from './MenuSidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import WhatsAppConnectionsManager from './WhatsAppConnectionsManager';




function Dashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // ...existing code...
  // Logout com confirmação sobre conexões WhatsApp
  async function doLogout(keepActive: boolean) {
    if (!keepActive) {
      try {
        // Busca todas as conexões e desconecta cada uma
        const res: any = await listWhatsappConnections();
        const connections = res.data.connections || [];
        for (const conn of connections) {
          if (conn.isConnected) {
            try { await disconnectWhatsapp(conn.connectionId); } catch {}
          }
        }
      } catch {}
    }
    // Limpa token e volta para landing page, informando se manteve conexões ativas
    localStorage.removeItem('token');
    window.location.href = `/?keepActive=${keepActive}`;
  }

  function handleLogout() {
    setShowLogoutModal(true);
  }
  // Buscar nome do usuário do localStorage (ou simulado)
  let userName = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.name) {
        userName = user.name.split(' ')[0];
      }
    }
  } catch {}
  if (!userName) userName = 'Usuário';

  const [showConnections, setShowConnections] = useState(false);

  return (
    <>
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered backdrop="static">
        <Modal.Body className="text-center p-4" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)', color: '#fff', borderRadius: 16 }}>
          <i className="bi bi-exclamation-triangle-fill mb-3" style={{ fontSize: 44, color: '#fff' }} />
          <h4 className="fw-bold mb-3">Sair do sistema</h4>
          <div className="mb-4" style={{ fontSize: 17, lineHeight: 1.5 }}>
            <div className="mb-2">Deseja <b>manter as conexões WhatsApp ativas</b> após sair?</div>
            <div style={{ fontSize: 15, color: '#e0e7ff' }}>
              <i className="bi bi-info-circle me-1" />
              <b>Manter Ativas</b>: Você continuará recebendo mensagens e notificações.<br />
              <i className="bi bi-x-circle me-1" />
              <b>Encerrar Todas</b>: Todas as conexões WhatsApp serão desconectadas.
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mt-3">
            <Button 
              variant="primary" 
              size="lg" 
              className="px-4 py-2 d-flex align-items-center fw-bold shadow-sm"
              style={{ minWidth: 200, fontSize: 18 }}
              onClick={async () => { setShowLogoutModal(false); await doLogout(true); }}
            >
              <i className="bi bi-plug me-2" style={{ fontSize: 22 }} /> Manter Ativas
            </Button>
            <Button 
              variant="danger" 
              size="lg" 
              className="px-4 py-2 d-flex align-items-center fw-bold shadow-sm"
              style={{ minWidth: 200, fontSize: 18 }}
              onClick={async () => { setShowLogoutModal(false); await doLogout(false); }}
            >
              <i className="bi bi-x-octagon me-2" style={{ fontSize: 22 }} /> Encerrar Todas
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', overflow: 'hidden' }}>
        <Navbar bg="dark" variant="dark" expand="lg" className="px-4 shadow-sm" style={{ marginBottom: 0, minHeight: 56 }}>
          <Navbar.Brand href="#" style={{ fontWeight: 700, fontSize: 24, letterSpacing: 1 }}> <i className="bi bi-whatsapp me-2" />Administração WhatsApp</Navbar.Brand>
          <Nav className="ms-auto align-items-center" style={{ gap: 12 }}>
            <Button variant="outline-success" size="sm" onClick={() => setShowConnections(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-whatsapp" style={{ color: '#25d366', fontSize: 18 }} /> Gerenciar Conexões
            </Button>
          </Nav>
        </Navbar>
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', width: '100vw' }}>
          <MenuSidebar userName={userName} onLogout={handleLogout} />
          <div style={{ flex: 1, padding: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
            <div style={{ padding: 32, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <Row className="mb-4" style={{ marginRight: 0, marginLeft: 0 }}>
        {/* Modal de QR Code WhatsApp */}
        <WhatsAppConnectionsManager show={showConnections} onHide={() => setShowConnections(false)} />
                <Col md={3} sm={6} className="mb-3">
                  <Card className="shadow-lg border-0 text-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)', color: '#fff' }}>
                    <Card.Body>
                      <div className="mb-2"><i className="bi bi-chat-dots" style={{ fontSize: 32 }} /></div>
                      <Card.Title className="fw-bold">Total de Conversas</Card.Title>
                      <Card.Text className="fs-2 fw-bold">0</Card.Text>
                      <Badge bg="light" text="dark">Hoje</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="shadow-lg border-0 text-center" style={{ background: 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)', color: '#fff' }}>
                    <Card.Body>
                      <div className="mb-2"><i className="bi bi-people" style={{ fontSize: 32 }} /></div>
                      <Card.Title className="fw-bold">Clientes Ativos</Card.Title>
                      <Card.Text className="fs-2 fw-bold">0</Card.Text>
                      <Badge bg="light" text="dark">Semana</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="shadow-lg border-0 text-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#fff' }}>
                    <Card.Body>
                      <div className="mb-2"><i className="bi bi-person-badge" style={{ fontSize: 32 }} /></div>
                      <Card.Title className="fw-bold">Operadores</Card.Title>
                      <Card.Text className="fs-2 fw-bold">0</Card.Text>
                      <Badge bg="light" text="dark">Equipe</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Card className="shadow-lg border-0 text-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#fff' }}>
                    <Card.Body>
                      <div className="mb-2"><i className="bi bi-bar-chart-line" style={{ fontSize: 32 }} /></div>
                      <Card.Title className="fw-bold">Relatórios</Card.Title>
                      <Card.Text className="fs-2 fw-bold">0</Card.Text>
                      <Badge bg="light" text="dark">Mês</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <h4 className="mb-3 fw-bold"><i className="bi bi-whatsapp me-2 text-success" />Bem-vindo ao Painel de Administração WhatsApp</h4>
                  <p className="lead">Selecione uma opção no menu lateral para começar a gerenciar seus serviços de atendimento.</p>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
