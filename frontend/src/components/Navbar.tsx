// Declaração global para window.atualizarAvisoAtivoCount
declare global {
  interface Window {
    atualizarAvisoAtivoCount?: () => void;
  }
}
import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import Modal from './Modal';
import AvisoForm from './AvisoForm';
import AvisosList from './AvisosList';
import AvisoAtivoModal from './AvisoAtivoModal';
import useAvisoAtivoCount from './useAvisoAtivoCount';

// Injeção de CSS para animação de piscar (executa uma vez no client)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (!document.head.querySelector('#aviso-pisca-style')) {
    const style = document.createElement('style');
    style.id = 'aviso-pisca-style';
    style.innerHTML = `@keyframes pisca { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } } .aviso-pisca { animation: pisca 1s steps(2, start) infinite !important; }`;
    document.head.appendChild(style);
  }
}

interface NavbarProps {
  userName?: string;
  userFoto?: string;
  onPerfilClick?: (e: React.MouseEvent) => void;
}

import { Aviso } from './AvisosList';
export default function Navbar({ userName, userFoto, onPerfilClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [showAvisos, setShowAvisos] = useState(false);
  const [showAvisoAtivo, setShowAvisoAtivo] = useState(false);
  const [editAviso, setEditAviso] = useState<Aviso | null>(null);
  const [refreshAvisos, setRefreshAvisos] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const nivel = localStorage.getItem('nivel') || 'user';
  const avisoAtivoCount = useAvisoAtivoCount();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <nav 
      className="navbar navbar-expand-lg fixed-top" 
      style={{ 
        background: '#1a1d29', 
        borderBottom: '1px solid #2d3142',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="/root" style={{ color: '#f8fafc' }}>
          <i className="bi bi-shield-lock me-2" style={{ color: '#f97316' }}></i> SaaS Admin
        </a>
        <div className="d-flex align-items-center ms-auto gap-3 position-relative" ref={menuRef}>
          {/* Avisos globais: superusuário vê painel, outros só ícone/cartinha */}
          {nivel === 'superuser' ? (
            <button className="btn btn-warning fw-bold d-flex align-items-center" style={{ borderRadius: 20 }} onClick={() => setShowAvisos(true)} title="Avisos globais">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Avisos
            </button>
          ) : (
            <button
              className={`btn btn-outline-warning position-relative${avisoAtivoCount > 0 ? ' aviso-pisca' : ''}`}
              style={{ borderRadius: 20 }}
              onClick={() => {
                setShowAvisoAtivo(true);
                setTimeout(() => { if (window.atualizarAvisoAtivoCount) window.atualizarAvisoAtivoCount(); }, 300);
              }}
              title="Aviso global"
            >
              <i className="bi bi-envelope-paper-fill"></i>
              {avisoAtivoCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: 12, animation: 'pisca 1s steps(2, start) infinite' }}
                >
                  {avisoAtivoCount}
                </span>
              )}
            </button>
          )}





          {/* Perfil */}
          <button
            className="btn btn-link p-0 border-0 d-flex align-items-center"
            style={{ textDecoration: 'none' }}
            onClick={() => setOpen(o => !o)}
            aria-label="Perfil"
          >
            <UserAvatar name={userName} foto={typeof userFoto === 'string' ? userFoto : undefined} />
            <span className="ms-2 fw-semibold d-none d-md-inline" style={{ color: '#cbd5e1' }}>{userName || 'Superusuário'}</span>
            <i className={`bi ms-2 ${open ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} style={{ color: '#cbd5e1' }}></i>
          </button>
          {open && (
            <div
              className="dropdown-menu show"
              style={{
                minWidth: 180,
                right: 0,
                left: 'auto',
                top: 'calc(100% + 8px)',
                position: 'absolute',
                zIndex: 1050,
                borderRadius: 10,
                background: '#0f1115',
                border: '1px solid #2d3142',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
              }}
            >
              <span className="dropdown-item-text small" style={{ color: '#64748b', padding: '0.5rem 1rem' }}>
                {userName || 'Superusuário'}
              </span>
              <div className="dropdown-divider" style={{ borderColor: '#2d3142', margin: '0.5rem 0' }}></div>
              <button 
                className="dropdown-item" 
                type="button" 
                onClick={onPerfilClick}
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
                <i className="bi bi-person me-2"></i> Meu Perfil
              </button>
              {nivel === 'admin' && (
                <a 
                  href="/admin/tags" 
                  className="dropdown-item"
                  style={{ 
                    color: '#cbd5e1',
                    background: 'transparent',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    display: 'block',
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
                  <i className="bi bi-tags me-2"></i> Gerenciar Tags
                </a>
              )}
              <a 
                href="/configuracoes" 
                className="dropdown-item"
                style={{ 
                  color: '#cbd5e1',
                  background: 'transparent',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  display: 'block',
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
                <i className="bi bi-gear me-2"></i> Configurações
              </a>
              <div className="dropdown-divider" style={{ borderColor: '#2d3142', margin: '0.5rem 0' }}></div>
              <a 
                href="/logout" 
                className="dropdown-item"
                style={{ 
                  color: '#ef4444',
                  background: 'transparent',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  display: 'block',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2d3142';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i> Sair
              </a>
            </div>
          )}
        </div>
      </div>
      {/* Modal painel de avisos globais (apenas superusuário) */}
      {nivel === 'superuser' && (
        <Modal show={showAvisos} onClose={() => { setShowAvisos(false); setEditAviso(null); }} title="Avisos Globais" size="lg">
          <div className="mb-4">
            <AvisoForm
              key={editAviso ? editAviso.id : 'novo'}
              aviso={editAviso}
              onSaved={() => { setEditAviso(null); setRefreshAvisos(r => r + 1); }}
              onCancel={() => setEditAviso(null)}
            />
          </div>
          <AvisosList
            refresh={refreshAvisos}
            onEdit={(aviso: Aviso) => setEditAviso(aviso)}
            onSuspend={async (aviso: Aviso) => {
              if (!window.confirm('Suspender este aviso?')) return;
              const token = localStorage.getItem('token');
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/avisos/${aviso.id}/suspender`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
              });
              setRefreshAvisos(r => r + 1);
            }}
            onDelete={async (aviso: Aviso) => {
              if (!window.confirm('Excluir este aviso?')) return;
              const token = localStorage.getItem('token');
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/avisos/${aviso.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              setRefreshAvisos(r => r + 1);
            }}
          />
        </Modal>
      )}
      {/* Modal aviso ativo simples (admins/users) */}
      {nivel !== 'superuser' && (
        <AvisoAtivoModal show={showAvisoAtivo} onClose={() => setShowAvisoAtivo(false)} />
      )}
    </nav>
  );
}
