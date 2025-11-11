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
      className="modal d-block modal-editar-overlay"
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content modal-editar-content">
          <div className="modal-header modal-editar-header">
            <h5 className="modal-title fw-bold modal-editar-title">
              <i className="bi bi-pencil-square me-2 modal-editar-title-icon"></i>
              Editar Usuário
            </h5>
            <button 
              type="button" 
              className="btn-close modal-editar-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body modal-editar-body">
            <div className="mb-3">
              <label className="form-label fw-semibold modal-editar-label">
                Nome
              </label>
              <input
                type="text"
                className="form-control modal-editar-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold modal-editar-label">
                E-mail
              </label>
              <input
                type="email"
                className="form-control modal-editar-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <div className="modal-footer modal-editar-footer">
            <button 
              type="button" 
              className="btn fw-semibold modal-editar-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn fw-semibold modal-editar-btn-save"
              onClick={handleSave}
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
