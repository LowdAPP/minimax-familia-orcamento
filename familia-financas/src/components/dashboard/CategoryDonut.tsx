// Donut de despesas por categoria do mês, com total no centro e legenda.
import { Link } from 'react-router-dom';
import { ArrowRight, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
}

interface CategoryDonutProps {
  data: CategoryExpense[];
  formatCurrency: (value: number) => string;
}

export function CategoryDonut({ data, formatCurrency }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <Card>
      <div className="mb-md">
        <h3 className="text-h4 font-bold text-neutral-900">Despesas por Categoria</h3>
        <p className="text-small text-neutral-600 mt-xs">Distribuição do mês atual</p>
      </div>

      {data.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center gap-md">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <PieChart>
                {/* @ts-ignore */}
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* @ts-ignore */}
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-subtitle font-bold text-neutral-900">{formatCurrency(total)}</span>
              <span className="text-small text-neutral-500">total</span>
            </div>
          </div>

          <ul className="flex-1 space-y-xs w-full">
            {top.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between text-small">
                <span className="flex items-center gap-xs text-neutral-700">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-medium text-neutral-900">{formatCurrency(entry.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <PieIcon className="w-12 h-12 mx-auto mb-sm opacity-50" />
            <p className="text-body">Nenhuma despesa registrada</p>
            <p className="text-small mt-xs">Comece importando seus extratos</p>
          </div>
        </div>
      )}

      <div className="mt-md pt-md border-t border-neutral-200">
        <Link to="/budget">
          <Button variant="outline" fullWidth>
            Ver Orçamento Completo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
