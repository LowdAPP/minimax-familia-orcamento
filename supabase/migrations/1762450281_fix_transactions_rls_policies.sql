-- Migration: fix_transactions_rls_policies
-- Created at: 1762450281


-- Corrigir políticas RLS da tabela transactions
-- Dropar política existente
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

-- Criar políticas específicas para cada operação
-- SELECT: Usuários podem ver suas próprias transações
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- INSERT: Usuários podem criar suas próprias transações
CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar suas próprias transações
CREATE POLICY "Users can update own transactions"
ON transactions
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar suas próprias transações
CREATE POLICY "Users can delete own transactions"
ON transactions
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Comentário de documentação
COMMENT ON TABLE transactions IS 'Transações financeiras - RLS policies atualizadas em 2025-11-07';
;