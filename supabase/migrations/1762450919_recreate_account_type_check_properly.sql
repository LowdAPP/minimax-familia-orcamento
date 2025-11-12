-- Migration: recreate_account_type_check_properly
-- Created at: 1762450919

-- Recriar constraint com os valores corretos
ALTER TABLE accounts ADD CONSTRAINT accounts_account_type_check 
CHECK (account_type::text = ANY (ARRAY['conta_corrente'::character varying, 'poupanca'::character varying, 'cartao_credito'::character varying, 'divida'::character varying]::text[]));;