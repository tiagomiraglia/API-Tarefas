import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';
import { sendWhatsappMessage, getHistory, getIaReply } from '../services/api';

interface ChatMessage {
  from: 'user' | 'operator' | 'ia';
  content: string;
}


const DUMMY_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoib3BlcmFkb3IiLCJpYXQiOjE3NTM0ODI0NDN9.9BYsUf18TdQv4IsykYl-nbmEJ-8HrxnK9D5H2Add1Yc'; // JWT válido gerado para autenticação

interface ChatProps {
  clientId: string;
}

const Chat: React.FC<ChatProps> = ({ clientId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getHistory(clientId, DUMMY_TOKEN) as ChatMessage[];
        if (Array.isArray(history)) setMessages(history);
      } catch {
        setError('Erro ao carregar histórico.');
      }
    }
    fetchHistory();
  }, [clientId]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    const userMsg: ChatMessage = { from: 'user', content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      await sendWhatsappMessage(userMsg.content, clientId, DUMMY_TOKEN);
      const ia = await getIaReply(userMsg.content, DUMMY_TOKEN) as { reply: string };
      setMessages((msgs) => [...msgs, { from: 'ia', content: ia.reply }]);
    } catch {
      setMessages((msgs) => [...msgs, { from: 'ia', content: 'Erro ao obter resposta da IA.' }]);
      setError('Erro ao enviar mensagem ou obter resposta da IA.');
    }
    setLoading(false);
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow p-4 w-100" style={{ maxWidth: 500 }}>
        <h2 className="mb-4 text-center">Painel de Atendimento WhatsApp</h2>
        <div ref={chatRef} className="mb-3 bg-white rounded p-2" style={{ height: 300, overflowY: 'auto' }}>
          {messages.map((msg, i) => <Message key={i} from={msg.from} content={msg.content} />)}
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="d-flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="form-control"
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="btn btn-primary px-4">
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
