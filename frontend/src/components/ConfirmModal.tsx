import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmModalContextType {
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(undefined);

interface ConfirmModalProviderProps {
  children: ReactNode;
}

export function ConfirmModalProvider({ children }: ConfirmModalProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = (confirmMessage: string, confirmTitle: string = 'Confirmação'): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(confirmMessage);
      setTitle(confirmTitle);
      setIsVisible(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsVisible(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsVisible(false);
    if (resolvePromise) resolvePromise(false);
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      {isVisible && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <div className="confirm-modal-header">
              <h5 className="confirm-modal-title">
                <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                {title}
              </h5>
            </div>
            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{message}</p>
            </div>
            <div className="confirm-modal-footer">
              <button
                type="button"
                className="btn btn-secondary confirm-modal-btn-cancel"
                onClick={handleCancel}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger confirm-modal-btn-confirm"
                onClick={handleConfirm}
              >
                <i className="bi bi-check-circle me-1"></i>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirmModal() {
  const context = useContext(ConfirmModalContext);
  if (context === undefined) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return context;
}