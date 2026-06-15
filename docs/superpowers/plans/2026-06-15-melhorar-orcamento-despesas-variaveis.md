# Melhorar a página Orçamento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a página Orçamento navegável por mês, com gasto real ao vivo (das transações) nas 3 abas, edição/persistência do planeado por categoria, e corrigir o bug de sinal na Reunião Semanal.

**Architecture:** Adicionar 2 helpers puros e testados em `cashflow.ts` (`monthRange`, `sumAbsByCategory`). Modificar `BudgetPage.tsx` para usar um `selectedMonth` em vez do mês fixo, calcular gasto a partir de `transactions` (valor absoluto), exibir Planeado/Gasto/Resta, e persistir `budget_items` por categoria (upsert manual, sem schema novo). Corrigir o sinal em `WeeklyReviewPage.tsx`.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (client direto + RLS), TailwindCSS, lucide-react, Vitest.

**Convenção de sinal:** `transactions.amount` é **negativo para despesa**, positivo para receita (`TransactionsPage.tsx` ~706). Todo gasto soma `Math.abs(amount)`.

---

## File Structure

- **Modify** `familia-financas/src/lib/finance/cashflow.ts` — adicionar `monthRange`, `sumAbsByCategory`.
- **Modify** `familia-financas/src/lib/finance/cashflow.test.ts` — testes dos 2 helpers.
- **Modify** `familia-financas/src/pages/WeeklyReviewPage.tsx` — corrigir sinal (abs) do gasto.
- **Modify** `familia-financas/src/pages/BudgetPage.tsx` — navegação de mês, gasto ao vivo, edição+persistência.

---

## Task 1: Helpers puros `monthRange` e `sumAbsByCategory` (TDD)

**Files:**
- Modify: `familia-financas/src/lib/finance/cashflow.ts`
- Test: `familia-financas/src/lib/finance/cashflow.test.ts`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

No fim de `familia-financas/src/lib/finance/cashflow.test.ts`, adicione ao import existente os nomes `monthRange, sumAbsByCategory` e acrescente estes blocos ao final do arquivo:
```ts
describe('monthRange', () => {
  it('junho/2026 vai de 01 a 30', () => {
    expect(monthRange(2026, 6)).toEqual({ startISO: '2026-06-01', endISO: '2026-06-30' });
  });
  it('fevereiro/2026 vai de 01 a 28', () => {
    expect(monthRange(2026, 2)).toEqual({ startISO: '2026-02-01', endISO: '2026-02-28' });
  });
  it('fevereiro/2024 (bissexto) vai até 29', () => {
    expect(monthRange(2024, 2)).toEqual({ startISO: '2024-02-01', endISO: '2024-02-29' });
  });
});

describe('sumAbsByCategory', () => {
  it('soma valor absoluto agrupado por category_id', () => {
    const items = [
      { category_id: 'a', amount: -87 },
      { category_id: 'a', amount: -13 },
      { category_id: 'b', amount: -40 },
    ];
    expect(sumAbsByCategory(items)).toEqual({ a: 100, b: 40 });
  });
  it('trata valores positivos e negativos pelo módulo', () => {
    const items = [
      { category_id: 'a', amount: -50 },
      { category_id: 'a', amount: 50 },
    ];
    expect(sumAbsByCategory(items)).toEqual({ a: 100 });
  });
  it('ignora itens sem category_id', () => {
    const items = [
      { category_id: null, amount: -99 },
      { category_id: undefined, amount: -1 },
      { category_id: 'a', amount: -10 },
    ];
    expect(sumAbsByCategory(items)).toEqual({ a: 10 });
  });
});
```
The existing import line near the top of the test file is:
```ts
import {
  committedAmount,
  availableAmount,
  paidThisMonth,
  daysInMonth,
  weeksInMonth,
  weeklyLimit,
  currentWeekOfMonth,
  weekRange,
  daysRemaining,
  sumInRange,
} from './cashflow';
```
Change it to also import the two new functions:
```ts
import {
  committedAmount,
  availableAmount,
  paidThisMonth,
  daysInMonth,
  weeksInMonth,
  weeklyLimit,
  currentWeekOfMonth,
  weekRange,
  daysRemaining,
  sumInRange,
  monthRange,
  sumAbsByCategory,
} from './cashflow';
```

