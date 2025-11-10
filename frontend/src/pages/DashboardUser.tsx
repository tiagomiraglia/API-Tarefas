import React from 'react';
import KanbanUsuario from '../components/KanbanUsuario';
import Navbar from '../components/Navbar';

const DashboardUser: React.FC = () => {
  const nome = localStorage.getItem('nome') || 'Usuário';
  const foto = localStorage.getItem('foto') || undefined;
  return (
    <>
      <Navbar userName={nome} userFoto={foto} />
      <div style={{ paddingTop: 80 }}>
        <KanbanUsuario />
      </div>
    </>
  );
};

export default DashboardUser;
