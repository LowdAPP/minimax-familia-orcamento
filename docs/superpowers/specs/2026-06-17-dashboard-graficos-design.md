# Design: Gráficos no Dashboard

**Data:** 2026-06-17
**Página:** `familia-financas/src/pages/DashboardPage.tsx`
**Estética:** Minimal (alinhada ao design system atual — `neutral`/`primary`, `Card`, tokens de espaçamento)

## Objetivo

Adicionar 4 visualizações de dados ao dashboard, transformando a lista de cards numéricos
numa visão que conta a história "quanto está livre, onde gasto, estou na meta, e minhas metas".

## Escopo (4 gráficos)

Grid 2×2 (`grid-cols-1 lg:grid-cols-2`), inserido após os StatCards de fluxo de caixa e antes
do bloco atual "Despesas por Categoria / Transações Recentes" — que é parcialmente substituído.

### 1. Gauge: Disponível vs Comprometido
- **Dados:** já carregados em `cashflow` state (`available`, `committed`) via `loadCashflow()`.
- **Visual:** semicírculo (gauge) recharts ou SVG. Percentual = `available / (available + committed)`.
- **Centro:** `59%` + legenda "€X livres de €Y".
- Sem novas queries.

### 2. Orçamento 50/30/20 (real vs meta)
- **Dados novos:** mirror da lógica do `BudgetPage`:
  - `budgets` (mês atual) → `total_income`, `needs_amount`, `wants_amount`, `savings_amount`.
  - `transactions` do mês agrupadas por `categories.category_type`:
    - Necessidades = `essencial` + `divida`
    - Desejos = `superfluo`
    - Poupança = `poupanca`
  - Helpers existentes: `monthRange(year, month)`, `sumAbsByCategory()` em `lib/finance/cashflow.ts`.
- **Visual:** 3 barras de progresso (real % da renda) com cor de status:
  - dentro da meta = neutro/verde; estourou a meta (real% > alvo%) = vermelho (`error`).
- **Vazio:** se não houver `budgets` do mês, mostra CTA "Configurar orçamento" → `/budget`.

### 3. Donut de categorias (refactor do gráfico atual)
- **Dados:** reusa `categoryExpenses` (já existe `loadCategoryExpenses()`).
- **Mudança:** Pizza → Donut (`innerRadius`), total no centro, legenda lateral com top categorias.
- Remove o `label` percentual sobreposto (poluído); mantém `Tooltip` com `formatCurrency`.

### 4. Progresso das metas
- **Dados novos:** novo `loadGoals()` — tabela `goals`: `goal_name`, `current_amount`,
  `target_amount`, `status`, `deadline`. Filtra `status` ativo, ordena por % desc, limita a ~4.
- **Visual:** barras de progresso por meta (`current/target`), label com nome + %.
- **Vazio:** CTA "Criar meta" → `/goals`.

## Layout final do dashboard

1. Header (saudação + ações) — mantido.
2. StatCards de fluxo de caixa — mantidos (Disponível/Comprometido/Dias restantes/Já poupado).
3. **(remover)** a segunda fileira de StatCards (Saldo/Receitas/Despesas/Economia) é redundante
   com os gráficos novos — consolidar: manter só "Saldo total" e "Economia do mês" se necessário,
   ou remover a fileira inteira. **Decisão:** remover a fileira duplicada para reduzir ruído.
4. Alertas — mantidos.
5. **(novo)** Grid 2×2 dos 4 gráficos.
6. Transações Recentes — mantido (movido para largura total ou abaixo do grid).
7. Ações Rápidas — mantido.

## Componentes / unidades

Para manter `DashboardPage` legível, extrair cada gráfico como componente em
`familia-financas/src/components/dashboard/`:
- `AvailableGauge.tsx` (props: `available`, `committed`)
- `BudgetBuckets.tsx` (props: dados dos 3 buckets {real, alvo})
- `CategoryDonut.tsx` (props: `categoryExpenses`)
- `GoalsProgress.tsx` (props: `goals[]`)

Cada um: entrada via props (sem fetch interno), testável isoladamente, usa `Card` + tokens existentes.
O fetch fica no `DashboardPage` (`loadBudgetBuckets()`, `loadGoals()` novos).

## Biblioteca

`recharts ^2.12.4` (já instalado). Gauge e donut via recharts; barras de progresso via divs/CSS
(como já é feito em `BudgetPage`/`FixedBillsPage`).

## Fora de escopo (YAGNI)

- Navegação de mês no dashboard (dashboard é sempre "mês atual"). Pode vir depois.
- Gráficos 1 e 2 do cardápio (Receitas vs Despesas mensal, Evolução do saldo) — não escolhidos.
- Troca de tema em runtime — Minimal é fixo.

## Testes

- Helpers de cálculo de bucket (real% por `category_type`) com teste unitário se extraídos para `lib/finance`.
- Estados vazios (sem orçamento, sem metas, sem despesas) renderizam CTA, não quebram.
