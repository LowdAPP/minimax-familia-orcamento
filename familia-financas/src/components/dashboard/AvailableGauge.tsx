// Gauge: Disponível vs Comprometido — quanto do mês ainda está livre.
import { Card } from '../ui/Card';

interface AvailableGaugeProps {
  available: number;
  committed: number;
  formatCurrency: (value: number) => string;
}

export function AvailableGauge({ available, committed, formatCurrency }: AvailableGaugeProps) {
  const total = available + committed;
  const ratio = total > 0 ? Math.max(0, Math.min(available / total, 1)) : 0;
  const pctLabel = Math.round(ratio * 100);

  // Semicírculo: raio 72, centro (100, 90), de 180° a 0°.
  const r = 72;
  const halfCirc = Math.PI * r; // comprimento do arco do semicírculo
  const filled = halfCirc * ratio;

  return (
    <Card>
      <div className="mb-md">
        <h3 className="text-h4 font-bold text-neutral-900">Disponível vs Comprometido</h3>
        <p className="text-small text-neutral-600 mt-xs">Quanto do mês ainda está livre</p>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 200 110" width="100%" height="180" style={{ maxWidth: 280 }}>
          {/* trilho */}
          <path
            d="M28,90 A72,72 0 0 1 172,90"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* preenchido (disponível) */}
          <path
            d="M28,90 A72,72 0 0 1 172,90"
            fill="none"
            stroke="#0066FF"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${halfCirc}`}
          />
          <text x="100" y="78" textAnchor="middle" className="fill-neutral-900" fontSize="28" fontWeight="800">
            {pctLabel}%
          </text>
          <text x="100" y="98" textAnchor="middle" fill="#6B7280" fontSize="11">
            {formatCurrency(available)} livres
          </text>
        </svg>
      </div>

      <div className="mt-md flex items-center justify-center gap-md text-small">
        <span className="flex items-center gap-xs text-neutral-600">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#0066FF' }} />
          Disponível {formatCurrency(available)}
        </span>
        <span className="flex items-center gap-xs text-neutral-600">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#E5E7EB' }} />
          Comprometido {formatCurrency(committed)}
        </span>
      </div>
    </Card>
  );
}
