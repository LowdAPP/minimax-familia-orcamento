// Página de Orçamento - 3 Metodologias (Envelope, 50/30/20, Zero-Based)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { useAlert } from '../hooks/useAlert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Check,
  Edit,
  Save
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type Methodology = 'envelope' | '50_30_20' | 'zero_based';

interface Budget {
  id?: string;
  budget_name: string;
  methodology: Methodology;
  total_income: number;
  needs_amount?: number;
  wants_amount?: number;
  savings_amount?: number;
}

interface CategoryBudget {
  category_id: string;
  category_name: string;
  allocated_amount: number;
  spent_amount: number;
  category_type: 'essencial' | 'superfluo' | 'poupanca' | 'divida';
}

const COLORS = {
  essencial: '#0066FF',
  superfluo: '#FF6B00',
  poupanca: '#00C853',
  divida: '#F44336'
};

export default function BudgetPage() {
  const { user, profile } = useAuth();
  const { t, formatCurrency, language } = useI18n();
  const { showAlert, AlertComponent } = useAlert();
  const [activeTab, setActiveTab] = useState<Methodology>('50_30_20');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [budget, setBudget] = useState<Budget>({
    budget_name: 'Orçamento Atual',
    methodology: '50_30_20',
    total_income: profile?.monthly_income || 0,
    needs_amount: 0,
    wants_amount: 0,
    savings_amount: 0
  });

  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBudget(),
        loadCategories(),
        loadCategoryBudgets()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudget = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('methodology', activeTab)
      .eq('month_year', currentMonth)
      .maybeSingle();

    if (data) {
      setBudget(data);
    } else {
      // Calcular orçamento baseado na metodologia
      await calculateBudget();
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user?.id},is_system_category.eq.true`)
      .order('name');

    setCategories(data || []);
  };

  const loadCategoryBudgets = async () => {
    if (!user || !budget.id) return;

    const { data } = await supabase
      .from('budget_items')
      .select(`
        category_id,
        allocated_amount,
        spent_amount,
        categories (name, category_type)
      `)
      .eq('budget_id', budget.id);

    setCategoryBudgets(
      data?.map((item: any) => ({
        category_id: item.category_id,
        category_name: item.categories.name,
        allocated_amount: item.allocated_amount,
        spent_amount: item.spent_amount,
        category_type: item.categories.category_type
      })) || []
    );
  };

  const calculateBudget = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('budget-calculator', {
        body: {
          user_id: user.id,
          methodology: activeTab,
          monthly_income: profile?.monthly_income || 0
        }
      });

      if (error) throw error;

      if (data?.budget) {
        setBudget(data.budget);
      }
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      
      // Fallback: cálculo local
      const income = profile?.monthly_income || 0;
      
      if (activeTab === '50_30_20') {
        setBudget({
          budget_name: 'Orçamento 50/30/20',
          methodology: '50_30_20',
          total_income: income,
          needs_amount: income * 0.5,
          wants_amount: income * 0.3,
          savings_amount: income * 0.2
        });
      } else if (activeTab === 'envelope') {
        setBudget({
          budget_name: 'Orçamento Envelope',
          methodology: 'envelope',
          total_income: income
        });
      } else {
        setBudget({
          budget_name: 'Orçamento Zero-Based',
          methodology: 'zero_based',
          total_income: income
        });
      }
    }
  };

  const saveBudget = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const budgetData = {
        user_id: user.id,
        budget_name: budget.budget_name,
        methodology: activeTab,
        month_year: currentMonth,
        status: 'active',
        total_income: budget.total_income,
        needs_amount: budget.needs_amount,
        wants_amount: budget.wants_amount,
        savings_amount: budget.savings_amount
      };

      // Primeiro, verificar se já existe um orçamento com esses critérios
      const { data: existingBudget } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .eq('methodology', activeTab)
        .maybeSingle();

      let result;
      if (existingBudget?.id) {
        // Atualizar orçamento existente
        const { data, error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', existingBudget.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Criar novo orçamento
        const { data, error } = await supabase
          .from('budgets')
          .insert(budgetData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      setBudget({ ...budget, id: result.id });
      setEditing(false);
      
      showAlert({
        type: 'success',
        title: 'Sucesso!',
        message: 'Orçamento salvo com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao salvar orçamento';
      showAlert({
        type: 'error',
        title: 'Erro ao salvar',
        message: `Erro ao salvar orçamento: ${errorMessage}`
      });
    } finally {
      setSaving(false);
    }
  };



  const getProgressPercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min((spent / allocated) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-error-500';
    if (percentage >= 80) return 'bg-warning-500';
    return 'bg-success-500';
  };

  // Dados para gráfico 50/30/20
  const fiftyThirtyTwentyData = [
    { name: 'Necessidades (50%)', value: budget.needs_amount || 0, color: COLORS.essencial },
    { name: 'Desejos (30%)', value: budget.wants_amount || 0, color: COLORS.superfluo },
    { name: 'Poupança (20%)', value: budget.savings_amount || 0, color: COLORS.poupanca }
  ];

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
          <h1 className="text-h2 font-bold text-neutral-900">Orçamento</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Gerencie seu orçamento com diferentes metodologias
          </p>
        </div>
        <div className="flex gap-sm">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveBudget} loading={saving}>
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4" />
              Editar Orçamento
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de Metodologias */}
      <Card padding="sm">
        <div className="flex gap-xs">
          <button
            onClick={() => setActiveTab('50_30_20')}
            className={`
              flex-1 py-sm px-md rounded-base text-body font-semibold transition-all
              ${activeTab === '50_30_20'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            50/30/20
          </button>
          <button
            onClick={() => setActiveTab('envelope')}
            className={`
              flex-1 py-sm px-md rounded-base text-body font-semibold transition-all
              ${activeTab === 'envelope'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            Envelope
          </button>
          <button
            onClick={() => setActiveTab('zero_based')}
            className={`
              flex-1 py-sm px-md rounded-base text-body font-semibold transition-all
              ${activeTab === 'zero_based'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            Zero-Based
          </button>
        </div>
      </Card>

      {/* Método 50/30/20 */}
      {activeTab === '50_30_20' && (
        <div className="space-y-lg">
          <Card>
            <div className="mb-md">
              <h3 className="text-h4 font-bold text-neutral-900">Regra 50/30/20</h3>
              <p className="text-small text-neutral-600 mt-xs">
                50% Necessidades • 30% Desejos • 20% Poupança
              </p>
            </div>

            <div className="mb-lg">
              <Input
                type="number"
                label={language === 'pt-PT' ? 'Renda Mensal (€)' : 'Renda Mensal (R$)'}
                value={budget.total_income || ''}
                onChange={(e) => setBudget({ ...budget, total_income: parseFloat(e.target.value) || 0 })}
                disabled={!editing}
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {/* Gráfico */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  {/* @ts-ignore */}
                  <RechartsPie>
                    {/* @ts-ignore */}
                    <Pie
                      data={fiftyThirtyTwentyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fiftyThirtyTwentyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    {/* @ts-ignore */}
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    {/* @ts-ignore */}
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Valores */}
              <div className="space-y-md">
                <div className="p-md bg-blue-50 rounded-base border-l-4 border-blue-500">
                  <p className="text-small text-blue-700 font-semibold mb-xs">Necessidades (50%)</p>
                  <p className="text-h4 font-bold text-blue-900">
                    {formatCurrency(budget.total_income * 0.5)}
                  </p>
                  <p className="text-small text-blue-600 mt-xs">
                    Moradia, alimentação, transporte, saúde
                  </p>
                </div>

                <div className="p-md bg-orange-50 rounded-base border-l-4 border-orange-500">
                  <p className="text-small text-orange-700 font-semibold mb-xs">Desejos (30%)</p>
                  <p className="text-h4 font-bold text-orange-900">
                    {formatCurrency(budget.total_income * 0.3)}
                  </p>
                  <p className="text-small text-orange-600 mt-xs">
                    Lazer, restaurantes, compras não essenciais
                  </p>
                </div>

                <div className="p-md bg-green-50 rounded-base border-l-4 border-green-500">
                  <p className="text-small text-green-700 font-semibold mb-xs">Poupança (20%)</p>
                  <p className="text-h4 font-bold text-green-900">
                    {formatCurrency(budget.total_income * 0.2)}
                  </p>
                  <p className="text-small text-green-600 mt-xs">
                    Reserva de emergência, investimentos, aposentadoria
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="bg-info-50 border border-info-200 rounded-base p-md flex items-start gap-sm">
              <AlertCircle className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body font-semibold text-info-900 mb-xs">
                  Como funciona a regra 50/30/20?
                </p>
                <ul className="text-small text-info-700 space-y-xs list-disc list-inside">
                  <li>50% da renda para necessidades básicas (não negociáveis)</li>
                  <li>30% para desejos e estilo de vida (negociáveis)</li>
                  <li>20% para poupança e investimentos (seu futuro)</li>
                  <li>Metodologia criada pela senadora Elizabeth Warren</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Método Envelope */}
      {activeTab === 'envelope' && (
        <div className="space-y-lg">
          <Card>
            <div className="mb-md">
              <h3 className="text-h4 font-bold text-neutral-900">Método Envelope</h3>
              <p className="text-small text-neutral-600 mt-xs">
                Defina limites específicos para cada categoria de gasto
              </p>
            </div>

            <div className="mb-lg">
              <Input
                type="number"
                label={language === 'pt-PT' ? 'Renda Mensal (€)' : 'Renda Mensal (R$)'}
                value={budget.total_income || ''}
                onChange={(e) => setBudget({ ...budget, total_income: parseFloat(e.target.value) || 0 })}
                disabled={!editing}
                step="0.01"
              />
            </div>

            <div className="space-y-sm">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const categoryBudget = categoryBudgets.find(cb => cb.category_id === category.id);
                  const allocated = categoryBudget?.allocated_amount || 0;
                  const spent = categoryBudget?.spent_amount || 0;
                  const percentage = getProgressPercentage(spent, allocated);

                  return (
                    <div key={category.id} className="p-md bg-neutral-50 rounded-base">
                      <div className="flex items-center justify-between mb-sm">
                        <div>
                          <p className="text-body font-semibold text-neutral-900">{category.name}</p>
                          <p className="text-small text-neutral-600">
                            Gasto: {formatCurrency(spent)} de {formatCurrency(allocated)}
                          </p>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="0,00"
                            value={allocated || ''}
                            disabled={!editing}
                            step="0.01"
                            className="text-right"
                          />
                        </div>
                      </div>
                      
                      {allocated > 0 && (
                        <div className="space-y-xs">
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-small text-neutral-600 text-right">
                            {percentage.toFixed(0)}% utilizado
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-lg">
                  <PieChart className="w-12 h-12 text-neutral-300 mx-auto mb-sm" />
                  <p className="text-body text-neutral-600">Nenhuma categoria encontrada</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="bg-info-50 border border-info-200 rounded-base p-md flex items-start gap-sm">
              <AlertCircle className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body font-semibold text-info-900 mb-xs">
                  Como funciona o Método Envelope?
                </p>
                <ul className="text-small text-info-700 space-y-xs list-disc list-inside">
                  <li>Divida seu dinheiro em "envelopes" (categorias)</li>
                  <li>Defina um limite máximo para cada categoria</li>
                  <li>Quando o envelope acabar, você não pode gastar mais naquela categoria</li>
                  <li>Ideal para quem tem dificuldade em controlar gastos específicos</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Método Zero-Based */}
      {activeTab === 'zero_based' && (
        <div className="space-y-lg">
          <Card>
            <div className="mb-md">
              <h3 className="text-h4 font-bold text-neutral-900">Orçamento Base Zero</h3>
              <p className="text-small text-neutral-600 mt-xs">
                Atribua cada real da sua renda a uma categoria específica
              </p>
            </div>

            <div className="mb-lg">
              <Input
                type="number"
                label={language === 'pt-PT' ? 'Renda Mensal (€)' : 'Renda Mensal (R$)'}
                value={budget.total_income || ''}
                onChange={(e) => setBudget({ ...budget, total_income: parseFloat(e.target.value) || 0 })}
                disabled={!editing}
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
              <div className="p-md bg-neutral-100 rounded-base">
                <p className="text-small text-neutral-600 mb-xs">Total Alocado</p>
                <p className="text-h4 font-bold text-neutral-900">
                  {formatCurrency(categoryBudgets.reduce((sum, cb) => sum + cb.allocated_amount, 0))}
                </p>
              </div>
              <div className="p-md bg-primary-50 rounded-base">
                <p className="text-small text-primary-700 mb-xs">Restante para Alocar</p>
                <p className="text-h4 font-bold text-primary-900">
                  {formatCurrency(budget.total_income - categoryBudgets.reduce((sum, cb) => sum + cb.allocated_amount, 0))}
                </p>
              </div>
            </div>

            <div className="space-y-sm">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-md bg-neutral-50 rounded-base">
                  <div className="flex-1">
                    <p className="text-body font-semibold text-neutral-900">{category.name}</p>
                    <p className="text-small text-neutral-600 capitalize">{category.category_type}</p>
                  </div>
                  <div className="w-40">
                    <Input
                      type="number"
                      placeholder="0,00"
                      disabled={!editing}
                      step="0.01"
                      className="text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            {budget.total_income - categoryBudgets.reduce((sum, cb) => sum + cb.allocated_amount, 0) === 0 && (
              <div className="mt-md p-md bg-success-50 border border-success-200 rounded-base flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-600" />
                <p className="text-body text-success-700">
                  Perfeito! Você alocou 100% da sua renda.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <div className="bg-info-50 border border-info-200 rounded-base p-md flex items-start gap-sm">
              <AlertCircle className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body font-semibold text-info-900 mb-xs">
                  Como funciona o Orçamento Base Zero?
                </p>
                <ul className="text-small text-info-700 space-y-xs list-disc list-inside">
                  <li>Todo real da sua renda deve ter um destino específico</li>
                  <li>Renda menos despesas deve ser igual a ZERO</li>
                  <li>Inclua poupança e investimentos como categorias obrigatórias</li>
                  <li>Metodologia para máximo controle e consciência financeira</li>
                  <li>Popular entre quem quer eliminar desperdícios</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
      <AlertComponent />
    </div>
  );
}
