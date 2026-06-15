# Disponível vs Comprometido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar à app familia-financas a visão "Disponível vs Comprometido", a gestão de Contas Fixas (com vencimento e estado pago/por pagar por mês), limites semanais por categoria variável e uma página de Reunião Semanal.

**Architecture:** Duas tabelas novas (`fixed_bills`, `fixed_bill_payments`) + uma opcional (`weekly_limits`) no Supabase, com RLS multitenant idêntico ao padrão existente. Toda a lógica de cálculo (comprometido, disponível, limites/gasto semanal, dias restantes) vive num módulo **puro e testável** em `src/lib/finance/cashflow.ts`. As páginas leem/escrevem via `supabase` client diretamente (mesmo padrão de `CategoriesPage`), sem novos endpoints de backend.

**Tech Stack:** React 18 + TypeScript + Vite, Supabase (Postgres + RLS), TailwindCSS, lucide-react, Vitest (novo, só para o módulo de cálculo).

**Decisões da spec a notar (pequenos ajustes para fidelidade ao código):**
- **Sem endpoints de backend novos:** a app inteira faz CRUD pelo `supabase` client com RLS (ex.: `CategoriesPage`). Seguimos esse padrão.
- **Seed via empty-state:** como o app é multitenant e não dá para semear por SQL sem saber o usuário, o "seed das contas fixas recomendadas" vira um botão no estado vazio da página Contas Fixas.
- **Limites semanais vivem na página Reunião Semanal**, junto com a pergunta "estamos dentro do orçamento da semana?".
- Tabelas novas incluem `tenant_id UUID REFERENCES tenants(id)` (nullable) para casar com o RLS multitenant existente.

---

## File Structure

- **Create** `supabase/migrations/1765000000_create_fixed_bills_and_weekly_limits.sql` — tabelas + RLS + índices.
- **Create** `familia-financas/src/lib/finance/cashflow.ts` — módulo puro de cálculo.
- **Create** `familia-financas/src/lib/finance/cashflow.test.ts` — testes Vitest.
- **Create** `familia-financas/vitest.config.ts` — config de teste.
- **Modify** `familia-financas/package.json` — devDeps Vitest + script `test`.
- **Modify** `familia-financas/src/lib/supabase.ts` — interfaces `FixedBill`, `FixedBillPayment`, `WeeklyLimit`.
- **Create** `familia-financas/src/pages/FixedBillsPage.tsx` — CRUD de contas fixas + checkbox "pago" + seed.
- **Create** `familia-financas/src/pages/WeeklyReviewPage.tsx` — reunião semanal + barras de limite semanal.
- **Modify** `familia-financas/src/pages/DashboardPage.tsx` — cards Disponível/Comprometido/Dias/Poupado + bloco Cash Flow.
- **Modify** `familia-financas/src/App.tsx` — rotas `/fixed-bills` e `/weekly-review`.
- **Modify** `familia-financas/src/components/layout/DashboardLayout.tsx` — itens de menu.

---

## Task 1: Migration — tabelas e RLS

**Files:**
- Create: `supabase/migrations/1765000000_create_fixed_bills_and_weekly_limits.sql`

- [ ] **Step 1: Escrever a migration**

Create `supabase/migrations/1765000000_create_fixed_bills_and_weekly_limits.sql`:

