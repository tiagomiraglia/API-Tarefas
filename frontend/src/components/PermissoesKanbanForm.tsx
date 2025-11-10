import React, { useEffect, useState } from 'react';
import { getUsuarioById, patchPermissoesUsuario } from '../utils/usuarioApi';
import { getAbas } from '../utils/kanbanApi';
import { showToast } from '../utils/toast';

interface Aba {
  id: number;
  nome: string;
  colunas: Coluna[];
}
interface Coluna {
  id: number;
  nome: string;
}

interface PermissaoKanban {
  aba_id: number;
  coluna_id?: number;
  tipo: string;
}

interface Props {
  usuarioId: number;
  token: string;
  empresaId?: number;
}

const tipos = [
  { value: 'visualizar', label: 'Visualizar' },
  { value: 'mover', label: 'Mover' },
  { value: 'editar', label: 'Editar' },
  { value: 'admin', label: 'Admin' },
];

const PermissoesKanbanForm: React.FC<Props> = ({ usuarioId, token, empresaId }) => {
  const [abas, setAbas] = useState<Aba[]>([]);
  const [permissoes, setPermissoes] = useState<PermissaoKanban[]>([]);
  const [abaId, setAbaId] = useState<number | ''>('');
  const [colunaId, setColunaId] = useState<number | ''>('');
  const [tipo, setTipo] = useState('visualizar');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const abasRes = await getAbas(token, empresaId);
      setAbas(abasRes.data as Aba[]);
  const usuarioRes = await getUsuarioById(token, usuarioId);
  const usuario = (usuarioRes.data as any).user;
      // Espera-se que permissoes.kanban seja um array de permissões
      setPermissoes((usuario.permissoes?.kanban as PermissaoKanban[]) || []);
    } catch {
      showToast('Erro ao carregar permissões ou abas', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const handleAdd = async () => {
    if (!abaId || !tipo) return;
    try {
      // Buscar permissoes atuais do usuário
      const usuarioRes = await getUsuarioById(token, usuarioId);
      const usuario = (usuarioRes.data as any).user;
      const permissoesAtuais = usuario.permissoes || {};
      // Adiciona nova permissão ao array kanban
      const novaPerm: PermissaoKanban = {
        aba_id: Number(abaId),
        coluna_id: colunaId ? Number(colunaId) : undefined,
        tipo
      };
      const novasPerms = [...(permissoesAtuais.kanban || []), novaPerm];
      const novoObjetoPermissoes = { ...permissoesAtuais, kanban: novasPerms };
      await patchPermissoesUsuario(token, usuarioId, novoObjetoPermissoes);
      setAbaId(''); setColunaId(''); setTipo('visualizar');
      fetchData();
      showToast('Permissão atribuída!', 'success');
    } catch {
      showToast('Erro ao atribuir permissão', 'error');
    }
  };

  const handleDelete = async (p: PermissaoKanban) => {
    if (!window.confirm('Remover esta permissão?')) return;
    try {
      // Buscar permissoes atuais do usuário
      const usuarioRes = await getUsuarioById(token, usuarioId);
      const usuario = (usuarioRes.data as any).user;
      const permissoesAtuais = usuario.permissoes || {};
      // Remove permissão do array kanban
      const novasPerms = (permissoesAtuais.kanban || []).filter(
        (perm: PermissaoKanban) =>
          !(perm.aba_id === p.aba_id &&
            perm.coluna_id === p.coluna_id &&
            perm.tipo === p.tipo)
      );
      const novoObjetoPermissoes = { ...permissoesAtuais, kanban: novasPerms };
      await patchPermissoesUsuario(token, usuarioId, novoObjetoPermissoes);
      fetchData();
      showToast('Permissão removida', 'success');
    } catch {
      showToast('Erro ao remover permissão', 'error');
    }
  };

  return (
    <div className="card p-3 mb-3" style={{ 
      background: '#1a1d29', 
      border: '1px solid #2d3142',
      borderRadius: '10px'
    }}>
      <h5 style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '1rem' }}>Permissões Kanban</h5>
      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-4">
          <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Aba</label>
          <select className="form-select form-select-sm" value={abaId} onChange={e => { setAbaId(Number(e.target.value)); setColunaId(''); }} style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '6px',
            color: '#f8fafc'
          }}>
            <option value="">Selecione</option>
            {abas.map(aba => <option key={aba.id} value={aba.id}>{aba.nome}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Coluna (opcional)</label>
          <select className="form-select form-select-sm" value={colunaId} onChange={e => setColunaId(Number(e.target.value))} disabled={!abaId} style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '6px',
            color: '#f8fafc'
          }}>
            <option value="">Todas</option>
            {abas.find(a => a.id === abaId)?.colunas.map(col => <option key={col.id} value={col.id}>{col.nome}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Tipo</label>
          <select className="form-select form-select-sm" value={tipo} onChange={e => setTipo(e.target.value)} style={{
            background: '#0f1115',
            border: '1px solid #2d3142',
            borderRadius: '6px',
            color: '#f8fafc'
          }}>
            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-md-1">
          <button className="btn btn-sm w-100" onClick={handleAdd} disabled={loading || !abaId || !tipo} style={{
            background: loading || !abaId || !tipo ? '#64748b' : '#16a34a',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: '600'
          }}>+
          </button>
        </div>
      </div>
      <div>
        <table className="table table-sm" style={{ color: '#cbd5e1' }}>
          <thead style={{ background: '#0f1115', borderColor: '#2d3142' }}>
            <tr>
              <th style={{ color: '#94a3b8', borderColor: '#2d3142', padding: '0.5rem' }}>Aba</th>
              <th style={{ color: '#94a3b8', borderColor: '#2d3142', padding: '0.5rem' }}>Coluna</th>
              <th style={{ color: '#94a3b8', borderColor: '#2d3142', padding: '0.5rem' }}>Tipo</th>
              <th style={{ color: '#94a3b8', borderColor: '#2d3142', padding: '0.5rem' }}></th>
            </tr>
          </thead>
          <tbody style={{ background: '#1a1d29' }}>
            {permissoes.map((p, idx) => {
              const aba = abas.find(a => a.id === p.aba_id);
              const coluna = aba?.colunas.find(c => c.id === p.coluna_id);
              return (
                <tr key={idx}>
                  <td style={{ color: '#cbd5e1', borderColor: '#2d3142', padding: '0.5rem' }}>{aba?.nome || <em style={{ color: '#64748b' }}>?</em>}</td>
                  <td style={{ color: '#cbd5e1', borderColor: '#2d3142', padding: '0.5rem' }}>{coluna?.nome || <em style={{ color: '#64748b' }}>Todas</em>}</td>
                  <td style={{ color: '#cbd5e1', borderColor: '#2d3142', padding: '0.5rem' }}>{p.tipo}</td>
                  <td style={{ borderColor: '#2d3142', padding: '0.5rem' }}>
                    <button className="btn btn-sm" onClick={() => handleDelete(p)} style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem'
                    }}>Remover</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissoesKanbanForm;
