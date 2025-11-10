/**
 * Script para executar migration SQL adicionando suporte multi-tenant
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Executando migration: create_whatsapp_sessions...');

    // Criar tabela
    console.log('📝 Criando tabela whatsapp_sessions...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        empresa_id INT NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'disconnected',
        client_name VARCHAR(255),
        last_qr_update TIMESTAMP,
        connected_at TIMESTAMP,
        disconnected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('  ✅ Tabela criada!');

    // Criar índices
    console.log('🔍 Criando índices...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_empresa ON whatsapp_sessions(empresa_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_telefone ON whatsapp_sessions(telefone)`;
    console.log('  ✅ Índices criados!');

    // Adicionar foreign key
    console.log('🔗 Adicionando foreign key...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE whatsapp_sessions 
        ADD CONSTRAINT fk_whatsapp_sessions_empresa 
        FOREIGN KEY (empresa_id) REFERENCES "Empresa"(id) ON DELETE CASCADE
      `);
      console.log('  ✅ Foreign key adicionada!');
    } catch (error: any) {
      if (error.meta?.code === '42710') {
        console.log('  ⚠️  Foreign key já existe!');
      } else {
        throw error;
      }
    }

    // Adicionar coluna na CartaoWhatsApp
    console.log('🔧 Adicionando coluna whatsapp_session_id...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "CartaoWhatsApp" ADD COLUMN whatsapp_session_id VARCHAR(255) NULL`);
      console.log('  ✅ Coluna adicionada!');
    } catch (error: any) {
      if (error.meta?.code === '42701') {
        console.log('  ⚠️  Coluna já existe!');
      } else {
        throw error;
      }
    }

    // Criar índice na CartaoWhatsApp
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_cartao_whatsapp_session ON "CartaoWhatsApp"(whatsapp_session_id)`;

    console.log('\n✅ Migration executada com sucesso!');
    console.log('📌 Tabela whatsapp_sessions criada com sucesso!');
    console.log('✅ Seu sistema agora suporta múltiplas sessões WhatsApp por empresa!');

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
