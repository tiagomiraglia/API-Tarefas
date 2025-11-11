
import React, { useState } from 'react';
import { showToast } from '../utils/toast';

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
  const [original, setOriginal] = useState<{nome:string,email:string,foto:string}>({nome:'',email:'',foto:''});
  React.useEffect(() => {
    if (show && user?.id) {
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
        });
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
    <div className="modal fade show d-block perfil-modal-bg" tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content perfil-modal-content">
          <div className="modal-header perfil-modal-header">
            <h5 className="modal-title perfil-modal-title">
              <i className="bi bi-person me-2 perfil-modal-title-icon"></i>Meu Perfil
            </h5>
            <button 
              type="button" 
              className="btn-close perfil-modal-close" 
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSalvar}>
            <div className="modal-body row g-4 perfil-modal-body">
              <div className="col-md-3 d-flex flex-column align-items-center justify-content-center">
                <img 
                  src={avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome)} 
                  alt="Avatar" 
                  className="rounded-circle mb-3 perfil-modal-avatar" 
                />
                <div className="w-100 mb-3">
                  <label className="form-label w-100 text-center mb-1 perfil-modal-label">
                    Alterar foto
                  </label>
                  <input 
                    type="file" 
                    className="form-control form-control-sm perfil-modal-input" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatar(URL.createObjectURL(file));
                        setAvatarFile(file);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label perfil-modal-label">
                      Nome completo
                    </label>
                    <input 
                      type="text" 
                      className="form-control perfil-modal-input" 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label perfil-modal-label">
                      E-mail
                    </label>
                    <input 
                      type="email" 
                      className="form-control perfil-modal-input" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="col-md-6">
                    {/* Nível de permissão removido para root */}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label perfil-modal-label">
                      Último acesso
                    </label>
                    <input 
                      type="text" 
                      className="form-control perfil-modal-input perfil-modal-input-muted" 
                      value={ultimoAcesso} 
                      disabled 
                    />
                  </div>
                </div>
                <hr className="perfil-modal-divider" />
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label perfil-modal-label">
                      Senha atual
                    </label>
                    <input 
                      type="password" 
                      className="form-control perfil-modal-input" 
                      value={senhaAtual} 
                      onChange={e => setSenhaAtual(e.target.value)} 
                      autoComplete="current-password" 
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label perfil-modal-label">
                      Nova senha
                    </label>
                    <input 
                      type="password" 
                      className="form-control perfil-modal-input" 
                      value={novaSenha} 
                      onChange={e => setNovaSenha(e.target.value)} 
                      autoComplete="new-password" 
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label perfil-modal-label">
                      Confirmar nova senha
                    </label>
                    <input 
                      type="password" 
                      className="form-control perfil-modal-input" 
                      value={confirmaSenha} 
                      onChange={e => setConfirmaSenha(e.target.value)} 
                      autoComplete="new-password" 
                    />
                  </div>
                </div>
              </div>
            </div>
            {erro && (
              <div className="alert mb-0 mx-3 perfil-modal-error">
                {erro}
              </div>
            )}
            <div className="modal-footer perfil-modal-footer">
              <button 
                type="button" 
                className="btn me-auto perfil-modal-btn-excluir" 
                onClick={handleExcluir} 
                disabled={excluindo}
              >
                <i className="bi bi-trash me-1"></i> Excluir conta
              </button>
              <button 
                type="submit" 
                className="btn perfil-modal-btn-salvar"
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
