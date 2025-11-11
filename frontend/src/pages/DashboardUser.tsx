import React from 'react';
import Navbar from '../components/Navbar';

const DashboardUser: React.FC = () => {
  const nome = localStorage.getItem('nome') || 'Usuário';
  const foto = localStorage.getItem('foto') || undefined;
  return (
    <>
      <Navbar userName={nome} userFoto={foto} />
      <div style={{ paddingTop: 80 }}>
        <div>Dashboard User</div>
      </div>
    </>
  );
};

export default DashboardUser;
