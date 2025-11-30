# 🚨 IMPORTANTE: Aplicar Migration no Supabase

## Problema
Backend está dando erro de RLS mesmo com SERVICE_ROLE_KEY. A solução é criar uma função RPC que bypassa RLS.

## Solução: Aplicar Migration

### 1. Acesse Supabase SQL Editor
1. Vá para Supabase Dashboard
2. Clique em "SQL Editor"
3. Clique em "New query"

### 2. Execute a Migration
Cole e execute este SQL:

```sql
-- Migration: create_insert_transactions_bulk_function
-- Objetivo: Criar função RPC que bypassa RLS para inserir transações em lote

-- Função para inserir transações em lote (bypassa RLS quando chamada com service_role)
CREATE OR REPLACE FUNCTION insert_transactions_bulk(transactions_data jsonb[])
RETURNS TABLE(id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Executa com permissões do criador da função (bypassa RLS)
AS $$
BEGIN
  -- Inserir todas as transações
  RETURN QUERY
  INSERT INTO transactions (
    user_id,
    account_id,
    category_id,
    transaction_date,
    amount,
    description,
    merchant,
    transaction_type,
    status,
    source
  )
  SELECT
    (t->>'user_id')::uuid,
    (t->>'account_id')::uuid,
    CASE WHEN t->>'category_id' IS NOT NULL THEN (t->>'category_id')::uuid ELSE NULL END,
    (t->>'transaction_date')::date,
    (t->>'amount')::decimal,
    t->>'description',
    t->>'merchant',
    (t->>'transaction_type')::varchar,
    COALESCE((t->>'status')::varchar, 'confirmed'),
    COALESCE((t->>'source')::varchar, 'pdf_import')
  FROM unnest(transactions_data) AS t
  RETURNING transactions.id;
END;
$$;

-- Garantir que service_role pode executar a função
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO service_role;
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO anon;

-- Comentário
COMMENT ON FUNCTION insert_transactions_bulk IS 'Insere transações em lote bypassando RLS. Usado pelo backend para importação de PDFs.';
```

### 3. Verificar se Funcionou
Execute:
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'insert_transactions_bulk';
```

Deve retornar:
- `proname`: `insert_transactions_bulk`
- `prosecdef`: `true` (indica que é SECURITY DEFINER)

### 4. Testar
Após aplicar a migration:
1. Faça push do código atualizado
2. Teste upload de PDF
3. O backend vai tentar inserção direta primeiro
4. Se falhar com RLS, vai usar a função RPC automaticamente

## Como Funciona

1. **Inserção Direta**: Backend tenta inserir diretamente (mais rápido)
2. **Fallback RPC**: Se der erro de RLS, usa função `insert_transactions_bulk`
3. **SECURITY DEFINER**: A função executa com permissões do criador, bypassando RLS
4. **Fallback Lotes**: Se RPC não existir, tenta inserir em lotes menores

## Logs Esperados

Se funcionar:
```
[DB] 🔄 Erro de RLS detectado, tentando usar função RPC...
[DB] ✅ Inserção via RPC funcionou!
```

Se RPC não existir:
```
[DB] ⚠️ RPC function não existe, tentando inserção em lote menor...
```

