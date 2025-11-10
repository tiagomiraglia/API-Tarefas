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
    <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0, fontFamily: 'Inter, sans-serif' }}>
      <div className="shadow-lg" style={{ maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
            <i className="bi bi-key-fill text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Redefinir Senha</h2>
          <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Digite o código e sua nova senha</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail</label>
            <input type="email" className="form-control" style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }} value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Código de Recuperação</label>
            <input type="text" className="form-control" style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código de 6 dígitos" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Nova Senha</label>
            <input type="password" className="form-control" style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Confirmar Nova Senha</label>
            <input type="password" className="form-control" style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }} value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="alert alert-danger py-2 mb-3 text-center" style={{ borderRadius: 8, fontSize: 14, background: '#dc2626', border: 'none', color: '#fff' }}>{error}</div>}
          {success && <div className="alert alert-success py-2 mb-3 text-center" style={{ borderRadius: 8, fontSize: 14, background: '#16a34a', border: 'none', color: '#fff' }}>Senha redefinida com sucesso! Redirecionando...</div>}
          <button type="submit" className="btn w-100 fw-bold mb-3" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-arrow-repeat me-2"></i>}
            Redefinir Senha
          </button>
          <div className="text-center mt-4" style={{ color: '#94a3b8', fontSize: 14 }}>
            <a href="/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>
              <i className="bi bi-arrow-left me-1"></i>Voltar ao login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
