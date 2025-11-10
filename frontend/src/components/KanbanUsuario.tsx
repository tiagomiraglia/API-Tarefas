import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAbas } from '../utils/kanbanApi';
import { showToast } from '../utils/toast';
import axios from 'axios';
import ChatWhatsApp from './ChatWhatsApp';
import TransferirAtendimentoModal from './TransferirAtendimentoModal';
import CartaoDetalhesModal from './CartaoDetalhesModal';

interface Aba {
  id: number;
  nome: string;
  ordem: number;
  colunas: Coluna[];
}
interface Coluna {
  id: number;
  nome: string;
  ordem: number;
  aba_id: number;
  recebe_whats: boolean;
  cartoes?: Cartao[];
}
interface Cartao {
  id: number;
  titulo: string;
  descricao: string | null;
  coluna_id: number;
  ordem: number;
  cor: string;
  status_atendimento?: string | null;
  valor_orcamento?: string | null;
  usuario_atribuido?: {
    id: number;
    nome: string;
    foto: string | null;
  } | null;
  whatsapp?: {
    id: number;
    conversa_id: string;
    conversa_nome: string | null;
  } | null;
  _count?: {
    anexos: number;
    historico: number;
  };
}


// Novo modelo: permissoes.kanban é um array de permissões
interface PermissaoKanban {
  aba_id: number;
  coluna_id?: number;
  tipo: string;
}

