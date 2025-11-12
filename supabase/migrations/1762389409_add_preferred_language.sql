-- Migration: add_preferred_language
-- Created at: 1762389409

ALTER TABLE user_profiles 
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'pt-BR' 
CHECK (preferred_language IN ('pt-BR', 'pt-PT'));

UPDATE user_profiles 
SET preferred_language = 'pt-BR' 
WHERE preferred_language IS NULL;;