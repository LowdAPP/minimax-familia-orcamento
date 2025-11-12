-- Migration: create_complete_schema
-- Created at: 1762385643

-- ============================================
-- MIGRATION: Sistema SaaS Gestão Financeira Familiar
-- Data: 2025-11-06
-- Descrição: Schema completo do banco de dados
-- ============================================

-- ============================================
-- 1. TABELA: user_profiles
-- Perfis de usuários com persona e objetivo principal
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_type VARCHAR(50) CHECK (persona_type IN ('iniciante_perdido', 'frustrado_anonimo', 'sem_tempo', 'gastador_impulsivo')),
  primary_goal VARCHAR(50) CHECK (primary_goal IN ('fazer_sobrar', 'quitar_divida', 'criar_reserva', 'controlar_gastos')),
  monthly_income DECIMAL(10,2),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABELA: accounts
-- Contas bancárias, cartões e dívidas
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_type VARCHAR(50) CHECK (account_type IN ('conta_corrente', 'poupanca', 'cartao_credito', 'divida')),
  nickname VARCHAR(100) NOT NULL,
  institution VARCHAR(100),
  initial_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  credit_limit DECIMAL(10,2),
  due_date INTEGER,
  interest_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(user_id, is_active);

-- RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TABELA: categories
-- Categorias de transações
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(100) NOT NULL,
  category_type VARCHAR(50) CHECK (category_type IN ('essencial', 'superfluo', 'poupanca', 'divida')),
  icon VARCHAR(50),
  color VARCHAR(20),
  envelope_limit DECIMAL(10,2),
  is_system_category BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_system ON categories(is_system_category);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own and system categories"
  ON categories FOR SELECT
  USING (user_id = auth.uid() OR is_system_category = TRUE);

CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  USING (user_id = auth.uid() AND is_system_category = FALSE);

-- ============================================
-- 4. TABELA: transactions
-- Transações financeiras
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  category_id UUID,
  transaction_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  merchant VARCHAR(200),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('receita', 'despesa', 'transferencia')),
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  source VARCHAR(50) CHECK (source IN ('manual', 'pdf_import', 'api')) DEFAULT 'manual',
  pdf_file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(user_id, status);

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 5. TABELA: budgets
-- Orçamentos mensais
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  budget_name VARCHAR(100),
  methodology VARCHAR(50) CHECK (methodology IN ('envelope', '50_30_20', 'zero_based')),
  month_year VARCHAR(7) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('proposed', 'active', 'closed')) DEFAULT 'proposed',
  total_income DECIMAL(10,2),
  needs_amount DECIMAL(10,2),
  wants_amount DECIMAL(10,2),
  savings_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month_year DESC);

-- RLS Policies
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 6. TABELA: budget_envelopes
-- Envelopes por categoria (Envelope Method)
-- ============================================
CREATE TABLE IF NOT EXISTS budget_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL,
  category_id UUID NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_budget_envelopes_budget ON budget_envelopes(budget_id);

-- RLS Policies
ALTER TABLE budget_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget envelopes"
  ON budget_envelopes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = budget_envelopes.budget_id 
      AND budgets.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. TABELA: goals
-- Metas financeiras
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_name VARCHAR(100) NOT NULL,
  goal_type VARCHAR(50) CHECK (goal_type IN ('reserva_emergencia', 'quitacao_divida', 'superfluos', 'orcamento_mensal')),
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  status VARCHAR(20) CHECK (status IN ('defined', 'active', 'paused', 'completed', 'abandoned')) DEFAULT 'defined',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);

-- RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 8. TABELA: debt_payoff_plans
-- Planos de quitação de dívidas
-- ============================================
CREATE TABLE IF NOT EXISTS debt_payoff_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_name VARCHAR(100),
  methodology VARCHAR(50) CHECK (methodology IN ('snowball', 'avalanche')),
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  total_debt DECIMAL(10,2),
  total_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_debt_plans_user_id ON debt_payoff_plans(user_id);

-- RLS Policies
ALTER TABLE debt_payoff_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debt plans"
  ON debt_payoff_plans FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 9. TABELA: debt_items
-- Dívidas individuais no plano
-- ============================================
CREATE TABLE IF NOT EXISTS debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  account_id UUID NOT NULL,
  creditor_name VARCHAR(100),
  original_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  minimum_payment DECIMAL(10,2),
  priority_order INTEGER,
  status VARCHAR(20) CHECK (status IN ('active', 'paid_off')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_debt_items_plan ON debt_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_debt_items_priority ON debt_items(plan_id, priority_order);

-- RLS Policies
ALTER TABLE debt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own debt items"
  ON debt_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM debt_payoff_plans 
      WHERE debt_payoff_plans.id = debt_items.plan_id 
      AND debt_payoff_plans.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. TABELA: alerts
-- Alertas configurados
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type VARCHAR(50) CHECK (alert_type IN ('envelope_limit', 'due_date', 'budget_review', 'habit_streak', 'impulse_check', 'free_balance')),
  trigger_condition JSONB,
  message TEXT,
  channel VARCHAR(20) CHECK (channel IN ('app', 'email', 'sms')) DEFAULT 'app',
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(user_id, is_active);

-- RLS Policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON alerts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 11. TABELA: gamification_achievements
-- Conquistas e badges
-- ============================================
CREATE TABLE IF NOT EXISTS gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type VARCHAR(50) CHECK (achievement_type IN ('streak_semanal', 'primeira_meta', 'primeira_quitacao', 'consistente', 'vitoria_rapida')),
  achievement_name VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  earned_at TIMESTAMP DEFAULT NOW(),
  streak_count INTEGER DEFAULT 0
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON gamification_achievements(user_id);

-- RLS Policies
ALTER TABLE gamification_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON gamification_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON gamification_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 12. CATEGORIAS PADRÃO DO SISTEMA
-- ============================================
INSERT INTO categories (name, category_type, icon, color, is_system_category) VALUES
  ('Moradia', 'essencial', 'home', '#0066FF', TRUE),
  ('Alimentação', 'essencial', 'utensils', '#0066FF', TRUE),
  ('Transporte', 'essencial', 'car', '#0066FF', TRUE),
  ('Saúde', 'essencial', 'heart', '#0066FF', TRUE),
  ('Educação', 'essencial', 'book', '#0066FF', TRUE),
  ('Lazer', 'superfluo', 'smile', '#F59E0B', TRUE),
  ('Compras', 'superfluo', 'shopping-bag', '#F59E0B', TRUE),
  ('Restaurantes', 'superfluo', 'coffee', '#F59E0B', TRUE),
  ('Viagens', 'superfluo', 'plane', '#F59E0B', TRUE),
  ('Poupança', 'poupanca', 'piggy-bank', '#10B981', TRUE),
  ('Investimentos', 'poupanca', 'trending-up', '#10B981', TRUE),
  ('Dívidas', 'divida', 'credit-card', '#EF4444', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_budget_envelopes_updated_at BEFORE UPDATE ON budget_envelopes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_debt_payoff_plans_updated_at BEFORE UPDATE ON debt_payoff_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_debt_items_updated_at BEFORE UPDATE ON debt_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;