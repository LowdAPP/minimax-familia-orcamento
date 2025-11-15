// MonthPicker Component - Month/Year Picker
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from './Button';

interface MonthPickerProps {
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? new Date(value + '-01') : new Date();
  const [currentYear, setCurrentYear] = useState(getYear(selectedDate));

  // Gerar meses do ano atual
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const handleMonthSelect = (month: Date) => {
    const monthString = format(month, 'yyyy-MM');
    onChange(monthString);
    setIsOpen(false);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          className={`
            flex items-center gap-2 h-12 px-sm rounded-base border border-neutral-200 
            bg-white hover:bg-neutral-50 hover:border-primary-300 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            transition-colors text-body text-neutral-700
            ${className}
          `}
        >
          <CalendarIcon className="w-4 h-4 text-neutral-400" />
          <span className="flex-1 text-left">
            {value ? format(new Date(value + '-01'), "MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione o mês'}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="
            bg-white rounded-lg shadow-lg border border-neutral-200 p-md
            w-[320px] z-50
            animate-in fade-in-0 zoom-in-95 duration-200
          "
          sideOffset={5}
        >
          {/* Header com navegação de anos */}
          <div className="flex items-center justify-between mb-md pb-md border-b border-neutral-200">
            <button
              onClick={() => handleYearChange('prev')}
              className="p-xs hover:bg-neutral-100 rounded-base transition-colors"
              aria-label="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-600" />
            </button>
            
            <h3 className="text-body font-semibold text-neutral-900">
              {currentYear}
            </h3>
            
            <button
              onClick={() => handleYearChange('next')}
              className="p-xs hover:bg-neutral-100 rounded-base transition-colors"
              aria-label="Próximo ano"
            >
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-3 gap-xs">
            {months.map((month) => {
              const monthString = format(month, 'yyyy-MM');
              const isSelected = value === monthString;
              const isCurrentMonth = format(new Date(), 'yyyy-MM') === monthString;

              return (
                <button
                  key={monthString}
                  onClick={() => handleMonthSelect(month)}
                  className={`
                    h-12 px-sm rounded-base text-small font-medium transition-all
                    ${isSelected
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
                    }
                    ${isCurrentMonth && !isSelected
                      ? 'ring-2 ring-primary-200'
                      : ''
                    }
                  `}
                >
                  {monthNames[month.getMonth()]}
                </button>
              );
            })}
          </div>

          {/* Botões de ação rápida */}
          <div className="flex gap-xs mt-md pt-md border-t border-neutral-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = format(new Date(), 'yyyy-MM');
                onChange(today);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM');
                onChange(lastMonth);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Mês Anterior
            </Button>
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

