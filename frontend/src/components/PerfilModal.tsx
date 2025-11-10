
import React, { useState } from 'react';
import { showToast } from '../utils/toast';
import AvatarImageSearch from './AvatarImageSearch';

const cargos = [
  'CEO',
  'Administrativo',
  'Financeiro',
  'Comercial'
];

export default function PerfilModal({ user, show, onClose }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [ultimoAcesso, setUltimoAcesso] = useState('');
  const [carregado, setCarregado] = useState(false);
  const [original, setOriginal] = useState<{nome:string,email:string,foto:string}>({nome:'',email:'',foto:''});
  React.useEffect(() => {
    if (show && user?.id && !carregado) {
      fetch(`/api/usuarios/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          setNome(data.user?.nome || '');
          setEmail(data.user?.email || '');
          setAvatar(data.user?.foto || '');
          setUltimoAcesso(data.user?.ultimo_acesso || '');
          setOriginal({
            nome: data.user?.nome || '',
            email: data.user?.email || '',
            foto: data.user?.foto || ''
          });
          setCarregado(true);
        });
    }
    if (!show) {
      setCarregado(false);
    }
  }, [show, user]);
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  function handleBuscarAvatar() {
    if (!avatarUrl) return;
    setAvatar(avatarUrl);
    setAvatarUrl('');
  }

  function handleSalvar(ev: React.FormEvent) {
    ev.preventDefault();
    setErro('');
    // Só envia campos alterados
    const formData = new FormData();
    let alterou = false;
    if (nome !== original.nome) {
      formData.append('nome', nome);
      alterou = true;
    }
    if (email !== original.email) {
      formData.append('email', email);
      alterou = true;
    }
    if (avatarFile) {
      formData.append('foto', avatarFile);
      alterou = true;
    }
    if (novaSenha || confirmaSenha) {
      if (novaSenha !== confirmaSenha) {
        setErro('Nova senha e confirmação não coincidem.');
        return;
      }
      if (novaSenha) {
        formData.append('senha', novaSenha);
        alterou = true;
      }
    }
    if (!alterou) {
      showToast('Nada para atualizar.', 'info');
      return;
    }
    fetch(`/api/usuarios/${user.id}`, {
      method: 'PATCH',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao atualizar perfil');
        showToast('Perfil atualizado com sucesso!', 'success');
        onClose();
      })
      .catch(() => showToast('Erro ao atualizar perfil', 'error'));
  }

  function handleExcluir() {
    setExcluindo(true);
    // Aqui você pode chamar a API para excluir a conta
    setTimeout(() => {
      setExcluindo(false);
      setErro('Não é possível excluir: você é o único superusuário.');
    }, 1200);
  }

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content" style={{ 
          background: '#1a1d29', 
          border: '1px solid #2d3142',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-header" style={{ 
            borderBottom: '1px solid #2d3142',
            padding: '1.25rem 1.5rem'
          }}>
            <h5 className="modal-title" style={{ color: '#f8fafc', fontWeight: 600 }}>
              <i className="bi bi-person me-2" style={{ color: '#f97316' }}></i>Meu Perfil
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              style={{
                filter: 'invert(1)',
                opacity: 0.8
              }}
            ></button>
          </div>
          <form onSubmit={handleSalvar}>
            <div className="modal-body row g-4" style={{ padding: '1.5rem' }}>
              <div className="col-md-3 d-flex flex-column align-items-center justify-content-center">
                <img 
                  src={avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome)} 
                  alt="Avatar" 
                  className="rounded-circle mb-3" 
                  style={{ width: 90, height: 90, objectFit: 'cover', border: '2px solid #2d3142' }} 
                />
                <div className="w-100 mb-3">
                  <label className="form-label w-100 text-center mb-1" style={{ fontSize: 13, color: '#94a3b8' }}>
                    Alterar foto
                  </label>
                  <input 
                    type="file" 
                    className="form-control form-control-sm" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatar(URL.createObjectURL(file));
                        setAvatarFile(file);
                      }
                    }}
                    style={{
                      background: '#0f1115',
                      border: '1px solid #2d3142',
                      color: '#f8fafc',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      Nome completo
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      required 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      E-mail
                    </label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    {/* Nível de permissão removido para root */}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      Último acesso
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={ultimoAcesso} 
                      disabled 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#64748b',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                </div>
                <hr style={{ borderColor: '#2d3142', margin: '1.5rem 0' }} />
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      Senha atual
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={senhaAtual} 
                      onChange={e => setSenhaAtual(e.target.value)} 
                      autoComplete="current-password" 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      Nova senha
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={novaSenha} 
                      onChange={e => setNovaSenha(e.target.value)} 
                      autoComplete="new-password" 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                      Confirmar nova senha
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={confirmaSenha} 
                      onChange={e => setConfirmaSenha(e.target.value)} 
                      autoComplete="new-password" 
                      style={{
                        background: '#0f1115',
                        border: '1px solid #2d3142',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.625rem 0.875rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {erro && (
              <div className="alert mb-0 mx-3" style={{ 
                background: '#ef444420', 
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px'
              }}>
                {erro}
              </div>
            )}
            <div className="modal-footer" style={{ 
              borderTop: '1px solid #2d3142',
              padding: '1.25rem 1.5rem'
            }}>
              <button 
                type="button" 
                className="btn me-auto" 
                onClick={handleExcluir} 
                disabled={excluindo}
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                <i className="bi bi-trash me-1"></i> Excluir conta
              </button>
              <button 
                type="submit" 
                className="btn"
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#ea580c'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f97316'}
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
