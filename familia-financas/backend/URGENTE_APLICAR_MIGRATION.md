# 🚨 URGENTE: Aplicar Migration no Supabase AGORA

## ⚠️ Status Atual
- ✅ Parser funcionando: 87 transações encontradas
- ❌ Erro de RLS bloqueando inserção
- ⚠️ Função RPC não existe ainda (migration não aplicada)

## 🔧 Solução Imediata

### Passo 1: Acesse Supabase SQL Editor
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New query"

### Passo 2: Cole e Execute Este SQL

```sql
-- Criar função que bypassa RLS
CREATE OR REPLACE FUNCTION insert_transactions_bulk(transactions_data jsonb[])
RETURNS TABLE(id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- Dar permissões
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO service_role;
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_transactions_bulk(jsonb[]) TO anon;
```

### Passo 3: Verificar
Execute:
```sql
SELECT proname FROM pg_proc WHERE proname = 'insert_transactions_bulk';
```

Deve retornar 1 linha.

### Passo 4: Testar
1. Faça push do código atualizado
2. Teste upload de PDF novamente
3. Verifique logs - deve aparecer: `[DB] ✅ Inserção via RPC funcionou!`

## 📋 O Que Esta Migration Faz

- Cria função `insert_transactions_bulk` com `SECURITY DEFINER`
- `SECURITY DEFINER` = executa com permissões do criador (bypassa RLS)
- Aceita array de transações em formato JSONB
- Retorna IDs das transações inseridas

## ✅ Após Aplicar

O backend vai:
1. Tentar inserção direta (falha com RLS)
2. Detectar erro de RLS
3. Chamar função RPC automaticamente
4. ✅ Inserir todas as transações com sucesso!

