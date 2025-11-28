-- Migration: fix_categories_rls_policies
-- Created at: 1763200000
-- Objetivo: Corrigir e otimizar políticas RLS da tabela categories

-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
DROP POLICY IF EXISTS "Users can read own and system categories" ON categories;
DROP POLICY IF EXISTS "Allow read all categories" ON categories;
DROP POLICY IF EXISTS "Users can read categories" ON categories;

-- Política para SELECT: usuários podem ler suas próprias categorias E categorias do sistema
CREATE POLICY "Users can read own and system categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_system_category = true
  );

-- Política para INSERT: usuários podem criar apenas suas próprias categorias (não-sistema)
CREATE POLICY "Users can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND is_system_category = false
  );

-- Política para UPDATE: usuários podem atualizar apenas suas próprias categorias (não-sistema)
CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND is_system_category = false
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND is_system_category = false
  );

-- Política para DELETE: usuários podem deletar apenas suas próprias categorias (não-sistema)
CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND is_system_category = false
  );

-- Garantir que service_role tem acesso total (já existe, mas garantindo)
DROP POLICY IF EXISTS "Service role can access categories" ON categories;
CREATE POLICY "Service role can access categories"
  ON categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

