import React from 'react';
import KanbanAdmin from '../components/KanbanAdmin';

const KanbanPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const empresaId = localStorage.getItem('empresa_id') ? Number(localStorage.getItem('empresa_id')) : undefined;
  return <KanbanAdmin token={token} empresaId={empresaId} />;
};

export default KanbanPage;
