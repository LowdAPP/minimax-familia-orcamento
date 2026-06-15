-- Migration: Contas Fixas, Pagamentos e Limites Semanais
-- Data: 2026-06-15
-- Padrão RLS multitenant igual a 20251128_implement_multitenancy.sql

-- 1. fixed_bills (definição da conta fixa recorrente)
CREATE TABLE IF NOT EXISTS fixed_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fixed_bills_user ON fixed_bills(user_id);

-- 2. fixed_bill_payments (estado por mês)
CREATE TABLE IF NOT EXISTS fixed_bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixed_bill_id UUID NOT NULL REFERENCES fixed_bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    month_year VARCHAR(7) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    transaction_id UUID REFERENCES transactions(id),
    amount_paid DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (fixed_bill_id, month_year)
);
CREATE INDEX IF NOT EXISTS idx_fbp_user ON fixed_bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_fbp_month ON fixed_bill_payments(month_year);

-- 3. weekly_limits (override manual opcional do limite/semana)
CREATE TABLE IF NOT EXISTS weekly_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    month_year VARCHAR(7) NOT NULL,
    weekly_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (category_id, month_year)
);
CREATE INDEX IF NOT EXISTS idx_weekly_limits_user ON weekly_limits(user_id);

-- 4. RLS
ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Fixed Bills" ON fixed_bills FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Fixed Bills" ON fixed_bills FOR ALL
    TO service_role USING (true) WITH CHECK (true);

ALTER TABLE fixed_bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Bill Payments" ON fixed_bill_payments FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Bill Payments" ON fixed_bill_payments FOR ALL
    TO service_role USING (true) WITH CHECK (true);

ALTER TABLE weekly_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Weekly Limits" ON weekly_limits FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Weekly Limits" ON weekly_limits FOR ALL
    TO service_role USING (true) WITH CHECK (true);
