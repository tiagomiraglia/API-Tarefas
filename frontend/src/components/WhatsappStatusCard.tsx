import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function WhatsappStatusCard() {
  const [status, setStatus] = useState<'connected'|'disconnected'|'qrcode'|'connecting'|'error'|string>('disconnected');
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string|null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  async function fetchStatus() {
    const res = await fetch('/api/whatsapp/status');
    if (res.ok) {
      const data = await res.json();
      setStatus(data.status);
      if (data.qr) setQr(data.qr);
    }
  }

  async function handleConnect() {
    setLoading(true);
    setQr(null);
    const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
    setLoading(false);
    fetchStatus();
  }

  async function handleDisconnect() {
    setLoading(true);
    await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    setLoading(false);
    fetchStatus();
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    // Socket.IO integration
    const socket = io(); // assumes same origin
    socket.on('whatsapp-status', (data: { status: string, qr?: string }) => {
      setStatus(data.status);
      if (data.qr) setQr(data.qr);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Só abre o modal se status for 'qrcode' e não estiver fechando manualmente
    if (status === 'qrcode' && !showQrModal) {
      setShowQrModal(true);
    }
    if (status !== 'qrcode' && showQrModal) {
      setShowQrModal(false);
    }
    // eslint-disable-next-line
  }, [status, qr]);

  // Função para fechar o modal e atualizar status
  // Flag para evitar reabrir modal ao fechar manualmente
  const [manualClose, setManualClose] = useState(false);

  async function handleCloseQrModal(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setManualClose(true);
    setShowQrModal(false);
    // Se o QR não foi escaneado, desconecta no backend
    if (status === 'qrcode') {
      setStatus('disconnected');
      setQr(null);
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      fetchStatus();
    }
  }

  // Reset manualClose flag quando status mudar
  useEffect(() => {
    if (manualClose && status !== 'qrcode') {
      setManualClose(false);
    }
  }, [status, manualClose]);

  return (
    <div className="card border-0 shadow-lg mb-4" style={{ maxWidth: 380, margin: '0 auto', background: '#f8fafc', borderRadius: 18 }}>
      <div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-whatsapp" style={{ fontSize: 32, color: '#25D366', marginRight: 12 }}></i>
          <span className="fw-bold" style={{ fontSize: 20 }}>WhatsApp</span>
        </div>
        <div className="mb-3">
          {status === 'connected' && <span className="text-success fw-semibold"><i className="bi bi-check-circle me-2"></i>Conectado</span>}
          {status === 'disconnected' && <span className="text-danger fw-semibold"><i className="bi bi-x-circle me-2"></i>Desconectado</span>}
          {status === 'connecting' && <span className="text-warning fw-semibold"><i className="bi bi-arrow-repeat me-2"></i>Conectando...</span>}
          {status === 'qrcode' && <span className="text-info fw-semibold"><i className="bi bi-qr-code me-2"></i>Escaneie o QR Code</span>}
          {status === 'error' && <span className="text-danger fw-semibold"><i className="bi bi-exclamation-triangle me-2"></i>Erro</span>}
        </div>
        <div className="d-flex gap-2">
          {status !== 'connected' ? (
            <button className="btn btn-success px-4 py-2" style={{ fontWeight: 500, fontSize: 16 }} onClick={handleConnect} disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : <i className="bi bi-plug me-2"></i>}
              Conectar
            </button>
          ) : (
            <button className="btn btn-danger px-4 py-2" style={{ fontWeight: 500, fontSize: 16 }} onClick={handleDisconnect} disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : <i className="bi bi-x-circle me-2"></i>}
              Desconectar
            </button>
          )}
        </div>
      </div>
      {/* Modal para QR Code */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={handleCloseQrModal}>
          <div style={{
            background: '#fff',
            padding: 40,
            borderRadius: 18,
            boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
            textAlign: 'center',
            position: 'relative',
            minWidth: 340,
            minHeight: 320
          }} onClick={e => e.stopPropagation()}>
            <div className="mb-3">
              <i className="bi bi-qr-code" style={{ fontSize: 36, color: '#25D366' }}></i>
            </div>
            <h5 className="mb-4" style={{ fontWeight: 600 }}>Escaneie o QR Code do WhatsApp</h5>
            {!qr ? (
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 180 }}>
                <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} role="status"></div>
                <div style={{ fontSize: 18, color: '#555' }}>Aguardando QR Code...</div>
              </div>
            ) : (
              <img src={qr} alt="QR Code" style={{ maxWidth: 260, maxHeight: 260, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
            )}
            <button className="btn btn-secondary mt-4 px-4 py-2" style={{ fontWeight: 500, fontSize: 16 }} onClick={e => handleCloseQrModal(e)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
