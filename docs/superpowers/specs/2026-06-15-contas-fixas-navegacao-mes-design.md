# Design — Navegação de mês na página Contas Fixas

**Data:** 2026-06-15
**App:** familia-financas (React + Vite + TS, Supabase)

## 1. Problema

A página **Contas Fixas** (`/fixed-bills`) está travada no mês atual
(`currentMonthYear()` = `new Date()`). Não dá para ver nem marcar como pagas as contas
de outros meses. Queremos a mesma navegação de mês já adicionada à página Orçamento.

## 2. Escopo

**Dentro:** navegação de mês (setas `‹ Mês Ano ›`) na página Contas Fixas, espelhando o
padrão do `BudgetPage`.

**Fora:** mudança de schema, nova rota, alteração na lista de contas fixas em si.

## 3. Modelo mental

- `fixed_bills` são **recorrentes** (independentes de mês) → a lista exibida é a mesma em
  qualquer mês.
- `fixed_bill_payments` têm `month_year` → o estado **pago/por pagar** é por mês.
- Logo, navegar de mês só troca quais pagamentos são carregados; a lista de contas não muda.

## 4. Mudanças (apenas `src/pages/FixedBillsPage.tsx`)

- Importar `ChevronLeft`, `ChevronRight` de `lucide-react` e `useI18n` (já usado) para `language`.
- Novo estado `selectedMonth: string` (YYYY-MM), inicial = mês atual.
- Helpers `shiftMonth(delta)` e `monthLabel` (localizado via `toLocaleDateString`),
  idênticos ao padrão do `BudgetPage`.
- Substituir todos os usos de `monthYear` (hoje vindo de `currentMonthYear()`) por
  `selectedMonth`: na query de `fixed_bill_payments` e no `togglePaid` (`month_year`).
- `useEffect` passa a depender de `[user, selectedMonth]` (recarrega ao trocar mês).
- Controles de mês (setas + label) no header, abaixo do subtítulo, mesmo estilo do `BudgetPage`.
- `paid_date` ao marcar pago continua `new Date().toISOString().slice(0,10)` (data em que se marcou).

## 5. Decisões confirmadas

- Mesmo padrão visual/comportamental do `BudgetPage` (setas + label de mês localizado).
- Sem schema novo; lista de contas inalterada; só o estado de pagamento é por mês.

## 6. Teste

- Verificação manual: navegar entre meses muda os checkboxes de pago; marcar uma conta
  como paga num mês não afeta outro mês; a lista de contas permanece a mesma.
