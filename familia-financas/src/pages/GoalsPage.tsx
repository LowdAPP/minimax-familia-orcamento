// Página de Metas e Dívidas
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Award,
  CheckCircle
} from 'lucide-react';

interface Goal {
  id: string;
  goal_name: string;
  goal_type: 'reserva_emergencia' | 'quitacao_divida' | 'superfluos' | 'orcamento_mensal';
  target_amount: number;
  current_amount: number;
  deadline?: string;
  status: 'defined' | 'active' | 'paused' | 'completed' | 'abandoned';
}

interface Debt {
  id: string;
  debt_name: string;
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_date?: string;
}

interface DebtSimulation {
  method: 'snowball' | 'avalanche';
  totalInterest: number;
  totalMonths: number;
  monthlyPayment: number;
  payoffSchedule: Array<{
    month: number;
    debt_name: string;
    payment: number;
    remaining: number;
  }>;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { t, formatCurrency, language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulation, setSimulation] = useState<DebtSimulation | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);

  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    goal_type: 'reserva_emergencia' as Goal['goal_type'],
    target_amount: 0,
    current_amount: 0,
    deadline: ''
  });

  const [newDebt, setNewDebt] = useState({
    debt_name: '',
    principal_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: ''
  });

  const [extraPayment, setExtraPayment] = useState(0);
  const [simulationMethod, setSimulationMethod] = useState<'snowball' | 'avalanche'>('snowball');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      validateConnection();
      loadData();
    }
  }, [user]);

  // Validação de conexão com o banco de dados
  const validateConnection = async () => {
    try {
      // Testa conexão verificando se consegue acessar as tabelas
      const [goalsTest, debtsTest] = await Promise.all([
        supabase.from('goals').select('id').limit(1),
        supabase.from('debts').select('id').limit(1)
      ]);

      // Verifica se há erros de conexão ou permissão
      if (goalsTest.error || debtsTest.error) {
        const error = goalsTest.error || debtsTest.error;
        setDbConnected(false);
        setDbError(error.message || 'Erro ao conectar com o banco de dados');
        console.error('Erro de conexão:', error);
        return;
      }

      // Se chegou aqui, a conexão está OK
      setDbConnected(true);
      setDbError(null);
    } catch (error: any) {
      setDbConnected(false);
      setDbError(error.message || 'Erro ao validar conexão');
      console.error('Erro ao validar conexão:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadGoals(), loadDebts()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'abandoned')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar metas:', error);
        setDbConnected(false);
        setDbError(`Erro ao carregar metas: ${error.message}`);
        return;
      }

      setGoals(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
      setDbConnected(false);
      setDbError(error.message || 'Erro ao carregar metas');
    }
  };

  const loadDebts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('interest_rate', { ascending: false });

      if (error) {
        console.error('Erro ao carregar dívidas:', error);
        setDbConnected(false);
        setDbError(`Erro ao carregar dívidas: ${error.message}`);
        return;
      }

      setDebts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dívidas:', error);
      setDbConnected(false);
      setDbError(error.message || 'Erro ao carregar dívidas');
    }
  };

  const handleAddGoal = async () => {
    if (!user || !newGoal.goal_name || newGoal.target_amount <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        goal_name: newGoal.goal_name,
        goal_type: newGoal.goal_type,
        target_amount: newGoal.target_amount,
        current_amount: newGoal.current_amount,
        deadline: newGoal.deadline || null,
        status: 'active'
      });

      if (error) {
        setDbConnected(false);
        setDbError(`Erro ao adicionar meta: ${error.message}`);
        throw error;
      }

      setShowGoalModal(false);
      setNewGoal({
        goal_name: '',
        goal_type: 'reserva_emergencia',
        target_amount: 0,
        current_amount: 0,
        deadline: ''
      });
      await loadGoals();
    } catch (error: any) {
      console.error('Erro ao adicionar meta:', error);
      alert(error.message || 'Erro ao adicionar meta. Verifique a conexão com o banco de dados.');
    }
  };

  const handleAddDebt = async () => {
    if (!user || !newDebt.debt_name || newDebt.current_balance <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase.from('debts').insert({
        user_id: user.id,
        debt_name: newDebt.debt_name,
        principal_amount: newDebt.principal_amount,
        current_balance: newDebt.current_balance,
        interest_rate: newDebt.interest_rate,
        minimum_payment: newDebt.minimum_payment,
        due_date: newDebt.due_date || null,
        is_active: true
      });

      if (error) {
        setDbConnected(false);
        setDbError(`Erro ao adicionar dívida: ${error.message}`);
        throw error;
      }

      setShowDebtModal(false);
      setNewDebt({
        debt_name: '',
        principal_amount: 0,
        current_balance: 0,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: ''
      });
      await loadDebts();
    } catch (error: any) {
      console.error('Erro ao adicionar dívida:', error);
      alert(error.message || 'Erro ao adicionar dívida. Verifique a conexão com o banco de dados.');
    }
  };

  const handleSimulateDebt = async () => {
    if (debts.length === 0) {
      alert('Adicione suas dívidas primeiro');
      return;
    }

    setSimulationLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debt-optimizer', {
        body: {
          user_id: user?.id,
          debts: debts.map(d => ({
            debt_name: d.debt_name,
            current_balance: d.current_balance,
            interest_rate: d.interest_rate,
            minimum_payment: d.minimum_payment
          })),
          extra_payment: extraPayment,
          method: simulationMethod
        }
      });

      if (error) throw error;

      setSimulation(data);
      setShowSimulator(true);
    } catch (error) {
      console.error('Erro ao simular dívidas:', error);
      
      // Simulação local simplificada como fallback
      const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);
      const avgInterest = debts.reduce((sum, d) => sum + d.interest_rate, 0) / debts.length;
      const totalMinPayment = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
      
      setSimulation({
        method: simulationMethod,
        totalInterest: totalDebt * (avgInterest / 100) * 2,
        totalMonths: Math.ceil(totalDebt / (totalMinPayment + extraPayment)),
        monthlyPayment: totalMinPayment + extraPayment,
        payoffSchedule: []
      });
      setShowSimulator(true);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'abandoned' })
        .eq('id', id);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta dívida?')) return;

    try {
      const { error } = await supabase
        .from('debts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadDebts();
    } catch (error) {
      console.error('Erro ao excluir dívida:', error);
    }
  };



  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reserva_emergencia: 'Reserva de Emergência',
      quitacao_divida: 'Quitação de Dívida',
      superfluos: 'Compra Especial',
      orcamento_mensal: 'Orçamento Mensal'
    };
    return labels[type] || type;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
      {/* Validação de Conexão */}
      {dbConnected === false && (
        <Card className="bg-error-50 border-error-200">
          <div className="flex items-center gap-sm">
            <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-body font-semibold text-error-900">
                Erro de conexão com o banco de dados
              </p>
              <p className="text-small text-error-700 mt-xs">
                {dbError || 'Não foi possível conectar. Verifique sua conexão e tente novamente.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={validateConnection}
            >
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}

      {dbConnected === true && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-center gap-sm">
            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
            <p className="text-body text-success-700">
              Conectado ao banco de dados
            </p>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Metas e Dívidas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Acompanhe seu progresso e planeje o futuro financeiro
          </p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={() => setShowDebtModal(true)}>
            <AlertTriangle className="w-4 h-4" />
            Adicionar Dívida
          </Button>
          <Button variant="primary" onClick={() => setShowGoalModal(true)}>
            <Plus className="w-4 h-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Metas */}
      <div>
        <h2 className="text-h3 font-bold text-neutral-900 mb-md">Suas Metas</h2>
        
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {goals.map((goal) => {
              const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
              
              return (
                <Card key={goal.id} hover>
                  <div className="flex items-start justify-between mb-md">
                    <div className="flex items-start gap-sm flex-1">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body-large font-bold text-neutral-900 truncate">
                          {goal.goal_name}
                        </h3>
                        <p className="text-small text-neutral-600">
                          {getGoalTypeLabel(goal.goal_type)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-base transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-sm">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-small text-neutral-600">Progresso</p>
                        <p className="text-body-large font-bold text-neutral-900">
                          {formatCurrency(goal.current_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-small text-neutral-600">Meta</p>
                        <p className="text-body font-semibold text-neutral-700">
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-xs">
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="h-3 bg-gradient-to-r from-primary-500 to-success-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-small text-neutral-600 text-right">
                        {progress.toFixed(0)}% concluído
                      </p>
                    </div>

                    {goal.deadline && (
                      <p className="text-small text-neutral-500">
                        Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    {progress >= 100 && (
                      <div className="p-sm bg-success-50 border border-success-200 rounded-base flex items-center gap-sm">
                        <CheckCircle className="w-4 h-4 text-success-600" />
                        <p className="text-small text-success-700 font-semibold">
                          Meta alcançada! Parabéns!
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="text-center py-lg">
              <Target className="w-16 h-16 text-neutral-300 mx-auto mb-md" />
              <p className="text-body text-neutral-600 mb-xs">Nenhuma meta definida</p>
              <p className="text-small text-neutral-500 mb-md">
                Crie sua primeira meta financeira para começar
              </p>
              <Button variant="primary" onClick={() => setShowGoalModal(true)}>
                <Plus className="w-4 h-4" />
                Criar Primeira Meta
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dívidas e Calculadora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Lista de Dívidas */}
        <Card>
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-h4 font-bold text-neutral-900">Suas Dívidas</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDebtModal(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {debts.length > 0 ? (
            <div className="space-y-sm">
              {debts.map((debt) => (
                <div
                  key={debt.id}
                  className="p-md bg-error-50 border border-error-200 rounded-base"
                >
                  <div className="flex items-start justify-between mb-sm">
                    <div className="flex-1">
                      <p className="text-body font-semibold text-neutral-900">{debt.debt_name}</p>
                      <p className="text-h4 font-bold text-error-700 mt-xs">
                        {formatCurrency(debt.current_balance)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="p-2 text-neutral-400 hover:text-error-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-sm text-small">
                    <div>
                      <p className="text-neutral-600">Juros</p>
                      <p className="font-semibold text-neutral-900">{debt.interest_rate}% a.m.</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Pagamento Mín.</p>
                      <p className="font-semibold text-neutral-900">{formatCurrency(debt.minimum_payment)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-md border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-body font-semibold text-neutral-700">Total de Dívidas:</span>
                  <span className="text-h4 font-bold text-error-700">
                    {formatCurrency(debts.reduce((sum, d) => sum + d.current_balance, 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-lg">
              <Award className="w-12 h-12 text-success-500 mx-auto mb-sm" />
              <p className="text-body text-neutral-600">Nenhuma dívida cadastrada</p>
              <p className="text-small text-neutral-500 mt-xs">
                Você está livre de dívidas ou ainda não as cadastrou
              </p>
            </div>
          )}
        </Card>

        {/* Calculadora de Dívidas */}
        <Card>
          <div className="mb-md">
            <h3 className="text-h4 font-bold text-neutral-900 mb-xs">
              Calculadora de Quitação
            </h3>
            <p className="text-small text-neutral-600">
              Compare as estratégias Snowball vs Avalanche
            </p>
          </div>

          <div className="space-y-md">
            <Input
              type="number"
              label={language === 'pt-PT' ? 'Valor Extra Mensal (€)' : 'Valor Extra Mensal (R$)'}
              value={extraPayment || ''}
              onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              step="0.01"
              helperText="Quanto você pode pagar além do mínimo?"
            />

            <div>
              <label className="block text-small font-medium text-neutral-700 mb-sm">
                Estratégia de Pagamento
              </label>
              <div className="space-y-sm">
                <button
                  onClick={() => setSimulationMethod('snowball')}
                  className={`
                    w-full text-left p-sm rounded-base border-2 transition-all
                    ${simulationMethod === 'snowball'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <p className="text-body font-semibold text-neutral-900">Snowball (Bola de Neve)</p>
                  <p className="text-small text-neutral-600 mt-xs">
                    Paga as dívidas menores primeiro para ganhar motivação
                  </p>
                </button>

                <button
                  onClick={() => setSimulationMethod('avalanche')}
                  className={`
                    w-full text-left p-sm rounded-base border-2 transition-all
                    ${simulationMethod === 'avalanche'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <p className="text-body font-semibold text-neutral-900">Avalanche</p>
                  <p className="text-small text-neutral-600 mt-xs">
                    Paga as dívidas com maior juros primeiro para economizar dinheiro
                  </p>
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleSimulateDebt}
              loading={simulationLoading}
              disabled={debts.length === 0 || simulationLoading}
            >
              <Calculator className="w-4 h-4" />
              Simular Quitação
            </Button>
          </div>

          {simulation && (
            <div className="mt-lg pt-lg border-t border-neutral-200 space-y-sm">
              <h4 className="text-body-large font-bold text-neutral-900 mb-md">
                Resultado da Simulação ({simulation.method === 'snowball' ? 'Snowball' : 'Avalanche'})
              </h4>
              
              <div className="grid grid-cols-2 gap-sm">
                <div className="p-sm bg-neutral-50 rounded-base">
                  <p className="text-small text-neutral-600">Tempo Total</p>
                  <p className="text-body-large font-bold text-neutral-900">
                    {simulation.totalMonths} meses
                  </p>
                </div>
                <div className="p-sm bg-neutral-50 rounded-base">
                  <p className="text-small text-neutral-600">Juros Totais</p>
                  <p className="text-body-large font-bold text-error-700">
                    {formatCurrency(simulation.totalInterest)}
                  </p>
                </div>
              </div>

              <div className="p-sm bg-primary-50 rounded-base">
                <p className="text-small text-primary-700">Pagamento Mensal Total</p>
                <p className="text-h4 font-bold text-primary-900">
                  {formatCurrency(simulation.monthlyPayment)}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal: Nova Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-lg w-full">
            <h3 className="text-h4 font-bold text-neutral-900 mb-lg">Nova Meta Financeira</h3>
            
            <div className="space-y-md">
              <Input
                label="Nome da Meta"
                value={newGoal.goal_name}
                onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                placeholder="Ex: Reserva de Emergência"
                required
              />

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Tipo de Meta <span className="text-error-500">*</span>
                </label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value as any })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="reserva_emergencia">Reserva de Emergência</option>
                  <option value="quitacao_divida">Quitação de Dívida</option>
                  <option value="superfluos">Compra Especial</option>
                  <option value="orcamento_mensal">Orçamento Mensal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Valor Meta (€)' : 'Valor Meta (R$)'}
                  value={newGoal.target_amount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />

                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Valor Atual (€)' : 'Valor Atual (R$)'}
                  value={newGoal.current_amount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, current_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                />
              </div>

              <Input
                type="date"
                label="Prazo (opcional)"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => setShowGoalModal(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddGoal}
                fullWidth
              >
                Criar Meta
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Nova Dívida */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-lg w-full">
            <h3 className="text-h4 font-bold text-neutral-900 mb-lg">Nova Dívida</h3>
            
            <div className="space-y-md">
              <Input
                label="Nome da Dívida"
                value={newDebt.debt_name}
                onChange={(e) => setNewDebt({ ...newDebt, debt_name: e.target.value })}
                placeholder="Ex: Cartão de Crédito XYZ"
                required
              />

              <div className="grid grid-cols-2 gap-md">
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Valor Original (€)' : 'Valor Original (R$)'}
                  value={newDebt.principal_amount || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, principal_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                />

                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Saldo Atual (€)' : 'Saldo Atual (R$)'}
                  value={newDebt.current_balance || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, current_balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <Input
                  type="number"
                  label="Taxa de Juros (% a.m.)"
                  value={newDebt.interest_rate || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, interest_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />

                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Pagamento Mínimo (€)' : 'Pagamento Mínimo (R$)'}
                  value={newDebt.minimum_payment || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, minimum_payment: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />
              </div>

              <Input
                type="date"
                label="Vencimento (opcional)"
                value={newDebt.due_date}
                onChange={(e) => setNewDebt({ ...newDebt, due_date: e.target.value })}
              />
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => setShowDebtModal(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddDebt}
                fullWidth
              >
                Adicionar Dívida
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