- [ ] **Step 2: Rodar os testes para ver falhar**

Run: `cd familia-financas && pnpm test`
Expected: FAIL — `monthRange`/`sumAbsByCategory` não existem.

- [ ] **Step 3: Implementar os helpers**

No fim de `familia-financas/src/lib/finance/cashflow.ts`, adicione:
```ts
/** Intervalo ISO do mês inteiro [1º dia, último dia]. month = 1-12. */
export function monthRange(year: number, month: number): { startISO: string; endISO: string } {
  const last = daysInMonth(year, month);
  const mm = String(month).padStart(2, '0');
  return {
    startISO: `${year}-${mm}-01`,
    endISO: `${year}-${mm}-${String(last).padStart(2, '0')}`,
  };
}

/** Soma Math.abs(amount) agrupada por category_id. Itens sem category_id são ignorados. */
export function sumAbsByCategory(
  items: { category_id?: string | null; amount: number }[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    if (!it.category_id) continue;
    out[it.category_id] = (out[it.category_id] ?? 0) + Math.abs(it.amount);
  }
  return out;
}
```

- [ ] **Step 4: Rodar os testes para ver passar**

Run: `cd familia-financas && pnpm test`
Expected: PASS (todos os testes verdes, incluindo os 14 anteriores).

- [ ] **Step 5: Commit**

```bash
git add familia-financas/src/lib/finance/cashflow.ts familia-financas/src/lib/finance/cashflow.test.ts
git commit -m "feat(finance): monthRange e sumAbsByCategory (gasto por categoria, abs)"
```

---

## Task 2: Corrigir sinal do gasto na Reunião Semanal

**Files:**
- Modify: `familia-financas/src/pages/WeeklyReviewPage.tsx`

- [ ] **Step 1: Corrigir o cálculo de `weekSpent`**

Em `familia-financas/src/pages/WeeklyReviewPage.tsx`, localize:
```ts
      const weekSpent = txs
        .filter((t: any) => t.transaction_type === 'despesa')
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
```
Substitua por (usar valor absoluto, pois despesas são negativas):
```ts
      const weekSpent = txs
        .filter((t: any) => t.transaction_type === 'despesa')
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);
```

- [ ] **Step 2: Corrigir o `catSpent` por categoria**

Localize:
```ts
          const catSpent = sumInRange(
            txs
              .filter((t: any) => t.category_id === (it as any).category_id && t.transaction_type === 'despesa')
              .map((t: any) => ({ transaction_date: t.transaction_date, amount: Number(t.amount || 0) })),
            startISO,
            endISO
          );
```
Substitua o `.map` para usar valor absoluto:
```ts
          const catSpent = sumInRange(
            txs
              .filter((t: any) => t.category_id === (it as any).category_id && t.transaction_type === 'despesa')
              .map((t: any) => ({ transaction_date: t.transaction_date, amount: Math.abs(Number(t.amount || 0)) })),
            startISO,
            endISO
          );
```
(O cálculo de `weekIncome` fica como está — receita é positiva.)

- [ ] **Step 3: Verificar build**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: exit 0, sem erros.

- [ ] **Step 4: Commit**

```bash
git add familia-financas/src/pages/WeeklyReviewPage.tsx
git commit -m "fix(weekly): usar valor absoluto no gasto (despesas são negativas)"
```

---

## Task 3: BudgetPage — navegação de mês

**Files:**
- Modify: `familia-financas/src/pages/BudgetPage.tsx`

- [ ] **Step 1: Importar helpers e ícones de navegação**

No topo de `familia-financas/src/pages/BudgetPage.tsx`, no import de `lucide-react` existente (que contém `PieChart, TrendingUp, DollarSign, AlertCircle, Check, Edit, Save`), adicione `ChevronLeft` e `ChevronRight`. Resultado:
```ts
import {
  PieChart,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Check,
  Edit,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
```
E adicione um import do helper de mês logo abaixo do import do supabase:
```ts
import { monthRange, sumAbsByCategory } from '../lib/finance/cashflow';
```

- [ ] **Step 2: Adicionar estado `selectedMonth` e helper de navegação**

