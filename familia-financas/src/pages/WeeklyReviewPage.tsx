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
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);
      setIncome(weekIncome);
      setSpent(weekSpent);

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
          const catObj = Array.isArray(cat) ? cat[0] : cat;
          if (catObj?.category_type !== 'superfluo' && catObj?.category_type !== 'essencial') continue;
          const limit = weeklyLimit(Number((it as any).allocated_amount || 0), totalWeeks);
          const catSpent = sumInRange(
            txs
              .filter((t: any) => t.category_id === (it as any).category_id && t.transaction_type === 'despesa')
              .map((t: any) => ({ transaction_date: t.transaction_date, amount: Math.abs(Number(t.amount || 0)) })),
            startISO,
            endISO
          );
          limitRows.push({
            categoryId: (it as any).category_id,
            name: catObj?.name || 'Categoria',
            limit,
            spent: catSpent,
          });
        }
      }
      setRows(limitRows);

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
        <StatCard label="Quanto entrou" value={formatCurrency(income)} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Quanto gastámos" value={formatCurrency(spent)} icon={<TrendingDown className="w-5 h-5" />} />
        <StatCard label="Quanto sobrou" value={formatCurrency(income - spent)} icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Já poupado (mês)" value={formatCurrency(savedMonth)} icon={<Wallet className="w-5 h-5" />} />
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
