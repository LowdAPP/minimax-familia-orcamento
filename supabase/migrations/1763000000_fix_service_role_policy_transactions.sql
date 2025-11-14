-- Migration: fix_service_role_policy_transactions
-- Created at: 1763000000
-- Objetivo: Garantir que service_role pode inserir transações via backend

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;

-- Criar política específica para service_role (bypassa RLS)
CREATE POLICY "Service role can manage all transactions" 
ON public.transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Garantir permissões GRANT para service_role
GRANT ALL ON public.transactions TO service_role;

-- Verificar se a política foi criada
SELECT 
    policyname, 
    cmd, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
AND roles = '{service_role}';

-- Verificar permissões GRANT
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'transactions'
AND grantee = 'service_role';

