# Teste Manual - Validação RLS e Parsing Real de PDF

## URL de Teste
https://zspkxv4kcddg.space.minimax.io

## Credenciais
- **Email**: teste@teste.com
- **Senha**: 123456

## Objetivo do Teste
1. Validar que erro RLS (PGRST200) foi corrigido
2. Confirmar que parseMethod = "real" no upload de PDF
3. Verificar que transações são extraídas e exibidas corretamente

## Passo a Passo

### PASSO 1: Validar Correção RLS
1. Abrir DevTools (F12) → Console
2. Fazer login com as credenciais acima
3. Dashboard deve carregar automaticamente
4. **VERIFICAR NO CONSOLE**:
   - ✅ NÃO deve aparecer erro `PGRST200`
   - ✅ NÃO deve aparecer erro `HTTP 400`
   - ✅ Queries de transactions devem retornar HTTP 200
   - ✅ Dashboard deve mostrar dados (transações, gráficos)

### PASSO 2: Navegar para Transações
1. Clicar em "Transações" no menu lateral
2. Página deve carregar sem erros
3. **VERIFICAR**:
   - Lista de transações deve aparecer (se houver transações existentes)
   - Botão de upload de PDF deve estar visível
   - Sem erros no console

### PASSO 3: Upload de PDF (TESTE CRÍTICO)
1. Clicar no botão de upload de PDF
2. Selecionar qualquer arquivo PDF (pode ser um extrato bancário simulado)
3. **MONITORAR O CONSOLE DURANTE TODO O PROCESSO**
4. Aguardar resposta da edge function

### PASSO 4: Validar parseMethod
**NO CONSOLE, PROCURAR POR**:
```javascript
// Resposta da edge function pdf-parser
{
  "parseMethod": "real",  // ← DEVE SER "real", NÃO "mock"
  "transactions": [...],   // ← Array com transações extraídas
  "message": "...",
  "fileName": "..."
}
```

### PASSO 5: Verificar Transações Inseridas
1. Após upload bem-sucedido, verificar se:
   - Mensagem de sucesso aparece
   - Transações aparecem na lista da página
   - Dados estão corretos (datas, valores, descrições, categorias)

## Critérios de Sucesso

### RLS Corrigido ✅
- [ ] Sem erros PGRST200 no console
- [ ] Dashboard carrega transações existentes
- [ ] Queries retornam HTTP 200

### Parsing Real Funcionando ✅
- [ ] Edge function pdf-parser é chamada
- [ ] Resposta contém `"parseMethod": "real"`
- [ ] Transações são extraídas do PDF
- [ ] Dados aparecem na interface

### Sistema 100% Funcional ✅
- [ ] Upload completo sem erros
- [ ] Categorização automática aplicada
- [ ] Interface atualiza corretamente
- [ ] Sem erros no console

## Problemas Conhecidos Resolvidos

### ✅ Bug de Data Inválida
- **Antes**: `transaction_date=lt.2025-11-32`
- **Depois**: `transaction_date=lt.2025-11-30`
- **Status**: RESOLVIDO

### ✅ Erro RLS (PGRST200)
- **Antes**: Row Level Security bloqueando queries
- **Depois**: Políticas RLS específicas por operação
- **Status**: APLICADO (aguardando validação)

### ⏳ Parsing Real de PDF
- **Objetivo**: Confirmar que sistema usa pdfjs-dist (não mock)
- **Método**: Validar parseMethod = "real" na resposta
- **Status**: PENDENTE DE VALIDAÇÃO

## Logs para Capturar

### Console
```javascript
// Sucesso no SELECT de transactions
Status: 200
Response: [{id: "...", description: "..."}]

// Sucesso no upload de PDF
POST https://...supabase.co/functions/v1/pdf-parser
Status: 200
Response: {"parseMethod": "real", "transactions": [...]}

// Sucesso no INSERT de transactions
POST https://...supabase.co/rest/v1/transactions
Status: 201
Response: [...]
```

### Network Tab
- Filtrar por "transactions"
- Verificar Status Code: 200 ou 201
- Verificar Response contém dados

## Próximos Passos Após Teste

**SE TUDO PASSAR** ✅:
- Documentar sucesso completo
- Marcar sistema como PRODUCTION-READY
- Criar relatório final

**SE ENCONTRAR PROBLEMAS** ❌:
- Documentar erro específico
- Capturar screenshots
- Reportar para correção adicional