Logo após `const [saving, setSaving] = useState(false);` adicione:
```ts
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(
      language === 'pt-PT' ? 'pt-PT' : 'pt-BR',
      { month: 'long', year: 'numeric' }
    );
  })();
```

- [ ] **Step 3: Usar `selectedMonth` nas cargas e no save; reagir a mudança de mês**

Em `loadBudget`, substitua:
```ts
    const currentMonth = new Date().toISOString().slice(0, 7);
```
por:
```ts
    const currentMonth = selectedMonth;
```
Em `saveBudget`, substitua a mesma linha:
```ts
      const currentMonth = new Date().toISOString().slice(0, 7);
```
por:
```ts
      const currentMonth = selectedMonth;
```
E altere o `useEffect` de carga para reagir ao mês:
```ts
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);
```
para:
```ts
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab, selectedMonth]);
```

- [ ] **Step 4: Adicionar os controles de mês no header**

No JSX do header, localize o bloco do título:
```tsx
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Orçamento</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Gerencie seu orçamento com diferentes metodologias
          </p>
        </div>
```
Substitua por (adiciona a barra de navegação de mês abaixo do subtítulo):
```tsx
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Orçamento</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Gerencie seu orçamento com diferentes metodologias
          </p>
          <div className="flex items-center gap-sm mt-sm">
            <button
              onClick={() => shiftMonth(-1)}
              className="p-xs text-neutral-600 hover:text-primary-500 hover:bg-neutral-100 rounded-base"
              title="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-body font-semibold text-neutral-900 capitalize min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              className="p-xs text-neutral-600 hover:text-primary-500 hover:bg-neutral-100 rounded-base"
              title="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
```

- [ ] **Step 5: Verificar build**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: exit 0. (`sumAbsByCategory` é importado mas ainda não usado — TS não reclama de import usado parcialmente porque `monthRange` também é importado; se o linter reclamar de `sumAbsByCategory` não usado, ele será usado na Task 4 — mantenha o import. Se `tsc` falhar por "declared but never used", remova `sumAbsByCategory` deste import e re-adicione na Task 4.)

- [ ] **Step 6: Commit**

```bash
git add familia-financas/src/pages/BudgetPage.tsx
git commit -m "feat(budget): navegação de mês na página Orçamento"
```

---

## Task 4: BudgetPage — gasto real ao vivo (3 abas)

**Files:**
- Modify: `familia-financas/src/pages/BudgetPage.tsx`

- [ ] **Step 1: Estado do gasto + loader**

Após `const [categories, setCategories] = useState<any[]>([]);` adicione:
```ts
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
```
Adicione `loadSpent` ao `Promise.all` de `loadData`:
```ts
      await Promise.all([
        loadBudget(),
        loadCategories(),
        loadCategoryBudgets(),
        loadSpent()
      ]);
```
E defina a função (perto das outras `loadX`):
```ts
  const loadSpent = async () => {
    if (!user) return;
    const [y, m] = selectedMonth.split('-').map(Number);
    const { startISO, endISO } = monthRange(y, m);
    const { data } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'despesa')
      .gte('transaction_date', startISO)
      .lte('transaction_date', endISO);
    setSpentByCategory(sumAbsByCategory((data || []) as any));
  };
```

- [ ] **Step 2: Aba Envelope — usar gasto real (Planeado | Gasto | Resta)**

Na aba Envelope, localize:
```tsx
                  const categoryBudget = categoryBudgets.find(cb => cb.category_id === category.id);
                  const allocated = categoryBudget?.allocated_amount || 0;
                  const spent = categoryBudget?.spent_amount || 0;
                  const percentage = getProgressPercentage(spent, allocated);
```
Substitua por:
```tsx
                  const categoryBudget = categoryBudgets.find(cb => cb.category_id === category.id);
                  const allocated = categoryBudget?.allocated_amount || 0;
                  const spent = spentByCategory[category.id] || 0;
                  const remaining = allocated - spent;
                  const percentage = getProgressPercentage(spent, allocated);
```
E logo abaixo, localize:
```tsx
                          <p className="text-small text-neutral-600">
                            Gasto: {formatCurrency(spent)} de {formatCurrency(allocated)}
                          </p>
```
Substitua por:
```tsx
                          <p className="text-small text-neutral-600">
                            Gasto: {formatCurrency(spent)} de {formatCurrency(allocated)}
                            {allocated > 0 && (
                              <span className={remaining < 0 ? 'text-error-600 font-semibold' : 'text-success-600'}>
                                {' · '}Resta {formatCurrency(remaining)}
                              </span>
                            )}
                          </p>
```

