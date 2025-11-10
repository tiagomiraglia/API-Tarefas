import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ValidateAccount: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await api.post('/cadastro/validate', { email, token });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao validar cadastro');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow p-4" style={{ maxWidth: 400, width: '100%' }}>
        <h2 className="mb-4 text-center">Validar Cadastro</h2>
        <form onSubmit={handleValidate}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="token" className="form-label">Código de validação</label>
            <input
              id="token"
              type="text"
              className="form-control"
              placeholder="Digite o código recebido"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">Cadastro validado! Redirecionando...</div>}
          <button type="submit" className="btn btn-success w-100 mb-2">Validar</button>
        </form>
        <div className="text-center mt-3">
          <button onClick={() => navigate('/')} className="btn btn-link p-0">Voltar ao login</button>
        </div>
      </div>
    </div>
  );
};

export default ValidateAccount;
