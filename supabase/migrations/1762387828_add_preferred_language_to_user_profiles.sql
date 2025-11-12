-- Migration: add_preferred_language_to_user_profiles
-- Created at: 1762387828

ALTER TABLE user_profiles ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'pt-BR' CHECK (preferred_language IN ('pt-BR', 'pt-PT'));;