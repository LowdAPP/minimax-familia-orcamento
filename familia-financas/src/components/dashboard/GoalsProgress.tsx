// Progresso das metas de poupança (current vs target).
import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface GoalProgress {
  id: string;
  name: string;
  current: number;
  target: number;
}

interface GoalsProgressProps {
  goals: GoalProgress[];
  formatCurrency: (value: number) => string;
}

const BAR_COLORS = ['#0066FF', '#00C853', '#FF6B00', '#9C27B0'];

export function GoalsProgress({ goals, formatCurrency }: GoalsProgressProps) {
  return (
    <Card>
      <div className="mb-md">
        <h3 className="text-h4 font-bold text-neutral-900">Progresso das Metas</h3>
        <p className="text-small text-neutral-600 mt-xs">Suas metas de poupança</p>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-md">
          {goals.map((goal, index) => {
            const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between text-small mb-xs">
                  <span className="text-neutral-700 font-medium truncate pr-sm">{goal.name}</span>
                  <span className="text-neutral-900 font-bold">{Math.round(pct)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${pct}%`, background: BAR_COLORS[index % BAR_COLORS.length] }}
                  />
                </div>
                <p className="text-small text-neutral-500 mt-xs">
                  {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[240px] flex flex-col items-center justify-center text-center text-neutral-500">
          <Target className="w-12 h-12 mb-sm opacity-50" />
          <p className="text-body">Nenhuma meta criada ainda</p>
          <Link to="/goals" className="mt-md">
            <Button variant="outline">
              Criar Meta
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
