// Página de Dashboard - Hub Principal
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import type { FixedBill, FixedBillPayment } from '../lib/supabase';
import { committedAmount, availableAmount, daysRemaining, monthRange, sumAbsByCategory } from '../lib/finance/cashflow';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FixedBillsProgress, type FixedBillItem } from '../components/dashboard/FixedBillsProgress';
import { BudgetBuckets, type Bucket } from '../components/dashboard/BudgetBuckets';
import { CategoryDonut } from '../components/dashboard/CategoryDonut';
import { GoalsProgress, type GoalProgress } from '../components/dashboard/GoalsProgress';
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Upload,
  Target,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight,
  Lock,
  PieChart,
  X
} from 'lucide-react';

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
  code: string; // Identificador único do tipo de alerta para persistência
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
  const [cashflow, setCashflow] = useState({
    available: 0,
    committed: 0,
    daysLeft: 0,
    savingsBalance: 0,
  });
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [budgetIncome, setBudgetIncome] = useState(0);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBillItem[]>([]);

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
        loadAlerts(),
        loadCashflow(),
        loadBudgetBuckets(),
        loadGoals()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCashflow = async () => {
    if (!user) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    const monthYear = now.toISOString().slice(0, 7);

    const { data: accounts } = await supabase
      .from('accounts')
      .select('current_balance, account_type, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const checking = (accounts || [])
      .filter((a: any) => a.account_type === 'conta_corrente')
      .reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);
    const savingsBalance = (accounts || [])
      .filter((a: any) => a.account_type === 'poupanca')
      .reduce((s: number, a: any) => s + Number(a.current_balance || 0), 0);

    const { data: billsData } = await supabase
      .from('fixed_bills')
      .select('id, name, amount, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    const { data: payData } = await supabase
      .from('fixed_bill_payments')
      .select('fixed_bill_id, is_paid, amount_paid')
      .eq('user_id', user.id)
      .eq('month_year', monthYear);

    const bills = (billsData || []) as FixedBill[];
    const payments = (payData || []) as FixedBillPayment[];
    const committed = committedAmount(bills, payments);

    const paidIds = new Set(payments.filter((p) => p.is_paid).map((p) => p.fixed_bill_id));
    setFixedBills(
      bills.map((b) => ({
        id: b.id,
        name: b.name,
        amount: Number(b.amount) || 0,
        isPaid: paidIds.has(b.id),
      }))
    );

    setCashflow({
      available: availableAmount(checking, committed),
      committed,
      daysLeft: daysRemaining(year, month, day),
      savingsBalance,
    });
  };

  // Orçamento 50/30/20: gasto real por bucket (category_type) no mês atual.
  const loadBudgetBuckets = async () => {
    if (!user) return;
    const now = new Date();
    const { startISO, endISO } = monthRange(now.getFullYear(), now.getMonth() + 1);

    const { data: categories } = await supabase
      .from('categories')
      .select('id, category_type')
      .or(`user_id.eq.${user.id},is_system_category.eq.true`);

    const { data: txns } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'despesa')
      .gte('transaction_date', startISO)
      .lte('transaction_date', endISO);

    const spentByCategory = sumAbsByCategory((txns || []) as any);
    const spentForTypes = (types: string[]) =>
      (categories || [])
        .filter((c: any) => types.includes(c.category_type))
        .reduce((s: number, c: any) => s + (spentByCategory[c.id] || 0), 0);

    setBuckets([
      { label: 'Necessidades', spent: spentForTypes(['essencial', 'divida']), targetPct: 50 },
      { label: 'Desejos', spent: spentForTypes(['superfluo']), targetPct: 30 },
      { label: 'Poupança', spent: spentForTypes(['poupanca']), targetPct: 20 },
    ]);

    const income = Number(profile?.monthly_income) || 0;
    setBudgetIncome(income);
  };

  // Metas de poupança: progresso current vs target.
  const loadGoals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('id, goal_name, current_amount, target_amount, status')
      .eq('user_id', user.id)
      .neq('status', 'cancelled');

    const mapped: GoalProgress[] = (data || []).map((g: any) => ({
      id: g.id,
      name: g.goal_name,
      current: Number(g.current_amount) || 0,
      target: Number(g.target_amount) || 0,
    }));

    // Ordena por % de progresso (desc) e mostra as 4 principais.
    mapped.sort((a, b) => {
      const pa = a.target > 0 ? a.current / a.target : 0;
      const pb = b.target > 0 ? b.current / b.target : 0;
      return pb - pa;
    });
    setGoals(mapped.slice(0, 4));
  };

  const loadStats = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const [year, month] = currentMonth.split('-');
    // Calcular último dia do mês atual corretamente
    // currentMonth vem como "2024-11" (novembro), onde month é "11" (1-12)
    // Em JS, meses são 0-11 (0=janeiro, 11=dezembro)
    // new Date(year, month, 0) retorna o último dia do mês anterior ao especificado
    // Se month é "11" (novembro em formato 1-12), parseInt(month) = 11 (dezembro em JS)
    // new Date(2024, 11, 0) = último dia de novembro ✓
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

    console.log('📅 Período calculado:', {
      currentMonth,
      startDate: `${currentMonth}-01`,
      endDate,
      lastDay
    });

    // Carregar contas ativas
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, current_balance, account_type, nickname')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      console.error('❌ Erro ao carregar contas:', accountsError);
    } else {
      console.log('💳 Contas carregadas:', accounts?.length || 0, accounts);
    }

    const totalBalance = accounts?.reduce((sum, acc) => {
      const balance = parseFloat(acc.current_balance) || 0;
      return sum + balance;
    }, 0) || 0;

    // Carregar TODAS as transações do mês (independente do status)
    // Conforme documentação: transações pendentes também devem ser consideradas
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, transaction_type, status, transaction_date, description')
      .eq('user_id', user.id)
      .gte('transaction_date', `${currentMonth}-01`)
      .lte('transaction_date', endDate)
      .neq('status', 'cancelled'); // Excluir apenas canceladas

    if (transactionsError) {
      console.error('❌ Erro ao carregar transações:', transactionsError);
    } else {
      console.log('💰 Transações carregadas:', transactions?.length || 0);
      console.log('📋 Detalhes das transações:', transactions);
    }

    // Calcular receitas (amount sempre positivo no DB)
    const receitas = transactions?.filter(t => t.transaction_type === 'receita') || [];
    const monthlyIncome = receitas.reduce((sum, t) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

    // Calcular despesas (amount sempre positivo no DB)
    const despesas = transactions?.filter(t => t.transaction_type === 'despesa') || [];
    const monthlyExpenses = despesas.reduce((sum, t) => {
      const amount = parseFloat(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

    const savings = monthlyIncome - monthlyExpenses;

    console.log('📊 Stats calculados:', {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savings,
      receitasCount: receitas.length,
      despesasCount: despesas.length,
      transactionsCount: transactions?.length || 0,
      accountsCount: accounts?.length || 0
    });

    setStats({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savings
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
        category_id
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

    // Buscar categorias se houver category_id
    const categoryIds = [...new Set(data.map((t: any) => t.category_id).filter(Boolean))];
    const categoriesMap = new Map<string, { name: string; color: string }>();
    
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, color')
        .in('id', categoryIds);
      
      if (categories) {
        categories.forEach((cat: any) => {
          categoriesMap.set(cat.id, { name: cat.name, color: cat.color || COLORS[0] });
        });
      }
    }

    // Agrupar por categoria
    const categoryMap = new Map<string, number>();
    data.forEach((transaction: any) => {
      const category = transaction.category_id ? categoriesMap.get(transaction.category_id) : null;
      const categoryName = category?.name || 'Outros';
      const currentValue = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentValue + Math.abs(transaction.amount));
    });

    const expenses: CategoryExpense[] = Array.from(categoryMap.entries()).map(([name, value], index) => {
      // Encontrar cor da categoria se existir
      const category = Array.from(categoriesMap.values()).find(c => c.name === name);
      return {
        name,
        value,
        color: category?.color || COLORS[index % COLORS.length]
      };
    });

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
        category_id
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

    // Buscar categorias se houver category_id
    const categoryIds = [...new Set(data.map((t: any) => t.category_id).filter(Boolean))];
    const categoriesMap = new Map<string, string>();
    
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);
      
      if (categories) {
        categories.forEach((cat: any) => {
          categoriesMap.set(cat.id, cat.name);
        });
      }
    }

    setRecentTransactions(
      data.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
        category_name: t.category_id ? categoriesMap.get(t.category_id) : undefined
      }))
    );
  };

  const loadAlerts = async () => {
    if (!user) return;

    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    console.log('🔍 Carregando alertas para:', currentMonthYear);

    // 1. Buscar alertas dispensados neste mês
    const { data: acknowledgments, error: ackError } = await supabase
      .from('alert_acknowledgments')
      .select('alert_type')
      .eq('user_id', user.id)
      .eq('month_year', currentMonthYear);

    if (ackError) {
      console.error('❌ Erro ao carregar alertas dispensados:', ackError);
    } else {
      console.log('✅ Alertas dispensados:', acknowledgments);
    }

    const dismissedTypes = new Set(acknowledgments?.map(a => a.alert_type) || []);
    console.log('🗑️ Tipos dispensados:', Array.from(dismissedTypes));

    // 2. Buscar alertas configurados no banco
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    const finalAlerts: Alert[] = [];

    // Processar alertas do banco
    if (data && data.length > 0) {
      data.forEach((a: any) => {
        if (!dismissedTypes.has(a.alert_type)) {
          finalAlerts.push({
            id: a.id,
            type: a.alert_type === 'spending_limit' ? 'warning' : a.alert_type === 'goal_achieved' ? 'success' : 'info',
            title: a.alert_title,
            message: a.message,
            code: a.alert_type
          });
        }
      });
    }

    // 3. Gerar alertas mocks (apenas se não tiver alertas suficientes do banco ou complementar)
    if (finalAlerts.length < 3) { // Se tiver espaço para mais alertas
      
      // Mock 1: Orçamento Limite
      if (!dismissedTypes.has('spending_limit_warning') && stats.monthlyExpenses > stats.monthlyIncome * 0.9 && stats.monthlyIncome > 0) {
        const alertTitle = language === 'pt-PT' ? 'Atenção: Orçamento próximo do limite' : 'Atenção: Orçamento próximo do limite';
        const alertMessage = language === 'pt-PT' 
          ? `Já gastou ${formatCurrency(stats.monthlyExpenses)} de ${formatCurrency(stats.monthlyIncome)} este mês.`
          : `Você já gastou ${formatCurrency(stats.monthlyExpenses)} de ${formatCurrency(stats.monthlyIncome)} este mês.`;
        
        finalAlerts.push({
          id: 'mock-1',
          type: 'warning',
          title: alertTitle,
          message: alertMessage,
          code: 'spending_limit_warning'
        });
      }

      // Mock 2: Economia
      if (!dismissedTypes.has('savings_success') && stats.savings > 0) {
        const successMessage = language === 'pt-PT' 
          ? `Conseguiu economizar ${formatCurrency(stats.savings)} este mês.`
          : `Você conseguiu economizar ${formatCurrency(stats.savings)} este mês.`;
          
        finalAlerts.push({
          id: 'mock-2',
          type: 'success',
          title: 'Parabéns! Você está economizando',
          message: successMessage,
          code: 'savings_success'
        });
      }

      // Mock 3: Dica
      if (!dismissedTypes.has('import_tip_info')) {
        finalAlerts.push({
          id: 'mock-3',
          type: 'info',
          title: 'Dica: Importe seus extratos',
          message: 'Faça upload dos seus extratos bancários para categorização automática.',
          code: 'import_tip_info'
        });
      }
    }

    console.log('📢 Alertas finais:', finalAlerts);
    setAlerts(finalAlerts.slice(0, 3));
  };

  const handleDismissAlert = async (alert: Alert) => {
    if (!user) return;

    console.log('🚫 Dispensando alerta:', alert);

    // Otimisticamente remover da UI
    setAlerts(prev => prev.filter(a => a.id !== alert.id));

    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
      const { error } = await supabase
        .from('alert_acknowledgments')
        .insert({
          user_id: user.id,
          alert_type: alert.code,
          month_year: currentMonthYear
        });
      
      if (error) {
        console.error('❌ Erro Supabase ao dispensar:', error);
        throw error;
      }
      
      console.log('✅ Alerta dispensado no banco com sucesso');
    } catch (error) {
      console.error('❌ Erro ao dispensar alerta:', error);
      // Se falhar, recarrega os alertas (opcional, mas bom para consistência)
      loadAlerts();
    }
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
          <p className="text-body text-neutral-600 mt-xs capitalize">
            Resumo de {new Date().toLocaleDateString('pt-BR', { month: 'long' })} · {cashflow.daysLeft} dias restantes
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

      {/* Stat Cards: Disponível / Comprometido / Receitas / Já poupado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Disponível"
          value={formatCurrency(cashflow.available)}
        />
        <StatCard
          icon={<Lock className="w-5 h-5" />}
          label="Comprometido"
          value={formatCurrency(cashflow.committed)}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('dashboard.monthlyIncome')}
          value={formatCurrency(stats.monthlyIncome)}
        />
        <StatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label="Já poupado"
          value={formatCurrency(cashflow.savingsBalance)}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-sm">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-sm p-md rounded-base border ${getAlertStyles(alert.type)} relative group`}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1 pr-8">
                <p className="font-semibold text-body">{alert.title}</p>
                <p className="text-small mt-xs opacity-90">{alert.message}</p>
              </div>
              <button 
                onClick={() => handleDismissAlert(alert)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors text-current opacity-60 hover:opacity-100"
                title="Dispensar alerta este mês"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <FixedBillsProgress bills={fixedBills} formatCurrency={formatCurrency} />
        <BudgetBuckets buckets={buckets} income={budgetIncome} formatCurrency={formatCurrency} />
        <CategoryDonut data={categoryExpenses} formatCurrency={formatCurrency} />
        <GoalsProgress goals={goals} formatCurrency={formatCurrency} />
      </div>

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
