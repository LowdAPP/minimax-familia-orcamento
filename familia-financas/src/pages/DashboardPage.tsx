// Página de Dashboard - Hub Principal
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Upload,
  Target,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
}

interface CategoryExpense {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_type: 'receita' | 'despesa';
  transaction_date: string;
  category_name?: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

const COLORS = ['#0066FF', '#00C853', '#FF6B00', '#FFD600', '#9C27B0', '#00BCD4', '#F44336'];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { t, formatCurrency, setLanguage, loadUserLanguage, language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0
  });
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Carregar preferência de idioma do usuário quando o perfil for carregado
  useEffect(() => {
    if (profile && profile.preferred_language && profile.preferred_language !== language) {
      loadUserLanguage(profile.preferred_language);
    }
  }, [profile, language, loadUserLanguage]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadCategoryExpenses(),
        loadRecentTransactions(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [year, month] = currentMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

    // Carregar contas
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      console.error('Erro ao carregar contas:', accountsError);
    }

    const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

    // Carregar transações do mês
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', user.id)
      .gte('transaction_date', `${currentMonth}-01`)
      .lte('transaction_date', endDate);

    if (transactionsError) {
      console.error('Erro ao carregar transações:', transactionsError);
    }

    const monthlyIncome = transactions
      ?.filter(t => t.transaction_type === 'receita')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const monthlyExpenses = transactions
      ?.filter(t => t.transaction_type === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0;

    setStats({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savings: monthlyIncome - monthlyExpenses
    });
  };

  const loadCategoryExpenses = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [year, month] = currentMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories (name, color)
      `)
      .eq('user_id', user.id)
      .eq('transaction_type', 'despesa')
      .gte('transaction_date', `${currentMonth}-01`)
      .lte('transaction_date', endDate);

    if (error) {
      console.error('Erro ao carregar despesas por categoria:', error);
      setCategoryExpenses([]);
      return;
    }

    if (!data || data.length === 0) {
      setCategoryExpenses([]);
      return;
    }

    // Agrupar por categoria
    const categoryMap = new Map<string, number>();
    data.forEach((transaction: any) => {
      const categoryName = transaction.categories?.name || 'Outros';
      const currentValue = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentValue + Math.abs(transaction.amount));
    });

    const expenses: CategoryExpense[] = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    setCategoryExpenses(expenses);
  };

  const loadRecentTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        transaction_type,
        transaction_date,
        categories (name)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Erro ao carregar transações recentes:', error);
      setRecentTransactions([]);
      return;
    }

    if (!data || data.length === 0) {
      setRecentTransactions([]);
      return;
    }

    setRecentTransactions(
      data.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
        category_name: t.categories?.name
      }))
    );
  };

  const loadAlerts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!data || data.length === 0) {
      // Alertas mock baseados nos dados
      const mockAlerts: Alert[] = [];

      if (stats.monthlyExpenses > stats.monthlyIncome * 0.9) {
        const alertTitle = language === 'pt-PT' ? 'Atenção: Orçamento próximo do limite' : 'Atenção: Orçamento próximo do limite';
        const alertMessage = language === 'pt-PT' 
          ? `Já gastou ${formatCurrency(stats.monthlyExpenses)} de ${formatCurrency(stats.monthlyIncome)} este mês.`
          : `Você já gastou ${formatCurrency(stats.monthlyExpenses)} de ${formatCurrency(stats.monthlyIncome)} este mês.`;
        
        mockAlerts.push({
          id: '1',
          type: 'warning',
          title: alertTitle,
          message: alertMessage
        });
      }

      if (stats.savings > 0) {
        const successMessage = language === 'pt-PT' 
          ? `Conseguiu economizar ${formatCurrency(stats.savings)} este mês.`
          : `Você conseguiu economizar ${formatCurrency(stats.savings)} este mês.`;
          
        mockAlerts.push({
          id: '2',
          type: 'success',
          title: 'Parabéns! Você está economizando',
          message: successMessage
        });
      }

      mockAlerts.push({
        id: '3',
        type: 'info',
        title: 'Dica: Importe seus extratos',
        message: 'Faça upload dos seus extratos bancários para categorização automática.'
      });

      setAlerts(mockAlerts);
      return;
    }

    setAlerts(
      data.map((a: any) => ({
        id: a.id,
        type: a.alert_type === 'spending_limit' ? 'warning' : a.alert_type === 'goal_achieved' ? 'success' : 'info',
        title: a.alert_title,
        message: a.message
      }))
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800';
      default:
        return 'bg-info-50 border-info-200 text-info-800';
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">
            Olá, {user?.email?.split('@')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-body text-neutral-600 mt-xs">
            Aqui está um resumo das suas finanças
          </p>
        </div>
        <div className="flex gap-sm">
          <Link to="/transactions">
            <Button variant="secondary" size="md">
              <Upload className="w-4 h-4" />
              Importar PDF
            </Button>
          </Link>
          <Link to="/goals">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4" />
              Nova Meta
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label={t('dashboard.totalBalance')}
          value={formatCurrency(stats.totalBalance)}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('dashboard.monthlyIncome')}
          value={formatCurrency(stats.monthlyIncome)}
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label={t('dashboard.monthlyExpenses')}
          value={formatCurrency(stats.monthlyExpenses)}
        />
        <StatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label={t('dashboard.savings')}
          value={formatCurrency(stats.savings)}
          change={
            stats.savings > 0
              ? { value: Math.round((stats.savings / stats.monthlyIncome) * 100), type: 'increase' }
              : undefined
          }
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-sm">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-sm p-md rounded-base border ${getAlertStyles(alert.type)}`}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="font-semibold text-body">{alert.title}</p>
                <p className="text-small mt-xs opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Despesas por Categoria */}
        <Card>
          <div className="mb-md">
            <h3 className="text-h4 font-bold text-neutral-900">Despesas por Categoria</h3>
            <p className="text-small text-neutral-600 mt-xs">Distribuição do mês atual</p>
          </div>

          {categoryExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {/* @ts-ignore */}
              <PieChart>
                {/* @ts-ignore */}
                <Pie
                  data={categoryExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* @ts-ignore */}
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-sm opacity-50" />
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

        {/* Transações Recentes */}
        <Card>
          <div className="mb-md">
            <h3 className="text-h4 font-bold text-neutral-900">Transações Recentes</h3>
            <p className="text-small text-neutral-600 mt-xs">Últimas movimentações</p>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-sm">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-sm rounded-base bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-body font-medium text-neutral-900">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-xs mt-xs">
                      <span className="text-small text-neutral-500">
                        {formatDate(transaction.transaction_date)}
                      </span>
                      {transaction.category_name && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <span className="text-small text-neutral-500">
                            {transaction.category_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-body font-bold ${
                      transaction.transaction_type === 'receita'
                        ? 'text-success-600'
                        : 'text-error-600'
                    }`}
                  >
                    {transaction.transaction_type === 'receita' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-sm opacity-50" />
                <p className="text-body">Nenhuma transação registrada</p>
                <p className="text-small mt-xs">Adicione sua primeira transação</p>
              </div>
            </div>
          )}

          <div className="mt-md pt-md border-t border-neutral-200">
            <Link to="/transactions">
              <Button variant="outline" fullWidth>
                Ver Todas as Transações
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-h4 font-bold text-neutral-900 mb-md">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Link to="/transactions" className="block">
            <div className="p-md rounded-base border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-all group">
              <Upload className="w-6 h-6 text-primary-500 mb-sm" />
              <p className="text-body font-semibold text-neutral-900 group-hover:text-primary-600">
                Importar Extrato
              </p>
              <p className="text-small text-neutral-600 mt-xs">
                Upload de PDF bancário
              </p>
            </div>
          </Link>

          <Link to="/budget" className="block">
            <div className="p-md rounded-base border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-all group">
              <PieChart className="w-6 h-6 text-primary-500 mb-sm" />
              <p className="text-body font-semibold text-neutral-900 group-hover:text-primary-600">
                Ajustar Orçamento
              </p>
              <p className="text-small text-neutral-600 mt-xs">
                Configure suas metas de gastos
              </p>
            </div>
          </Link>

          <Link to="/goals" className="block">
            <div className="p-md rounded-base border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-all group">
              <Target className="w-6 h-6 text-primary-500 mb-sm" />
              <p className="text-body font-semibold text-neutral-900 group-hover:text-primary-600">
                Definir Meta
              </p>
              <p className="text-small text-neutral-600 mt-xs">
                Crie objetivos financeiros
              </p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
