import React, { useState } from 'react';
import WhatsAppConversasList from './WhatsAppConversasList';
import WhatsAppChatWindow from './WhatsAppChatWindow';
import { showToast } from '../utils/toast';
import { WhatsAppConversa } from '../types/whatsapp';

export default function WhatsAppIntegration() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [conversaSelecionada, setConversaSelecionada] = useState<WhatsAppConversa | null>(null);
  const [criandoCartao, setCriandoCartao] = useState(false);
  const [refreshConversas, setRefreshConversas] = useState(0);

  async function handleCreateCartao(conversaId: string, conversaNome: string) {
    setCriandoCartao(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}/api/whatsapp-kanban/criar-cartao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversaId,
          conversaNome
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Cartão criado com sucesso!', 'success');
      } else {
        const error = await res.json();
        const errorMsg = error.error || 'Erro ao criar cartão';
        
        // Mensagens mais amigáveis
        if (errorMsg.includes('empresa associada')) {
          showToast('Seu usuário não está associado a nenhuma empresa. Entre em contato com o administrador.', 'error');
        } else if (errorMsg.includes('coluna configurada')) {
          showToast('Configure uma coluna do Kanban para receber WhatsApp. Acesse Config antropology > Kanban.', 'error');
        } else {
          showToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      showToast('Erro de conexão', 'error');
    } finally {
      setCriandoCartao(false);
    }
  }

  return (
    <div style={{
      width: '100%',
      height: '600px',
      background: '#0f1115',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      border: '1px solid #2d3142'
    }}>
      {/* Lista de Conversas */}
      <div style={{
        width: conversaSelecionada ? '35%' : '100%',
        borderRight: conversaSelecionada ? '1px solid #2d3142' : 'none',
        transition: 'width 0.3s ease',
        height: '100%'
      }}>
        <WhatsAppConversasList
          onSelectConversa={(conversa) => setConversaSelecionada(conversa)}
          conversaSelecionada={conversaSelecionada}
          refreshKey={refreshConversas}
        />
      </div>

      {/* Janela de Chat */}
      {conversaSelecionada && (
        <div style={{
          width: '65%',
          height: '100%'
        }}>
          <WhatsAppChatWindow
            conversa={conversaSelecionada}
            onClose={() => setConversaSelecionada(null)}
            onCreateCartao={handleCreateCartao}
            onMessageRead={() => setRefreshConversas(prev => prev + 1)}
          />
        </div>
      )}
    </div>
  );
}