```sql
-- Migration: Contas Fixas, Pagamentos e Limites Semanais
-- Data: 2026-06-15
-- Padrão RLS multitenant igual a 20251128_implement_multitenancy.sql

-- 1. fixed_bills (definição da conta fixa recorrente)
CREATE TABLE IF NOT EXISTS fixed_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fixed_bills_user ON fixed_bills(user_id);

-- 2. fixed_bill_payments (estado por mês)
CREATE TABLE IF NOT EXISTS fixed_bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixed_bill_id UUID NOT NULL REFERENCES fixed_bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    month_year VARCHAR(7) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    transaction_id UUID REFERENCES transactions(id),
    amount_paid DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (fixed_bill_id, month_year)
);
CREATE INDEX IF NOT EXISTS idx_fbp_user ON fixed_bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_fbp_month ON fixed_bill_payments(month_year);

-- 3. weekly_limits (override manual opcional do limite/semana)
CREATE TABLE IF NOT EXISTS weekly_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    month_year VARCHAR(7) NOT NULL,
    weekly_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (category_id, month_year)
);
CREATE INDEX IF NOT EXISTS idx_weekly_limits_user ON weekly_limits(user_id);

-- 4. RLS
ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Fixed Bills" ON fixed_bills FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Fixed Bills" ON fixed_bills FOR ALL
    TO service_role USING (true) WITH CHECK (true);

ALTER TABLE fixed_bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Bill Payments" ON fixed_bill_payments FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Bill Payments" ON fixed_bill_payments FOR ALL
    TO service_role USING (true) WITH CHECK (true);

ALTER TABLE weekly_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Multitenant Manage Weekly Limits" ON weekly_limits FOR ALL
    USING (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()))
    WITH CHECK (auth.uid() = user_id AND (tenant_id IS NULL OR tenant_id = get_auth_tenant_id()));
CREATE POLICY "Service Role Full Access Weekly Limits" ON weekly_limits FOR ALL
    TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Aplicar a migration no Supabase**

Aplique via o fluxo já usado no projeto (ver `APLICAR_MIGRATION_BUDGETS.md` / `supabase db push` ou o SQL editor do Supabase).
Expected: 3 tabelas criadas sem erro; `tenants`, `categories`, `transactions` já existem como referência.

- [ ] **Step 3: Verificar manualmente no SQL editor**

Run (no SQL editor do Supabase):
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('fixed_bills','fixed_bill_payments','weekly_limits');
```
Expected: 3 linhas retornadas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/1765000000_create_fixed_bills_and_weekly_limits.sql
git commit -m "feat(db): tabelas fixed_bills, fixed_bill_payments e weekly_limits com RLS"
```

---

## Task 2: Módulo puro de cálculo (TDD com Vitest)

**Files:**
- Modify: `familia-financas/package.json`
- Create: `familia-financas/vitest.config.ts`
- Create: `familia-financas/src/lib/finance/cashflow.ts`
- Test: `familia-financas/src/lib/finance/cashflow.test.ts`

- [ ] **Step 1: Instalar Vitest e adicionar script**

Run:
```bash
cd familia-financas && pnpm add -D vitest@^2.0.0
```
Depois edite `familia-financas/package.json`, no objeto `"scripts"`, adicione a linha do `test` (mantenha as demais):
```json
    "test": "vitest run",
```

- [ ] **Step 2: Criar config do Vitest**

Create `familia-financas/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Escrever os testes (falham primeiro)**

