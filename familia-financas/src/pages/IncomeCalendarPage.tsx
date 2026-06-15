// Página: Calendário de Receitas
// Mostra padrões de receitas e previsões futuras em formato de calendário

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { useAlert } from '../hooks/useAlert';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface IncomePattern {
  source: string;
  frequency: string;
  predictability: string;
  avg_interval_days: number;
  avg_amount: number;
  occurrences: number;
  typical_day: number | null;
  last_date: string;
  category: string;
}

interface IncomePrediction {
  date: string;
  source: string;
  predicted_amount: number;
  confidence: number;
  category: string;
  frequency: string;
}

interface IncomeMetrics {
  total_income_analyzed: number;
  avg_monthly_income: number;
  predictable_monthly_income: number;
  irregular_monthly_income: number;
  income_variability: number;
  predictability_score: number;
  total_patterns_found: number;
  high_predictability_sources: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  predictions: IncomePrediction[];
  totalAmount: number;
}

const CATEGORY_COLORS = {
  salario: '#0066FF',
  freelance: '#FF6B00',
  aluguel: '#9C27B0',
  investimentos: '#00C853',
  outros: '#666666',
};

const CATEGORY_LABELS = {
  salario: 'Salário',
  freelance: 'Freelance',
  aluguel: 'Aluguel',
  investimentos: 'Investimentos',
  outros: 'Outros',
};

