# Análise do Erro HTTP 400 no PDF Parser

## 🔍 **PROBLEMA IDENTIFICADO**

O erro HTTP 400 na edge function `pdf-parser` é causado por uma **violação de constraint NOT NULL** na tabela `transactions`.

## 📋 **Detalhes Técnicos**

### 1. **Constraint Violada - Account ID**
- **Campo**: `account_id` na tabela `transactions`
- **Constraint**: `NOT NULL` 
- **Status**: A edge function não está enviando este campo obrigatório

### 2. **Evidências do Código**

#### Edge Function (`/supabase/functions/pdf-parser/index.ts` - Linhas 369-379):
```typescript
const transactionData = {
    user_id: userId,
    description: transaction.description,
    amount: transaction.amount,
    transaction_type: transaction.amount < 0 ? 'despesa' : 'receita',
    transaction_date: transaction.date,
    category_id: category.id,
    merchant: transaction.merchant,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
    // ❌ FALTA: account_id é obrigatório!
};
```

#### Schema da Tabela (`/supabase/migrations/1762439153_create_complete_schema.sql` - Linha 108):
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,  -- ← OBRIGATÓRIO mas não enviado
  category_id UUID,
  -- ... outros campos
);
```

### 3. **Análise das Políticas RLS**

#### Migration `1762521968_fix_rls_policies_comprehensive.sql`:
```sql
-- Desabilitar temporariamente RLS na tabela transactions para debugging
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
```

**Status atual**: RLS está desabilitado, então não é problema de permissão.

#### Migration `1762521491_fix_pdf_parser_rls_policy.sql`:
```sql
-- Política para permitir inserção via service role
CREATE POLICY "Service role can insert transactions" ON public.transactions
FOR INSERT TO service_role WITH CHECK (true);
```

**Status**: Política existe e permite inserção via service role.

## 🛠️ **SOLUÇÃO**

### Opção 1: Corrigir a Edge Function (RECOMENDADA)
Adicionar `account_id` na inserção da transação:

```typescript
// 1. Buscar ou criar conta padrão para o usuário
const account = await getOrCreateUserAccount(userId, supabaseUrl, serviceRoleKey);

// 2. Adicionar account_id nos dados da transação
const transactionData = {
    user_id: userId,
    account_id: account.id,  // ← ADICIONAR ESTA LINHA
    description: transaction.description,
    // ... resto dos campos
};
```

### Opção 2: Modificar Schema (ALTERNATIVA)
Tornar `account_id` opcional na tabela:
```sql
ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;
```

## 📊 **Logs de Erro Esperados**

Quando ocorre o erro HTTP 400, o Supabase deve retornar:
```json
{
  "code": "42501",
  "message": "new row for relation \"transactions\" violates check constraint \"transactions_account_id_notnull\""
}
```

## ✅ **Status das Verificações**

| Componente | Status | Detalhes |
|------------|--------|----------|
| ✅ RLS Policies | OK | Desabilitado, service_role tem permissões |
| ✅ Service Role Key | OK | Presente na edge function |
| ✅ PDF Parsing | OK | Texto extraído corretamente |
| ❌ Account ID | ERRO | Campo obrigatório não fornecido |
| ✅ Categoria Handling | OK | Busca/cria categorias corretamente |

## 🔧 **Próximos Passos para Correção**

1. **Implementar função de busca/criação de conta padrão**
2. **Modificar edge function para incluir account_id**
3. **Testar com PDF real do Santander**
4. **Reabilitar RLS após validação** (migration `1762521968`)

## 📝 **Resumo Executivo**

O erro HTTP 400 é causado pela ausência do campo `account_id` obrigatório na inserção de transações. A edge function está processando corretamente o PDF e criando os dados das transações, mas falha ao inserir no banco devido à violação da constraint NOT NULL.

**Prioridade**: Alta - Impede completamente a funcionalidade de importação de PDF.
**Impacto**: 100% das importações falham
**Solução**: Adicionar lógica de account_id na edge function