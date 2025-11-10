import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationCenter.css';

interface NotificationCenterProps {
  userId: number;
  onNotificationClick?: (cartaoId: number) => void;
}

export function NotificationCenter({ userId, onNotificationClick }: NotificationCenterProps) {
  const { connected, notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  return (
    <div className="notification-center">
      {/* Badge de notificações */}
      <div className="dropdown">
        <button
          className="btn btn-link position-relative p-2"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Notificações"
        >
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount > 99 ? '99+' : unreadCount}
              <span className="visually-hidden">notificações não lidas</span>
            </span>
          )}
          {!connected && (
            <span className="position-absolute top-100 start-50 translate-middle">
              <i className="bi bi-exclamation-circle text-warning" title="Desconectado"></i>
            </span>
          )}
        </button>

        {/* Dropdown de notificações */}
        <div className="dropdown-menu dropdown-menu-end notification-dropdown shadow-lg" style={{ width: '380px', maxHeight: '600px', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
            <h6 className="mb-0 fw-bold">Notificações</h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-decoration-none"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Status de conexão */}
          <div className={`px-3 py-2 small ${connected ? 'text-success' : 'text-danger'}`}>
            <i className={`bi bi-circle-fill me-2`} style={{ fontSize: '8px' }}></i>
            {connected ? 'Conectado' : 'Desconectado'}
          </div>

          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
              <p className="mb-0">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="list-group-item list-group-item-action notification-item"
                  onClick={() => {
                    if (notification.type === 'transferencia' && onNotificationClick) {
                      onNotificationClick(notification.data.cartaoId);
                    }
                    markAsRead(index);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {notification.type === 'transferencia' && (
                    <>
                      <div className="d-flex align-items-start">
                        <div className="notification-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-arrow-left-right"></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-0 fw-semibold">Nova Transferência</h6>
                            <button
                              className="btn btn-sm btn-link text-muted p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(index);
                              }}
                              title="Marcar como lida"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                          <p className="mb-1 small">
                            <strong>{notification.data.usuarioOrigem.nome}</strong> transferiu para você:
                          </p>
                          <p className="mb-1 text-primary fw-semibold">
                            {notification.data.cartaoTitulo}
                          </p>
                          {notification.data.observacao && (
                            <p className="mb-1 small text-muted fst-italic">
                              "{notification.data.observacao}"
                            </p>
                          )}
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(notification.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>
                    </>
                  )}

                  {notification.type === 'cartao-update' && (
                    <>
                      <div className="d-flex align-items-start">
                        <div className="notification-icon bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-pencil-square"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0 fw-semibold">Cartão Atualizado</h6>
                          <p className="mb-1 small">
                            Ação: <span className="badge bg-secondary">{notification.action}</span>
                          </p>
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(notification.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
