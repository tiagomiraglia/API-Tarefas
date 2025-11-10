import React from 'react';

export interface UsuarioTime {
  id: number;
  nome: string;
  email: string;
  permissoes: any;
  nivel?: string;
  is_superuser?: boolean;
  foto?: string;
  ultimo_acesso?: string;
  suspenso?: boolean;
}

interface ListaUsuariosProps {
  usuarios: UsuarioTime[];
  onEdit?: (usuario: UsuarioTime) => void;
  onEditarPermissoes: (usuario: UsuarioTime) => void;
  onSuspender: (usuario: UsuarioTime) => void;
  onDelete: (usuario: UsuarioTime) => void;
}

export default function ListaUsuarios({ usuarios, onEdit, onEditarPermissoes, onSuspender, onDelete }: ListaUsuariosProps) {
  return (
    <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden' }}>
      {usuarios.length === 0 ? (
        <div className="text-center py-5" style={{ color: '#64748b' }}>
          <i className="bi bi-people" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.3 }}></i>
          <p className="mb-0">Nenhum usuário cadastrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
          {usuarios.map((usuario, index) => (
            <div 
              key={usuario.id} 
              style={{ 
                background: '#1e293b',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                border: '1px solid #334155',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.borderColor = '#475569';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                {usuario.foto ? (
                  <img 
                    src={usuario.foto} 
                    alt={usuario.nome} 
                    className="rounded-circle" 
                    style={{ width: 48, height: 48, objectFit: 'cover', border: '2px solid #334155' }} 
                  />
                ) : (
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" 
                    style={{ 
                      width: 48, 
                      height: 48, 
                      fontSize: 16, 
                      background: index % 2 === 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: '2px solid #334155'
                    }}
                  >
                    {usuario.nome ? usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'SU'}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '600' }}>
                    {usuario.nome}
                  </span>
                  {usuario.suspenso && (
                    <span style={{ 
                      background: '#64748b20',
                      color: '#64748b',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <i className="bi bi-pause-circle"></i>
                      Suspenso
                    </span>
                  )}
                  {(usuario.is_superuser || usuario.nivel === 'admin') && (
                    <span style={{ 
                      background: '#16a34a20',
                      color: '#16a34a',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Admin
                    </span>
                  )}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  {usuario.email}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(usuario)} 
                    title="Editar usuário"
                    style={{ 
                      background: 'transparent',
                      color: '#3b82f6',
                      border: '1px solid #3b82f620',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.background = '#3b82f620'; 
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.background = 'transparent'; 
                      e.currentTarget.style.borderColor = '#3b82f620';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                )}
                
                <button 
                  onClick={() => onEditarPermissoes(usuario)} 
                  title="Editar permissões"
                  style={{ 
                    background: 'transparent',
                    color: '#8b5cf6',
                    border: '1px solid #8b5cf620',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.background = '#8b5cf620'; 
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.borderColor = '#8b5cf620';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className="bi bi-shield-lock"></i>
                </button>
                
                <button 
                  onClick={() => onSuspender(usuario)} 
                  title={usuario.suspenso ? 'Reativar usuário' : 'Suspender usuário'}
                  style={{ 
                    background: 'transparent',
                    color: usuario.suspenso ? '#16a34a' : '#eab308',
                    border: usuario.suspenso ? '1px solid #16a34a20' : '1px solid #eab30820',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { 
                    const color = usuario.suspenso ? '#16a34a' : '#eab308';
                    e.currentTarget.style.background = color + '20';
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => { 
                    const color = usuario.suspenso ? '#16a34a' : '#eab308';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = color + '20';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className={`bi ${usuario.suspenso ? 'bi-play-circle' : 'bi-pause-circle'}`}></i>
                </button>
                
                <button 
                  onClick={() => onDelete(usuario)} 
                  title="Excluir usuário"
                  style={{ 
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef444420',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.background = '#ef444420';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#ef444420';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
