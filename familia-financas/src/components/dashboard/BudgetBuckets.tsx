// Orçamento 50/30/20 — gasto real vs meta por bucket (Necessidades/Desejos/Poupança).
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface Bucket {
  label: string;
  spent: number;
  targetPct: number; // 50 | 30 | 20
}

interface BudgetBucketsProps {
  buckets: Bucket[];
  income: number;
  formatCurrency: (value: number) => string;
}

export function BudgetBuckets({ buckets, income, formatCurrency }: BudgetBucketsProps) {
  const hasData = income > 0;

  return (
    <Card>
      <div className="mb-md">
        <h3 className="text-h4 font-bold text-neutral-900">Orçamento 50/30/20</h3>
        <p className="text-small text-neutral-600 mt-xs">Gasto real vs meta deste mês</p>
      </div>

      {hasData ? (
        <div className="space-y-md">
          {buckets.map((b) => {
            const realPct = income > 0 ? (b.spent / income) * 100 : 0;
            const over = realPct > b.targetPct;
            const barWidth = Math.min(realPct, 100);
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-small mb-xs">
                  <span className="text-neutral-600">
                    {b.label} · meta {b.targetPct}%
                  </span>
                  <span className={`font-bold ${over ? 'text-error-600' : 'text-neutral-900'}`}>
                    {Math.round(realPct)}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-neutral-200">
                  <div
                    className={`h-2 rounded-full ${over ? 'bg-error-500' : 'bg-success-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* marcador da meta */}
                  <div
                    className="absolute top-[-2px] h-3 w-0.5 bg-neutral-400"
                    style={{ left: `${Math.min(b.targetPct, 100)}%` }}
                    title={`Meta ${b.targetPct}%`}
                  />
                </div>
                <p className="text-small text-neutral-500 mt-xs">
                  {formatCurrency(b.spent)} de {formatCurrency((income * b.targetPct) / 100)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[240px] flex flex-col items-center justify-center text-center text-neutral-500">
          <p className="text-body">Configure seu orçamento para acompanhar a regra 50/30/20</p>
          <Link to="/budget" className="mt-md">
            <Button variant="outline">
              Configurar Orçamento
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
