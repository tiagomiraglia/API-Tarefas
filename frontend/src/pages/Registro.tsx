

import React, { useState } from 'react';

// Função para aplicar máscara de CNPJ
function mascararCNPJ(valor: string) {
  valor = valor.replace(/\D/g, '');
  valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1/$2');
  valor = valor.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  return valor;
}

// Tela de Registro de Empresa

export default function Registro(): JSX.Element {
  // Hooks principais
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  // Código de verificação
  const [codigo, setCodigo] = useState('');
  const [erroCodigo, setErroCodigo] = useState('');
  const [codigoValidado, setCodigoValidado] = useState(false);
  // Hooks para etapa de cadastro da empresa/admin
  const [cnpj, setCnpj] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [carregandoForm, setCarregandoForm] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  function emailValido(e: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  }

  function cnpjValido(cnpj: string) {
    // Validação simples: 14 dígitos
    return /^\d{14}$/.test(cnpj.replace(/\D/g, ''));
  }

  async function aoSubmeter(ev: React.FormEvent) {
    ev.preventDefault();
    setErro('');
    if (!nomeEmpresa.trim()) {
      setErro('Informe o nome da empresa.');
      return;
    }
    if (!emailValido(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEmpresa, email, senha: 'senhaForteAqui' })
      });
      if (res.ok) {
        setSucesso(true);
        setErro('');
      } else {
        const data = await res.json().catch(() => ({}));
        setErro(data.message || 'Erro ao registrar.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    }
    setCarregando(false);
  }

  async function aoSubmeterEmpresa(ev: React.FormEvent) {
    ev.preventDefault();
    setErroForm('');
    if (!nomeEmpresa.trim()) {
      setErroForm('Informe o nome da empresa.');
      return;
    }
    if (!cnpjValido(cnpj)) {
      setErroForm('CNPJ inválido. Informe 14 dígitos.');
      return;
    }
    if (!nomeAdmin.trim()) {
      setErroForm('Informe o nome do administrador.');
      return;
    }
    if (!emailValido(emailAdmin)) {
      setErroForm('E-mail do administrador inválido.');
      return;
    }
    if (senhaAdmin.length < 6) {
      setErroForm('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setCarregandoForm(true);
    try {
      // Enviar o CNPJ sem máscara para o backend
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      const res = await fetch('/api/auth/empresa-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeEmpresa,
          cnpj: cnpjLimpo,
          nomeAdmin,
          emailAdmin,
          senhaAdmin
        })
      });
      if (res.ok) {
        setFinalizado(true);
        setErroForm('');
      } else {
        const data = await res.json().catch(() => ({}));
        let msg = data.message || 'Erro ao cadastrar empresa/admin.';
        if (msg.includes('CNPJ')) {
          import('../utils/toast').then(({ showToast }) => showToast('CNPJ já cadastrado!', 'error'));
        } else {
          import('../utils/toast').then(({ showToast }) => showToast(msg, 'error'));
        }
        setErroForm(''); // Não exibe mais alerta visual
      }
    } catch (err) {
      import('../utils/toast').then(({ showToast }) => showToast('Erro de conexão com o servidor.', 'error'));
      setErroForm('');
    }
    setCarregandoForm(false);
  }

  // Função para validar código (precisa estar fora do render condicional)
  async function validarCodigo(ev: React.FormEvent) {
    ev.preventDefault();
    setErroCodigo('');
    if (!codigo.trim()) {
      setErroCodigo('Informe o código recebido por e-mail.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo })
      });
      if (res.ok) {
        setCodigoValidado(true);
        setErroCodigo('');
      } else {
        const data = await res.json().catch(() => ({}));
        setErroCodigo(data.message || 'Código inválido ou expirado.');
      }
    } catch (err) {
      setErroCodigo('Erro de conexão com o servidor.');
    }
    setCarregando(false);
  }

  // Preencher emailAdmin automaticamente ao validar código
  React.useEffect(() => {
    if (sucesso && codigoValidado) {
      setEmailAdmin(email);
    }
  }, [sucesso, codigoValidado, email]);

  // Renderização condicional por variáveis
  let conteudo: JSX.Element = <div />;
  if (sucesso && !codigoValidado) {
    conteudo = (
      <div className="registro-bg">
        <div style={{maxWidth: 420, width: '100%'}}>
          <div className="shadow-lg mb-4 registro-verificacao-card">
            <div className="rounded-3 p-3 mb-3 d-inline-block registro-verificacao-icon-bg">
              <i className="bi bi-envelope-check text-white registro-verificacao-icon"></i>
            </div>
            <h4 className="mb-3 registro-verificacao-title">Verifique seu e-mail</h4>
            <p className="registro-verificacao-desc">Enviamos um código de confirmação para <b className="registro-verificacao-email">{email}</b>.<br />Digite o código recebido para validar seu cadastro.</p>
          </div>
          <form onSubmit={validarCodigo} className="w-100" autoComplete="off">
            <div className="mb-3">
              <label htmlFor="codigo" className="form-label fw-semibold registro-label">Código de verificação</label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                className={`form-control registro-input${erroCodigo ? ' registro-input-error' : ''}`}
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                required
                maxLength={6}
                autoFocus
              />
              {erroCodigo && <div className="registro-alert-error">{erroCodigo}</div>}
            </div>
            <button type="submit" className="btn w-100 fw-bold registro-btn" disabled={carregando}>
              {carregando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-shield-check me-2"></i>}
              Validar código
            </button>
          </form>
        </div>
      </div>
    );
  } else if (sucesso && codigoValidado) {
    if (finalizado) {
      conteudo = (
        <div className="registro-bg">
          <div className="shadow-lg text-center registro-success-card">
            <div className="rounded-3 p-3 mb-3 d-inline-block registro-success-icon-bg">
              <i className="bi bi-check-circle text-white registro-success-icon"></i>
            </div>
            <h4 className="mb-3 registro-success-title">Cadastro concluído!</h4>
            <p className="registro-success-desc">Sua empresa foi cadastrada com sucesso.<br />Agora é só acessar o sistema.</p>
            <a href="/login" className="btn fw-bold registro-btn registro-success-link">
              <i className="bi bi-box-arrow-in-right me-2"></i>Ir para o login
            </a>
          </div>
        </div>
      );
    } else {
      conteudo = (
        <div className="registro-bg">
          <div className="shadow-lg registro-card">
            <div className="d-flex flex-column align-items-center mb-4">
              <div className="rounded-3 p-3 mb-3 registro-card-icon-bg">
                <i className="bi bi-building text-white registro-card-icon"></i>
              </div>
              <h2 className="fw-bold mb-2 text-center registro-title">Dados da empresa</h2>
            </div>
            <form onSubmit={aoSubmeterEmpresa} noValidate>
              <div className="mb-3">
                <label htmlFor="nomeEmpresa" className="form-label fw-semibold registro-label">Nome da empresa</label>
                <input
                  id="nomeEmpresa"
                  name="nomeEmpresa"
                  type="text"
                  className="form-control registro-input"
                  value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: Nynch Tecnologia"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="cnpj" className="form-label fw-semibold registro-label">CNPJ</label>
                <input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  className="form-control registro-input"
                  value={cnpj}
                  onChange={e => setCnpj(mascararCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
              </div>
              <hr className="registro-card-hr" />
              <h5 className="mb-3 text-center registro-card-subtitle">Administrador da empresa</h5>
              <div className="mb-3">
                <label htmlFor="nomeAdmin" className="form-label fw-semibold registro-label">Nome do administrador</label>
                <input
                  id="nomeAdmin"
                  name="nomeAdmin"
                  type="text"
                  className="form-control registro-input"
                  value={nomeAdmin}
                  onChange={e => setNomeAdmin(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="emailAdmin" className="form-label fw-semibold registro-label">E-mail do administrador</label>
                <input
                  id="emailAdmin"
                  name="emailAdmin"
                  type="email"
                  className="form-control registro-input"
                  value={emailAdmin}
                  onChange={e => setEmailAdmin(e.target.value)}
                  placeholder="admin@empresa.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="senhaAdmin" className="form-label fw-semibold registro-label">Senha</label>
                <input
                  id="senhaAdmin"
                  name="senhaAdmin"
                  type="password"
                  className="form-control registro-input"
                  value={senhaAdmin}
                  onChange={e => setSenhaAdmin(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn w-100 fw-bold registro-btn" disabled={carregandoForm}>
                {carregandoForm ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                Finalizar cadastro
              </button>
            </form>
          </div>
        </div>
      );
    }
  } else {
      conteudo = (
        <div className="registro-bg">
          <div className="shadow-lg registro-card">
            <div className="d-flex flex-column align-items-center mb-4">
              <div className="rounded-3 p-3 mb-3 registro-card-icon-bg">
                <i className="bi bi-person-plus text-white registro-card-icon"></i>
              </div>
              <h2 className="fw-bold mb-2 text-center registro-title">Criar conta</h2>
              <div className="text-center registro-desc">Cadastre sua empresa na plataforma AWA</div>
            </div>
          <form onSubmit={aoSubmeter} noValidate>
            <div className="mb-3">
              <label htmlFor="nomeEmpresa" className="form-label fw-semibold registro-label">Nome da empresa</label>
              <input
                id="nomeEmpresa"
                name="nomeEmpresa"
                type="text"
                className="form-control registro-input"
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Nynch Tecnologia"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold registro-label">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control registro-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            {erro && <div className="alert alert-danger py-2 mb-3 text-center registro-alert-error">{erro}</div>}
            <button type="submit" className="btn w-100 fw-bold mb-3 registro-btn" disabled={carregando}>
              {carregando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
              Registrar
            </button>
            <div className="text-center mt-4 registro-link-wrap">
              <a href="/login" className="registro-link">Já tem conta? Entrar</a>
            </div>
          </form>
        </div>
      </div>
    );
  }



  // Preencher emailAdmin automaticamente ao validar código
  React.useEffect(() => {
    if (sucesso && codigoValidado) {
      setEmailAdmin(email);
    }
  }, [sucesso, codigoValidado, email]);

  // O conteúdo correto já está em 'conteudo', basta retornar ele
  return conteudo;
}

