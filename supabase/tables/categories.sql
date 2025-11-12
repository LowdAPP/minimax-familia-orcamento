CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50),
    icon VARCHAR(50),
    color VARCHAR(20),
    envelope_limit DECIMAL(10,2),
    is_system_category BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);