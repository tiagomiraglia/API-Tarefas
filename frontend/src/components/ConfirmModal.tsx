import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ show, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }: ConfirmModalProps) {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
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
            <h5 className="modal-title fw-bold" style={{ color: '#f8fafc' }}>{title || 'Confirmação'}</h5>
            <button 
              type="button" 
              className="btn-close" 
              aria-label="Fechar" 
              onClick={onCancel}
              style={{
                filter: 'invert(1)',
                opacity: 0.8
              }}
            ></button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <p className="mb-0" style={{ color: '#cbd5e1', fontSize: '1rem' }}>{message}</p>
          </div>
          <div className="modal-footer" style={{ 
            borderTop: '1px solid #334155',
            padding: '1.25rem 1.5rem'
          }}>
            <button 
              type="button" 
              className="btn" 
              onClick={onCancel}
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
                e.currentTarget.style.background = '#64748b';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
            >{cancelText}</button>
            <button 
              type="button" 
              className="btn" 
              onClick={onConfirm}
              style={{
                background: '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#ea580c'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f97316'}
            >{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