- [ ] **Step 3: Aba 50/30/20 — mostrar gasto real por tipo**

Antes do `return (` da página (perto de `fiftyThirtyTwentyData`), adicione um cálculo de gasto por tipo:
```ts
  const spentForTypes = (types: string[]) =>
    categories
      .filter((c: any) => types.includes(c.category_type))
      .reduce((s: number, c: any) => s + (spentByCategory[c.id] || 0), 0);

  const needsSpent = spentForTypes(['essencial', 'divida']);
  const wantsSpent = spentForTypes(['superfluo']);
  const savingsSpent = spentForTypes(['poupanca']);
```
Na aba 50/30/20, dentro da caixa "Necessidades (50%)", após o parágrafo do valor:
```tsx
                  <p className="text-h4 font-bold text-blue-900">
                    {formatCurrency(budget.total_income * 0.5)}
                  </p>
```
adicione:
```tsx
                  <p className="text-small text-blue-700 mt-xs font-semibold">
                    Gasto real: {formatCurrency(needsSpent)}
                  </p>
```
Na caixa "Desejos (30%)", após:
```tsx
                  <p className="text-h4 font-bold text-orange-900">
                    {formatCurrency(budget.total_income * 0.3)}
                  </p>
```
adicione:
```tsx
                  <p className="text-small text-orange-700 mt-xs font-semibold">
                    Gasto real: {formatCurrency(wantsSpent)}
                  </p>
```
Na caixa "Poupança (20%)", após:
```tsx
                  <p className="text-h4 font-bold text-green-900">
                    {formatCurrency(budget.total_income * 0.2)}
                  </p>
```
adicione:
```tsx
                  <p className="text-small text-green-700 mt-xs font-semibold">
                    Gasto real: {formatCurrency(savingsSpent)}
                  </p>
```

- [ ] **Step 4: Verificar build**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: exit 0.
Run: `cd familia-financas && pnpm test` → 20 testes verdes (14 + 6 novos da Task 1).

- [ ] **Step 5: Commit**

```bash
git add familia-financas/src/pages/BudgetPage.tsx
git commit -m "feat(budget): gasto real ao vivo das transações nas 3 abas"
```

---

## Task 5: BudgetPage — edição rápida do planeado + persistência de `budget_items`

**Files:**
- Modify: `familia-financas/src/pages/BudgetPage.tsx`

- [ ] **Step 1: Função para atualizar o planeado por categoria no estado**

Após a função `loadSpent` (ou perto das outras funções), adicione:
```ts
  const setAllocated = (categoryId: string, value: number, categoryType: CategoryBudget['category_type']) => {
    setCategoryBudgets((prev) => {
      const exists = prev.find((cb) => cb.category_id === categoryId);
      if (exists) {
        return prev.map((cb) =>
          cb.category_id === categoryId ? { ...cb, allocated_amount: value } : cb
        );
      }
      return [
        ...prev,
        {
          category_id: categoryId,
          category_name: '',
          allocated_amount: value,
          spent_amount: 0,
          category_type: categoryType,
        },
      ];
    });
  };
```

- [ ] **Step 2: Persistir `budget_items` ao salvar (upsert manual)**

Adicione a função de persistência após `saveBudget` (ou logo antes do `return`):
```ts
  const persistBudgetItems = async (budgetId: string) => {
    for (const cb of categoryBudgets) {
      if (cb.allocated_amount == null) continue;
      const { data: existing } = await supabase
        .from('budget_items')
        .select('id')
        .eq('budget_id', budgetId)
        .eq('category_id', cb.category_id)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from('budget_items')
          .update({ allocated_amount: cb.allocated_amount })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budget_items')
          .insert({
            budget_id: budgetId,
            category_id: cb.category_id,
            allocated_amount: cb.allocated_amount,
            spent_amount: 0,
          });
        if (error) throw error;
      }
    }
  };
```
Em `saveBudget`, localize:
```ts
      setBudget({ ...budget, id: result.id });
      setEditing(false);

      showAlert({
        type: 'success',
        title: 'Sucesso!',
        message: 'Orçamento salvo com sucesso!'
      });
```
Substitua por (persistir itens e recarregar antes do alerta de sucesso):
```ts
      await persistBudgetItems(result.id);

      setBudget({ ...budget, id: result.id });
      setEditing(false);
      await loadData();

      showAlert({
        type: 'success',
        title: 'Sucesso!',
        message: 'Orçamento salvo com sucesso!'
      });
```

