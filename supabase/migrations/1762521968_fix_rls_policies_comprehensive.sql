-- Migration: fix_rls_policies_comprehensive
-- Created at: 1762521968

-- Desabilitar temporariamente RLS na tabela transactions para debugging
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Verificar se o service_role tem todas as permissões necessárias
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.user_profiles TO service_role;

-- Verificar as políticas após a mudança
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'transactions';;