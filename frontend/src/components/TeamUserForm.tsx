
import React, { useState } from 'react';
import PermissoesForm, { permissoesPadrao, Permissoes } from './PermissoesForm';

interface TeamUserFormProps {
  onSubmit: (data: { nome: string; email: string; permissoes: Permissoes }) => void;
  onClose: () => void;
  loading?: boolean;
}




const TeamUserForm: React.FC<TeamUserFormProps> = ({ onSubmit, onClose, loading }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [permissoes, setPermissoes] = useState<Permissoes>(permissoesPadrao);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    onSubmit({ nome, email, permissoes });
  }

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ 
          background: '#1e293b', 
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid #334155',
            padding: '1.25rem 1.5rem'
          }}>
            <h5 className="modal-title fw-bold" style={{ color: '#f8fafc' }}>Adicionar Usuário ao Time</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              style={{
                filter: 'invert(1)',
                opacity: 0.8
              }}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="mb-3">
                <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '500', marginBottom: '0.5rem' }}>Nome</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                  required 
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    padding: '0.625rem 0.875rem'
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '500', marginBottom: '0.5rem' }}>E-mail</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    padding: '0.625rem 0.875rem'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ 
              borderTop: '1px solid #334155',
              padding: '1.25rem 1.5rem'
            }}>
              <button 
                type="button" 
                className="btn" 
                onClick={onClose} 
                disabled={loading}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #64748b',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#64748b';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >Cancelar</button>
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{
                  background: loading ? '#64748b' : '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#ea580c')}
                onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#f97316')}
              >
                {loading ? 'Enviando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamUserForm;
