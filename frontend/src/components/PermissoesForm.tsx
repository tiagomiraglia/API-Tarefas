import React, { useState } from 'react';

export type Permissoes = {
  dashboard: boolean;
  relatorios: boolean;
  configuracoes: boolean;
  financeiro: boolean;
};

const permissoesPadrao: Permissoes = {
  dashboard: true,
  relatorios: false,
  configuracoes: false,
  financeiro: false,
};

interface PermissoesFormProps {
  value: Permissoes;
  onChange: (perms: Permissoes) => void;
}

export default function PermissoesForm({ value, onChange }: PermissoesFormProps) {
  function handleToggle(key: keyof Permissoes) {
    onChange({ ...value, [key]: !value[key] });
  }
  return (
    <div>
      <label className="form-label">Permissões de acesso</label>
      <div className="d-flex flex-column gap-2">
        <label><input type="checkbox" checked={value.dashboard} onChange={() => handleToggle('dashboard')} /> Dashboard</label>
        <label><input type="checkbox" checked={value.relatorios} onChange={() => handleToggle('relatorios')} /> Relatórios</label>
        <label><input type="checkbox" checked={value.configuracoes} onChange={() => handleToggle('configuracoes')} /> Configurações</label>
        <label><input type="checkbox" checked={value.financeiro} onChange={() => handleToggle('financeiro')} /> Financeiro</label>
      </div>
    </div>
  );
}
export { permissoesPadrao };
