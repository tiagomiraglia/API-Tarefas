import { Nav, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function MenuSidebar({ userName = 'Usuário', onLogout }: { userName?: string, onLogout?: () => void }) {
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
  }, [collapsed]);

  const handleNav = (key: string, path: string) => {
    setActive(key);
    navigate(path);
  };

  return (
    <div style={{ width: collapsed ? 64 : 220, background: '#fff', borderRight: '1px solid #dee2e6', minHeight: '100%', padding: 0, boxShadow: '2px 0 8px #e0e7ff55', position: 'relative', transition: 'width 200ms' }}>
      {/* collapse toggle */}
      <button
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        title={collapsed ? 'Expandir' : 'Recolher'}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(v => !v)}
        style={{
          position: 'absolute',
          right: -22,
          top: 12,
          border: '1px solid #eef2f7',
          background: '#fff',
          padding: 4,
          cursor: 'pointer',
          borderRadius: 14,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          zIndex: 6,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms, transform 180ms'
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f7f9ff'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 180ms' }}>
          <path d="M9 18l6-6-6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Nav className={collapsed ? 'flex-column p-2 gap-1 align-items-center' : 'flex-column p-3 gap-1'} activeKey={active}>
        <Nav.Link title={collapsed ? 'Dashboard' : undefined} eventKey="dashboard" onClick={() => handleNav('dashboard', '/dashboard')} className={collapsed ? 'fw-normal text-center' : 'fw-bold'}><i className="bi bi-speedometer2" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Dashboard</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Conversas' : undefined} eventKey="conversas" onClick={() => handleNav('conversas', '/conversas')} className={collapsed ? 'text-center' : ''}><i className="bi bi-chat-dots" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Conversas</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Clientes' : undefined} eventKey="clientes" onClick={() => handleNav('clientes', '/clientes')} className={collapsed ? 'text-center' : ''}><i className="bi bi-people" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Clientes</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Operadores' : undefined} eventKey="operadores" onClick={() => handleNav('operadores', '/operadores')} className={collapsed ? 'text-center' : ''}><i className="bi bi-person-badge" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Operadores</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Relatórios' : undefined} eventKey="relatorios" onClick={() => handleNav('relatorios', '/relatorios')} className={collapsed ? 'text-center' : ''}><i className="bi bi-bar-chart-line" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Relatórios</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Automação' : undefined} eventKey="automacao" onClick={() => handleNav('automacao', '/automacao')} className={collapsed ? 'text-center' : ''}><i className="bi bi-diagram-3" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Automação</span>}</Nav.Link>
        <Nav.Link title={collapsed ? 'Configurações' : undefined} eventKey="configuracoes" onClick={() => handleNav('configuracoes', '/configuracoes')} className={collapsed ? 'text-center' : ''}><i className="bi bi-gear" style={{ fontSize: 18 }} />{!collapsed && <span className="ms-2">Configurações</span>}</Nav.Link>
      </Nav>
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', background: '#f3f4f6', borderTop: '1px solid #e5e7eb', padding: collapsed ? '10px 0' : '16px 0 12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 -2px 8px #e0e7ff33', zIndex: 2 }}>
  <Dropdown drop="up" align="end">
      <Dropdown.Toggle variant="light" id="dropdown-user-panel" style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8, color: '#222', fontWeight: 500, fontSize: 16, border: 'none', background: 'none', boxShadow: 'none', padding: 0 }}>
            <i className="bi bi-person-circle" style={{ fontSize: 22, color: '#6366f1' }} />
            {!collapsed && userName}
          </Dropdown.Toggle>
      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} style={{ minWidth: 180, boxShadow: '0 2px 16px #6366f133', borderRadius: 10, marginBottom: 8 }}>
            <Dropdown.Item onClick={() => handleNav('configuracoes', '/configuracoes')}><i className="bi bi-gear me-2" style={{ color: '#6366f1' }} />Configurações</Dropdown.Item>
            <Dropdown.Item onClick={() => handleNav('trocar-senha', '/trocar-senha')}><i className="bi bi-key me-2" style={{ color: '#f59e42' }} />Trocar senha</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item as="button" style={{ color: '#dc3545', fontWeight: 500 }} onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-2" style={{ color: '#dc3545' }} />Sair
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}
