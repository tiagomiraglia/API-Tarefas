import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationToast.css';

interface NotificationToastProps {
  userId: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationToast({ userId, position = 'top-right' }: NotificationToastProps) {
  const { notifications } = useNotifications(userId);
  const [visibleToasts, setVisibleToasts] = React.useState<Array<{ id: string; notification: any }>>([]);

  useEffect(() => {
    // Mostrar apenas as últimas 3 notificações como toast
    const latestNotifications = notifications.slice(0, 3);
    
    const newToasts = latestNotifications.map((notif, index) => ({
      id: `${Date.now()}-${index}`,
      notification: notif
    }));

    setVisibleToasts(newToasts);

    // Auto-remover toasts após 7 segundos
    const timers = newToasts.map((toast, index) => 
      setTimeout(() => {
        setVisibleToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 7000 + (index * 500))
    );

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  const removeToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top-right':
        return 'top-0 end-0 mt-3 me-3';
      case 'top-left':
        return 'top-0 start-0 mt-3 ms-3';
      case 'bottom-right':
        return 'bottom-0 end-0 mb-3 me-3';
      case 'bottom-left':
        return 'bottom-0 start-0 mb-3 ms-3';
      default:
        return 'top-0 end-0 mt-3 me-3';
    }
  };

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container position-fixed ${getPositionClass()}`} style={{ zIndex: 9999 }}>
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className="toast show notification-toast mb-2"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {toast.notification.type === 'transferencia' && (
            <>
              <div className="toast-header bg-primary text-white">
                <i className="bi bi-arrow-left-right me-2"></i>
                <strong className="me-auto">Nova Transferência</strong>
                <small className="text-white-50">agora</small>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Fechar"
                ></button>
              </div>
              <div className="toast-body">
                <p className="mb-1">
                  <strong>{toast.notification.data.usuarioOrigem.nome}</strong> transferiu para você:
                </p>
                <p className="mb-1 text-primary fw-semibold">
                  📋 {toast.notification.data.cartaoTitulo}
                </p>
                {toast.notification.data.observacao && (
                  <p className="mb-0 small text-muted fst-italic">
                    💬 "{toast.notification.data.observacao}"
                  </p>
                )}
              </div>
            </>
          )}

          {toast.notification.type === 'cartao-update' && (
            <>
              <div className="toast-header bg-info text-white">
                <i className="bi bi-pencil-square me-2"></i>
                <strong className="me-auto">Cartão Atualizado</strong>
                <small className="text-white-50">agora</small>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Fechar"
                ></button>
              </div>
              <div className="toast-body">
                <p className="mb-0">
                  Ação: <span className="badge bg-secondary">{toast.notification.action}</span>
                </p>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
