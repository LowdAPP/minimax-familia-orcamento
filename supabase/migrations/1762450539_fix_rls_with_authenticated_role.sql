-- Migration: fix_rls_with_authenticated_role
-- Created at: 1762450539


-- Corrigir políticas RLS para usar role authenticated
-- Dropar políticas existentes
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Criar políticas com role authenticated
-- SELECT: Usuários autenticados podem ver suas próprias transações
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Usuários autenticados podem criar suas próprias transações
CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários autenticados podem atualizar suas próprias transações
CREATE POLICY "Users can update own transactions"
ON transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários autenticados podem deletar suas próprias transações
CREATE POLICY "Users can delete own transactions"
ON transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar política para permitir select via anon key (apenas para testes)
-- Esta política permite que queries autenticadas funcionem mesmo com anon key
CREATE POLICY "Allow authenticated users to select"
ON transactions
FOR SELECT
TO anon
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert"
ON transactions
FOR INSERT
TO anon
WITH CHECK (auth.uid() = user_id);

-- Comentário de documentação
COMMENT ON TABLE transactions IS 'Transações financeiras - RLS policies com authenticated+anon roles - 2025-11-07';
;