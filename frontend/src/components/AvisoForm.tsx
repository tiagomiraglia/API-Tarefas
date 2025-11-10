import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

interface Aviso {
  id: number;
  mensagem: string;
  ativo: boolean;
  data_criacao: string;
  data_expiracao: string | null;
  destinatario_id?: number | null;
  destinatario_nivel?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL;

interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivel?: string;
}

const niveis = [
  { value: 'admin', label: 'Administradores' },
  { value: 'usuario', label: 'Usuários' },
];

interface AvisoFormProps {
  aviso?: Aviso | null;
  onSaved?: () => void;
  onCancel?: () => void;
}


export default function AvisoForm({ aviso, onSaved, onCancel }: AvisoFormProps) {
  const [mensagem, setMensagem] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [dataExpiracao, setDataExpiracao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  // const [success, setSuccess] = useState('');
  const [destinatarioTipo, setDestinatarioTipo] = useState<'global'|'grupo'|'usuario'>('global');
  const [destinatarioNivel, setDestinatarioNivel] = useState('');
  const [destinatarioId, setDestinatarioId] = useState<number|null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (typeof aviso === 'object' && aviso) {
      setMensagem(aviso.mensagem || '');
      setAtivo(!!aviso.ativo);
      setDataExpiracao(aviso.data_expiracao ? aviso.data_expiracao.slice(0, 16) : '');
      if (aviso.destinatario_id) {
        setDestinatarioTipo('usuario');
        setDestinatarioId(aviso.destinatario_id);
      } else if (aviso.destinatario_nivel) {
        setDestinatarioTipo('grupo');
        setDestinatarioNivel(aviso.destinatario_nivel);
      } else {
        setDestinatarioTipo('global');
        setDestinatarioNivel('');
        setDestinatarioId(null);
      }
    } else {
      setMensagem('');
      setAtivo(true);
      setDataExpiracao('');
      setDestinatarioTipo('global');
      setDestinatarioNivel('');
      setDestinatarioId(null);
    }
  }, [aviso]);

  // Carregar usuários para seleção
  useEffect(() => {
    if (destinatarioTipo === 'usuario') {
      const token = localStorage.getItem('token');
      api.get<{ users: Usuario[] }>('/api/usuarios', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUsuarios(res.data.users || []))
        .catch(() => setUsuarios([]));
    }
  }, [destinatarioTipo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  setLoading(true);
  setErro('');
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/avisos`;
      let method = 'POST';
      if (aviso && aviso.id) {
        url = `${API_URL}/api/avisos/${aviso.id}`;
        method = 'PATCH';
      }
      // Corrigir formato para ISO completo se dataExpiracao estiver preenchido
      let dataExpiracaoISO = null;
      if (dataExpiracao) {
        let base = dataExpiracao.length === 16 ? dataExpiracao + ':00' : dataExpiracao;
        if (!base.includes('Z') && !base.includes('+') && !base.includes('-', 10)) {
          dataExpiracaoISO = base + '.000Z';
        } else {
          dataExpiracaoISO = base;
        }
      }
      const body: any = { mensagem, ativo, data_expiracao: dataExpiracaoISO };
      if (destinatarioTipo === 'usuario' && destinatarioId) {
        body.destinatario_id = destinatarioId;
        body.destinatario_nivel = null;
      } else if (destinatarioTipo === 'grupo' && destinatarioNivel) {
        body.destinatario_id = null;
        body.destinatario_nivel = destinatarioNivel;
      } else {
        body.destinatario_id = null;
        body.destinatario_nivel = null;
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
  showToast('Aviso salvo com sucesso!', 'success');
        // Limpa todos os campos após salvar
        setMensagem('');
        setAtivo(true);
        setDataExpiracao('');
        setDestinatarioTipo('global');
        setDestinatarioNivel('');
        setDestinatarioId(null);
        if (onSaved) onSaved();
      } else {
        setErro('Erro ao salvar aviso.');
      }
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }

  return (
  <form onSubmit={handleSubmit} className="mb-4" style={{ color: '#cbd5e1', background: '#0f1115', borderRadius: '12px', border: '1px solid #334155', padding: '2rem' }}>
      <h5 className="mb-3 fw-bold" style={{ color: '#f8fafc' }}>Aviso de Manutenção / Comunicação</h5>
      
      <div className="mb-3">
        <label className="form-label fw-bold" style={{ color: '#f8fafc', marginBottom: '0.75rem' }}>Destinatário:</label>
        <div className="d-flex gap-3 mb-2" style={{ color: '#cbd5e1' }}>
          <label style={{ cursor: 'pointer' }}>
            <input type="radio" name="destinatario" value="global" checked={destinatarioTipo==='global'} onChange={()=>setDestinatarioTipo('global')} className="me-1" /> Global (todos)
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="radio" name="destinatario" value="grupo" checked={destinatarioTipo==='grupo'} onChange={()=>setDestinatarioTipo('grupo')} className="me-1" /> Grupo
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="radio" name="destinatario" value="usuario" checked={destinatarioTipo==='usuario'} onChange={()=>setDestinatarioTipo('usuario')} className="me-1" /> Usuário específico
          </label>
        </div>
        {destinatarioTipo === 'grupo' && (
          <select 
            className="form-select" 
            value={destinatarioNivel} 
            onChange={e=>setDestinatarioNivel(e.target.value)} 
            required
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              padding: '0.625rem 0.875rem'
            }}
          >
            <option value="">Selecione o grupo</option>
            {niveis.map(n=>(<option key={n.value} value={n.value}>{n.label}</option>))}
          </select>
        )}
        {destinatarioTipo === 'usuario' && (
          <select 
            className="form-select" 
            value={destinatarioId||''} 
            onChange={e=>setDestinatarioId(Number(e.target.value))} 
            required
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              padding: '0.625rem 0.875rem'
            }}
          >
            <option value="">Selecione o usuário</option>
            {usuarios.map(u=>(<option key={u.id} value={u.id}>{u.nome} ({u.email})</option>))}
          </select>
        )}
      </div>

      {erro && (
        <div className="mb-3 p-3" style={{ 
          background: '#ef444420', 
          border: '1px solid #ef4444', 
          borderRadius: '8px', 
          color: '#ef4444' 
        }}>{erro}</div>
      )}

      <div className="mb-3">
        <textarea
          className="form-control"
          rows={3}
          placeholder="Mensagem do aviso (ex: O sistema estará em manutenção hoje às 22h)"
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          required
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            padding: '0.75rem'
          }}
        />
      </div>

      <div className="mb-3 d-flex align-items-center gap-2">
        <input type="checkbox" id="ativo" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
        <label htmlFor="ativo" className="mb-0" style={{ color: '#cbd5e1', cursor: 'pointer' }}>Aviso ativo</label>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold" style={{ color: '#cbd5e1', marginBottom: '0.5rem' }}>Data/hora de expiração (opcional):</label>
        <input
          type="datetime-local"
          className="form-control"
          value={dataExpiracao}
          onChange={e => setDataExpiracao(e.target.value)}
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            padding: '0.625rem 0.875rem'
          }}
        />
      </div>

      <div className="d-flex gap-2">
        <button 
          className="btn fw-bold px-4" 
          type="submit" 
          disabled={loading}
          style={{
            background: loading ? '#64748b' : '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.625rem 1.5rem',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#ea580c')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#f97316')}
        >
          {loading ? 'Salvando...' : 'Salvar Aviso'}
        </button>
        {typeof aviso === 'object' && aviso && onCancel && (
          <button 
            type="button" 
            className="btn" 
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #64748b',
              borderRadius: '8px',
              padding: '0.625rem 1.5rem',
              fontWeight: '500',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#64748b';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >Cancelar</button>
        )}
      </div>
    </form>
  );
}
