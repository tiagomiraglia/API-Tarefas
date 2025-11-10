import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUsuariosSemEmpresa() {
  try {
    console.log('🔍 Buscando usuários sem empresa...');
    
    // Busca todos os usuários
    const usuarios = await prisma.usuario.findMany({
      include: { empresa: true }
    });

    console.log(`📊 Total de usuários: ${usuarios.length}`);
    
    // Verifica quais não têm empresa
    const usuariosSemEmpresa = usuarios.filter(u => !u.empresa_id || !u.empresa);
    
    if (usuariosSemEmpresa.length === 0) {
      console.log('✅ Todos os usuários têm empresa associada!');
      return;
    }

    console.log(`⚠️ ${usuariosSemEmpresa.length} usuários sem empresa:`);
    usuariosSemEmpresa.forEach(u => {
      console.log(`  - ${u.nome} (${u.email})`);
    });

    // Busca a primeira empresa disponível
    const empresa = await prisma.empresa.findFirst();
    
    if (!empresa) {
      console.error('❌ Nenhuma empresa encontrada no banco de dados!');
      console.log('💡 Crie uma empresa primeiro.');
      return;
    }

    console.log(`✅ Empresa encontrada: ${empresa.nome} (ID: ${empresa.id})`);
    console.log('🔧 Corrigindo usuários...');

    // Atualiza todos os usuários sem empresa
    for (const usuario of usuariosSemEmpresa) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { empresa_id: empresa.id }
      });
      console.log(`  ✅ ${usuario.nome} → Empresa ${empresa.nome}`);
    }

    console.log('✅ Correção concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsuariosSemEmpresa();
