import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const ResetarSenhaTemporaria: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha || novaSenha.length < 6) {
  showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    if (novaSenha !== confirmarSenha) {
  showToast('As senhas não coincidem.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/resetar-senha-temporaria', { userId, novaSenha });
  showToast('Senha redefinida com sucesso! Faça login novamente.', 'success');
      navigate('/login');
    } catch (err: any) {
  showToast(err.response?.data?.error || 'Erro ao redefinir senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div>Usuário não identificado.</div>;
  }

  return (
    <div className="resetar-senha-bg">
      <div className="shadow-lg resetar-senha-card">
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3 resetar-senha-icon-bg">
            <i className="bi bi-shield-lock text-white resetar-senha-icon" />
          </div>
          <h2 className="fw-bold mb-2 text-center resetar-senha-title">Defina sua nova senha</h2>
          <div className="text-center resetar-senha-desc">Crie uma senha segura para sua conta</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="novaSenha" className="form-label fw-semibold resetar-senha-label">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              className="form-control resetar-senha-input"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmarSenha" className="form-label fw-semibold resetar-senha-label">Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              className="form-control resetar-senha-input"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button className="btn w-100 fw-bold resetar-senha-btn" type="submit" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check2-circle me-2"></i>Salvar nova senha</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetarSenhaTemporaria;