Create `familia-financas/src/lib/finance/cashflow.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
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

const bills = [
  { id: 'a', amount: 700, is_active: true },
  { id: 'b', amount: 20, is_active: true },
  { id: 'c', amount: 50, is_active: true },
];

describe('committedAmount', () => {
  it('soma todas as contas quando nenhuma está paga', () => {
    expect(committedAmount(bills, [])).toBe(770);
  });
  it('exclui contas com pagamento is_paid=true', () => {
    const payments = [{ fixed_bill_id: 'a', is_paid: true }];
    expect(committedAmount(bills, payments)).toBe(70);
  });
  it('ignora contas inativas', () => {
    const b2 = [...bills, { id: 'd', amount: 999, is_active: false }];
    expect(committedAmount(b2, [])).toBe(770);
  });
});

describe('availableAmount', () => {
  it('disponível = saldo corrente - comprometido', () => {
    expect(availableAmount(1000, 770)).toBe(230);
  });
});

describe('paidThisMonth', () => {
  it('soma amount_paid dos pagamentos pagos', () => {
    const payments = [
      { fixed_bill_id: 'a', is_paid: true, amount_paid: 700 },
      { fixed_bill_id: 'b', is_paid: false, amount_paid: null },
    ];
    expect(paidThisMonth(payments)).toBe(700);
  });
});

describe('daysInMonth / weeksInMonth', () => {
  it('junho/2026 tem 30 dias e 5 blocos de semana', () => {
    expect(daysInMonth(2026, 6)).toBe(30);
    expect(weeksInMonth(2026, 6)).toBe(5);
  });
  it('fevereiro/2026 tem 28 dias e 4 blocos', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(weeksInMonth(2026, 2)).toBe(4);
  });
});

describe('weeklyLimit', () => {
  it('divide o mensal pelo nº de semanas', () => {
    expect(weeklyLimit(600, 4)).toBe(150);
  });
  it('retorna 0 se semanas for 0', () => {
    expect(weeklyLimit(600, 0)).toBe(0);
  });
});

describe('currentWeekOfMonth', () => {
  it('dia 1-7 = semana 1, dia 15 = semana 3', () => {
    expect(currentWeekOfMonth(1)).toBe(1);
    expect(currentWeekOfMonth(7)).toBe(1);
    expect(currentWeekOfMonth(8)).toBe(2);
    expect(currentWeekOfMonth(15)).toBe(3);
  });
});

describe('weekRange', () => {
  it('semana 3 de junho/2026 vai de 15 a 21', () => {
    const r = weekRange(2026, 6, 3);
    expect(r.startISO).toBe('2026-06-15');
    expect(r.endISO).toBe('2026-06-21');
  });
  it('última semana não passa do último dia do mês', () => {
    const r = weekRange(2026, 6, 5);
    expect(r.startISO).toBe('2026-06-29');
    expect(r.endISO).toBe('2026-06-30');
  });
});

describe('daysRemaining', () => {
  it('dia 15 de junho/2026 restam 15 dias', () => {
    expect(daysRemaining(2026, 6, 15)).toBe(15);
  });
});

describe('sumInRange', () => {
  it('soma valores dentro do intervalo inclusivo', () => {
    const items = [
      { transaction_date: '2026-06-14', amount: 10 },
      { transaction_date: '2026-06-15', amount: 90 },
      { transaction_date: '2026-06-21', amount: 5 },
      { transaction_date: '2026-06-22', amount: 50 },
    ];
    expect(sumInRange(items, '2026-06-15', '2026-06-21')).toBe(95);
  });
});
```

- [ ] **Step 4: Rodar os testes para ver falhar**

Run: `cd familia-financas && pnpm test`
Expected: FAIL — módulo `./cashflow` não existe.

- [ ] **Step 5: Implementar o módulo puro**

Create `familia-financas/src/lib/finance/cashflow.ts`:
```ts
// Cálculos puros de fluxo de caixa (sem efeitos colaterais, sem Date.now()).
// Semana = bloco de 7 dias a partir do dia 1 do mês.

export interface BillLike {
  id: string;
  amount: number;
  is_active?: boolean;
}

export interface PaymentLike {
  fixed_bill_id: string;
  is_paid: boolean;
  amount_paid?: number | null;
}

export interface DatedAmount {
  transaction_date: string; // 'YYYY-MM-DD'
  amount: number;
}

/** Comprometido = soma das contas ativas SEM pagamento is_paid=true. */
export function committedAmount(bills: BillLike[], payments: PaymentLike[]): number {
  const paidIds = new Set(payments.filter((p) => p.is_paid).map((p) => p.fixed_bill_id));
  return bills
    .filter((b) => b.is_active !== false && !paidIds.has(b.id))
    .reduce((sum, b) => sum + b.amount, 0);
}

/** Disponível = saldo de conta corrente - comprometido. */
export function availableAmount(currentAccountBalance: number, committed: number): number {
  return currentAccountBalance - committed;
}

/** Total já pago este mês (soma amount_paid dos pagamentos confirmados). */
export function paidThisMonth(payments: PaymentLike[]): number {
  return payments
    .filter((p) => p.is_paid)
    .reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
}

/** Nº de dias do mês (month = 1-12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Nº de blocos de 7 dias no mês. */
export function weeksInMonth(year: number, month: number): number {
  return Math.ceil(daysInMonth(year, month) / 7);
}

/** Limite semanal = mensal / nº de semanas. */
export function weeklyLimit(allocatedMonthly: number, weeks: number): number {
  if (weeks <= 0) return 0;
  return allocatedMonthly / weeks;
}

/** Semana do mês para um dia (1-based, blocos de 7 dias). */
export function currentWeekOfMonth(day: number): number {
  return Math.floor((day - 1) / 7) + 1;
}

/** Intervalo ISO [start, end] do bloco de semana (1-based), limitado ao fim do mês. */
export function weekRange(
  year: number,
  month: number,
  weekIndex: number
): { startISO: string; endISO: string } {
  const last = daysInMonth(year, month);
  const startDay = (weekIndex - 1) * 7 + 1;
  const endDay = Math.min(weekIndex * 7, last);
  const mm = String(month).padStart(2, '0');
  return {
    startISO: `${year}-${mm}-${String(startDay).padStart(2, '0')}`,
    endISO: `${year}-${mm}-${String(endDay).padStart(2, '0')}`,
  };
}

/** Dias restantes no mês a partir de um dia (exclusivo do próprio dia). */
export function daysRemaining(year: number, month: number, day: number): number {
  return daysInMonth(year, month) - day;
}

/** Soma de amounts cujo transaction_date está em [startISO, endISO] inclusivo. */
export function sumInRange(items: DatedAmount[], startISO: string, endISO: string): number {
  return items
    .filter((i) => i.transaction_date >= startISO && i.transaction_date <= endISO)
    .reduce((sum, i) => sum + i.amount, 0);
}
```

