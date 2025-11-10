

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
      <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
        <div style={{maxWidth: 420, width: '100%'}}>
          <div className="shadow-lg mb-4" style={{ borderRadius: 16, background: '#1e293b', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155', textAlign: 'center' }}>
            <div className="rounded-3 p-3 mb-3 d-inline-block" style={{background: '#16a34a'}}>
              <i className="bi bi-envelope-check text-white" style={{ fontSize: 32 }}></i>
            </div>
            <h4 className="mb-3" style={{ color: '#f8fafc', fontWeight: 700 }}>Verifique seu e-mail</h4>
            <p style={{ color: '#cbd5e1', fontSize: 14 }}>Enviamos um código de confirmação para <b style={{color: '#f97316'}}>{email}</b>.<br />Digite o código recebido para validar seu cadastro.</p>
          </div>
          <form onSubmit={validarCodigo} className="w-100" autoComplete="off">
            <div className="mb-3">
              <label htmlFor="codigo" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Código de verificação</label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                className="form-control"
                style={{ borderRadius: 8, border: erroCodigo ? '1px solid #dc2626' : '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                required
                maxLength={6}
                autoFocus
              />
              {erroCodigo && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{erroCodigo}</div>}
            </div>
            <button type="submit" className="btn w-100 fw-bold" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }} disabled={carregando}>
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
        <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
          <div className="shadow-lg text-center" style={{ maxWidth: 420, borderRadius: 16, background: '#1e293b', padding: '48px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155' }}>
            <div className="rounded-3 p-3 mb-3 d-inline-block" style={{background: '#16a34a'}}>
              <i className="bi bi-check-circle text-white" style={{ fontSize: 48 }}></i>
            </div>
            <h4 className="mb-3" style={{ color: '#f8fafc', fontWeight: 700, fontSize: 24 }}>Cadastro concluído!</h4>
            <p style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 32 }}>Sua empresa foi cadastrada com sucesso.<br />Agora é só acessar o sistema.</p>
            <a href="/login" className="btn fw-bold" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px 24px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)', textDecoration: 'none', display: 'inline-block' }}>
              <i className="bi bi-box-arrow-in-right me-2"></i>Ir para o login
            </a>
          </div>
        </div>
      );
    } else {
      conteudo = (
        <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
          <div className="shadow-lg" style={{maxWidth: 420, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155'}}>
            <div className="d-flex flex-column align-items-center mb-4">
              <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
                <i className="bi bi-building text-white" style={{ fontSize: 32 }}></i>
              </div>
              <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Dados da empresa</h2>
            </div>
            <form onSubmit={aoSubmeterEmpresa} noValidate>
              <div className="mb-3">
                <label htmlFor="nomeEmpresa" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Nome da empresa</label>
                <input
                  id="nomeEmpresa"
                  name="nomeEmpresa"
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                  value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: Nynch Tecnologia"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="cnpj" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>CNPJ</label>
                <input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                  value={cnpj}
                  onChange={e => setCnpj(mascararCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
              </div>
              <hr style={{ borderColor: '#475569', margin: '24px 0' }} />
              <h5 className="mb-3 text-center" style={{ color: '#cbd5e1', fontSize: 18 }}>Administrador da empresa</h5>
              <div className="mb-3">
                <label htmlFor="nomeAdmin" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Nome do administrador</label>
                <input
                  id="nomeAdmin"
                  name="nomeAdmin"
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                  value={nomeAdmin}
                  onChange={e => setNomeAdmin(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="emailAdmin" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail do administrador</label>
                <input
                  id="emailAdmin"
                  name="emailAdmin"
                  type="email"
                  className="form-control"
                  style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                  value={emailAdmin}
                  onChange={e => setEmailAdmin(e.target.value)}
                  placeholder="admin@empresa.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="senhaAdmin" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Senha</label>
                <input
                  id="senhaAdmin"
                  name="senhaAdmin"
                  type="password"
                  className="form-control"
                  style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                  value={senhaAdmin}
                  onChange={e => setSenhaAdmin(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn w-100 fw-bold" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }} disabled={carregandoForm}>
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
      <div style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
        <div className="shadow-lg" style={{maxWidth: 420, minWidth: 320, width: '100%', borderRadius: 16, background: '#1e293b', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid #334155'}}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="rounded-3 p-3 mb-3" style={{background: '#f97316'}}>
              <i className="bi bi-person-plus text-white" style={{ fontSize: 32 }}></i>
            </div>
            <h2 className="fw-bold mb-2 text-center" style={{ color: '#f8fafc', letterSpacing: -0.5, fontSize: 28 }}>Criar conta</h2>
            <div className="text-center" style={{ color: '#cbd5e1', fontSize: 14 }}>Cadastre sua empresa na plataforma AWA</div>
          </div>
          <form onSubmit={aoSubmeter} noValidate>
            <div className="mb-3">
              <label htmlFor="nomeEmpresa" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>Nome da empresa</label>
              <input
                id="nomeEmpresa"
                name="nomeEmpresa"
                type="text"
                className="form-control"
                style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Nynch Tecnologia"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold" style={{ color: '#f8fafc', fontSize: 14 }}>E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                style={{ borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', padding: '12px 16px', fontSize: 15 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            {erro && <div className="alert alert-danger py-2 mb-3 text-center" style={{ borderRadius: 8, fontSize: 14, background: '#dc2626', border: 'none', color: '#fff' }}>{erro}</div>}
            <button type="submit" className="btn w-100 fw-bold mb-3" style={{ background: '#f97316', color: '#fff', fontSize: 16, borderRadius: 8, padding: '12px', border: 'none', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }} disabled={carregando}>
              {carregando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
              Registrar
            </button>
            <div className="text-center mt-4" style={{ color: '#94a3b8', fontSize: 14 }}>
              <a href="/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>Já tem conta? Entrar</a>
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

