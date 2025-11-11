import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { login, type LoginResponse } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="login-bg">
      {/* Navbar fixa no topo, igual Home */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top home-navbar w-100" style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100}}>
        <div className="container py-2">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/">
            <div className="home-navbar-icon">
              <i className="bi bi-kanban-fill text-white fs-4"></i>
            </div>
            <span className="fs-4 home-navbar-title">AWA</span>
          </a>
          <div className="d-flex gap-2 align-items-center">
            <a className="btn px-4 fw-semibold shadow-sm home-navbar-register" href="/registro">
              <i className="bi bi-person-plus me-2"></i>Criar conta
            </a>
            {/* Theme toggle no topo da Login */}
            <div className="ms-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Centraliza o cartão abaixo da navbar */}
      <div className="login-bg-content">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <i className="bi bi-kanban-fill"></i>
            </div>
            <h2 className="login-title">Entrar</h2>
            <div className="login-desc">Acesse sua conta para gerenciar atendimentos</div>
          </div>
          <div>
            <form onSubmit={aoSubmeter} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="login-label">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`login-input ${erroEmail ? 'login-input-error' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@exemplo.com"
                  aria-invalid={!!erroEmail}
                  aria-describedby={erroEmail ? 'email-error' : undefined}
                  onBlur={() => {
                    if (email && !emailValido(email)) setErroEmail('E-mail inválido');
                  }}
                />
                {erroEmail && <div id="email-error" className="login-error">{erroEmail}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="login-label">Senha</label>
                <div className="login-password-row">
                  <input
                    id="password"
                    name="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    className={`login-input ${erroSenha ? 'login-input-error' : ''}`}
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
                    className="login-show-pass"
                    tabIndex={-1}
                    aria-pressed={mostrarSenha}
                    onClick={() => setMostrarSenha((s) => !s)}
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                {erroSenha && <div id="password-error" className="login-error">{erroSenha}</div>}
              </div>
              {erroEnvio && <div className="login-alert-error">{erroEnvio}</div>}
              <button type="submit" disabled={carregando} className="login-btn">
                {carregando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
                Entrar
              </button>
              <div className="login-footer">
                <a href="/recuperacao" className="login-link"><i className="bi bi-question-circle me-1"></i>Esqueci minha senha</a>
                <a href="/registro" className="login-link"><i className="bi bi-person-plus me-1"></i>Criar conta</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
