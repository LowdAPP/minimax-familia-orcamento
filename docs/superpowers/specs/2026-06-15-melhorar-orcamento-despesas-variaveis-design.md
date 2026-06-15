# Design — Melhorar a página Orçamento (despesas variáveis mês a mês)

**Data:** 2026-06-15
**App:** familia-financas (React + Vite + TS, Supabase)
**Autor:** Lucas + Claude

## 1. Problema

A página **Orçamento** já tem orçamento por categoria e por mês (tabelas `budgets` +
`budget_items`, metodologias Envelope / 50_30_20 / Zero-Based), mas com três limitações:

1. **Travada no mês atual** — usa `new Date().toISOString().slice(0,7)` em todo lado; não
   dá para ver/editar o planeado de outro mês.
2. **Gasto não é real** — mostra o campo parado `budget_items.spent_amount`, que não é
   atualizado a partir das transações. Não reflete o gasto verdadeiro.
3. **Planeado por categoria não é persistido** — `saveBudget` grava só a linha `budgets`;
   **não grava `budget_items`**. Editar o planeado por categoria hoje praticamente não salva.

Bug correlato descoberto: despesas são gravadas com **valor negativo**
(`amount = -Math.abs(valor)` em `TransactionsPage`), receitas positivas. Logo, somar
`amount` de despesas dá negativo — o que quebra a **Reunião Semanal** já entregue
(gasto/limites zerados ou negativos).

## 2. Escopo

**Dentro:**
- Navegação de mês na página Orçamento (editar/ver qualquer mês).
- Gasto real ao vivo, calculado das transações, nas 3 abas.
- Edição rápida do planeado por categoria + **persistência de `budget_items`** (hoje ausente).
- Correção do sinal na Reunião Semanal (usar valor absoluto).

**Fora:**
- Mudança de schema (reusa `budgets`/`budget_items`/`transactions`).
- Tela nova dedicada (decisão do usuário: melhorar a página existente).
- Onde lançar receita (resposta dada: via Transações → Nova Transação, tipo "receita").
- Atualizar o campo `spent_amount` (passa a ser ignorado; gasto vem das transações).

## 3. Convenção de sinal (importante)

`transactions.amount`: **despesa = negativo**, **receita = positivo** (ver
`TransactionsPage.tsx` ~linha 706). Toda soma de gasto deve usar **`Math.abs(amount)`**
para ser robusta ao sinal e a imports (pdf/csv) que possam divergir.

## 4. Helpers puros novos em `src/lib/finance/cashflow.ts` (com testes)

```ts
/** Intervalo ISO do mês inteiro [1º dia, último dia]. */
export function monthRange(year: number, month: number): { startISO: string; endISO: string };

/** Soma Math.abs(amount) agrupada por category_id. category_id null/undefined é ignorado. */
export function sumAbsByCategory(
  items: { category_id?: string | null; amount: number }[]
): Record<string, number>;
```

`monthRange` reusa `daysInMonth`. Ambas puras, testadas via Vitest.

## 5. `BudgetPage.tsx`

### 5.1 Navegação de mês
- Estado `selectedMonth: string` (YYYY-MM), inicial = mês atual.
- Header ganha controles `‹  <Mês Ano>  ›` (prev/next). Próximo/anterior ajustam ano na virada.
- Substituir TODOS os usos de `currentMonth = new Date()...` por `selectedMonth` em
  `loadBudget`, `loadCategoryBudgets`, `saveBudget`.
- `useEffect` passa a depender de `[user, activeTab, selectedMonth]`.

### 5.2 Gasto real ao vivo
- Novo `loadSpent()` (incluído no `Promise.all` de `loadData`):
  - `const { startISO, endISO } = monthRange(year, month)` do `selectedMonth`.
  - Busca `transactions` do usuário com `transaction_type = 'despesa'` e
    `transaction_date` em `[startISO, endISO]`, selecionando `amount, category_id`.
  - `spentByCategory = sumAbsByCategory(rows)` → guardar em estado.
- **Envelope / Zero-Based:** para cada categoria, `gasto = spentByCategory[cat] ?? 0`;
  exibir **Planeado | Gasto | Resta** (Resta = planeado − gasto) e barra de progresso
  (reusar `getProgressPercentage`/`getProgressColor`).
- **50/30/20:** calcular gasto por tipo a partir das categorias carregadas:
  - needs = soma de gasto das categorias `essencial` + `divida`
  - wants = soma das `superfluo`
  - savings = soma das `poupanca`
  - Exibir alocado (needs/wants/savings do budget) vs gasto real por tipo.
- Não usar mais `spent_amount`.

### 5.3 Edição rápida do planeado + persistência de `budget_items`
- No modo edição (Envelope/Zero-Based), o input de `allocated_amount` por categoria é
  editável inline e atualiza `categoryBudgets` no estado.
- Ao **Salvar** (`saveBudget`), após garantir a linha `budgets` do `selectedMonth`:
  - Para cada categoria com `allocated_amount` definido, fazer **upsert manual** em
    `budget_items` (sem depender de constraint nova):
    1. `select id from budget_items where budget_id = <id> and category_id = <cat>`
    2. se existe → `update { allocated_amount }`; senão → `insert { budget_id, category_id, allocated_amount, spent_amount: 0 }`.
  - Recarregar via `loadData()` ao final.
- Mensagens de sucesso/erro via `showAlert` (padrão já usado na página).

### 5.4 Tratamento de erro
- Cada chamada Supabase de escrita verifica `{ error }` e exibe `showAlert` de erro
  (consistente com o restante da página).

## 6. Correção da Reunião Semanal (`WeeklyReviewPage.tsx`)

- `weekSpent` e o `catSpent` por categoria passam a somar **`Math.abs(amount)`** das
  despesas (hoje somam `Number(amount)`, que é negativo). Income continua positivo.
- Resultado: "Quanto gastámos", "Quanto sobrou" e as barras de limite passam a refletir
  o gasto real e o estado "acima do limite" volta a funcionar.

## 7. Testes

- Unit (Vitest, puro): `monthRange` (junho→01..30, fevereiro→01..28/29), `sumAbsByCategory`
  (sinais mistos, category_id nulo ignorado, múltiplas categorias).
- Verificação manual: navegar entre meses mostra planeado/gasto corretos; editar planeado
  por categoria e salvar persiste em `budget_items` (recarrega e mantém o valor);
  uma despesa lançada aparece no "Gasto" do mês certo; Reunião Semanal mostra gasto positivo.

## 8. Decisões confirmadas
- Melhorar a página Orçamento existente (sem tela nova, sem arquivar a antiga).
- 4 melhorias: navegação de mês, gasto real ao vivo, edição rápida do planeado, gasto real nas 3 abas.
- Sem mudança de schema; `spent_amount` deixa de ser usado.
- Corrigir o sinal na Reunião Semanal junto.
