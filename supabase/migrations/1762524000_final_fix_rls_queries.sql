-- Migration: Final fix RLS para queries de transações
-- Created at: 1762524000
-- Objetivo: Corrigir HTTP 400 nas queries da interface

-- Desabilitar RLS temporariamente para limpar políticas antigas
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Recriar RLS com políticas mais permissivas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política principal: usuários podem gerenciar próprias transações
CREATE POLICY "Users can manage own transactions full" 
ON public.transactions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para service_role (edge functions)
CREATE POLICY "Service role can manage all transactions" 
ON public.transactions 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Política específica para consultas com JOIN (resolvendo problema das queries)
CREATE POLICY "Users can read with joins" 
ON public.transactions 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
);

-- Verificar se a tabela categories tem políticas adequadas
DROP POLICY IF EXISTS "Service role can access categories" ON public.categories;
CREATE POLICY "Service role can access categories" 
ON public.categories 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- Garantir que categorias sistema são visíveis
DROP POLICY IF EXISTS "Users can read own and system categories" ON public.categories;
CREATE POLICY "Users can read categories" 
ON public.categories 
FOR SELECT 
USING (
    user_id = auth.uid() 
    OR is_system_category = TRUE
    OR auth.role() = 'service_role'
);

-- Conceder permissões adequadas
GRANT ALL ON public.transactions TO authenticated, service_role;
GRANT ALL ON public.categories TO authenticated, service_role;

-- Criar indexes se não existirem para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_active ON transactions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transactions_date_active ON transactions(transaction_date DESC) WHERE is_active = true;

-- Verificar se a política está funcionando
SELECT 
    schemaname,
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename IN ('transactions', 'categories')
ORDER BY tablename, policyname;