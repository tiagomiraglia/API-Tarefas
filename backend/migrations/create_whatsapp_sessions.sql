-- Migration: Criar tabela para gerenciar sessões WhatsApp por empresa
-- Cada empresa poderá ter múltiplas conexões WhatsApp

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
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_empresa ON whatsapp_sessions(empresa_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_telefone ON whatsapp_sessions(telefone);

ALTER TABLE whatsapp_sessions ADD CONSTRAINT IF NOT EXISTS fk_whatsapp_sessions_empresa FOREIGN KEY (empresa_id) REFERENCES "Empresa"(id) ON DELETE CASCADE;

ALTER TABLE "CartaoWhatsApp" ADD COLUMN IF NOT EXISTS whatsapp_session_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_cartao_whatsapp_session ON "CartaoWhatsApp"(whatsapp_session_id);

