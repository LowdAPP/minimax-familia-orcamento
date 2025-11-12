-- Migration: fix_categories_rls_for_joins
-- Created at: 1762445011


-- Corrigir políticas RLS de categories para permitir JOINs

-- Remover políticas duplicadas/conflitantes
DROP POLICY IF EXISTS "Users can read all categories" ON categories;
DROP POLICY IF EXISTS "Users can read own and system categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;

-- Criar política única e clara para leitura (permite JOINs)
CREATE POLICY "Allow read all categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Política para gerenciar categorias próprias (não-sistema)
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO public
  USING ((user_id = auth.uid()) AND (is_system_category = false))
  WITH CHECK ((user_id = auth.uid()) AND (is_system_category = false));

-- Garantir que categorias do sistema sejam read-only
-- (apenas para INSERT, não afeta SELECT que já é permitido acima)
CREATE POLICY "Prevent modification of system categories"
  ON categories
  FOR UPDATE
  TO public
  USING (is_system_category = false);
;