# Correção: Bug de Data Inválida no Dashboard

## Data: 2025-11-07

## Problema Identificado

Durante testes de upload de PDF, foi identificado erro crítico de data inválida:

**Erro Console**:
```
Error 22008 - transaction_date=lt.2025-11-32
```

**Causa Raiz**:
- Arquivo: `DashboardPage.tsx`
- Linhas: 118 e 150
- Código problemático: `.lt('transaction_date', ${currentMonth}-32)`
- Problema: Usa `-32` direto sem calcular último dia do mês
- Resultado: Gera datas inválidas como "2025-11-32" (novembro tem 30 dias)

## Solução Implementada

### Código Corrigido

**Função `loadStats` (linha 98)**:
```typescript
const loadStats = async () => {
  if (!user) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [year, month] = currentMonth.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

  // ... código de queries usando endDate
  .gte('transaction_date', `${currentMonth}-01`)
  .lt('transaction_date', endDate); // Agora usa data válida
};
```

**Função `loadCategoryExpenses` (linha 136)**:
```typescript
const loadCategoryExpenses = async () => {
  if (!user) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [year, month] = currentMonth.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

  // ... código de queries usando endDate
  .gte('transaction_date', `${currentMonth}-01`)
  .lt('transaction_date', endDate); // Agora usa data válida
};
```

### Explicação da Correção

1. **Extração de ano/mês**: `const [year, month] = currentMonth.split('-')`
2. **Cálculo do último dia**: `new Date(parseInt(year), parseInt(month), 0).getDate()`
   - Quando day=0, JavaScript retorna último dia do mês anterior
   - Ex: `new Date(2025, 11, 0)` → 30 (último dia de novembro)
3. **Padding de zero**: `String(lastDay).padStart(2, '0')`
   - Garante formato "DD" (ex: "09" em vez de "9")
4. **Data final válida**: `${currentMonth}-${String(lastDay).padStart(2, '0')}`
   - Ex: "2025-11-30" (válido) em vez de "2025-11-32" (inválido)

## Validação

### Antes da Correção
```
URL: https://wfm1ozoexiai.space.minimax.io
Console Error: transaction_date=lt.2025-11-32
Status: FALHA - Data inválida (erro 22008)
```

### Depois da Correção
```
URL: https://zio7ozmctahi.space.minimax.io
Console Log: transaction_date=lt.2025-11-30
Status: SUCESSO - Data válida (sem erro 22008)
```

## Arquivos Modificados

1. **`/workspace/familia-financas/src/pages/DashboardPage.tsx`**
   - Linha 98-118: Função `loadStats`
   - Linha 136-150: Função `loadCategoryExpenses`

## Deploy

- **Build**: Bem-sucedido
- **Deploy**: https://zio7ozmctahi.space.minimax.io
- **Status**: Em produção com correção aplicada

## Observação

Esta correção segue o mesmo padrão já aplicado em `TransactionsPage.tsx` (linha 91), garantindo consistência no cálculo de datas em todo o sistema.

## Próximos Passos

1. ✅ Bug de data: RESOLVIDO
2. ⏳ Erro RLS (PGRST200): Ainda presente, necessita correção separada
3. ⏳ Teste de parsing real de PDF: Pendente (aguardando continuação do teste)
