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
    <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0, fontFamily: 'Inter, sans-serif' }}>
      <div className="shadow-lg" style={{ maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
            <i className="bi bi-shield-lock text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Defina sua nova senha</h2>
          <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Crie uma senha segura para sua conta</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="novaSenha" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              className="form-control"
              style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmarSenha" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              className="form-control"
              style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button className="btn w-100 fw-bold" type="submit" disabled={loading} style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)', marginTop: 10 }}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check2-circle me-2"></i>Salvar nova senha</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetarSenhaTemporaria;
