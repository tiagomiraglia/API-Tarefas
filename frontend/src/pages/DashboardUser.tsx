import React from 'react';
import NavbarUser from '../components/NavbarUser';

const DashboardUser: React.FC = () => {
  const nome = localStorage.getItem('nome') || 'Usuário';
  const foto = localStorage.getItem('foto') || undefined;
  return (
    <>
      <NavbarUser userName={nome} userFoto={foto} />
      <div style={{ paddingTop: 80 }}>
        <div>Dashboard User</div>
      </div>
    </>
  );
};

export default DashboardUser;