- [ ] **Step 6: Rodar os testes para ver passar**

Run: `cd familia-financas && pnpm test`
Expected: PASS (todos os testes verdes).

- [ ] **Step 7: Commit**

```bash
git add familia-financas/package.json familia-financas/pnpm-lock.yaml familia-financas/vitest.config.ts familia-financas/src/lib/finance/cashflow.ts familia-financas/src/lib/finance/cashflow.test.ts
git commit -m "feat(finance): módulo puro de cálculo de fluxo de caixa + testes"
```

---

## Task 3: Tipos no supabase.ts

**Files:**
- Modify: `familia-financas/src/lib/supabase.ts` (append ao fim, depois da interface `Goal`)

- [ ] **Step 1: Adicionar as interfaces**

No fim de `familia-financas/src/lib/supabase.ts`, após a interface `Goal`, adicione:
```ts
export interface FixedBill {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  name: string;
  amount: number;
  due_day: number;
  category_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FixedBillPayment {
  id: string;
  fixed_bill_id: string;
  user_id: string;
  tenant_id?: string | null;
  month_year: string; // 'YYYY-MM'
  is_paid: boolean;
  paid_date?: string | null;
  transaction_id?: string | null;
  amount_paid?: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyLimit {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  category_id: string;
  month_year: string;
  weekly_amount: number;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add familia-financas/src/lib/supabase.ts
git commit -m "feat(types): FixedBill, FixedBillPayment, WeeklyLimit"
```

---

## Task 4: Página Contas Fixas (CRUD + pago + seed)

**Files:**
- Create: `familia-financas/src/pages/FixedBillsPage.tsx`
- Modify: `familia-financas/src/App.tsx`
- Modify: `familia-financas/src/components/layout/DashboardLayout.tsx`

- [ ] **Step 1: Criar a página**

