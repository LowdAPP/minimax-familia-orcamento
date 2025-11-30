# 🚀 Aplicar Migration: Fix Budgets Unique Constraint

## Problema
O código está tentando usar `onConflict: 'user_id,month_year,methodology'` mas a constraint UNIQUE no banco não inclui `methodology`, causando erro HTTP 400.

## Solução: Aplicar Migration

### 1. Acesse Supabase SQL Editor
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto (qkmuypctpuyoouqfatjf)
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New query**

### 2. Execute a Migration
Cole e execute este SQL:

```sql
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
```

### 3. Verificar se Funcionou
Execute:

```sql
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'budgets'::regclass 
AND contype = 'u';
```

Deve retornar uma constraint com `user_id, month_year, methodology`.

### 4. Testar
Após aplicar a migration:
1. Acesse a página de Orçamento na aplicação
2. Tente salvar um orçamento
3. Deve funcionar sem erro HTTP 400

## O Que Esta Migration Faz

- Remove a constraint antiga `UNIQUE(user_id, month_year)` se existir
- Adiciona a nova constraint `UNIQUE(user_id, month_year, methodology)`
- Permite que usuários tenham múltiplos orçamentos no mesmo mês com metodologias diferentes (50/30/20, Envelope, Zero-Based)

## Nota

O código já foi atualizado para funcionar mesmo sem esta migration (fazendo upsert manual), mas a migration garante a estrutura correta do banco e permite usar o upsert nativo do Supabase no futuro.

