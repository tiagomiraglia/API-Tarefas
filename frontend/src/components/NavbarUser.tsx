// Declaração global para window.atualizarAvisoAtivoCount
declare global {
  interface Window {
    atualizarAvisoAtivoCount?: () => void;
  }
}
import React, { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

// Injeção de CSS para animação de piscar (executa uma vez no client)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (!document.head.querySelector('#aviso-pisca-style')) {
    const style = document.createElement('style');
    style.id = 'aviso-pisca-style';
    style.innerHTML = `@keyframes pisca { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } } .aviso-pisca { animation: pisca 1s steps(2, start) infinite !important; }`;
    document.head.appendChild(style);
  }
}

interface NavbarUserProps {
  userName?: string;
  userFoto?: string;
  onPerfilClick?: (e: React.MouseEvent) => void;
  activeTab?: string;
  onTabChange?: (tab:'estatisticas' | 'configuracoes' | 'empresas' | 'usuarios') => void;
}

export default function NavbarUser({ userName, userFoto, onPerfilClick, activeTab, onTabChange }: NavbarUserProps) {
  const [openClientes, setOpenClientes] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nivel = localStorage.getItem('nivel') || 'user';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenClientes(false);
        setOpenPerfil(false);
      }
    }
    if (openClientes || openPerfil) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openClientes, openPerfil]);

  return (
    <nav className="navbar navbar-expand-lg fixed-top navbar-theme">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold navbar-theme-brand" href="/dashboard">
          <i className="bi bi-house me-2 navbar-theme-icon"></i> Dashboard
        </a>
        {/* Menu de navegação principal no topo */}
        <ul className="navbar-nav flex-row gap-2 ms-4">
          <li className="nav-item">
            <button
              className={`nav-link btn btn-link fw-semibold px-3 py-2${activeTab === 'estatisticas' ? ' sidebar-theme-btn-active' : ''}`}
              onClick={() => { setOpenClientes(false); setOpenPerfil(false); onTabChange && onTabChange('estatisticas'); }}
            >
              <i className="bi bi-bar-chart-line me-2"></i>Estatísticas
            </button>
          </li>
          {/* Dropdown Clientes */}
          <li className="nav-item dropdown">
            <button
              className={`nav-link btn btn-link fw-semibold px-3 py-2 d-flex align-items-center${activeTab === 'empresas' || activeTab === 'usuarios' ? ' sidebar-theme-btn-active' : ''}`}
              onClick={() => { setOpenClientes(o => !o); setOpenPerfil(false); }}
              aria-expanded={openClientes}
              aria-haspopup="true"
            >
              <i className="bi bi-people me-2"></i>Clientes
              <i className={`bi ms-2 ${openClientes ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`}></i>
            </button>
            {openClientes && (
              <ul className="navbar-theme-dropdown navbar-theme-dropdown-clientes">
                <li>
                  <button
                    className="navbar-theme-dropdown-item"
                    type="button"
                    onClick={() => { setOpenClientes(false); onTabChange && onTabChange('empresas'); }}
                  >
                    <i className="bi bi-building me-2"></i>Empresas
                  </button>
                </li>
                <li>
                  <button
                    className="navbar-theme-dropdown-item"
                    type="button"
                    onClick={() => { setOpenClientes(false); onTabChange && onTabChange('usuarios'); }}
                  >
                    <i className="bi bi-person me-2"></i>Usuários
                  </button>
                </li>
              </ul>
            )}
          </li>
        </ul>
        <div className="d-flex align-items-center ms-auto gap-3 position-relative">
          {/* Toggle Tema */}
          <ThemeToggle />
          {/* Perfil */}
          <div className="navbar-theme-perfil-wrap">
            <button
              className="btn btn-link p-0 border-0 d-flex align-items-center navbar-theme-perfil-btn"
              onClick={() => { setOpenPerfil(o => !o); setOpenClientes(false); }}
              aria-label="Perfil"
            >
              {userFoto ? (
                <img
                  src={userFoto}
                  alt="Avatar"
                  className="navbar-theme-perfil-avatar me-2"
                  width={32}
                  height={32}
                />
              ) : (
                <span className="navbar-theme-perfil-avatar-placeholder me-2">👤</span>
              )}
              <span className="fw-semibold navbar-theme-perfil-name">{userName || 'Usuário'}</span>
              <i className={`bi ms-2 ${openPerfil ? 'bi-caret-up-fill' : 'bi-caret-down-fill'} navbar-theme-perfil-caret`}></i>
            </button>
            {openPerfil && (
              <div className="navbar-theme-dropdown navbar-theme-dropdown-perfil">
                <span className="dropdown-item-text small navbar-theme-dropdown-user">
                  {userName || 'Usuário'}
                </span>
                <div className="dropdown-divider navbar-theme-dropdown-divider"></div>
                <button
                  className="navbar-theme-dropdown-item"
                  type="button"
                  onClick={onPerfilClick}
                >
                  <i className="bi bi-person me-2"></i> Meu Perfil
                </button>
                {nivel === 'admin' && (
                  <a
                    href="/admin/tags"
                    className="navbar-theme-dropdown-item"
                  >
                    <i className="bi bi-tags me-2"></i> Gerenciar Tags
                  </a>
                )}
                <a
                  href="/configuracoes"
                  className="navbar-theme-dropdown-item"
                >
                  <i className="bi bi-gear me-2"></i> Configurações
                </a>
                <div className="dropdown-divider navbar-theme-dropdown-divider"></div>
                <a
                  href="/logout"
                  className="navbar-theme-dropdown-item navbar-theme-dropdown-item-logout"
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Sair
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}