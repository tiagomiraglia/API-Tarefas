import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

// Controle para evitar múltiplos toasts idênticos
let whatsappToastShown = false;
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { WhatsAppConversa } from '../types/whatsapp';

interface Props {
  onSelectConversa: (conversa: WhatsAppConversa) => void;
  conversaSelecionada?: WhatsAppConversa | null;
  refreshKey?: number;
}

export default function WhatsAppConversasList({ onSelectConversa, conversaSelecionada, refreshKey }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [conversas, setConversas] = useState<WhatsAppConversa[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<'contatos' | 'grupos'>('contatos');

  useEffect(() => {
    fetchConversas();
  }, [refreshKey]);

  async function fetchConversas() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/whatsapp-kanban/conversas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversas(data.sort((a: WhatsAppConversa, b: WhatsAppConversa) => b.timestamp - a.timestamp));
        } else if (data.length === 0) {
          // Lista vazia não é erro, apenas não há conversas
          setConversas([]);
        }
      } else if (res.status === 503) {
        const error = await res.json();
        if (!whatsappToastShown) {
          showToast(error.message || 'WhatsApp não conectado', 'error');
          whatsappToastShown = true;
          setTimeout(() => { whatsappToastShown = false; }, 5000);
        }
        // Mantém conversas antigas se houver
      } else {
        // Em caso de erro, mantém conversas antigas se houver
        console.warn('Erro ao carregar conversas, mantendo cache');
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      // Em caso de erro de rede, mantém conversas antigas
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function getContactName(conversa: WhatsAppConversa): string {
    if (conversa.isGroup) {
      return conversa.name || 'Grupo';
    }
    // Extrai o número do ID (ex: 5511999998888@c.us)
    const phoneMatch = conversa.id.match(/(\d+)@/);
    const formatted = phoneMatch ? formatPhoneNumber(phoneMatch[1]) : '';
    // Se tem nome, mostra nome, senão mostra número formatado
    if (conversa.name && conversa.name !== conversa.id) {
      return `${conversa.name} (${formatted})`;
    }
    return formatted || conversa.name || 'Contato';
  }

  // Separar conversas em grupos e contatos
  const contatos = conversas.filter(conv => !conv.isGroup);
  const grupos = conversas.filter(conv => conv.isGroup);

  // Filtrar por aba e busca
  const filteredConversas = (abaSelecionada === 'contatos' ? contatos : grupos).filter(conv =>
    getContactName(conv).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.lastMessage?.body || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f1115',
      borderRight: '1px solid #2d3142'
    }}>
      {/* Header + Abas */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #2d3142',
        background: '#1a1d29'
      }}>
        {/* Abas */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => setAbaSelecionada('contatos')}
            style={{
              background: abaSelecionada === 'contatos' ? '#25D366' : 'transparent',
              color: abaSelecionada === 'contatos' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem 1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s'
            }}
          >
            <i className="bi bi-person" style={{ marginRight: 6 }}></i> Mensagens
          </button>
          <button
            onClick={() => setAbaSelecionada('grupos')}
            style={{
              background: abaSelecionada === 'grupos' ? '#128C7E' : 'transparent',
              color: abaSelecionada === 'grupos' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem 1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s'
            }}
          >
            <i className="bi bi-people-fill" style={{ marginRight: 6 }}></i> Grupos
          </button>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <h5 style={{ color: '#f8fafc', margin: 0, fontWeight: '700' }}>
            <i className="bi bi-whatsapp me-2" style={{ color: '#25D366' }}></i>
            Conversas
          </h5>
          <button
            onClick={fetchConversas}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <i className="bi bi-search" style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            fontSize: '0.9rem'
          }}></i>
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#0f1115',
              border: '1px solid #2d3142',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Lista de Conversas */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        {loading && conversas.length === 0 ? (
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '100%'
          }}>
            <div className="spinner-border" style={{ color: '#25D366', width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <div style={{ color: '#cbd5e1', marginTop: '1rem', fontSize: '0.95rem' }}>
              Carregando conversas...
            </div>
          </div>
        ) : filteredConversas.length === 0 ? (
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '80%',
            maxWidth: '400px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.2)'
            }}>
              <i className="bi bi-whatsapp" style={{ fontSize: '2.5rem', color: '#fff' }}></i>
            </div>
            <div style={{ 
              color: '#f8fafc', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              fontSize: '1.1rem'
            }}>
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
            </div>
            <div style={{ 
              color: '#94a3b8', 
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              {searchTerm 
                ? 'Tente pesquisar com outros termos' 
                : (
                  <>
                    Conecte o WhatsApp acima para começar a<br />
                    visualizar e gerenciar suas conversas
                  </>
                )
              }
            </div>
            {!searchTerm && (
              <button
                onClick={fetchConversas}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Atualizar Conversas
              </button>
            )}
          </div>
        ) : (
          filteredConversas.map(conversa => (
            <div
              key={conversa.id}
              onClick={() => onSelectConversa(conversa)}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: '1px solid #2d3142',
                cursor: 'pointer',
                background: conversaSelecionada?.id === conversa.id ? '#1a1d29' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
              onMouseOver={(e) => {
                if (conversaSelecionada?.id !== conversa.id) {
                  e.currentTarget.style.background = '#1a1d2950';
                }
              }}
              onMouseOut={(e) => {
                if (conversaSelecionada?.id !== conversa.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: conversa.isGroup ? '#128C7E' : '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fff'
              }}>
                {conversa.isGroup ? (
                  <i className="bi bi-people-fill"></i>
                ) : (
                  // Avatar igual WhatsApp: letra inicial do nome ou número
                  (conversa.name && conversa.name !== conversa.id)
                    ? conversa.name.charAt(0).toUpperCase()
                    : (formatPhoneNumber((conversa.id.match(/(\d+)@/)||[])[1]||'').charAt(0) || '?')
                )}
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.25rem'
                }}>
                  <div style={{
                    color: '#f8fafc',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {getContactName(conversa)}
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    marginLeft: '0.5rem',
                    flexShrink: 0
                  }}>
                    {formatTime(conversa.timestamp)}
                  </div>
                </div>

                {/* Número formatado para contatos */}
                {!conversa.isGroup && (conversa as any).phone && (
                  <div style={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    {(conversa as any).phone}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {conversa.lastMessage?.body || 'Sem mensagens'}
                  </div>
                  {conversa.unreadCount > 0 && (
                    <div style={{
                      background: '#25D366',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {conversa.unreadCount}
                    </div>
                  )}
                </div>

                {/* Status do Atendimento */}
                {conversa.cartao && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Badge da Coluna */}
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <i className="bi bi-kanban" style={{ fontSize: '0.65rem' }}></i>
                      {conversa.cartao.coluna}
                    </div>

                    {/* Atendente Responsável */}
                    {conversa.cartao.atendente && (
                      <div style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#c084fc',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#a855f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          fontWeight: '700',
                          color: '#fff'
                        }}>
                          {conversa.cartao.atendente.iniciais}
                        </div>
                        {conversa.cartao.atendente.nome.split(' ')[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
