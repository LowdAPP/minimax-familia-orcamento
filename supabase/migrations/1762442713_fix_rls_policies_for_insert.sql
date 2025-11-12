-- Migration: fix_rls_policies_for_insert
-- Created at: 1762442713


-- Corrigir políticas RLS para permitir INSERT com verificação de user_id

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;

-- Recriar políticas com with_check para permitir INSERT
-- Política para transactions
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para accounts
CREATE POLICY "Users can manage own accounts"
  ON accounts
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verificar se categories tem políticas (necessário para foreign keys)
DROP POLICY IF EXISTS "Users can read all categories" ON categories;
CREATE POLICY "Users can read all categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Verificar se budgets tem políticas
DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
CREATE POLICY "Users can manage own budgets"
  ON budgets
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
;