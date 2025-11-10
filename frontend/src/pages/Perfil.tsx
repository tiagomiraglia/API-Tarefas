import React, { useState } from 'react';
import PerfilModal from '../components/PerfilModal';

export default function PerfilPage() {
  // Simulação de dados do usuário logado
  const user = {
    nome: 'Tiago Miraglia',
    email: 'tiagomiraglia@nynch.com.br',
    cargo: 'CEO',
    avatar: '',
    nivel: 'superuser',
    ultimo_acesso: '2025-10-16 06:00',
  };
  const [show, setShow] = useState(true);

  return (
    <>
      <PerfilModal user={user} show={show} onClose={() => setShow(false)} />
      {!show && <div className="container py-5 text-center">Perfil fechado.</div>}
    </>
  );
}