- [ ] **Step 3: Wire do input do planeado — aba Envelope**

Na aba Envelope, localize o `<Input>` do valor alocado:
```tsx
                          <Input
                            type="number"
                            placeholder="0,00"
                            value={allocated || ''}
                            disabled={!editing}
                            step="0.01"
                            className="text-right"
                          />
```
Substitua por (adiciona `onChange`):
```tsx
                          <Input
                            type="number"
                            placeholder="0,00"
                            value={allocated || ''}
                            onChange={(e) =>
                              setAllocated(category.id, parseFloat(e.target.value) || 0, category.category_type)
                            }
                            disabled={!editing}
                            step="0.01"
                            className="text-right"
                          />
```

- [ ] **Step 4: Wire do input do planeado — aba Zero-Based**

Na aba Zero-Based, localize o bloco do `<Input>` (que hoje não tem `value` nem `onChange`):
```tsx
                  <div className="w-40">
                    <Input
                      type="number"
                      placeholder="0,00"
                      disabled={!editing}
                      step="0.01"
                      className="text-right"
                    />
                  </div>
```
Substitua por (lê do estado e grava via setAllocated):
```tsx
                  <div className="w-40">
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={(categoryBudgets.find(cb => cb.category_id === category.id)?.allocated_amount) || ''}
                      onChange={(e) =>
                        setAllocated(category.id, parseFloat(e.target.value) || 0, category.category_type)
                      }
                      disabled={!editing}
                      step="0.01"
                      className="text-right"
                    />
                  </div>
```

- [ ] **Step 5: Verificar build e fluxo**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: exit 0.
Run: `cd familia-financas && pnpm test`
Expected: 20 testes verdes.
Verificação manual (`pnpm dev`): na aba Envelope/Zero-Based, clique "Editar Orçamento", defina valores planeados por categoria, "Salvar" → recarregar a página mantém os valores (persistiu em `budget_items`); navegue para outro mês → planeado é independente por mês; lance uma despesa numa categoria e veja o "Gasto" aparecer no mês certo.

- [ ] **Step 6: Commit**

```bash
git add familia-financas/src/pages/BudgetPage.tsx
git commit -m "feat(budget): edição e persistência do planeado por categoria (budget_items)"
```

---

## Self-Review (preenchido)

**Cobertura da spec:**
- §4 helpers puros (`monthRange`, `sumAbsByCategory`) → Task 1. ✓
- §5.1 navegação de mês → Task 3. ✓
- §5.2 gasto real ao vivo (Envelope/Zero-Based/50-30-20) → Task 4. ✓
- §5.3 edição rápida + persistência `budget_items` (upsert manual) → Task 5. ✓
- §5.4 tratamento de erro nas escritas → Task 5 (persistBudgetItems lança erro; `saveBudget` já tem try/catch com `showAlert`). ✓
- §6 correção de sinal na Reunião Semanal → Task 2. ✓

**Pontos a confirmar na execução (não bloqueiam):**
- O `<Input>` do projeto repassa `onChange` ao `<input>` nativo (confirmar em `components/ui/Input.tsx`; `CategoriesPage`/`TransactionsPage` já usam `onChange` em `Input`, então sim).
- `CategoryBudget` é a interface já existente no arquivo (usada em `setAllocated`).
- A tabela `budget_items` aceita insert com (`budget_id`, `category_id`, `allocated_amount`, `spent_amount`) sob RLS — o `budget_id` pertence ao usuário, consistente com o padrão.

**Consistência de tipos:** `spentByCategory: Record<string, number>` usado em Tasks 4/5 conforme definido; `setAllocated`/`persistBudgetItems` usam `CategoryBudget` existente; helpers de Task 1 batem com as chamadas em Task 4.
