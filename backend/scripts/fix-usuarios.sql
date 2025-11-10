-- Verifica usuários sem empresa
SELECT id, nome, email, empresa_id FROM "Usuario" WHERE empresa_id IS NULL;

-- Verifica todas as empresas disponíveis
SELECT id, nome FROM "Empresa";

-- Atualiza usuários sem empresa para a primeira empresa
-- ATENÇÃO: Ajuste o ID da empresa conforme necessário
UPDATE "Usuario" 
SET empresa_id = (SELECT id FROM "Empresa" LIMIT 1)
WHERE empresa_id IS NULL;

-- Verifica se a correção foi aplicada
SELECT id, nome, email, empresa_id FROM "Usuario";
