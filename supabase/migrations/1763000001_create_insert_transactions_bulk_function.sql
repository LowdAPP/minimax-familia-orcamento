-- Migration: create_insert_transactions_bulk_function
-- Created at: 1763000001
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

