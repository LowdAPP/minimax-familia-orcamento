# Correção de Erro RLS - Upload de PDF

## Problema Identificado

**Erro**: "new row violates row-level security policy"
**Causa**: Políticas RLS nas tabelas `transactions` e `accounts` não tinham a cláusula `WITH CHECK` necessária para operações de INSERT.

## Análise Técnica

### Políticas RLS Originais (Incorretas)

```sql
-- PROBLEMA: Apenas USING, sem WITH CHECK
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO public
  USING (auth.uid() = user_id);
  -- Faltava: WITH CHECK (auth.uid() = user_id)
```

**Por que isso causa erro?**
- `USING`: Verifica permissões para SELECT/UPDATE/DELETE (linhas existentes)
- `WITH CHECK`: Verifica permissões para INSERT/UPDATE (linhas novas)
- Sem `WITH CHECK`, o INSERT falha porque não há verificação de segurança para novas linhas

### Correções Aplicadas

Migration aplicada: `fix_rls_policies_for_insert`

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;

-- Recriar políticas COMPLETAS com USING e WITH CHECK
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own accounts"
  ON accounts
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar política de leitura para categories (necessário para FK)
CREATE POLICY "Users can read all categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Corrigir política de budgets
CREATE POLICY "Users can manage own budgets"
  ON budgets
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Tabelas Afetadas e Políticas Corrigidas

| Tabela | Política | Status |
|--------|----------|--------|
| transactions | Users can manage own transactions | CORRIGIDA |
| accounts | Users can manage own accounts | CORRIGIDA |
| budgets | Users can manage own budgets | CORRIGIDA |
| categories | Users can read all categories | ADICIONADA |
| user_profiles | Políticas existentes | OK |

## Verificação de Políticas Atualizadas

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('transactions', 'accounts', 'categories', 'budgets')
ORDER BY tablename, policyname;
```

**Resultado**: Todas as políticas agora têm `with_check` definido corretamente.

## Storage Bucket

**Status**: Bucket "agent-uploads" está configurado como público
```sql
SELECT id, name, public FROM storage.buckets WHERE name = 'agent-uploads';
-- Resultado: public = true
```

## Problema Adicional Identificado (TransactionsPage.tsx)

### Linha 195 e 237: account_id pode ser null

```typescript
// PROBLEMA
const transactionsToInsert = extractedTransactions.map((t: any) => ({
  user_id: user.id,
  account_id: accounts[0]?.id || null, // ← NULL não permitido!
  // ...
}));
```

**Causa**: Campo `account_id` na tabela transactions é NOT NULL, mas o código pode enviar null se não houver contas.

**Solução Recomendada**: 
1. Garantir que usuário sempre tenha pelo menos uma conta antes de permitir upload
2. Ou modificar schema para permitir NULL em account_id (menos recomendado)
3. Adicionar validação no frontend

## Impacto da Correção

### Antes
- INSERT de transações: BLOQUEADO (erro RLS)
- INSERT de accounts: BLOQUEADO (erro RLS)
- SELECT/UPDATE/DELETE: Funcionando

### Depois
- INSERT de transações: PERMITIDO (com user_id = auth.uid())
- INSERT de accounts: PERMITIDO (com user_id = auth.uid())
- SELECT/UPDATE/DELETE: Funcionando
- Segurança mantida: usuários só veem/modificam seus próprios dados

## Fluxo de Upload de PDF (Após Correção)

1. Usuário seleciona PDF
2. Frontend faz upload para storage bucket "agent-uploads"
3. Edge function "pdf-parser" processa o PDF
4. Transações extraídas são inseridas no banco
5. **RLS agora permite**: INSERT porque `with_check (auth.uid() = user_id)` está definido

## Status Final

- RLS Policies: CORRIGIDAS
- Storage Bucket: CONFIGURADO
- Banco de Dados: PRONTO
- Frontend: NECESSITA validação de account_id

## Próximos Passos

1. Verificar se edge function "pdf-parser" está deployada
2. Garantir que usuários tenham pelo menos uma conta antes de upload
3. Testar upload completo de PDF
4. Deploy da aplicação atualizada

## Data da Correção

2025-11-06 23:24:12
