-- Migration: final_rls_fix_simplified
-- Created at: 1762450705


-- Re-abilitar RLS e criar políticas simplificadas
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Dropar todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to select" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON transactions;

-- Criar política SIMPLES E PERMISSIVA para SELECT
-- Permite que qualquer usuário autenticado veja suas próprias transações
CREATE POLICY "enable_read_access_for_own_transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Política SIMPLES para INSERT
CREATE POLICY "enable_insert_access_for_own_transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política SIMPLES para UPDATE
CREATE POLICY "enable_update_access_for_own_transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política SIMPLES para DELETE
CREATE POLICY "enable_delete_access_for_own_transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- Comentário de documentação
COMMENT ON TABLE transactions IS 'RLS re-habilitado com políticas simplificadas - 2025-11-07 - Teste Final';
;