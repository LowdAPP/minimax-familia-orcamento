-- Fix budgets table unique constraint to include methodology
-- This allows users to have multiple budgets per month with different methodologies

-- Remove old unique constraint if it exists (user_id, month_year)
DO $$ 
BEGIN
    -- Try to drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'budgets'::regclass 
        AND contype = 'u'
        AND pg_get_constraintdef(oid) LIKE '%user_id%month_year%'
        AND pg_get_constraintdef(oid) NOT LIKE '%methodology%'
    ) THEN
        ALTER TABLE budgets DROP CONSTRAINT budgets_user_id_month_year_key;
    END IF;
END $$;

-- Add new unique constraint with methodology
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'budgets'::regclass 
        AND contype = 'u'
        AND pg_get_constraintdef(oid) LIKE '%user_id%month_year%methodology%'
    ) THEN
        ALTER TABLE budgets 
        ADD CONSTRAINT budgets_user_id_month_year_methodology_key 
        UNIQUE (user_id, month_year, methodology);
    END IF;
END $$;

