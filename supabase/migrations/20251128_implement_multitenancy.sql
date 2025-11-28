-- Migration: Implementação de Multitenancy e Segurança RLS
-- Data: 2025-11-28
-- Descrição: Adiciona isolamento por tenant e reforça políticas de segurança

-- 1. Função auxiliar para obter o tenant_id do usuário atual
-- Tenta pegar de user_profiles, se não tiver, tenta de users (legado/admin)
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
DECLARE
  tid UUID;
BEGIN
  -- Tenta pegar do perfil financeiro
  SELECT tenant_id INTO tid FROM public.user_profiles WHERE id = auth.uid();
  
  -- Se não achou, tenta da tabela users (sistema educacional/admin)
  IF tid IS NULL THEN
    SELECT tenant_id INTO tid FROM public.users WHERE id = auth.uid();
  END IF;
  
  RETURN tid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Adicionar colunas tenant_id e migrar dados
DO $$
DECLARE
    -- ID do tenant "Igreja Reviver" existente para migração
    default_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN

    -- user_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE user_profiles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);
    END IF;

    -- accounts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'tenant_id') THEN
        ALTER TABLE accounts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE accounts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
    END IF;

    -- categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'tenant_id') THEN
        ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_categories_tenant ON categories(tenant_id);
    END IF;

    -- transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'tenant_id') THEN
        ALTER TABLE transactions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE transactions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
    END IF;

    -- budgets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'tenant_id') THEN
        ALTER TABLE budgets ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE budgets SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
    END IF;

    -- goals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'tenant_id') THEN
        ALTER TABLE goals ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE goals SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_goals_tenant ON goals(tenant_id);
    END IF;

    -- debts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debts' AND column_name = 'tenant_id') THEN
        ALTER TABLE debts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE debts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_debts_tenant ON debts(tenant_id);
    END IF;

    -- alerts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'tenant_id') THEN
        ALTER TABLE alerts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        UPDATE alerts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        CREATE INDEX idx_alerts_tenant ON alerts(tenant_id);
    END IF;

END $$;

-- 3. Atualizar Policies RLS para Multitenancy

-- TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own transactions full" ON transactions;
DROP POLICY IF EXISTS "Users can read with joins" ON transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON transactions;
DROP POLICY IF EXISTS "Service role full access" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "enable_read_access_for_own_transactions" ON transactions;

-- Política de Leitura: Dono do dado E mesmo tenant
CREATE POLICY "Multitenant Read Transactions"
ON transactions FOR SELECT
USING (
    auth.uid() = user_id 
    AND (
        tenant_id IS NULL -- Legado/Transição
        OR tenant_id = get_auth_tenant_id()
    )
);

-- Política de Escrita (Insert/Update/Delete): Dono do dado E mesmo tenant
CREATE POLICY "Multitenant Write Transactions"
ON transactions FOR ALL
USING (
    auth.uid() = user_id 
    AND (
        tenant_id IS NULL 
        OR tenant_id = get_auth_tenant_id()
    )
)
WITH CHECK (
    auth.uid() = user_id 
    AND (
        tenant_id IS NULL 
        OR tenant_id = get_auth_tenant_id()
    )
);

-- Política para Service Role (Backend/Edge Functions)
CREATE POLICY "Service Role Full Access Transactions"
ON transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ACCOUNTS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;

CREATE POLICY "Multitenant Manage Accounts"
ON accounts FOR ALL
USING (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id())
)
WITH CHECK (
    auth.uid() = user_id 
    AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id())
);

CREATE POLICY "Service Role Full Access Accounts"
ON accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own and system categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
DROP POLICY IF EXISTS "Service role can access categories" ON categories;

CREATE POLICY "Multitenant Read Categories"
ON categories FOR SELECT
USING (
    (user_id = auth.uid() AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    OR 
    (is_system_category = TRUE) -- Categorias de sistema são globais ou por tenant (aqui assumindo globais se tenant_id for null)
);

CREATE POLICY "Multitenant Manage Categories"
ON categories FOR ALL
USING (
    user_id = auth.uid() 
    AND is_system_category = FALSE
    AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id())
)
WITH CHECK (
    user_id = auth.uid() 
    AND is_system_category = FALSE
    AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id())
);

CREATE POLICY "Service Role Full Access Categories"
ON categories FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- USER_PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Multitenant Manage Profiles"
ON user_profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
-- Nota: user_profiles define o tenant, então a verificação aqui é apenas de ID
-- O tenant_id é atribuído na criação (via trigger ou backend)

CREATE POLICY "Service Role Full Access Profiles"
ON user_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


