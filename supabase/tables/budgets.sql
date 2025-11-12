CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_name VARCHAR(100),
    methodology VARCHAR(50),
    month_year VARCHAR(7),
    status VARCHAR(20) DEFAULT 'proposed',
    total_income DECIMAL(10,2),
    needs_amount DECIMAL(10,2),
    wants_amount DECIMAL(10,2),
    savings_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);