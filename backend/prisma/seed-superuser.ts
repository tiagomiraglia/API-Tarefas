import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'tiagomiraglia@nynch.com.br';
  const password = process.env.ADMIN_PASSWORD || 'Tiagoadb0j87@';
  const hash = await bcrypt.hash(password, 10);

  // Cria empresa padrão se não existir
  const empresaNome = 'Empresa Principal';
  let empresa = await prisma.empresa.findFirst({ where: { nome: empresaNome } });
  if (!empresa) {
    empresa = await prisma.empresa.create({ data: { nome: empresaNome } });
  }

  // Cria usuário superuser se não existir
  const existing = await prisma.usuario.findFirst({ where: { email } });
  if (!existing) {
    await prisma.usuario.create({
      data: {
        nome: 'Tiago Miraglia',
        email,
        senha: hash,
        is_superuser: true,
        nivel: 'admin',
        empresa: { connect: { id: empresa.id } }
      }
    });
    console.log('Superusuário criado:', email);
  } else {
    console.log('Superusuário já existe:', email);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
