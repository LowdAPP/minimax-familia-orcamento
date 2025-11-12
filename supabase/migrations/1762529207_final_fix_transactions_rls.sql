-- Migration: final_fix_transactions_rls
-- Created at: 1762529207

-- Reabilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;

-- Criar políticas corretas
CREATE POLICY "Users can insert own transactions" ON public.transactions
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Políticas para service_role
CREATE POLICY "Service role can manage all transactions" ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'transactions';;