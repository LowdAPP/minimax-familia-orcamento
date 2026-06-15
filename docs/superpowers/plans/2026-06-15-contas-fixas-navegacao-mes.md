# Navegação de mês na Contas Fixas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar navegação de mês (setas ‹ Mês Ano ›) à página Contas Fixas, espelhando o padrão já usado no BudgetPage, para ver/marcar contas pagas de qualquer mês.

**Architecture:** Modificação única em `FixedBillsPage.tsx`: trocar o `monthYear` fixo por um estado `selectedMonth` com setas prev/next e label localizado; as queries de `fixed_bill_payments` e o `togglePaid` passam a usar `selectedMonth`. A lista de `fixed_bills` (recorrentes) não muda por mês — só o estado de pagamento.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase, lucide-react.

---

## File Structure

- **Modify** `familia-financas/src/pages/FixedBillsPage.tsx` — estado de mês + controles + uso de `selectedMonth`.

---

## Task 1: Navegação de mês na página Contas Fixas

**Files:**
- Modify: `familia-financas/src/pages/FixedBillsPage.tsx`

- [ ] **Step 1: Importar ícones de navegação e `language`**

No import de `lucide-react`:
```ts
import { Plus, Edit, Trash2, Save, X, CheckCircle, Circle, Sparkles } from 'lucide-react';
```
Substitua por (adiciona `ChevronLeft`, `ChevronRight`):
```ts
import { Plus, Edit, Trash2, Save, X, CheckCircle, Circle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
```
E na linha do `useI18n`:
```ts
  const { formatCurrency } = useI18n();
```
Substitua por:
```ts
  const { formatCurrency, language } = useI18n();
```

- [ ] **Step 2: Trocar `monthYear` fixo por estado `selectedMonth` + helpers**

Localize:
```ts
  const monthYear = currentMonthYear();
```
Substitua por:
```ts
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentMonthYear());

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
(Mantenha a função `currentMonthYear()` existente — ela é usada como valor inicial.)

- [ ] **Step 3: Usar `selectedMonth` na query de pagamentos**

Em `load`, localize:
```ts
      const { data: payData } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear);
```
Substitua a última linha para usar `selectedMonth`:
```ts
      const { data: payData } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', selectedMonth);
```

- [ ] **Step 4: Usar `selectedMonth` no `togglePaid`**

No `togglePaid`, localize:
```ts
      month_year: monthYear,
```
Substitua por:
```ts
      month_year: selectedMonth,
```

- [ ] **Step 5: Recarregar ao trocar de mês**

Localize:
```ts
  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
```
Substitua por:
```ts
  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedMonth]);
```

- [ ] **Step 6: Controles de mês no header**

Localize o bloco do título no header:
```tsx
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Contas Fixas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Marque cada conta conforme paga. O que falta pagar é o seu "comprometido".
          </p>
        </div>
```
Substitua por (adiciona a barra de navegação de mês abaixo do subtítulo):
```tsx
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Contas Fixas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Marque cada conta conforme paga. O que falta pagar é o seu "comprometido".
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

- [ ] **Step 7: Verificar build**

Run: `cd /Volumes/BackupMAC/react/archived/minimax-familia-orcamento/familia-financas && pnpm exec tsc -b --noEmit`
Expected: exit 0, sem erros.
Run: `pnpm test`
Expected: 20 testes ainda passam (sem mudança nos testes).
Confirme também que não sobrou nenhuma referência a `monthYear` na página (todas viraram `selectedMonth`): `grep -n "monthYear" src/pages/FixedBillsPage.tsx` deve mostrar APENAS a função `currentMonthYear` e seu uso como inicializador, não a variável antiga.

- [ ] **Step 8: Commit**

```bash
git add familia-financas/src/pages/FixedBillsPage.tsx
git commit -m "feat(fixed-bills): navegação de mês na página Contas Fixas"
```

---

## Self-Review (preenchido)

**Cobertura da spec:**
- §4 importar ChevronLeft/ChevronRight + language → Step 1. ✓
- §4 estado `selectedMonth` + shiftMonth + monthLabel → Step 2. ✓
- §4 trocar `monthYear`→`selectedMonth` na query e no togglePaid → Steps 3, 4. ✓
- §4 useEffect depende de `[user, selectedMonth]` → Step 5. ✓
- §4 controles no header → Step 6. ✓
- §6 teste manual + tsc → Step 7. ✓

**Sem placeholders.** **Consistência:** `selectedMonth` (string YYYY-MM) usado em todas as queries; `currentMonthYear()` reusada como inicializador; padrão idêntico ao `BudgetPage` (shiftMonth/monthLabel).
