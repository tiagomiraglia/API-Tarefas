import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Aba {
  id: number;
  nome: string;
  colunas: Coluna[];
}

interface Coluna {
  id: number;
  nome: string;
  recebe_whats: boolean;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  conversaId: string;
  conversaNome: string;
  onSuccess: () => void;
}

export default function CreateCartaoModal({ show, onClose, conversaId, conversaNome, onSuccess }: Props) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [abas, setAbas] = useState<Aba[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedAba, setSelectedAba] = useState<number | null>(null);
  const [selectedColuna, setSelectedColuna] = useState<number | null>(null);
  const [selectedAtendente, setSelectedAtendente] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (show) {
      fetchAbas();
      fetchUsuarios();
    }
  }, [show]);

  // Auto-seleciona a coluna com recebe_whats quando a aba é selecionada
  useEffect(() => {
    if (selectedAba && abas.length > 0) {
      const aba = abas.find(a => a.id === selectedAba);
      if (aba) {
        // Tenta encontrar uma coluna com recebe_whats = true
        const colunaWhatsApp = aba.colunas.find(c => c.recebe_whats);
        if (colunaWhatsApp) {
          setSelectedColuna(colunaWhatsApp.id);
        } else if (aba.colunas.length > 0) {
          // Se não encontrar, seleciona a primeira
          setSelectedColuna(aba.colunas[0].id);
        }
      }
    }
  }, [selectedAba, abas]);

  async function fetchAbas() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/kanban/abas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar abas');
      
      const data = await response.json();
      
      // Garante que seja um array
      if (!Array.isArray(data)) {
        console.warn('Resposta de abas não é um array:', data);
        setAbas([]);
        showToast('Erro ao carregar abas', 'error');
        return;
      }
      
      setAbas(data);

      // Auto-seleciona a primeira aba com coluna que recebe WhatsApp
      const abaComWhatsApp = data.find((aba: Aba) => 
        aba.colunas && Array.isArray(aba.colunas) && aba.colunas.some(c => c.recebe_whats)
      );
      
      if (abaComWhatsApp) {
        setSelectedAba(abaComWhatsApp.id);
      } else if (data.length > 0) {
        setSelectedAba(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar abas:', error);
      showToast('Erro ao carregar abas', 'error');
      setAbas([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsuarios() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar usuários');
      
      const data = await response.json();
      
      // Garante que seja um array
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsuarios(data.users);
      } else {
        console.warn('Resposta de usuários não é um array:', data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsuarios([]);
    }
  }

  async function handleCreateCartao() {
    if (!selectedColuna) {
      showToast('Selecione uma coluna', 'error');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/whatsapp-kanban/criar-cartao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversaId,
          conversaNome,
          colunaId: selectedColuna,
          atendenteId: selectedAtendente
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar cartão');
      }

      const result = await response.json();
      showToast('✅ Cartão criado com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar cartão:', error);
      showToast(error.message || 'Erro ao criar cartão', 'error');
    } finally {
      setCreating(false);
    }
  }

  if (!show) return null;

  const selectedAbaObj = abas.find(a => a.id === selectedAba);
  const selectedColunaObj = selectedAbaObj?.colunas.find(c => c.id === selectedColuna);

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ backgroundColor: '#1a1d29', border: '1px solid #2d3142' }}>
          <div className="modal-header" style={{ borderBottom: '1px solid #2d3142' }}>
            <h5 className="modal-title" style={{ color: '#fff' }}>
              <i className="bi bi-kanban me-2"></i>
              Criar Cartão no Kanban
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={creating}
            ></button>
          </div>
          
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Preview do que será criado */}
                <div className="alert alert-info mb-4" style={{ 
                  backgroundColor: 'rgba(37, 211, 102, 0.1)', 
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#25D366'
                }}>
                  <i className="bi bi-whatsapp me-2"></i>
                  <strong>Conversa:</strong> {conversaNome}
                </div>

                {/* Seleção de Aba */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#fff' }}>
                    <i className="bi bi-folder me-2"></i>
                    Aba
                  </label>
                  <select 
                    className="form-select"
                    style={{ 
                      backgroundColor: '#2d3142', 
                      color: '#fff',
                      border: '1px solid #3d4152'
                    }}
                    value={selectedAba || ''}
                    onChange={(e) => setSelectedAba(Number(e.target.value))}
                  >
                    {abas && Array.isArray(abas) && abas.map(aba => (
                      <option key={aba.id} value={aba.id}>
                        {aba.nome}
                        {aba.colunas && Array.isArray(aba.colunas) && aba.colunas.some(c => c.recebe_whats) && ' ⚡'}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    ⚡ indica abas com colunas configuradas para WhatsApp
                  </small>
                </div>

                {/* Seleção de Coluna */}
                {selectedAbaObj && selectedAbaObj.colunas && Array.isArray(selectedAbaObj.colunas) && (
                  <div className="mb-3">
                    <label className="form-label" style={{ color: '#fff' }}>
                      <i className="bi bi-columns me-2"></i>
                      Coluna
                    </label>
                    <select 
                      className="form-select"
                      style={{ 
                        backgroundColor: '#2d3142', 
                        color: '#fff',
                        border: '1px solid #3d4152'
                      }}
                      value={selectedColuna || ''}
                      onChange={(e) => setSelectedColuna(Number(e.target.value))}
                    >
                      {selectedAbaObj.colunas.map(coluna => (
                        <option key={coluna.id} value={coluna.id}>
                          {coluna.nome}
                          {coluna.recebe_whats && ' 💬'}
                        </option>
                      ))}
                    </select>
                    {selectedColunaObj?.recebe_whats && (
                      <small className="text-success">
                        💬 Esta coluna está configurada para receber WhatsApp
                      </small>
                    )}
                  </div>
                )}

                {/* Seleção de Atendente */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#fff' }}>
                    <i className="bi bi-person-circle me-2"></i>
                    Atribuir para (opcional)
                  </label>
                  <select 
                    className="form-select"
                    style={{ 
                      backgroundColor: '#2d3142', 
                      color: '#fff',
                      border: '1px solid #3d4152'
                    }}
                    value={selectedAtendente || ''}
                    onChange={(e) => setSelectedAtendente(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Nenhum atendente</option>
                    {usuarios && Array.isArray(usuarios) && usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome} ({usuario.email})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Deixe vazio para não atribuir a ninguém
                  </small>
                </div>

                {/* Resumo */}
                <div className="alert alert-dark mt-3" style={{ 
                  backgroundColor: '#2d3142',
                  border: '1px solid #3d4152'
                }}>
                  <strong style={{ color: '#fff' }}>Resumo:</strong>
                  <ul className="mb-0 mt-2" style={{ color: '#aaa' }}>
                    <li>Aba: <strong style={{ color: '#25D366' }}>{selectedAbaObj?.nome}</strong></li>
                    <li>Coluna: <strong style={{ color: '#25D366' }}>{selectedColunaObj?.nome}</strong></li>
                    <li>Atendente: <strong style={{ color: '#25D366' }}>
                      {selectedAtendente && usuarios && Array.isArray(usuarios)
                        ? usuarios.find(u => u.id === selectedAtendente)?.nome 
                        : 'Não atribuído'}
                    </strong></li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          <div className="modal-footer" style={{ borderTop: '1px solid #2d3142' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={creating}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={handleCreateCartao}
              disabled={!selectedColuna || creating}
            >
              {creating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Criando...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Criar Cartão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
