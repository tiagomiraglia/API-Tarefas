import React, { useState, useEffect } from 'react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Props {
  show: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSave: (id: number, nome: string, email: string) => void;
}

const ModalEditarUsuario: React.FC<Props> = ({ show, usuario, onClose, onSave }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
    }
  }, [usuario]);

  const handleSave = () => {
    if (!nome.trim() || !email.trim()) return;
    if (usuario) {
      onSave(usuario.id, nome, email);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="modal d-block" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content" 
          style={{ 
            background: '#1a1d29', 
            border: '1px solid #2d3142',
            borderRadius: '12px',
            color: '#f8fafc'
          }}
        >
          <div 
            className="modal-header" 
            style={{ 
              borderBottom: '1px solid #2d3142',
              padding: '1.25rem'
            }}
          >
            <h5 className="modal-title fw-bold" style={{ color: '#f8fafc' }}>
              <i className="bi bi-pencil-square me-2" style={{ color: '#f97316' }}></i>
              Editar Usuário
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              style={{
                filter: 'invert(1)',
                opacity: 0.7
              }}
            ></button>
          </div>
          
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Nome
              </label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  background: '#0f1115',
                  border: '1px solid #2d3142',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  padding: '0.625rem 0.875rem'
                }}
                placeholder="Nome do usuário"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                E-mail
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: '#0f1115',
                  border: '1px solid #2d3142',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  padding: '0.625rem 0.875rem'
                }}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          
          <div 
            className="modal-footer" 
            style={{ 
              borderTop: '1px solid #2d3142',
              padding: '1rem 1.5rem'
            }}
          >
            <button 
              type="button" 
              className="btn fw-semibold"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #64748b',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem'
              }}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn fw-semibold"
              onClick={handleSave}
              style={{
                background: '#f97316',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#ea580c')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f97316')}
            >
              <i className="bi bi-check-lg me-1"></i>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarUsuario;
