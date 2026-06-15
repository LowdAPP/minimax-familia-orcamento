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
  monthRange,
  sumAbsByCategory,
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