export default function IncomeCalendarPage() {
  const { user } = useAuth();
  const { formatCurrency } = useI18n();
  const { showAlert, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [patterns, setPatterns] = useState<IncomePattern[]>([]);
  const [predictions, setPredictions] = useState<IncomePrediction[]>([]);
  const [metrics, setMetrics] = useState<IncomeMetrics | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    if (user) {
      analyzeIncomePatterns();
    }
  }, [user]);

  const analyzeIncomePatterns = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('income-pattern-analyzer', {
        body: {
          user_id: user?.id,
          months_to_analyze: 6,
          months_to_predict: 3,
        },
      });

      if (error) throw error;

      if (data?.data) {
        setPatterns(data.data.patterns || []);
        setPredictions(data.data.predictions || []);
        setMetrics(data.data.metrics || null);
      }
    } catch (error) {
      console.error('Erro ao analisar padrões:', error);
      showAlert({
        type: 'error',
        title: 'Erro na Análise',
        message: 'Não foi possível analisar seus padrões de receita. Verifique sua conexão e tente novamente.',
      });
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayPredictions = predictions.filter(p => p.date === dateStr);
      const totalAmount = dayPredictions.reduce((sum, p) => sum + p.predicted_amount, 0);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        predictions: dayPredictions,
        totalAmount,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getTotalPredictedForMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return predictions
      .filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === year && pDate.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.predicted_amount, 0);
  };

  const calculateAvailableToSpend = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const upcomingIncome = predictions
      .filter(p => {
        const pDate = new Date(p.date);
        return pDate >= today && pDate <= endOfMonth;
      })
      .reduce((sum, p) => sum + p.predicted_amount, 0);
    
    return upcomingIncome;
  };

  const getNextIncomeDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextIncome = predictions.find(p => p.date > today);
    return nextIncome;
  };

  const getBestDaysToSpend = () => {
    // Dias logo após receitas previstas de alta confiança
    const highConfidenceDates = predictions
      .filter(p => p.confidence >= 0.8 && new Date(p.date) > new Date())
      .slice(0, 3)
      .map(p => {
        const date = new Date(p.date);
        date.setDate(date.getDate() + 1); // Dia seguinte à receita
        return {
          date: date.toISOString().split('T')[0],
          reason: `Após ${p.source} (${formatCurrency(p.predicted_amount)})`,
        };
      });
    
    return highConfidenceDates;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const nextIncome = getNextIncomeDate();
  const bestDays = getBestDaysToSpend();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <AlertComponent />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Calendário de Receitas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Previsão inteligente de entradas e sugestões de gastos
          </p>
        </div>
        <Button
          variant="primary"
          onClick={analyzeIncomePatterns}
          loading={analyzing}
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar Análise
        </Button>
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <Card padding="md">
            <div className="flex items-center gap-sm mb-xs">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-small text-neutral-600">Renda Mensal Média</p>
            </div>
            <p className="text-h3 font-bold text-neutral-900">
              {formatCurrency(metrics.avg_monthly_income)}
            </p>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-sm mb-xs">
              <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <p className="text-small text-neutral-600">Renda Previsível</p>
            </div>
            <p className="text-h3 font-bold text-success-700">
              {formatCurrency(metrics.predictable_monthly_income)}
            </p>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-sm mb-xs">
              <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning-600" />
              </div>
              <p className="text-small text-neutral-600">Renda Irregular</p>
            </div>
            <p className="text-h3 font-bold text-warning-700">
              {formatCurrency(metrics.irregular_monthly_income)}
            </p>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-sm mb-xs">
              <div className="w-10 h-10 rounded-full bg-info-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-info-600" />
              </div>
              <p className="text-small text-neutral-600">Previsibilidade</p>
            </div>
            <p className="text-h3 font-bold text-info-700">
              {Math.round(metrics.predictability_score * 100)}%
            </p>
          </Card>
        </div>
      )}

      {/* Alertas e Sugestões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {/* Próxima Receita */}
        {nextIncome && (
          <Card>
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-body-large font-bold text-neutral-900 mb-xs">
                  Próxima Receita Prevista
                </h3>
                <p className="text-small text-neutral-600 mb-sm">
                  {new Date(nextIncome.date).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <div className="flex items-center justify-between p-sm bg-success-50 rounded-base">
                  <span className="text-small text-success-700">{nextIncome.source}</span>
                  <span className="text-body-large font-bold text-success-700">
                    {formatCurrency(nextIncome.predicted_amount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Disponível para Gastar */}
        <Card>
          <div className="flex items-start gap-md">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-body-large font-bold text-neutral-900 mb-xs">
                Disponível até o Fim do Mês
              </h3>
              <p className="text-small text-neutral-600 mb-sm">
                Baseado nas receitas previstas
              </p>
              <div className="p-sm bg-primary-50 rounded-base">
                <span className="text-h3 font-bold text-primary-700">
                  {formatCurrency(calculateAvailableToSpend())}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Melhores Dias para Gastar */}
      {bestDays.length > 0 && (
        <Card>
          <h3 className="text-h4 font-bold text-neutral-900 mb-md flex items-center gap-sm">
            <CheckCircle className="w-5 h-5 text-success-500" />
            Melhores Dias para Realizar Gastos
          </h3>
          <div className="space-y-sm">
            {bestDays.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-md bg-success-50 rounded-base border border-success-200"
              >
                <div className="flex items-center gap-md">
                  <span className="text-body-large font-bold text-success-700">
                    {new Date(day.date).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <ArrowRight className="w-4 h-4 text-success-500" />
                  <span className="text-small text-success-700">{day.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendário Visual */}
      <Card>
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-h4 font-bold text-neutral-900 flex items-center gap-sm">
            <CalendarIcon className="w-5 h-5" />
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-xs">
            <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="mb-sm">
          <p className="text-small text-neutral-600">
            Total previsto para o mês:{' '}
            <span className="font-bold text-primary-600">
              {formatCurrency(getTotalPredictedForMonth())}
            </span>
          </p>
        </div>

        {/* Grid do Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cabeçalho dos dias da semana */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-small font-semibold text-neutral-600 p-2"
            >
              {day}
            </div>
          ))}

          {/* Dias do calendário */}
          {calendarDays.map((day, index) => {
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const hasIncome = day.predictions.length > 0;

            return (
              <button
                key={index}
                onClick={() => hasIncome ? setSelectedDay(day) : null}
                className={`
                  min-h-[80px] p-2 rounded-base text-left transition-all
                  ${!day.isCurrentMonth ? 'opacity-30' : ''}
                  ${isToday ? 'ring-2 ring-primary-500' : ''}
                  ${hasIncome ? 'bg-success-50 hover:bg-success-100 cursor-pointer border-2 border-success-300' : 'bg-neutral-50 hover:bg-neutral-100'}
                `}
              >
                <div className="text-small font-semibold text-neutral-900 mb-xs">
                  {day.date.getDate()}
                </div>
                {hasIncome && (
                  <div className="space-y-xs">
                    {day.predictions.slice(0, 2).map((pred, i) => (
                      <div
                        key={i}
                        className="text-xs p-1 rounded"
                        style={{
                          backgroundColor: CATEGORY_COLORS[pred.category] + '20',
                          color: CATEGORY_COLORS[pred.category],
                        }}
                      >
                        {formatCurrency(pred.predicted_amount)}
                      </div>
                    ))}
                    {day.predictions.length > 2 && (
                      <div className="text-xs text-neutral-600">
                        +{day.predictions.length - 2} mais
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-md pt-md border-t border-neutral-200">
          <p className="text-small font-semibold text-neutral-700 mb-sm">Legenda:</p>
          <div className="flex flex-wrap gap-md">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-xs">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: CATEGORY_COLORS[key] }}
                />
                <span className="text-small text-neutral-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Padrões Identificados */}
      {patterns.length > 0 && (
        <Card>
          <h3 className="text-h4 font-bold text-neutral-900 mb-md">
            Padrões de Receita Identificados
          </h3>
          <div className="space-y-sm">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className="p-md bg-neutral-50 rounded-base flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-body font-semibold text-neutral-900">
                    {pattern.source}
                  </p>
                  <div className="flex items-center gap-md mt-xs flex-wrap">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[pattern.category] + '20',
                        color: CATEGORY_COLORS[pattern.category],
                      }}
                    >
                      {CATEGORY_LABELS[pattern.category]}
                    </span>
                    <span className="text-small text-neutral-600 capitalize">
                      Frequência: {pattern.frequency}
                    </span>
                    <span
                      className={`text-small px-2 py-1 rounded ${
                        pattern.predictability === 'alta'
                          ? 'bg-success-100 text-success-700'
                          : pattern.predictability === 'media'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-error-100 text-error-700'
                      }`}
                    >
                      Previsibilidade: {pattern.predictability}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-body-large font-bold text-neutral-900">
                    {formatCurrency(pattern.avg_amount)}
                  </p>
                  <p className="text-small text-neutral-600">
                    {pattern.occurrences} ocorrências
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal: Detalhes do Dia */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50"
          onClick={() => setSelectedDay(null)}
        >
          <Card
            className="max-w-lg w-full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-h4 font-bold text-neutral-900">
                {selectedDay.date.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
                Fechar
              </Button>
            </div>

            <div className="space-y-sm">
              {selectedDay.predictions.map((pred, index) => (
                <div
                  key={index}
                  className="p-md rounded-base"
                  style={{
                    backgroundColor: CATEGORY_COLORS[pred.category] + '10',
                    borderLeft: `4px solid ${CATEGORY_COLORS[pred.category]}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-xs">
                    <p className="text-body font-semibold text-neutral-900">
                      {pred.source}
                    </p>
                    <p className="text-body-large font-bold" style={{ color: CATEGORY_COLORS[pred.category] }}>
                      {formatCurrency(pred.predicted_amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-md text-small text-neutral-600">
                    <span className="capitalize">{CATEGORY_LABELS[pred.category]}</span>
                    <span>•</span>
                    <span>Confiança: {Math.round(pred.confidence * 100)}%</span>
                    <span>•</span>
                    <span className="capitalize">{pred.frequency}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-md pt-md border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-neutral-700">
                  Total do dia:
                </span>
                <span className="text-h4 font-bold text-primary-600">
                  {formatCurrency(selectedDay.totalAmount)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Estado vazio */}
      {patterns.length === 0 && !analyzing && (
        <Card>
          <div className="text-center py-xl">
            <CalendarIcon className="w-16 h-16 text-neutral-300 mx-auto mb-md" />
            <p className="text-body text-neutral-600 mb-xs">
              Nenhum padrão de receita identificado
            </p>
            <p className="text-small text-neutral-500 mb-md">
              Adicione mais transações de receita para que possamos identificar padrões
            </p>
            <Button variant="primary" onClick={analyzeIncomePatterns}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
