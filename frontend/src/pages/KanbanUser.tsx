
import React from 'react';
import KanbanUsuario from '../components/KanbanUsuario';
import NavbarUser from '../components/NavbarUser';

const KanbanUserPage: React.FC = () => {
	const nome = localStorage.getItem('nome') || 'Usuário';
	const foto = localStorage.getItem('foto') || undefined;
	return (
		<>
			<NavbarUser userName={nome} userFoto={foto} />
			<div style={{ paddingTop: 80 }}>
				<KanbanUsuario />
			</div>
		</>
	);
};

export default KanbanUserPage;
