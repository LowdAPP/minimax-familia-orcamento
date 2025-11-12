// Card Component
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  hover = false, 
  padding = 'lg',
  className = '',
  ...props 
}: CardProps) {
  const paddings = {
    sm: 'p-md',
    md: 'p-lg',
    lg: 'p-lg md:p-xl'
  };
  
  return (
    <div
      className={`
        bg-surface rounded-lg border border-neutral-100 shadow-sm
        ${hover ? 'transition-all duration-base hover:-translate-y-1 hover:shadow-md hover:scale-[1.02]' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat Card variant
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

export function StatCard({ icon, label, value, change }: StatCardProps) {
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-small text-neutral-500 mb-xs">{label}</p>
          <p className="text-subtitle font-bold text-neutral-900">{value}</p>
          {change && (
            <p className={`text-small mt-xs ${change.type === 'increase' ? 'text-success-600' : 'text-error-600'}`}>
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
          {icon}
        </div>
      </div>
    </Card>
  );
}
