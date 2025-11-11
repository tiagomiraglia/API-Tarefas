import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import PerfilModal from "./PerfilModal";
import "../styles.css";

const adminMenu = [
  { label: "Dashboard", path: "/dashboard-admin" },
  { label: "Usuários", path: "/dashboard-admin/usuarios" },
  // Adicione mais opções conforme necessário
];

export default function NavbarAdmin({ user }: any) {
  const [open, setOpen] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const nome = user?.nome ? user.nome : (user === null ? 'Carregando...' : 'Administrador');
  const foto = user?.foto;
  const email = user?.email || '';

  return (
    <nav className="navbar navbar-expand-lg fixed-top navbar-theme">
  <div className="container-fluid navbar-admin-container">
        <div className="d-flex align-items-center gap-3">
          <Link to="/dashboard-admin" className="navbar-theme-brand d-flex align-items-center gap-2 text-decoration-none">
            <span className="navbar-theme-icon"><i className="bi bi-lightning-charge-fill" /></span>
            <span className="fw-bold">Nynch Admin</span>
          </Link>
          <ul className="d-flex align-items-center gap-2 mb-0 navbar-admin-menu">
            {adminMenu.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="btn btn-link text-decoration-none navbar-admin-menu-link">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
          <div className="d-flex align-items-center ms-auto gap-3 position-relative navbar-admin-perfil-wrap" ref={menuRef}>
          {/* Toggle Tema */}
          <ThemeToggle />
          {/* Perfil */}
          <div className="navbar-admin-perfil-dropdown-wrap">
            <button
              className="btn d-flex align-items-center gap-2 navbar-theme-perfil-btn navbar-admin-perfil-btn"
              onClick={() => setOpen(o => !o)}
            >
              {foto ? (
                <img src={foto} alt="avatar" className="navbar-theme-perfil-avatar" width={32} height={32} />
              ) : (
                <span className="navbar-theme-icon"><i className="bi bi-person-circle" /></span>
              )}
              <span className="navbar-theme-perfil-name">{nome}</span>
              <span className="navbar-theme-perfil-caret"><i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} /></span>
            </button>
            {open && (
              <div className="navbar-theme-dropdown navbar-admin-dropdown-perfil">
                <span className="dropdown-item-text small navbar-theme-dropdown-user">{nome}</span>
                <div className="dropdown-divider navbar-theme-dropdown-divider"></div>
                <button className="navbar-theme-dropdown-item" onClick={() => setShowPerfilModal(true)}>
                  <i className="bi bi-person"></i> Painel do Usuário
                </button>
                <Link to="/configuracoes" className="navbar-theme-dropdown-item">
                  <i className="bi bi-gear" /> Configurações
                </Link>
                <div className="dropdown-divider navbar-theme-dropdown-divider"></div>
                <button
                  className="navbar-theme-dropdown-item navbar-theme-dropdown-item-logout"
                  onClick={() => {
                    localStorage.clear();
                    navigate('/login');
                  }}
                >
                  <i className="bi bi-box-arrow-right" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPerfilModal && (
        <PerfilModal user={user} show={showPerfilModal} onClose={() => setShowPerfilModal(false)} />
      )}
    </nav>
  );
}
