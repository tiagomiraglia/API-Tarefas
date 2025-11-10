import React, { useEffect, useState, useRef } from 'react';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import axios from 'axios';
import { showToast } from '../utils/toast';

interface Mensagem {
  id: number;
  mensagem_id: string;
  autor: string;
  conteudo: string | null;
  tipo: string;
  midia_url: string | null;
  is_from_me: boolean;
  timestamp: string;
  status: string | null;
}

interface ChatWhatsAppProps {
  cartaoId: number;
  conversaId: string;
  conversaNome: string | null;
}

const ChatWhatsApp: React.FC<ChatWhatsAppProps> = ({ cartaoId, conversaId, conversaNome }) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token') || '';
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Carrega mensagens iniciais ao montar ou trocar conversa/cartao
  useEffect(() => {
    carregarMensagens();
    // Polling a cada 5 segundos para garantir atualização
    const interval = setInterval(() => {
      carregarMensagens(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [cartaoId, conversaId]);

  // Real-time socket subscription
  useRealtimeNotifications({
    onNewMessage: (payload) => {
      // Aceita variantes: id, conversa_id, phone, client_name
      const ids = [
        String(payload?.id || ''),
        String(payload?.conversa_id || ''),
        String(payload?.phone || ''),
        String(payload?.client_name || ''),
        String(payload?.original?.id || ''),
        String(payload?.original?.conversa_id || ''),
        String(payload?.original?.phone || ''),
        String(payload?.original?.client_name || '')
      ];
      if (ids.includes(conversaId)) {
        carregarMensagens(true);
      }
    }
  });

  const carregarMensagens = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/whatsapp-kanban/mensagens/${conversaId}?cartaoId=${cartaoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensagens(res.data as Mensagem[]);
    } catch (error) {
      if (!silent) showToast('Erro ao carregar mensagens', 'error');
      console.error(error);
    }
    if (!silent) setLoading(false);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    setEnviando(true);
    try {
      const payload: any = {
        phone: conversaId,
        message: novaMensagem
      };
      // Se quiser adicionar suporte a mídia, inclua aqui (igual admin)
      // if (selectedFile) { ... }
      await axios.post(`${baseURL}/api/whatsapp-kanban/enviar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNovaMensagem('');
      await carregarMensagens(true);
    } catch (error) {
      showToast('Erro ao enviar mensagem', 'error');
      console.error(error);
    }
    setEnviando(false);
  };

  const sincronizar = async () => {
    setLoading(true);
    try {
      await axios.post(`${baseURL}/api/whatsapp-kanban/sincronizar`, {
        cartaoId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await carregarMensagens(true);
      showToast('Mensagens sincronizadas', 'success');
    } catch (error) {
      showToast('Erro ao sincronizar', 'error');
      console.error(error);
    }
    setLoading(false);
  };

  const formatarHora = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-whatsapp text-success fs-4"></i>
          <div>
            <div className="fw-bold">{conversaNome || conversaId}</div>
            <div className="text-muted small">{conversaId}</div>
          </div>
        </div>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={sincronizar}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise"></i> Sincronizar
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: '400px', minHeight: '300px' }}>
        {loading && mensagens.length === 0 ? (
          <div className="text-center">
            <div className="spinner-border spinner-border-sm"></div>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="text-center text-muted">Nenhuma mensagem</div>
        ) : (
          <>
            {mensagens.map((msg) => (
              <div 
                key={msg.id} 
                className={`d-flex mb-3 ${msg.is_from_me ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div 
                  className={`p-2 rounded ${msg.is_from_me ? 'bg-primary text-white' : 'bg-light'}`}
                  style={{ maxWidth: '70%' }}
                >
                  {!msg.is_from_me && (
                    <div className="small fw-bold mb-1">{msg.autor}</div>
                  )}
                  {msg.tipo === 'image' && msg.midia_url ? (
                    <img src={msg.midia_url} alt="Imagem" className="img-fluid rounded mb-1" />
                  ) : msg.tipo === 'video' && msg.midia_url ? (
                    <video src={msg.midia_url} controls className="w-100 rounded mb-1"></video>
                  ) : null}
                  {msg.conteudo && <div>{msg.conteudo}</div>}
                  <div className={`small mt-1 ${msg.is_from_me ? 'text-white-50' : 'text-muted'}`}>
                    {formatarHora(msg.timestamp)}
                    {msg.is_from_me && msg.status && (
                      <span className="ms-1">
                        {msg.status === 'read' && '✓✓'}
                        {msg.status === 'delivered' && '✓✓'}
                        {msg.status === 'sent' && '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input de mensagem */}
      <div className="border-top p-3 bg-light">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Digite sua mensagem..."
            value={novaMensagem}
            onChange={e => setNovaMensagem(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && enviarMensagem()}
            disabled={enviando}
          />
          <button 
            className="btn btn-primary"
            onClick={enviarMensagem}
            disabled={enviando || !novaMensagem.trim()}
          >
            {enviando ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-send"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWhatsApp;