Create `familia-financas/src/pages/FixedBillsPage.tsx`:
```tsx
// Página de Contas Fixas — definição + estado pago/por pagar do mês corrente
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase, FixedBill, FixedBillPayment } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash2, Save, X, CheckCircle, Circle, Sparkles } from 'lucide-react';

const RECOMMENDED = [
  { name: 'Renda', amount: 700, due_day: 5 },
  { name: 'Água + Luz + Gás', amount: 125, due_day: 12 },
  { name: 'Internet + Telemóveis', amount: 50, due_day: 15 },
];

function currentMonthYear(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function FixedBillsPage() {
  const { user } = useAuth();
  const { formatCurrency } = useI18n();
  const monthYear = currentMonthYear();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [payments, setPayments] = useState<FixedBillPayment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixedBill | null>(null);
  const [form, setForm] = useState({ name: '', amount: 0, due_day: 1 });

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: billsData } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('due_day');
      const { data: payData } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear);
      setBills(billsData || []);
      setPayments(payData || []);
    } finally {
      setLoading(false);
    }
  };

  const paymentFor = (billId: string) =>
    payments.find((p) => p.fixed_bill_id === billId);

  const openAdd = () => {
    setForm({ name: '', amount: 0, due_day: 1 });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (bill: FixedBill) => {
    setForm({ name: bill.name, amount: bill.amount, due_day: bill.due_day });
    setEditing(bill);
    setShowModal(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) {
      alert('Preencha o nome da conta');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: form.amount || 0,
        due_day: form.due_day || 1,
        user_id: user.id,
        is_active: true,
      };
      if (editing) {
        await supabase.from('fixed_bills').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('fixed_bills').insert(payload);
      }
      await load();
      setShowModal(false);
      setEditing(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (bill: FixedBill) => {
    if (!confirm(`Apagar a conta fixa "${bill.name}"?`)) return;
    await supabase.from('fixed_bills').delete().eq('id', bill.id);
    await load();
  };

  const togglePaid = async (bill: FixedBill) => {
    if (!user) return;
    const existing = paymentFor(bill.id);
    const nextPaid = !(existing?.is_paid);
    const payload = {
      fixed_bill_id: bill.id,
      user_id: user.id,
      month_year: monthYear,
      is_paid: nextPaid,
      paid_date: nextPaid ? new Date().toISOString().slice(0, 10) : null,
      amount_paid: nextPaid ? bill.amount : null,
    };
    // upsert pela chave única (fixed_bill_id, month_year)
    await supabase
      .from('fixed_bill_payments')
      .upsert(payload, { onConflict: 'fixed_bill_id,month_year' });
    await load();
  };

  const seedRecommended = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const rows = RECOMMENDED.map((r) => ({ ...r, user_id: user.id, is_active: true }));
      await supabase.from('fixed_bills').insert(rows);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Contas Fixas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Marque cada conta conforme paga. O que falta pagar é o seu "comprometido".
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Nova Conta Fixa
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card>
          <div className="text-center py-lg space-y-md">
            <p className="text-body text-neutral-600">
              Ainda não tem contas fixas. Quer começar pelas recomendadas?
            </p>
            <Button variant="primary" onClick={seedRecommended} loading={saving}>
              <Sparkles className="w-4 h-4" />
              Adicionar contas recomendadas
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center text-small font-semibold text-neutral-500 pb-sm border-b border-neutral-200">
            <span>Conta</span>
            <span>Venc.</span>
            <span>Planeado</span>
            <span>Pago?</span>
            <span></span>
          </div>
          {bills.map((bill) => {
            const pay = paymentFor(bill.id);
            const paid = !!pay?.is_paid;
            return (
              <div
                key={bill.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center py-sm border-b border-neutral-100"
              >
                <span className="text-body font-medium text-neutral-900">{bill.name}</span>
                <span className="text-small text-neutral-600">dia {bill.due_day}</span>
                <span className="text-body text-neutral-900">{formatCurrency(bill.amount)}</span>
                <button
                  onClick={() => togglePaid(bill)}
                  className="flex items-center gap-xs"
                  title={paid ? 'Pago' : 'Por pagar'}
                >
                  {paid ? (
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-neutral-300" />
                  )}
                </button>
                <div className="flex gap-xs">
                  <button onClick={() => openEdit(bill)} className="p-xs text-neutral-600 hover:text-primary-500">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(bill)} className="p-xs text-neutral-600 hover:text-error-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-h4 font-bold text-neutral-900">
                {editing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-xs text-neutral-600 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-md">
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Renda"
                required
              />
              <Input
                type="number"
                label="Valor planeado"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <Input
                type="number"
                label="Dia de vencimento (1-31)"
                value={form.due_day || ''}
                onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || 1 })}
                min="1"
                max="31"
              />
            </div>
            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button variant="ghost" onClick={() => setShowModal(false)} fullWidth>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save} loading={saving} fullWidth>
                <Save className="w-4 h-4" />
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Registrar a rota**

Em `familia-financas/src/App.tsx`, adicione o import junto aos outros imports de páginas:
```tsx
import FixedBillsPage from './pages/FixedBillsPage';
```
E adicione o bloco de rota logo após a rota `/budget` (antes de `/categories`):
```tsx
          <Route
            path="/fixed-bills"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FixedBillsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
```

- [ ] **Step 3: Adicionar item de menu**

Em `familia-financas/src/components/layout/DashboardLayout.tsx`, no array de navegação (perto da linha 34, após o item `/budget`), adicione:
```tsx
    { path: '/fixed-bills', label: 'Contas Fixas', icon: Receipt },
