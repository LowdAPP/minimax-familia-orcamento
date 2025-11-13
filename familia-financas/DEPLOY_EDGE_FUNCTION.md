# Deploy da Edge Function pdf-parser Corrigida

## Problema Identificado

A edge function estava tentando inserir transações com UUID inválido ("1" em vez de UUID válido), causando o erro:
```
invalid input syntax for type uuid: "1"
```

## Correções Implementadas

1. **Validação de UUIDs**: Validação de `user_id` e `account_id` antes de inserir
2. **Validação de dados**: Validação de datas e valores antes de inserir
3. **Melhor tratamento de erros**: Logs detalhados e mensagens de erro mais informativas
4. **Validação de formato de data**: Garantia de que datas estão no formato YYYY-MM-DD

## Como Fazer o Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
cd familia-financas

# Verificar se está logado
supabase login

# Fazer deploy da edge function
supabase functions deploy pdf-parser --project-ref qkmuypctpuyoouqfatjf
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/qkmuypctpuyoouqfatjf
2. Vá em **Edge Functions** no menu lateral
3. Clique em **pdf-parser**
4. Vá na aba **Code**
5. Cole o conteúdo do arquivo `familia-financas/supabase/functions/pdf-parser/index.ts`
6. Clique em **Deploy**

### Opção 3: Via API do Supabase

```bash
# Obter o conteúdo do arquivo
cat familia-financas/supabase/functions/pdf-parser/index.ts

# Fazer deploy via API (requer autenticação)
# Use o Supabase CLI ou Dashboard para isso
```

## Verificação do Deploy

Após o deploy, verifique:

1. **Status da função**: Deve estar como **ACTIVE**
2. **Versão**: Deve mostrar a versão mais recente
3. **Logs**: Verifique os logs para confirmar que não há erros

## Teste Após Deploy

1. Faça upload de um PDF de teste
2. Verifique o console do navegador para logs detalhados
3. Verifique os logs da edge function no Dashboard do Supabase
4. Confirme que as transações são inseridas corretamente

## Estrutura da Resposta Esperada

Após o deploy, a resposta deve ter este formato:

```json
{
  "success": true,
  "transactionsInserted": 5,
  "message": "PDF processado com sucesso! 5 transações importadas.",
  "bankFormat": "Santander Portugal",
  "parseMethod": "multi_bank_v9",
  "preview": [...]
}
```

## Troubleshooting

Se ainda houver erros após o deploy:

1. **Verificar logs da edge function** no Dashboard
2. **Verificar se os UUIDs estão corretos** nos logs
3. **Verificar se o formato do PDF é suportado**
4. **Verificar se há políticas RLS corretas** na tabela transactions

