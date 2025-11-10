import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { WhatsAppConversa, WhatsAppMensagem } from '../types/whatsapp';
import CreateCartaoModal from './CreateCartaoModal';

interface Props {
  conversa: WhatsAppConversa;
  onClose: () => void;
  onCreateCartao?: (conversaId: string, conversaNome: string) => void;
  onMessageRead?: () => void;
}

export default function WhatsAppChatWindow({ conversa, onClose, onCreateCartao, onMessageRead }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [mensagens, setMensagens] = useState<WhatsAppMensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMensagens();
    markAsRead(); // Marca como lido ao abrir o chat
    
    // Atualiza mensagens a cada 5 segundos
    const interval = setInterval(fetchMensagens, 5000);
    return () => clearInterval(interval);
  }, [conversa.id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  async function markAsRead() {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${baseURL}/api/whatsapp-kanban/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: conversa.id })
      });
      console.log('✅ Chat marcado como lido');
      
      // Notifica o componente pai para atualizar a lista
      if (onMessageRead) {
        onMessageRead();
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  }

  async function fetchMensagens() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/whatsapp-kanban/mensagens/${conversa.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMensagens(data);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload: any = {
        phone: conversa.id,
        message: newMessage
      };

      // Se tem arquivo selecionado, converte para base64
      if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        const mediaType = getMediaType(selectedFile.type);
        
        payload.media = {
          type: mediaType,
          data: base64.split(',')[1], // Remove o prefixo data:...;base64,
          mimetype: selectedFile.type,
          filename: selectedFile.name,
          caption: newMessage || undefined
        };
      }

      const res = await fetch(`${baseURL}/api/whatsapp-kanban/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewMessage('');
        setSelectedFile(null);
        setFilePreview(null);
        await fetchMensagens();
      } else {
        showToast('Erro ao enviar mensagem', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showToast('Erro de conexão', 'error');
    } finally {
      setSending(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getMediaType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowAttachMenu(false);

    // Cria preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getContactName(): string {
    if (conversa.isGroup) {
      return conversa.name;
    }
    const phoneMatch = conversa.id.match(/(\d+)@/);
    if (phoneMatch) {
      const formatted = formatPhoneNumber(phoneMatch[1]);
      return conversa.name || formatted;
    }
    return conversa.name || 'Contato';
  }

  function handleCreateCartao() {
    setShowCreateModal(true);
  }

  function handleCreateSuccess() {
    // O toast já é exibido no modal, não precisa duplicar
  }

  return (
    <>
      <CreateCartaoModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        conversaId={conversa.id}
        conversaNome={getContactName()}
        onSuccess={handleCreateSuccess}
      />
      
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f1115'
      }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #2d3142',
        background: '#1a1d29',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button
            onClick={onClose}
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
            <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem' }}></i>
          </button>

          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: conversa.isGroup ? '#f97316' : '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            {conversa.isGroup ? (
              <i className="bi bi-people-fill"></i>
            ) : (
              getContactName().charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '1rem' }}>
              {getContactName()}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
              {conversa.isGroup ? 'Grupo' : 'Online'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleCreateCartao}
            style={{
              background: '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#ea580c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f97316'}
          >
            <i className="bi bi-kanban me-2"></i>
            Criar Cartão
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        backgroundImage: 'linear-gradient(to bottom, #0f1115, #1a1d29)'
      }}>
        {loading && mensagens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" style={{ color: '#25D366' }} role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : mensagens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Nenhuma mensagem ainda
          </div>
        ) : (
          <>
            {mensagens.map((msg, index) => (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  justifyContent: msg.fromMe ? 'flex-end' : 'flex-start',
                  marginBottom: '0.75rem'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: msg.hasMedia && msg.type === 'image' ? '0.25rem' : '0.75rem 1rem',
                  borderRadius: '12px',
                  background: msg.fromMe ? '#005C4B' : '#1a1d29',
                  color: '#f8fafc',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* Nome do remetente em grupos */}
                  {!msg.fromMe && conversa.isGroup && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#f97316',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {(msg as any).fromName || 'Desconhecido'}
                    </div>
                  )}


                  {/* Visualização de Imagem */}
                  {msg.hasMedia && (msg.type === 'image' || (msg.media && msg.media.mimetype && msg.media.mimetype.startsWith('image/'))) && (msg as any).media && (
                    <div style={{ marginBottom: msg.body ? '0.5rem' : 0 }}>
                      <img
                        src={(msg as any).media.url}
                        alt="Imagem"
                        style={{
                          maxWidth: '100%',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        onClick={() => window.open((msg as any).media.url, '_blank')}
                      />
                    </div>
                  )}

                  {/* Player de Áudio */}
                  {msg.hasMedia && (msg.type === 'audio' || (msg.media && msg.media.mimetype && msg.media.mimetype.startsWith('audio/'))) && (msg as any).media && (
                    <div style={{ marginBottom: msg.body ? '0.5rem' : 0 }}>
                      <audio
                        controls
                        style={{
                          maxWidth: '100%',
                          height: '40px',
                          background: '#222',
                          borderRadius: '6px'
                        }}
                      >
                        <source src={(msg as any).media.url} type={(msg as any).media.mimetype} />
                        Seu navegador não suporta áudio.
                      </audio>
                    </div>
                  )}

                  {msg.hasMedia && msg.type === 'document' && (msg as any).media && (
                    <a
                      href={(msg as any).media.url}
                      download
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#f8fafc',
                        marginBottom: msg.body ? '0.5rem' : 0
                      }}
                    >
                      <i className="bi bi-file-earmark-text" style={{ fontSize: '1.5rem' }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                          {(msg as any).media.fileName || 'Documento'}
                        </div>
                        {(msg as any).media.fileLength && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {Math.round((msg as any).media.fileLength / 1024)} KB
                          </div>
                        )}
                      </div>
                      <i className="bi bi-download"></i>
                    </a>
                  )}

                  {/* Texto da mensagem */}
                  {msg.body && (
                    <div style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      marginBottom: '0.25rem',
                      padding: msg.hasMedia && msg.type === 'image' ? '0.5rem' : 0
                    }}>
                      {msg.body}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.7rem',
                    color: msg.fromMe ? '#D1D7DB' : '#64748b',
                    textAlign: 'right',
                    marginTop: '0.25rem',
                    padding: msg.hasMedia && msg.type === 'image' ? '0 0.5rem 0.5rem' : 0
                  }}>
                    {formatTime(msg.timestamp)}
                    {msg.fromMe && (
                      <i className="bi bi-check-all ms-1" style={{ color: '#53bdeb' }}></i>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input de Mensagem */}
      <form onSubmit={handleSendMessage} style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #2d3142',
        background: '#1a1d29'
      }}>
        {/* Preview de arquivo selecionado */}
        {selectedFile && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#0f1115',
            borderRadius: '12px',
            border: '1px solid #2d3142'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.875rem' }}>
                <i className="bi bi-paperclip me-2"></i>
                Arquivo selecionado
              </div>
              <button
                type="button"
                onClick={clearFile}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '1.25rem'
                }}
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
            
            {filePreview ? (
              <img src={filePreview} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                <i className="bi bi-file-earmark" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <div style={{ fontSize: '0.85rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.75rem' }}>{Math.round(selectedFile.size / 1024)} KB</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          {/* Botão de anexo */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#2d3142';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <i className="bi bi-plus-circle" style={{ fontSize: '1.5rem' }}></i>
            </button>

            {/* Menu de anexos */}
            {showAttachMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '0.5rem',
                background: '#1a1d29',
                border: '1px solid #2d3142',
                borderRadius: '12px',
                padding: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 10,
                minWidth: '200px'
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#2d3142'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="bi bi-image" style={{ fontSize: '1.25rem', color: '#8b5cf6' }}></i>
                  <span style={{ fontSize: '0.9rem' }}>Imagem/Vídeo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.setAttribute('accept', 'audio/*');
                    fileInputRef.current?.click();
                    fileInputRef.current?.setAttribute('accept', 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#2d3142'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="bi bi-mic-fill" style={{ fontSize: '1.25rem', color: '#22c55e' }}></i>
                  <span style={{ fontSize: '0.9rem' }}>Áudio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.zip');
                    fileInputRef.current?.click();
                    fileInputRef.current?.setAttribute('accept', 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#2d3142'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="bi bi-file-earmark-text" style={{ fontSize: '1.25rem', color: '#3b82f6' }}></i>
                  <span style={{ fontSize: '0.9rem' }}>Documento</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Digite uma mensagem..."
              rows={1}
              style={{
                width: '100%',
                background: '#0f1115',
                border: '1px solid #2d3142',
                borderRadius: '24px',
                padding: '0.75rem 1rem',
                color: '#f8fafc',
                fontSize: '0.95rem',
                resize: 'none',
                outline: 'none',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            style={{
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!newMessage.trim() && !selectedFile) || sending ? 'not-allowed' : 'pointer',
              opacity: (!newMessage.trim() && !selectedFile) || sending ? 0.5 : 1,
              transition: 'all 0.3s',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              if ((newMessage.trim() || selectedFile) && !sending) {
                e.currentTarget.style.background = '#20BA5A';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#25D366';
            }}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-send-fill" style={{ fontSize: '1.1rem' }}></i>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
