-- Migration: temporarily_disable_account_type_check
-- Created at: 1762450885

-- Desabilitar temporariamente a constraint para debug
ALTER TABLE accounts DROP CONSTRAINT accounts_account_type_check;;