```
(`Receipt` já é importado de `lucide-react` neste arquivo — verifique no topo; se não estiver, adicione ao import.)

- [ ] **Step 4: Verificar build e fluxo manual**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: sem erros.
Run manual: `pnpm dev`, abra `/fixed-bills`, clique "Adicionar contas recomendadas" → aparecem 3 contas; marque uma como paga (ícone vira verde); recarregue → estado persiste.

- [ ] **Step 5: Commit**

```bash
git add familia-financas/src/pages/FixedBillsPage.tsx familia-financas/src/App.tsx familia-financas/src/components/layout/DashboardLayout.tsx
git commit -m "feat(ui): página Contas Fixas com checkbox de pago e seed"
```

---

## Task 5: Cards Disponível/Comprometido + bloco Cash Flow no Dashboard

**Files:**
- Modify: `familia-financas/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Importar o módulo de cálculo e tipos**

No topo de `familia-financas/src/pages/DashboardPage.tsx`, após os imports existentes de `../lib/supabase`, adicione:
```tsx
import { FixedBill, FixedBillPayment } from '../lib/supabase';
import {
  committedAmount,
  availableAmount,
  paidThisMonth,
  daysRemaining,
} from '../lib/finance/cashflow';
```
E adicione os ícones que faltam ao import existente de `lucide-react` (junte aos já presentes): `CalendarClock`, `Lock`.

- [ ] **Step 2: Adicionar estado para o fluxo de caixa**

Logo após o `const [alerts, setAlerts] = useState<Alert[]>([]);`, adicione:
```tsx
  const [cashflow, setCashflow] = useState({
    available: 0,
    committed: 0,
    paid: 0,
    daysLeft: 0,
    savingsBalance: 0,
  });
```

- [ ] **Step 3: Adicionar o loader e ligá-lo ao loadDashboardData**

Dentro de `loadDashboardData`, adicione `loadCashflow()` ao `Promise.all([...])`.
Depois, adicione a função (perto das outras `loadX`):
```tsx
  const loadCashflow = async () => {
    if (!user) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    const monthYear = now.toISOString().slice(0, 7);

    const { data: accounts } = await supabase
      .from('accounts')
      .select('current_balance, account_type, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const checking = (accounts || [])
      .filter((a: any) => a.account_type === 'conta_corrente')
      .reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);
    const savingsBalance = (accounts || [])
      .filter((a: any) => a.account_type === 'poupanca')
      .reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);

    const { data: billsData } = await supabase
      .from('fixed_bills')
      .select('id, amount, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    const { data: payData } = await supabase
      .from('fixed_bill_payments')
      .select('fixed_bill_id, is_paid, amount_paid')
      .eq('user_id', user.id)
      .eq('month_year', monthYear);

    const bills = (billsData || []) as FixedBill[];
    const payments = (payData || []) as FixedBillPayment[];
    const committed = committedAmount(bills, payments);

    setCashflow({
      available: availableAmount(checking, committed),
      committed,
      paid: paidThisMonth(payments),
      daysLeft: daysRemaining(year, month, day),
      savingsBalance,
    });
  };
```

- [ ] **Step 4: Renderizar a faixa de cards no topo do return**

No JSX retornado pela página, logo no início do conteúdo principal (antes dos cards/gráficos existentes), adicione:
```tsx
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          title="Disponível"
          value={formatCurrency(cashflow.available)}
          subtitle="podes gastar"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Comprometido"
          value={formatCurrency(cashflow.committed)}
          subtitle="contas a pagar"
          icon={<Lock className="w-5 h-5" />}
        />
        <StatCard
          title="Dias restantes"
          value={String(cashflow.daysLeft)}
          subtitle="no mês"
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <StatCard
          title="Já poupado"
          value={formatCurrency(cashflow.savingsBalance)}
          subtitle="em poupança"
          icon={<PiggyBank className="w-5 h-5" />}
        />
      </div>
```
> Nota: confirme a assinatura de `StatCard` em `src/components/ui/Card.tsx` (props `title`, `value`, `subtitle`, `icon`). Ajuste os nomes das props caso difiram — mantenha os 4 valores.

- [ ] **Step 5: Verificar build e visual**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: sem erros.
Run manual: `pnpm dev`, abra `/dashboard` → 4 cards aparecem; ao marcar uma conta como paga em `/fixed-bills` e voltar, "Comprometido" diminui e "Disponível" aumenta.

