CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID,
    category_id UUID,
    transaction_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    merchant VARCHAR(200),
    transaction_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);