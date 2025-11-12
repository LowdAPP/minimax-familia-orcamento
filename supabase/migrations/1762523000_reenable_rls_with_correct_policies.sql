-- Migration: Reabilitar RLS com políticas corretas para PDF parser
-- Created at: 1762523000

-- Reabilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

-- Criar política para service_role (edge functions)
CREATE POLICY "Service role can manage all transactions" 
ON public.transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Criar política para usuários autenticados (seu próprio usuário)
CREATE POLICY "Users can manage own transactions" 
ON public.transactions 
FOR ALL 
USING (auth.uid() = user_id);

-- Verificar se existem categorias sistema
-- Se não existirem, criar as categorias básicas do sistema
INSERT INTO categories (name, category_type, icon, color, is_system_category) VALUES
  ('Moradia', 'essencial', 'home', '#0066FF', true),
  ('Alimentação', 'essencial', 'utensils', '#0066FF', true),
  ('Transporte', 'essencial', 'car', '#0066FF', true),
  ('Saúde', 'essencial', 'heart', '#0066FF', true),
  ('Educação', 'essencial', 'book', '#0066FF', true),
  ('Lazer', 'superfluo', 'smile', '#F59E0B', true),
  ('Compras', 'superfluo', 'shopping-bag', '#F59E0B', true),
  ('Restaurantes', 'superfluo', 'coffee', '#F59E0B', true),
  ('Viagens', 'superfluo', 'plane', '#F59E0B', true),
  ('Poupança', 'poupanca', 'piggy-bank', '#10B981', true),
  ('Investimentos', 'poupanca', 'trending-up', '#10B981', true),
  ('Dívidas', 'divida', 'credit-card', '#EF4444', true),
  ('Transferência', 'essencial', 'transfer', '#6366f1', true),
  ('Outros', 'superfluo', 'more', '#94a3b8', true)
ON CONFLICT (name) DO NOTHING;

-- Garantir que service_role tem acesso completo às categorias
GRANT ALL ON public.categories TO service_role;

-- Verificar as políticas criadas
SELECT 
    schemaname,
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;