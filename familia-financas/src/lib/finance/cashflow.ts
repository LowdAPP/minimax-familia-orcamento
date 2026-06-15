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
