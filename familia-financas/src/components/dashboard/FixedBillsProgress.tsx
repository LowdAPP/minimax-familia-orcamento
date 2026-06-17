// Contas fixas do mês: pago vs a pagar (progresso + lista + quanto falta).
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, CalendarClock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface FixedBillItem {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
}

interface FixedBillsProgressProps {
  bills: FixedBillItem[];
  formatCurrency: (value: number) => string;
}

export function FixedBillsProgress({ bills, formatCurrency }: FixedBillsProgressProps) {
  const total = bills.reduce((s, b) => s + b.amount, 0);
  const paid = bills.filter((b) => b.isPaid).reduce((s, b) => s + b.amount, 0);
  const remaining = total - paid;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Pagas primeiro, depois as pendentes (que é o que falta resolver).
  const ordered = [...bills].sort((a, b) => Number(b.isPaid) - Number(a.isPaid));
  const top = ordered.slice(0, 5);

  return (
    <Card>
      <div className="mb-md">
        <h3 className="text-h4 font-bold text-neutral-900">Contas Fixas do Mês</h3>
        <p className="text-small text-neutral-600 mt-xs">Pago vs a pagar</p>
      </div>

      {bills.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-small mb-xs">
            <span className="text-neutral-600">Pago</span>
            <span className="font-bold text-neutral-900">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 mb-md">
            <div className="h-2 rounded-full bg-success-500" style={{ width: `${pct}%` }} />
          </div>

          <ul className="space-y-xs">
            {top.map((bill) => (
              <li key={bill.id} className="flex items-center justify-between text-small">
                <span className="flex items-center gap-xs text-neutral-700">
                  {bill.isPaid ? (
                    <CheckCircle2 className="w-4 h-4 text-success-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300" />
                  )}
                  <span className={bill.isPaid ? 'line-through text-neutral-400' : ''}>{bill.name}</span>
                </span>
                <span className="font-medium text-neutral-900">{formatCurrency(bill.amount)}</span>
              </li>
            ))}
          </ul>
          {ordered.length > top.length && (
            <p className="text-small text-neutral-400 mt-xs">+{ordered.length - top.length} outras</p>
          )}

          <div className="mt-md pt-md border-t border-neutral-200 flex items-center justify-between">
            <span className="text-small text-neutral-600">Falta pagar</span>
            <span className={`text-body font-bold ${remaining > 0 ? 'text-error-600' : 'text-success-600'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </>
      ) : (
        <div className="h-[240px] flex flex-col items-center justify-center text-center text-neutral-500">
          <CalendarClock className="w-12 h-12 mb-sm opacity-50" />
          <p className="text-body">Nenhuma conta fixa cadastrada</p>
          <Link to="/fixed-bills" className="mt-md">
            <Button variant="outline">
              Adicionar Conta Fixa
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
