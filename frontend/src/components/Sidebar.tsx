import React, { useState } from 'react';


interface SidebarProps {
  active?: string;
  onTabChange?: (tab: 'dashboard' | 'estatisticas' | 'configuracoes' | 'empresas' | 'usuarios') => void;
}

export default function Sidebar({ active, onTabChange }: SidebarProps) {
  const [clientesOpen, setClientesOpen] = useState(false);
  const handleTab = (tab: 'estatisticas' | 'empresas' | 'usuarios') => {
    setClientesOpen(false);
    if (onTabChange) onTabChange(tab);
  };
  return (
    <aside className="d-none d-md-block vh-100 position-fixed sidebar-theme">
      <ul className="nav flex-column pt-4">
        <li className="nav-item">
          <button 
            className={`nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center sidebar-theme-btn${active === 'estatisticas' ? ' sidebar-theme-btn-active' : ''}`}
            onClick={() => handleTab('estatisticas')}
          >
            <i className="bi bi-bar-chart-line me-2"></i>Estatísticas
          </button>
        </li>
        {/* Dropdown Clientes */}
        <li className="nav-item dropdown">
          <button 
            className={`nav-link px-4 py-2 fw-semibold btn btn-link text-start w-100 d-flex align-items-center sidebar-theme-btn${active === 'empresas' || active === 'usuarios' ? ' sidebar-theme-btn-active' : ''}`}
            onClick={() => setClientesOpen(o => !o)} 
            aria-expanded={clientesOpen} 
            aria-haspopup="true"
          >
            <i className="bi bi-people me-2"></i>Clientes
            <i className={`bi ms-auto ${clientesOpen ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`}></i>
          </button>
          {clientesOpen && (
            <ul className="sidebar-theme-dropdown">
              <li>
                <button 
                  className="sidebar-theme-dropdown-item" 
                  type="button" 
                  onClick={() => handleTab('empresas')}
                >
                  <i className="bi bi-building me-2"></i>Empresas
                </button>
              </li>
              <li>
                <button 
                  className="sidebar-theme-dropdown-item" 
                  type="button" 
                  onClick={() => handleTab('usuarios')}
                >
                  <i className="bi bi-person me-2"></i>Usuários
                </button>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </aside>
  );
}
