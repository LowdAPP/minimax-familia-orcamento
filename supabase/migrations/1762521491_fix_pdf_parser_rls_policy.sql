-- Migration: fix_pdf_parser_rls_policy
-- Created at: 1762521491

-- Criar política para permitir inserção via service role (edge functions)
CREATE POLICY "Service role can insert transactions" ON public.transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Também para categorias
CREATE POLICY "Service role can access categories" ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar as políticas atualizadas
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename IN ('transactions', 'categories');;