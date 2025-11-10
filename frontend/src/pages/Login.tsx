import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { login, type LoginResponse } from '../services/api';

// Tela de Login
export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroEnvio, setErroEnvio] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  function emailValido(e: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  }

  function validarCampos() {
    let ok = true;
    if (!emailValido(email)) {
      setErroEmail('E-mail inválido');
      ok = false;
    } else {
      setErroEmail('');
    }
    if (senha.length < 6) {
      setErroSenha('Senha deve ter ao menos 6 caracteres');
      ok = false;
    } else {
      setErroSenha('');
    }
    return ok;
  }

  async function aoSubmeter(ev?: React.FormEvent) {
    ev?.preventDefault();
    setErroEnvio('');
    if (!validarCampos()) return;
    setCarregando(true);
    try {
      const data: LoginResponse = await login(email, senha);
      if (data.requirePasswordReset && data.user?.id) {
        // Redireciona para tela de troca de senha temporária
        navigate('/resetar-senha-temporaria', { state: { userId: data.user.id } });
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user?.is_superuser === true) {
          localStorage.setItem('nivel', 'superuser');
        } else {
          localStorage.setItem('nivel', data.user?.nivel || 'user');
        }
  localStorage.setItem('user_id', data.user?.id ? String(data.user.id) : '');
  localStorage.setItem('empresa_id', data.user?.empresa_id ? String(data.user.empresa_id) : '');
  localStorage.setItem('nome', data.user?.nome || '');
  localStorage.setItem('email', data.user?.email || '');
        // Salva permissoes do usuário no localStorage
        if (data.user?.permissoes) {
          localStorage.setItem('permissoes', JSON.stringify(data.user.permissoes));
        } else {
          localStorage.removeItem('permissoes');
        }
        if (data.user?.is_superuser === true) {
          window.location.href = '/root';
        } else if (data.user?.nivel === 'admin') {
          window.location.href = '/dashboard-admin';
        } else {
          window.location.href = '/dashboard';
        }
        return;
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      if (error.code === 'ECONNREFUSED') {
        setErroEnvio('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 4000.');
      } else if (error.code === 'ENOTFOUND') {
        setErroEnvio('Erro de conexão: Servidor não encontrado. Verifique a configuração de rede.');
      } else if (error.response?.status === 403 && error.response?.data?.message?.toLowerCase().includes('suspenso')) {
        toast.error(
          'Seu acesso foi temporariamente suspenso por decisão administrativa. Entre em contato com suporte@nynch.com.br',
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'colored',
          }
        );
        setErroEnvio('');
      } else {
        setErroEnvio(error.response?.data?.message || 'Erro ao efetuar login');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0, fontFamily: 'Inter, sans-serif' }}>
      <div className="shadow-lg" style={{ maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
        <div className="d-flex flex-column align-items-center mb-4">
          <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
            <i className="bi bi-kanban-fill text-white" style={{ fontSize: 32 }} />
          </div>
          <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Entrar</h2>
          <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Acesse sua conta para gerenciar atendimentos</div>
        </div>
        <div>
          <form onSubmit={aoSubmeter} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                style={{ borderRadius: 8, border: erroEmail ? '1px solid #dc2626' : '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@exemplo.com"
                aria-invalid={!!erroEmail}
                aria-describedby={erroEmail ? 'email-error' : undefined}
                onBlur={() => {
                  if (email && !emailValido(email)) setErroEmail('E-mail inválido');
                }}
              />
              {erroEmail && <div id="email-error" style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{erroEmail}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Senha</label>
              <div className="position-relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="form-control"
                  style={{ borderRadius: 8, border: erroSenha ? '1px solid #dc2626' : '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15, paddingRight: 45 }}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={!!erroSenha}
                  aria-describedby={erroSenha ? 'password-error' : undefined}
                  onBlur={() => {
                    if (senha && senha.length < 6) setErroSenha('Senha curta');
                  }}
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 8 }}
                  tabIndex={-1}
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha((s) => !s)}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <i className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {erroSenha && <div id="password-error" style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{erroSenha}</div>}
            </div>
            {erroEnvio && <div className="alert alert-danger py-2 mb-3 text-center" style={{ borderRadius: 8, fontSize: 14, background: '#dc2626', border: 'none', color: '#fff' }}>{erroEnvio}</div>}
            <button type="submit" disabled={carregando} className="btn w-100 fw-bold mb-3" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}>
              {carregando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
              Entrar
            </button>
            <div className="d-flex justify-content-between mt-4" style={{ color: '#94a3b8', fontSize: 14 }}>
              <a href="/recuperacao" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}><i className="bi bi-question-circle me-1"></i>Esqueci minha senha</a>
              <a href="/registro" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}><i className="bi bi-person-plus me-1"></i>Criar conta</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
