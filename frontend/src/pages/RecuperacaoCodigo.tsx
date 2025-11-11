import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RecuperacaoCodigo() {
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Tenta obter o e-mail da query string ou do state
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
  }, [location]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/resetar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, novaSenha })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao redefinir senha.');
      }
    } catch {
      setError('Erro de conexão.');
    }
    setLoading(false);
  }

  return (
    <div className="recuperacao-codigo-bg">
      <div className="shadow-lg recuperacao-codigo-card">
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3 recuperacao-codigo-icon-bg">
            <i className="bi bi-key-fill text-white recuperacao-codigo-icon" />
          </div>
          <h2 className="fw-bold mb-2 text-center recuperacao-codigo-title">Redefinir Senha</h2>
          <div className="text-center recuperacao-codigo-desc">Digite o código e sua nova senha</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold recuperacao-codigo-label">E-mail</label>
            <input type="email" className="form-control recuperacao-codigo-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold recuperacao-codigo-label">Código de Recuperação</label>
            <input type="text" className="form-control recuperacao-codigo-input" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código de 6 dígitos" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold recuperacao-codigo-label">Nova Senha</label>
            <input type="password" className="form-control recuperacao-codigo-input" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold recuperacao-codigo-label">Confirmar Nova Senha</label>
            <input type="password" className="form-control recuperacao-codigo-input" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="alert alert-danger py-2 mb-3 text-center recuperacao-codigo-alert-error">{error}</div>}
          {success && <div className="alert alert-success py-2 mb-3 text-center recuperacao-codigo-alert-success">Senha redefinida com sucesso! Redirecionando...</div>}
          <button type="submit" className="btn w-100 fw-bold mb-3 recuperacao-codigo-btn" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-arrow-repeat me-2"></i>}
            Redefinir Senha
          </button>
          <div className="text-center mt-4 recuperacao-codigo-link-wrap">
            <a href="/login" className="recuperacao-codigo-link">
              <i className="bi bi-arrow-left me-1"></i>Voltar ao login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
