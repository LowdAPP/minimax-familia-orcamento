# Comandos para Implementar a Correção HTTP 400

## 🚀 **Implementação da Correção**

### 1. **Backup do Estado Atual** (Opcional mas recomendado)
```bash
# Fazer backup da edge function atual
cp /workspace/supabase/functions/pdf-parser/index.ts /workspace/supabase/functions/pdf-parser/index.ts.backup

# Ver status atual
supabase status
```

### 2. **Aplicar Migration para RLS**
```bash
# Executar migration para reabilitar RLS com políticas corretas
supabase db push --include-all

# Verificar se migration foi aplicada
supabase db status
```

### 3. **Deploy da Edge Function Corrigida**
```bash
# Deploy da edge function com correção do account_id
supabase functions deploy pdf-parser

# Verificar se deploy foi bem-sucedido
supabase functions list
```

### 4. **Verificar se as Correções foram Aplicadas**

#### Verificar RLS Policies:
```sql
-- Conectar ao Supabase e executar:
SELECT 
    schemaname,
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;
```

#### Verificar Edge Function:
```bash
# Ver logs da edge function
supabase functions logs pdf-parser
```

### 5. **Teste da Correção**

#### Teste Manual via Interface:
1. **Acessar**: https://j1mfff04t42c.space.minimax.io
2. **Login**: teste@teste.com / 123456
3. **Navegar**: Transações
4. **Upload**: Movimentos.pdf
5. **Verificar**: "Processando..." deve completar
6. **Confirmar**: Transações reais visíveis

#### Teste via Logs:
```bash
# Monitorar logs em tempo real
supabase functions logs pdf-parser --follow
```

## 🔧 **Comandos de Debug**

### Verificar Status do Supabase:
```bash
supabase status
```

### Verificar Policies do Banco:
```sql
-- Conectar via Dashboard ou CLI:
SELECT * FROM pg_policies WHERE tablename = 'transactions';
```

### Verificar Categorias:
```sql
SELECT name, is_system_category FROM categories WHERE is_system_category = true;
```

### Testar Edge Function Manualmente:
```bash
# Testar com curl (após fazer login e obter token)
curl -X POST 'https://qkmuypctpuyoouqfatjf.supabase.co/functions/v1/pdf-parser' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@/path/to/Movimentos.pdf' \
  -F 'user_id=USER_UUID'
```

## ⚠️ **Se Algo Der Errado**

### Rollback da Edge Function:
```bash
# Restaurar backup se necessário
cp /workspace/supabase/functions/pdf-parser/index.ts.backup /workspace/supabase/functions/pdf-parser/index.ts
supabase functions deploy pdf-parser
```

### Desabilitar RLS Temporariamente:
```sql
-- Se for necessário para debug
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
```

### Verificar Service Role Key:
```bash
# Verificar se as variáveis de ambiente estão corretas
supabase secrets list
```

## 📋 **Checklist de Implementação**

- [ ] **Backup realizado** (opcional)
- [ ] **Migration aplicada** (`supabase db push`)
- [ ] **Edge function deployada** (`supabase functions deploy pdf-parser`)
- [ ] **RLS verificado** (policies corretas)
- [ ] **Categorias verificadas** (sistema presente)
- [ ] **Teste manual realizado** (upload PDF)
- [ ] **Logs verificados** (sem erros)
- [ ] **Transações visíveis** (dados Santander)

## 🎯 **Resultado Esperado**

Após executar todos os comandos:

```
✅ Migration aplicada com sucesso
✅ Edge function deployada
✅ RLS habilitado com políticas corretas
✅ 15+ transações do Santander importadas
✅ Interface mostra: "15 transações encontradas"
✅ Total de receitas/despesas correto
```

**A correção estará 100% implementada e funcional!**
