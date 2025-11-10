import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      type LoginResponse = { token: string; user: { id: number; name: string; email: string } };
      const response = await axios.post<LoginResponse>('/api/login', { email, password });
      // Salva token e dados do usuário no localStorage
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      // Redireciona para o dashboard
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}>
      <div className="shadow-lg" style={{ maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
            <i className="bi bi-kanban-fill text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Acesse sua conta</h2>
          <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Bem-vindo de volta à plataforma AWA</div>
        </div>
        <form onSubmit={handleLogin} className="w-100">
          <div className="mb-3 text-start w-100">
            <label htmlFor="email" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3 text-start w-100">
            <label htmlFor="password" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Senha</label>
            <input
              id="password"
              type="password"
              className="form-control"
              style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger py-2 w-100 text-center mb-3" style={{ borderRadius: 8, fontSize: 14, background: '#dc2626', border: 'none', color: '#fff' }}>{error}</div>}
          <button type="submit" className="btn w-100 mb-3 fw-bold" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}>
            <i className="bi bi-box-arrow-in-right me-2"></i>Entrar
          </button>
        </form>
        <div className="text-center mt-4 w-100" style={{ color: '#94a3b8', fontSize: 14 }}>
          <button onClick={() => navigate('/cadastro')} className="btn btn-link p-0" style={{ color: '#f97316', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>Criar conta</button>
          <span className="mx-2" style={{color: '#475569'}}>•</span>
          <button onClick={() => navigate('/recuperacao')} className="btn btn-link p-0" style={{ color: '#f97316', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>Esqueci a senha</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
