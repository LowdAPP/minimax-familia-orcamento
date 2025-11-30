# 🔍 Debug de Erros RLS

## Problema
Backend está dando erro de política RLS mesmo usando SERVICE_ROLE_KEY.

## Checklist de Verificação

### 1. Verificar Variáveis de Ambiente no Railway
- ✅ `SUPABASE_URL` está configurada?
- ✅ `SUPABASE_SERVICE_ROLE_KEY` está configurada? (NÃO use ANON_KEY)
- ⚠️ A Service Role Key deve ter mais de 100 caracteres
- ⚠️ A Service Role Key geralmente começa com `eyJ`

### 2. Verificar Logs do Backend
Após fazer deploy, verifique os logs do Railway:
```
[INIT] 🔑 Using: SERVICE_ROLE_KEY ✅
```

Se aparecer:
```
[INIT] 🔑 Using: ANON_KEY ⚠️ (fallback - pode não funcionar)
```
Significa que `SUPABASE_SERVICE_ROLE_KEY` não está configurada.

### 3. Verificar Políticas RLS no Supabase
Execute no Supabase SQL Editor:
```sql
SELECT 
    policyname, 
    cmd, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
AND roles = '{service_role}';
```

Deve retornar uma política com:
- `policyname`: "Service role can manage all transactions"
- `cmd`: "ALL"
- `roles`: "{service_role}"
- `qual`: "true"
- `with_check`: "true"

### 4. Aplicar Migration
Se a política não existir, execute a migration:
```sql
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.transactions;

-- Criar política específica para service_role (bypassa RLS)
CREATE POLICY "Service role can manage all transactions" 
ON public.transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Garantir permissões GRANT para service_role
GRANT ALL ON public.transactions TO service_role;
```

### 5. Verificar Permissões GRANT
```sql
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'transactions'
AND grantee = 'service_role';
```

Deve retornar todas as permissões (SELECT, INSERT, UPDATE, DELETE).

## Erros Comuns

### Erro: "new row violates row-level security policy"
**Causa:** Service Role Key não está sendo usada ou política não existe.
**Solução:** 
1. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurada no Railway
2. Aplicar migration de política service_role
3. Verificar logs do backend para confirmar uso da service role key

### Erro: "permission denied for table transactions"
**Causa:** Service role não tem permissões GRANT.
**Solução:** Executar `GRANT ALL ON public.transactions TO service_role;`

## Como Obter Service Role Key

1. Acesse Supabase Dashboard
2. Vá em Settings → API
3. Copie a **service_role** key (não a anon key!)
4. Cole no Railway como `SUPABASE_SERVICE_ROLE_KEY`

## Teste Rápido

Após configurar, faça um teste:
1. Faça upload de PDF
2. Verifique logs do Railway
3. Se aparecer `[DB] ❌ ERRO DE RLS DETECTADO!`, a Service Role Key não está funcionando

