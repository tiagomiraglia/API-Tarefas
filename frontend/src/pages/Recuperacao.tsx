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
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', background: '#0f172a', margin: 0, padding: 0, fontFamily: 'Inter, sans-serif' }}>
      <div className="shadow-lg" style={{ maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
            <i className="bi bi-key-fill text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Recuperar senha</h2>
          <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Informe seu e-mail para redefinir sua senha</div>
        </div>
        <form onSubmit={handleSubmit} className="w-100">
          <div className="mb-3 text-start w-100">
            <label className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail</label>
            <input type="email" className="form-control" style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger py-2 w-100 text-center mb-3" style={{ borderRadius: 8, fontSize: 14, background: '#dc2626', border: 'none', color: '#fff' }}>{error}</div>}
          {success && <div className="alert alert-success py-2 w-100 text-center mb-3" style={{ borderRadius: 8, fontSize: 14, background: '#16a34a', border: 'none', color: '#fff' }}>E-mail de recuperação enviado!</div>}
          <button type="submit" className="btn w-100 mb-3 fw-bold" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
            Recuperar Senha
          </button>
        </form>
        <div className="text-center mt-4 w-100" style={{ color: '#94a3b8', fontSize: 14 }}>
          <button onClick={() => navigate('/login')} className="btn btn-link p-0" style={{ color: '#f97316', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            <i className="bi bi-arrow-left me-1"></i>Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
