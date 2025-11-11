import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Recuperacao() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/recuperacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/recuperacao-codigo?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar e-mail.');
      }
    } catch {
      setError('Erro de conexão.');
    }
    setLoading(false);
  }

  return (
    <div className="d-flex align-items-center justify-content-center recuperacao-bg">
      <div className="shadow-lg recuperacao-card">
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3 recuperacao-icon-bg">
            <i className="bi bi-key-fill text-white recuperacao-icon" />
          </div>
          <h2 className="fw-bold mb-2 text-center recuperacao-title">Recuperar senha</h2>
          <div className="text-center recuperacao-desc">Informe seu e-mail para redefinir sua senha</div>
        </div>
        <form onSubmit={handleSubmit} className="w-100">
          <div className="mb-3 text-start w-100">
            <label className="form-label fw-semibold recuperacao-label">E-mail</label>
            <input type="email" className="form-control recuperacao-input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger py-2 w-100 text-center mb-3 recuperacao-alert-error">{error}</div>}
          {success && <div className="alert alert-success py-2 w-100 text-center mb-3 recuperacao-alert-success">E-mail de recuperação enviado!</div>}
          <button type="submit" className="btn w-100 mb-3 fw-bold recuperacao-btn" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
            Recuperar Senha
          </button>
        </form>
        <div className="text-center mt-4 w-100 recuperacao-link-wrap">
          <button onClick={() => navigate('/login')} className="btn btn-link p-0 recuperacao-link">
            <i className="bi bi-arrow-left me-1"></i>Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
