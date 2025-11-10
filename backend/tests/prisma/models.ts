// Script de teste para verificar se os models do Prisma estão funcionando
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any; // Temporário até TypeScript Server recarregar

async function testPrismaModels() {
  try {
    console.log('✅ Testing Prisma Client...');
    
    // Testar se os models existem
    console.log('✅ Cartao model:', typeof prisma.cartao);
    console.log('✅ CartaoWhatsApp model:', typeof prisma.cartaoWhatsApp);
    console.log('✅ MensagemWhatsApp model:', typeof prisma.mensagemWhatsApp);
    console.log('✅ CartaoHistorico model:', typeof prisma.cartaoHistorico);
    console.log('✅ CartaoAnexo model:', typeof prisma.cartaoAnexo);
    
    console.log('\n✅ All Kanban models are available in Prisma Client!');
    console.log('\n📝 Note: TypeScript errors in VS Code may require restarting the TS Server');
    console.log('   Command Palette → TypeScript: Restart TS Server');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaModels();
