import React, { useState } from 'react';


interface SidebarProps {
  active?: string;
  onTabChange?: (tab: 'dashboard' | 'estatisticas' | 'configuracoes' | 'empresas' | 'usuarios') => void;
}

export default function Sidebar({ active, onTabChange }: SidebarProps) {
  const [clientesOpen, setClientesOpen] = useState(false);
  const handleTab = (tab: 'dashboard' | 'estatisticas' | 'configuracoes' | 'empresas' | 'usuarios') => {
    setClientesOpen(false);
    if (onTabChange) onTabChange(tab);
  };
  return (
    <aside 
      className="d-none d-md-block vh-100 position-fixed" 
      style={{ 
        width: 220, 
        top: 56, 
        left: 0, 
        zIndex: 1030,
        background: '#1a1d29',
        borderRight: '1px solid #2d3142'
      }}
    >
      <ul className="nav flex-column pt-4">
        <li className="nav-item">
          <button 
            className="nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center" 
            style={{ 
              fontSize: 17,
              color: active === '/root' ? '#f97316' : '#cbd5e1',
              background: active === '/root' ? '#f9731620' : 'transparent',
              borderRadius: '8px',
              margin: '0 0.5rem',
              width: 'calc(100% - 1rem)',
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => handleTab('dashboard')}
            onMouseOver={(e) => {
              if (active !== '/root') {
                e.currentTarget.style.background = '#2d3142';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (active !== '/root') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
          >
            <i className="bi bi-house me-2"></i>Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button 
            className="nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center" 
            style={{ 
              fontSize: 17,
              color: active === '/estatisticas' ? '#f97316' : '#cbd5e1',
              background: active === '/estatisticas' ? '#f9731620' : 'transparent',
              borderRadius: '8px',
              margin: '0 0.5rem',
              width: 'calc(100% - 1rem)',
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => handleTab('estatisticas')}
            onMouseOver={(e) => {
              if (active !== '/estatisticas') {
                e.currentTarget.style.background = '#2d3142';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (active !== '/estatisticas') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
          >
            <i className="bi bi-bar-chart-line me-2"></i>Estatísticas
          </button>
        </li>
        {/* Dropdown Clientes */}
        <li className="nav-item dropdown">
          <button 
            className="nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center" 
            style={{ 
              fontSize: 17,
              color: '#cbd5e1',
              background: 'transparent',
              borderRadius: '8px',
              margin: '0 0.5rem',
              width: 'calc(100% - 1rem)',
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => setClientesOpen(o => !o)} 
            aria-expanded={clientesOpen} 
            aria-haspopup="true"
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#2d3142';
              e.currentTarget.style.color = '#f8fafc';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <i className="bi bi-people me-2"></i>Clientes
            <i className={`bi ms-auto ${clientesOpen ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`}></i>
          </button>
          <ul 
            className={`dropdown-menu border-0${clientesOpen ? ' show' : ''}`} 
            style={{ 
              position: 'static', 
              float: 'none', 
              minWidth: 180, 
              marginLeft: 20,
              background: '#0f1115',
              border: '1px solid #2d3142',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
          >
            <li>
              <button 
                className="dropdown-item" 
                type="button" 
                onClick={() => handleTab('empresas')}
                style={{
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2d3142';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <i className="bi bi-building me-2"></i>Empresas
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item" 
                type="button" 
                onClick={() => handleTab('usuarios')}
                style={{
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2d3142';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <i className="bi bi-person me-2"></i>Usuários
              </button>
            </li>
          </ul>
        </li>
        <li className="nav-item">
          <button 
            className="nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center" 
            style={{ 
              fontSize: 17,
              color: active === '/configuracoes' ? '#f97316' : '#cbd5e1',
              background: active === '/configuracoes' ? '#f9731620' : 'transparent',
              borderRadius: '8px',
              margin: '0 0.5rem',
              width: 'calc(100% - 1rem)',
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => handleTab('configuracoes')}
            onMouseOver={(e) => {
              if (active !== '/configuracoes') {
                e.currentTarget.style.background = '#2d3142';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (active !== '/configuracoes') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
          >
            <i className="bi bi-gear me-2"></i>Configurações
          </button>
        </li>
      </ul>
    </aside>
  );
}
