import React from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children, title, size = 'lg' }) => {
  if (!show) return null;
  const maxWidth = size === 'lg' ? 900 : size === 'xl' ? 1200 : undefined;
  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className={`modal-dialog modal-dialog-centered modal-${size}`} style={{ maxWidth }}>
        <div className="modal-content" style={{ 
          background: '#1e293b', 
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid #334155',
            padding: '1.5rem'
          }}>
            <h5 className="modal-title fw-bold" style={{ color: '#f8fafc' }}>{title}</h5>
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
          <div className="modal-body" style={{ 
            padding: '1.5rem',
            color: '#cbd5e1'
          }}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