- [ ] **Step 6: Commit**

```bash
git add familia-financas/src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): cards Disponível, Comprometido, Dias restantes e Poupado"
```

---

## Task 6: Página Reunião Semanal (resumo + limites semanais)

**Files:**
- Create: `familia-financas/src/pages/WeeklyReviewPage.tsx`
- Modify: `familia-financas/src/App.tsx`
- Modify: `familia-financas/src/components/layout/DashboardLayout.tsx`

- [ ] **Step 1: Criar a página**

Create `familia-financas/src/pages/WeeklyReviewPage.tsx`:
```tsx
// Reunião Semanal — resumo da semana + limites semanais por categoria variável
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  weeksInMonth,
  weekRange,
  weeklyLimit,
  sumInRange,
  currentWeekOfMonth,
} from '../lib/finance/cashflow';

interface CategoryLimitRow {
  categoryId: string;
  name: string;
  limit: number;
  spent: number;
}

export default function WeeklyReviewPage() {
  const { user } = useAuth();
  const { formatCurrency } = useI18n();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthYear = now.toISOString().slice(0, 7);
  const totalWeeks = weeksInMonth(year, month);

  const [week, setWeek] = useState(currentWeekOfMonth(now.getDate()));
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [spent, setSpent] = useState(0);
  const [savedMonth, setSavedMonth] = useState(0);
  const [rows, setRows] = useState<CategoryLimitRow[]>([]);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, week]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { startISO, endISO } = weekRange(year, month, week);

      // Transações da semana
      const { data: tx } = await supabase
        .from('transactions')
        .select('amount, transaction_type, transaction_date, category_id')
        .eq('user_id', user.id)
        .gte('transaction_date', startISO)
        .lte('transaction_date', endISO);

      const txs = tx || [];
      const weekIncome = txs
        .filter((t: any) => t.transaction_type === 'receita')
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const weekSpent = txs
        .filter((t: any) => t.transaction_type === 'despesa')
        .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      setIncome(weekIncome);
      setSpent(weekSpent);

      // Orçamento ativo do mês → budget_items (allocated) por categoria
      const { data: budget } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .eq('status', 'active')
        .maybeSingle();

      const limitRows: CategoryLimitRow[] = [];
      if (budget?.id) {
        const { data: items } = await supabase
          .from('budget_items')
          .select('allocated_amount, category_id, categories(name, category_type)')
          .eq('budget_id', budget.id);

        for (const it of items || []) {
          const cat: any = (it as any).categories;
          // Limites semanais só para categorias variáveis (não essenciais/poupança/dívida)
          if (cat?.category_type !== 'superfluo' && cat?.category_type !== 'essencial') continue;
          const limit = weeklyLimit(Number((it as any).allocated_amount || 0), totalWeeks);
          const catSpent = sumInRange(
            txs
              .filter((t: any) => t.category_id === (it as any).category_id && t.transaction_type === 'despesa')
              .map((t: any) => ({ transaction_date: t.transaction_date, amount: Number(t.amount || 0) })),
            startISO,
            endISO
          );
          limitRows.push({
            categoryId: (it as any).category_id,
            name: cat?.name || 'Categoria',
            limit,
            spent: catSpent,
          });
        }
      }
      setRows(limitRows);

      // Já poupado no mês = saldo de contas poupança
      const { data: accounts } = await supabase
        .from('accounts')
        .select('current_balance, account_type')
        .eq('user_id', user.id)
        .eq('is_active', true);
      setSavedMonth(
        (accounts || [])
          .filter((a: any) => a.account_type === 'poupanca')
          .reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0)
      );
    } finally {
      setLoading(false);
    }
  };

  const { startISO, endISO } = weekRange(year, month, week);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Reunião Semanal</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Semana {week} ({startISO.slice(8)}–{endISO.slice(8)}) · sem julgamentos, só números
          </p>
        </div>
        <div className="flex gap-xs">
          <Button variant="ghost" onClick={() => setWeek(Math.max(1, week - 1))} disabled={week <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={() => setWeek(Math.min(totalWeeks, week + 1))} disabled={week >= totalWeeks}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard title="Quanto entrou" value={formatCurrency(income)} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard title="Quanto gastámos" value={formatCurrency(spent)} icon={<TrendingDown className="w-5 h-5" />} />
        <StatCard title="Quanto sobrou" value={formatCurrency(income - spent)} icon={<Wallet className="w-5 h-5" />} />
        <StatCard title="Já poupado (mês)" value={formatCurrency(savedMonth)} icon={<Wallet className="w-5 h-5" />} />
      </div>

      <Card>
        <h2 className="text-h4 font-bold text-neutral-900 mb-md">Dentro do orçamento da semana?</h2>
        {rows.length === 0 ? (
          <p className="text-body text-neutral-600">
            Sem orçamento ativo com categorias variáveis neste mês. Crie um orçamento em "Orçamento".
          </p>
        ) : (
          <div className="space-y-md">
            {rows.map((r) => {
              const pct = r.limit > 0 ? Math.min(100, (r.spent / r.limit) * 100) : 0;
              const over = r.spent > r.limit;
              return (
                <div key={r.categoryId}>
                  <div className="flex justify-between text-small mb-xs">
                    <span className="font-medium text-neutral-900">{r.name}</span>
                    <span className={over ? 'text-error-600 font-semibold' : 'text-neutral-600'}>
                      {formatCurrency(r.spent)} / {formatCurrency(r.limit)}
                      {over ? ' ⚠' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={over ? 'h-full bg-error-500' : 'h-full bg-success-500'}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Registrar a rota**

Em `familia-financas/src/App.tsx`, adicione o import:
```tsx
import WeeklyReviewPage from './pages/WeeklyReviewPage';
```
E adicione a rota após `/income-calendar`:
```tsx
          <Route
            path="/weekly-review"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WeeklyReviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
