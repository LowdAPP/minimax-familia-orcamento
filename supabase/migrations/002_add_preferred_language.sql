-- Migration para adicionar campo preferred_language ao perfil do usuário
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/qkmuypctpuyoouqfatjf/sql

-- Adicionar coluna preferred_language à tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'pt-BR' 
CHECK (preferred_language IN ('pt-BR', 'pt-PT'));

-- Atualizar usuários existentes para usar o idioma padrão
UPDATE user_profiles 
SET preferred_language = 'pt-BR' 
WHERE preferred_language IS NULL;

-- Comentários para referência:
-- Esta coluna armazena a preferência de idioma do usuário:
-- 'pt-BR' = Português (Brasil) - mostra Real (R$)
-- 'pt-PT' = Português (Portugal) - mostra Euro (€)
-- O sistema automaticamente carrega esta preferência ao fazer login
-- e salva mudanças quando o usuário altera o idioma nas configurações