// Componente do cartão arrastável
const CartaoItem: React.FC<{ 
  cartao: Cartao; 
  onClick: () => void;
  onTransferir?: (cartao: Cartao) => void;
}> = ({ cartao, onClick, onTransferir }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `cartao-${cartao.id}` 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: '#ffffff',
    cursor: 'grab',
    borderLeft: cartao.whatsapp ? '4px solid #25D366' : '4px solid transparent'
  };

  const handleTransferClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onTransferir) {
      onTransferir(cartao);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Só abre o modal se não clicar no menu
    if (!(e.target as HTMLElement).closest('.action-menu')) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card mb-2 shadow-sm position-relative"
    >
      <div className="card-body p-3" onClick={handleCardClick}>
        {/* Header do Cartão */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="fw-bold" style={{ fontSize: '0.95rem', color: '#1e293b' }}>
              {cartao.titulo}
            </div>
            {/* Badge de Status */}
            {cartao.status_atendimento && (
              <span 
                className="badge mt-1"
                style={{
                  backgroundColor: 
                    cartao.status_atendimento === 'novo' ? '#6366f1' :
                    cartao.status_atendimento === 'em_atendimento' ? '#f59e0b' :
                    cartao.status_atendimento === 'aguardando_cliente' ? '#8b5cf6' :
                    cartao.status_atendimento === 'aguardando_interno' ? '#06b6d4' :
                    cartao.status_atendimento === 'resolvido' ? '#10b981' :
                    cartao.status_atendimento === 'cancelado' ? '#ef4444' : '#6366f1',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {cartao.status_atendimento === 'novo' ? 'Novo' :
                 cartao.status_atendimento === 'em_atendimento' ? 'Em Atendimento' :
                 cartao.status_atendimento === 'aguardando_cliente' ? 'Aguardando Cliente' :
                 cartao.status_atendimento === 'aguardando_interno' ? 'Aguardando Interno' :
                 cartao.status_atendimento === 'resolvido' ? 'Resolvido' :
                 cartao.status_atendimento === 'cancelado' ? 'Cancelado' : 
                 cartao.status_atendimento}
              </span>
            )}
          </div>
          
          {/* Menu de Ações */}
          <div className="action-menu position-relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="btn btn-sm btn-link text-secondary p-0"
              style={{ fontSize: '1.1rem' }}
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            
            {showMenu && (
              <div 
                className="dropdown-menu dropdown-menu-end show position-absolute"
                style={{ 
                  top: '100%', 
                  right: 0, 
                  zIndex: 1000,
                  minWidth: '200px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <button 
                  className="dropdown-item d-flex align-items-center"
                  onClick={handleCardClick}
                >
                  <i className="bi bi-eye me-2"></i>
                  Ver Detalhes
                </button>
                {cartao.whatsapp && (
                  <>
                    <button 
                      className="dropdown-item d-flex align-items-center"
                      onClick={handleCardClick}
                    >
                      <i className="bi bi-chat-dots me-2 text-success"></i>
                      Responder WhatsApp
                    </button>
                    {onTransferir && (
                      <button 
                        className="dropdown-item d-flex align-items-center"
                        onClick={handleTransferClick}
                      >
                        <i className="bi bi-arrow-left-right me-2 text-primary"></i>
                        Transferir Atendimento
                      </button>
                    )}
                  </>
                )}
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item d-flex align-items-center text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                >
                  <i className="bi bi-x me-2"></i>
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badge do WhatsApp */}
        {cartao.whatsapp && (
          <div className="mb-2">
            <span 
              className="badge" 
              style={{ 
                backgroundColor: '#e7f5ec',
                color: '#0d9b4c',
                fontSize: '0.7rem',
                fontWeight: '600',
                padding: '0.25rem 0.5rem'
              }}
            >
              <i className="bi bi-whatsapp me-1"></i>
              Conversa WhatsApp
            </span>
          </div>
        )}

        {/* Descrição / Última Mensagem */}
        {cartao.descricao && (
          <div 
            className="text-muted mb-2" 
            style={{ 
              fontSize: '0.8rem',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {cartao.descricao}
          </div>
        )}

        {/* Footer: Atendente */}
        {cartao.usuario_atribuido && (
          <div className="d-flex align-items-center mt-2 pt-2 border-top">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#6366f1',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '700'
              }}
            >
              {cartao.usuario_atribuido.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {cartao.usuario_atribuido.nome}
            </span>
          </div>
        )}

        {/* Info adicional */}
        {cartao._count && (cartao._count.anexos > 0 || cartao._count.historico > 0) && (
          <div className="d-flex gap-2 mt-2 pt-2 border-top">
            {cartao._count.anexos > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                <i className="bi bi-paperclip me-1"></i>
                {cartao._count.anexos}
              </span>
            )}
            {cartao._count.historico > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                <i className="bi bi-clock-history me-1"></i>
                {cartao._count.historico}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanUsuario: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const empresaId = localStorage.getItem('empresa_id') ? Number(localStorage.getItem('empresa_id')) : undefined;
  const userId = localStorage.getItem('id') ? Number(localStorage.getItem('id')) : undefined;
  const [abas, setAbas] = useState<Aba[]>([]);
  const [kanbanPerms, setKanbanPerms] = useState<PermissaoKanban[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<number | null>(null);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<Cartao | null>(null);
  const [filtroAtendente, setFiltroAtendente] = useState<'meus' | 'todos'>('meus'); // Novo filtro
  const [showModalTransferir, setShowModalTransferir] = useState(false); // Modal de transferência
  const [cartaoParaTransferir, setCartaoParaTransferir] = useState<Cartao | null>(null);
  const [showModalCartao, setShowModalCartao] = useState(false);
  const [showModalNovoCartao, setShowModalNovoCartao] = useState(false);
  const [colunaNovoCartao, setColunaNovoCartao] = useState<number | null>(null);
  const [novoCartaoTitulo, setNovoCartaoTitulo] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const abasRes = await getAbas(token, empresaId);
        const abasData = abasRes.data as Aba[];
        
        // Buscar cartões para cada aba
        for (const aba of abasData) {
          const cartoesRes = await axios.get(`${baseURL}/api/kanban/cartoes?abaId=${aba.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const cartoes = cartoesRes.data as Cartao[];
          
          // Distribuir cartões pelas colunas
          aba.colunas.forEach(coluna => {
            coluna.cartoes = cartoes.filter(c => c.coluna_id === coluna.id).sort((a, b) => a.ordem - b.ordem);
          });
        }
        
        setAbas(abasData);
        if (abasData.length > 0 && !abaAtiva) setAbaAtiva(abasData[0].id);
        
        // Lê permissoes do localStorage (salvo no login)
        const permsStr = localStorage.getItem('permissoes');
        if (permsStr) {
          const perms = JSON.parse(permsStr);
          // Converte formato do backend para o formato esperado
          if (perms.kanban && perms.kanban.abas && Array.isArray(perms.kanban.abas)) {
            const permissoesConvertidas: PermissaoKanban[] = [];
            perms.kanban.abas.forEach((aba: any) => {
              if (aba.colunas && aba.colunas.length > 0) {
                // Permissões específicas por coluna
                aba.colunas.forEach((colunaId: number) => {
                  permissoesConvertidas.push({
                    aba_id: aba.id,
                    coluna_id: colunaId,
                    tipo: 'editar'
                  });
                });
              } else {
                // Acesso a todas as colunas da aba
                permissoesConvertidas.push({
                  aba_id: aba.id,
                  tipo: 'editar'
                });
              }
            });
            setKanbanPerms(permissoesConvertidas);
          } else if (Array.isArray(perms.kanban)) {
            setKanbanPerms(perms.kanban);
          } else {
            setKanbanPerms(null);
          }
        } else {
          setKanbanPerms(null);
        }
      } catch (error) {
        showToast('Erro ao carregar Kanban', 'error');
        console.error(error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Novo: Agrupa permissoes.kanban por aba e colunas permitidas
  let abasPermitidas: Aba[] = [];
  if (kanbanPerms && kanbanPerms.length > 0) {
    const permsPorAba: { [abaId: number]: { colunas: number[] } } = {};
    kanbanPerms.forEach(perm => {
      if (!permsPorAba[perm.aba_id]) permsPorAba[perm.aba_id] = { colunas: [] };
      if (perm.coluna_id && !permsPorAba[perm.aba_id].colunas.includes(perm.coluna_id)) {
        permsPorAba[perm.aba_id].colunas.push(perm.coluna_id);
      }
    });
    abasPermitidas = abas
      .filter(aba => permsPorAba[aba.id] || kanbanPerms.some(p => p.aba_id === aba.id && !p.coluna_id))
      .map(aba => {
        const temTodas = kanbanPerms.some(p => p.aba_id === aba.id && !p.coluna_id);
        return {
          ...aba,
          colunas: temTodas
            ? aba.colunas
            : aba.colunas.filter(col => permsPorAba[aba.id]?.colunas.includes(col.id))
        };
      })
      .filter(aba => aba.colunas.length > 0);
  } else {
    abasPermitidas = abas;
  }

  const abaAtual = abasPermitidas.find(a => a.id === abaAtiva) || abasPermitidas[0];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const cartaoId = Number(String(active.id).replace('cartao-', ''));
    const colunaDestinoId = Number(String(over.id).replace('coluna-', ''));

    try {
      await axios.post(`${baseURL}/api/kanban/cartoes/move`, {
        cartaoId,
        destino_coluna_id: colunaDestinoId,
        nova_ordem: 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar estado local
      setAbas(prev => prev.map(aba => {
        if (aba.id === abaAtiva) {
          const novasColunas = aba.colunas.map(col => {
            const cartoes = col.cartoes || [];
            // Remover cartão da coluna origem
            const novosCartoes = cartoes.filter(c => c.id !== cartaoId);
            
            // Adicionar à coluna destino
            if (col.id === colunaDestinoId) {
              const cartao = cartoes.find(c => c.id === cartaoId) || 
                             aba.colunas.flatMap(c => c.cartoes || []).find(c => c.id === cartaoId);
              if (cartao) {
                novosCartoes.push({ ...cartao, coluna_id: colunaDestinoId });
              }
            }
            
            return { ...col, cartoes: novosCartoes };
          });
          return { ...aba, colunas: novasColunas };
        }
        return aba;
      }));

      showToast('Cartão movido com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao mover cartão', 'error');
      console.error(error);
    }
  };

  const handleCriarCartao = async () => {
    if (!novoCartaoTitulo.trim() || !colunaNovoCartao) return;
    
    try {
      const res = await axios.post(`${baseURL}/api/kanban/cartoes`, {
        titulo: novoCartaoTitulo,
        coluna_id: colunaNovoCartao
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar estado local
      setAbas(prev => prev.map(aba => ({
        ...aba,
        colunas: aba.colunas.map(col => 
          col.id === colunaNovoCartao 
            ? { ...col, cartoes: [...(col.cartoes || []), res.data as Cartao] }
            : col
        )
      })));

      setShowModalNovoCartao(false);
      setNovoCartaoTitulo('');
      showToast('Cartão criado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao criar cartão', 'error');
      console.error(error);
    }
  };

  const handleTransferirClick = (cartao: Cartao) => {
    setCartaoParaTransferir(cartao);
    setShowModalTransferir(true);
  };

  const handleTransferSuccess = () => {
    // Recarregar dados
    const fetchData = async () => {
      try {
        const abasRes = await getAbas(token, empresaId);
        const abasData = abasRes.data as Aba[];
        
        for (const aba of abasData) {
          const cartoesRes = await axios.get(`${baseURL}/api/kanban/cartoes?abaId=${aba.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const cartoes = cartoesRes.data as Cartao[];
          
          aba.colunas.forEach(coluna => {
            coluna.cartoes = cartoes.filter(c => c.coluna_id === coluna.id).sort((a, b) => a.ordem - b.ordem);
          });
        }
        
        setAbas(abasData);
      } catch (error) {
        console.error('Erro ao recarregar:', error);
      }
    };
    fetchData();
  };

  const filtrarCartoes = (cartoes: Cartao[]): Cartao[] => {
    if (filtroAtendente === 'todos') {
      return cartoes;
    }
    // Filtrar apenas cartões atribuídos ao usuário atual
    return cartoes.filter(c => c.usuario_atribuido?.id === userId);
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Meu Kanban</h2>
        
        {/* Filtro de Atendimento */}
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${filtroAtendente === 'meus' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFiltroAtendente('meus')}
          >
            <i className="bi bi-person-check me-2"></i>
            Meus Atendimentos
          </button>
          <button
            type="button"
            className={`btn ${filtroAtendente === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFiltroAtendente('todos')}
          >
            <i className="bi bi-people me-2"></i>
            Todos
          </button>
        </div>
      </div>

      {/* Banner de Ajuda */}
      <div className="alert alert-info d-flex align-items-start mb-4" style={{ 
        backgroundColor: '#e0f2fe',
        border: '1px solid #7dd3fc',
        borderRadius: '8px'
      }}>
        <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem', color: '#0284c7' }}></i>
        <div style={{ flex: 1 }}>
          <h6 className="alert-heading mb-2" style={{ color: '#0c4a6e', fontWeight: '600' }}>
            Como usar seu Kanban
          </h6>
          <ul className="mb-0 ps-3" style={{ fontSize: '0.9rem', color: '#075985' }}>
            <li><strong>Clique nos 3 pontos</strong> do cartão para ver as opções (responder, transferir, etc.)</li>
            <li><strong>Cartões com borda verde</strong> = Conversas do WhatsApp</li>
            <li><strong>Arraste e solte</strong> cartões entre colunas para mudar o status</li>
            <li><strong>Use "Meus Atendimentos"</strong> para ver apenas seus cartões</li>
            <li><strong>Transfira</strong> atendimentos para outros membros da equipe pelo menu do cartão</li>
          </ul>
        </div>
      </div>
      {loading ? (
        <div className="text-center"><div className="spinner-border"></div></div>
      ) : (
        <>
          {/* Abas */}
          {abasPermitidas.length > 1 && (
            <ul className="nav nav-tabs mb-3">
              {abasPermitidas.map(aba => (
                <li className="nav-item" key={aba.id}>
                  <button
                    className={`nav-link ${abaAtiva === aba.id ? 'active' : ''}`}
                    onClick={() => setAbaAtiva(aba.id)}
                  >
                    {aba.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {abasPermitidas.length === 0 ? (
            <p className="text-secondary">Nenhuma permissão de Kanban atribuída.</p>
          ) : abaAtual ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="d-flex gap-3" style={{ overflowX: 'auto' }}>
                {abaAtual.colunas.map(coluna => (
                  <div key={coluna.id} className="border rounded p-3 bg-light" style={{ minWidth: 280, maxWidth: 320 }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">{coluna.nome}</h5>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setColunaNovoCartao(coluna.id);
                          setShowModalNovoCartao(true);
                        }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                    
                    <SortableContext 
                      items={(coluna.cartoes || []).map(c => `cartao-${c.id}`)} 
                      strategy={verticalListSortingStrategy}
                      id={`coluna-${coluna.id}`}
                    >
                      <div style={{ minHeight: 100 }}>
                        {filtrarCartoes(coluna.cartoes || []).map(cartao => (
                          <CartaoItem
                            key={cartao.id}
                            cartao={cartao}
                            onClick={() => {
                              setCartaoSelecionado(cartao);
                              setShowModalCartao(true);
                            }}
                            onTransferir={handleTransferirClick}
                          />
                        ))}
                        {filtroAtendente === 'meus' && filtrarCartoes(coluna.cartoes || []).length === 0 && (coluna.cartoes || []).length > 0 && (
                          <div className="text-muted text-center p-3" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-inbox"></i>
                            <div>Nenhum cartão atribuído a você nesta coluna</div>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </DndContext>
          ) : null}
        </>
      )}

      {/* Modal Novo Cartão */}
      {showModalNovoCartao && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Novo Cartão</h5>
                <button className="btn-close" onClick={() => setShowModalNovoCartao(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Título do cartão"
                  value={novoCartaoTitulo}
                  onChange={e => setNovoCartaoTitulo(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModalNovoCartao(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleCriarCartao}>
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cartão - Nova versão melhorada */}
      {showModalCartao && cartaoSelecionado && (
        <CartaoDetalhesModal
          show={showModalCartao}
          onClose={() => {
            setShowModalCartao(false);
            setCartaoSelecionado(null);
          }}
          cartao={cartaoSelecionado}
          onUpdate={handleTransferSuccess}
          onTransferir={handleTransferirClick}
        />
      )}

      {/* Modal de Transferência */}
      {cartaoParaTransferir && (
        <TransferirAtendimentoModal
          show={showModalTransferir}
          onClose={() => {
            setShowModalTransferir(false);
            setCartaoParaTransferir(null);
          }}
          cartaoId={cartaoParaTransferir.id}
          cartaoTitulo={cartaoParaTransferir.titulo}
          atendenteAtual={cartaoParaTransferir.usuario_atribuido || null}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
};

export default KanbanUsuario;