```

- [ ] **Step 3: Adicionar item de menu**

Em `familia-financas/src/components/layout/DashboardLayout.tsx`, no array de navegação, após o item `/income-calendar`, adicione:
```tsx
    { path: '/weekly-review', label: 'Reunião Semanal', icon: CalendarCheck },
```
Adicione `CalendarCheck` ao import de `lucide-react` no topo do arquivo se ainda não estiver presente.

- [ ] **Step 4: Verificar build e fluxo manual**

Run: `cd familia-financas && pnpm exec tsc -b --noEmit`
Expected: sem erros.
Run manual: `pnpm dev`, abra `/weekly-review` → 4 cards de resumo + barras por categoria variável; navegação de semana muda os números; categoria acima do limite mostra barra vermelha e ⚠.

- [ ] **Step 5: Commit**

```bash
git add familia-financas/src/pages/WeeklyReviewPage.tsx familia-financas/src/App.tsx familia-financas/src/components/layout/DashboardLayout.tsx
git commit -m "feat(ui): página Reunião Semanal com limites semanais por categoria"
```

---

## Self-Review (preenchido)

**Cobertura da spec:**
- Disponível vs Comprometido → Task 2 (cálculo) + Task 5 (cards). ✓
- Contas Fixas com vencimento + pago/por pagar → Task 1 (schema) + Task 4 (página). ✓
- Limites semanais (mensal ÷ semanas, blocos de 7 dias) → Task 2 (`weeklyLimit`/`weekRange`) + Task 6 (barras). ✓
- Reunião Semanal (entrou/gastou/sobrou/dentro do orçamento/poupado) → Task 6. ✓
- Seed das contas recomendadas → Task 4 (empty-state CTA). ✓
- RLS multitenant → Task 1. ✓
- Dias restantes no mês → Task 2 (`daysRemaining`) + Task 5. ✓

**Pontos a confirmar durante a execução (não bloqueiam o plano):**
- Assinatura exata de `StatCard` em `src/components/ui/Card.tsx` (props title/value/subtitle/icon) — ajustar nomes se diferir.
- Nome da coluna em `budget_items` (`allocated_amount`) e a relação `categories` no select aninhado do Supabase.
- Ícones `Lock`, `CalendarClock`, `CalendarCheck`, `Receipt` existem em `lucide-react` (todos existem na versão 0.364).

**Consistência de tipos:** funções de `cashflow.ts` usadas em Tasks 5/6 batem com as assinaturas definidas/testadas na Task 2.
