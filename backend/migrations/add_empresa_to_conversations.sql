-- Migration: Adicionar suporte multi-tenant para conexões WhatsApp
-- Cada empresa terá suas próprias conexões WhatsApp isoladas

-- 1. Adicionar coluna empresa_id na tabela conversations
ALTER TABLE conversations 
ADD COLUMN empresa_id INT NULL AFTER id,
ADD COLUMN whatsapp_session_id VARCHAR(255) NULL AFTER phone;

-- 2. Criar índice para melhorar performance de consultas por empresa
CREATE INDEX idx_conversations_empresa ON conversations(empresa_id);
CREATE INDEX idx_conversations_session ON conversations(whatsapp_session_id);

-- 3. Atualizar registros existentes (associar à primeira empresa encontrada)
-- IMPORTANTE: Execute manualmente caso já existam dados
-- UPDATE conversations c
-- SET empresa_id = (SELECT id FROM Empresa ORDER BY id LIMIT 1)
-- WHERE empresa_id IS NULL;

-- 4. Após verificar os dados, tornar empresa_id obrigatório
-- ALTER TABLE conversations MODIFY empresa_id INT NOT NULL;

-- 5. Adicionar foreign key (após popular dados)
-- ALTER TABLE conversations 
-- ADD CONSTRAINT fk_conversations_empresa 
-- FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE;
