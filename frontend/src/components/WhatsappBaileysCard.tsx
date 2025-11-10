import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

interface WhatsAppSession {
  sessionId: string;
  telefone?: string | null;
  status: "disconnected" | "connecting" | "connected" | "qr";
  hasQR?: boolean;
  client_name?: string | null;
  created_at?: string;
}

const WhatsappBaileysCard: React.FC = () => {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:4000/api/whatsapp/sessions", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.log("Erro ao buscar sess�es:", error);
    }
  };

  const createSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:4000/api/whatsapp/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedSessionId(data.sessionId);
        await fetchSessions();
        startQRPolling(data.sessionId);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao criar sess�o");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const startQRPolling = (sessionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let currentSessionId = sessionId; // Permitir atualização do sessionId

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/whatsapp/sessions/${currentSessionId}/qr`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();

          // Se o sessionId mudou (após conexão), atualizar
          if (data.sessionId && data.sessionId !== currentSessionId) {
            console.log(`SessionId atualizado: ${currentSessionId} → ${data.sessionId}`);
            currentSessionId = data.sessionId;
            setSelectedSessionId(data.sessionId);
          }

          if (data.status === "connected" || data.status === "disconnected") {
            if (interval) clearInterval(interval);
            setPollingInterval(null);
            setQrCode(null);
            setSelectedSessionId(null);
            await fetchSessions();
          } else if (data.qr) {
            setQrCode(data.qr);
            await fetchSessions();
          }
        }
      } catch (error) {
        console.error("Erro no polling:", error);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const disconnectAllSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      for (const session of sessions) {
        await fetch(`http://localhost:4000/api/whatsapp/sessions/${session.sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await fetchSessions();
    } catch (error) {
      alert("Erro ao desconectar sess�es");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <span className="badge" style={{ background: "#10b981", color: "white" }}>Conectado</span>;
      case "connecting":
      case "qr":
        return <span className="badge" style={{ background: "#f59e0b", color: "white" }}>Aguardando QR</span>;
      default:
        return <span className="badge" style={{ background: "#6b7280", color: "white" }}>Desconectado</span>;
    }
  };

  useEffect(() => {
    fetchSessions();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return (
    <>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">WhatsApp (Baileys)</h5>
          
          {sessions.length === 0 ? (
            <div>
              <p className="text-muted">Nenhuma sess�o ativa</p>
              <button 
                className="btn btn-success" 
                onClick={createSession}
                disabled={loading}
              >
                {loading ? "Conectando..." : "Conectar WhatsApp"}
              </button>
            </div>
          ) : (
            <div>
              {sessions.map((session) => (
                <div key={session.sessionId} className="mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Telefone:</strong> {session.telefone || "N�o conectado"}
                      <br />
                      {session.client_name && (
                        <>
                          <strong>Nome:</strong> {session.client_name}
                          <br />
                        </>
                      )}
                      <strong>Status:</strong> {getStatusBadge(session.status)}
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                className="btn btn-danger" 
                onClick={disconnectAllSessions}
                disabled={loading}
              >
                Desconectar Todas
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal show={!!qrCode} onHide={() => setQrCode(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Escaneie o QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {qrCode && (
            <img 
              src={qrCode} 
              alt="QR Code WhatsApp" 
              style={{ maxWidth: "100%", height: "auto" }}
            />
          )}
          <p className="mt-3 text-muted">
            Abra o WhatsApp no seu celular e escaneie este c�digo
          </p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default WhatsappBaileysCard;
