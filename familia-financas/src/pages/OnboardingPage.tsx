// Página de Onboarding - Wizard de 5 Etapas
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { useAlert } from '../hooks/useAlert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { 
  Users, 
  DollarSign, 
  PieChart, 
  Target, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

interface OnboardingData {
  // Etapa 1: Perfil Familiar
  familyMembersCount: number;
  familyMembersAges: string;
  
  // Etapa 2: Renda
  monthlyIncome: number;
  incomeSources: string;
  
  // Etapa 3: Orçamento Atual
  currentExpenses: {
    alimentacao: number;
    moradia: number;
    transporte: number;
    saude: number;
    educacao: number;
    lazer: number;
    outros: number;
  };
  
  // Etapa 4: Meta Principal
  primaryGoal: 'fazer_sobrar' | 'quitar_divida' | 'criar_reserva' | 'controlar_gastos';
  personaType: 'iniciante_perdido' | 'frustrado_anonimo' | 'sem_tempo' | 'gastador_impulsivo';
}

export default function OnboardingPage() {
  const { user, updateProfile, profile } = useAuth();
  const { t, formatCurrency, language } = useI18n();
  const { showAlert, AlertComponent } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refazer = searchParams.get('refazer') === 'true';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado para gerenciar as idades como array (mais fácil de trabalhar com dropdowns)
  const [familyAges, setFamilyAges] = useState<(number | null)[]>([null]);
  
  // Estado local para o campo de quantidade de pessoas (permite ficar vazio)
  const [familyMembersCountInput, setFamilyMembersCountInput] = useState<string>('1');
  
  const [formData, setFormData] = useState<OnboardingData>({
    familyMembersCount: 1,
    familyMembersAges: '',
    monthlyIncome: 0,
    incomeSources: '',
    currentExpenses: {
      alimentacao: 0,
      moradia: 0,
      transporte: 0,
      saude: 0,
      educacao: 0,
      lazer: 0,
      outros: 0
    },
    primaryGoal: 'controlar_gastos',
    personaType: 'iniciante_perdido'
  });

  // Redirecionar se já completou onboarding (exceto se estiver refazendo)
  useEffect(() => {
    if (profile?.onboarding_completed && !refazer) {
      console.log('Onboarding já completado, redirecionando para dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate, refazer]);

  // Sincronizar o input com o formData quando mudar externamente
  useEffect(() => {
    setFamilyMembersCountInput(formData.familyMembersCount.toString());
  }, [formData.familyMembersCount]);

  // Ajustar array de idades quando a quantidade de membros mudar
  useEffect(() => {
    setFamilyAges(prevAges => {
      // Se o array anterior tem o mesmo tamanho, não precisa ajustar
      if (prevAges.length === formData.familyMembersCount) {
        return prevAges;
      }
      const newAges = Array(formData.familyMembersCount).fill(null).map((_, index) => {
        // Manter idade existente se já foi definida, senão null
        return prevAges[index] ?? null;
      });
      return newAges;
    });
  }, [formData.familyMembersCount]);

  // Sincronizar array de idades com o formData (como string para compatibilidade)
  useEffect(() => {
    const agesString = familyAges
      .filter(age => age !== null && age !== undefined)
      .map(age => `${age} anos`)
      .join(', ');
    setFormData(prev => ({ ...prev, familyMembersAges: agesString }));
  }, [familyAges]);

  // Auto-save ao mudar de etapa
  useEffect(() => {
    if (currentStep > 1) {
      saveProgress();
    }
  }, [currentStep]);

  const saveProgress = async () => {
    if (!user) return;
    
    try {
      // Salvar no user_profiles
      const profileUpdates = {
        monthly_income: formData.monthlyIncome,
        primary_goal: formData.primaryGoal,
        persona_type: formData.personaType,
        onboarding_completed: currentStep === 5
      };
      
      await updateProfile(profileUpdates);
      
      // Se chegou na etapa 3 ou superior, criar orçamento inicial
      if (currentStep >= 3) {
        const totalExpenses = Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0);
        
        const { error: budgetError } = await supabase
          .from('budgets')
          .upsert({
            user_id: user.id,
            budget_name: 'Orçamento Inicial',
            methodology: '50_30_20',
            month_year: new Date().toISOString().slice(0, 7),
            status: 'active',
            total_income: formData.monthlyIncome,
            needs_amount: formData.currentExpenses.alimentacao + formData.currentExpenses.moradia + formData.currentExpenses.saude,
            wants_amount: formData.currentExpenses.lazer + formData.currentExpenses.outros,
            savings_amount: formData.monthlyIncome - totalExpenses
          }, {
            onConflict: 'user_id,month_year'
          });
        
        if (budgetError) console.error('Erro ao salvar orçamento:', budgetError);
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (formData.familyMembersCount < 1) {
          newErrors.familyMembersCount = 'Informe pelo menos 1 membro';
        }
        // Validar se todas as idades foram preenchidas
        if (familyAges.length !== formData.familyMembersCount || 
            familyAges.some(age => age === null || age === undefined)) {
          newErrors.familyMembersAges = 'Informe a idade de todos os membros da família';
        }
        break;
        
      case 2:
        if (formData.monthlyIncome <= 0) {
          newErrors.monthlyIncome = 'Informe sua renda mensal';
        }
        if (!formData.incomeSources.trim()) {
          newErrors.incomeSources = 'Informe suas fontes de renda';
        }
        break;
        
      case 3:
        const totalExpenses = Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0);
        if (totalExpenses <= 0) {
          newErrors.currentExpenses = 'Informe pelo menos uma categoria de despesa';
        }
        if (totalExpenses > formData.monthlyIncome * 1.5) {
          newErrors.currentExpenses = 'Suas despesas parecem muito altas. Revise os valores.';
        }
        break;
        
      case 4:
        if (!formData.primaryGoal) {
          newErrors.primaryGoal = 'Selecione sua meta principal';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Salvar TODOS os dados do onboarding de uma vez
      const finalProfileData = {
        monthly_income: formData.monthlyIncome,
        primary_goal: formData.primaryGoal,
        persona_type: formData.personaType,
        onboarding_completed: true
      };
      
      console.log('Salvando onboarding completo:', finalProfileData);
      
      // Atualizar perfil
      await updateProfile(finalProfileData);
      
      // Criar orçamento inicial se ainda não existe
      const totalExpenses = Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0);
      
      await supabase
        .from('budgets')
        .upsert({
          user_id: user!.id,
          budget_name: 'Orçamento Inicial',
          methodology: '50_30_20',
          month_year: new Date().toISOString().slice(0, 7),
          status: 'active',
          total_income: formData.monthlyIncome,
          needs_amount: formData.currentExpenses.alimentacao + formData.currentExpenses.moradia + formData.currentExpenses.saude,
          wants_amount: formData.currentExpenses.lazer + formData.currentExpenses.outros,
          savings_amount: formData.monthlyIncome - totalExpenses
        }, {
          onConflict: 'user_id,month_year'
        });
      
      console.log('Onboarding concluído com sucesso! Redirecionando...');
      
      // Pequeno delay para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navegar para dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar dados. Por favor, tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateExpense = (category: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      currentExpenses: {
        ...prev.currentExpenses,
        [category]: value
      }
    }));
    if (errors.currentExpenses) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.currentExpenses;
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-lg px-sm">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-xl">
          <div className="flex items-center justify-between mb-sm">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-small transition-all duration-base
                    ${currentStep > step ? 'bg-success-500 text-white' : ''}
                    ${currentStep === step ? 'bg-primary-500 text-white ring-4 ring-primary-100' : ''}
                    ${currentStep < step ? 'bg-neutral-200 text-neutral-500' : ''}
                  `}
                >
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`
                      h-1 w-12 md:w-24 mx-xs transition-all duration-base
                      ${currentStep > step ? 'bg-success-500' : 'bg-neutral-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-small text-neutral-600">
            Etapa {currentStep} de 5
          </p>
        </div>

        {/* Step Content */}
        <Card>
          {/* Etapa 1: Perfil Familiar */}
          {currentStep === 1 && (
            <div className="space-y-lg">
              <div className="text-center mb-md">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-h3 font-bold text-neutral-900 mb-xs">
                  Conte-nos sobre sua família
                </h2>
                <p className="text-body text-neutral-600">
                  Vamos personalizar sua experiência para atender às necessidades da sua família
                </p>
              </div>

              <Input
                type="number"
                label="Quantas pessoas moram com você? (incluindo você)"
                value={familyMembersCountInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setFamilyMembersCountInput(value);
                  
                  // Limpar erro ao editar
                  if (errors.familyMembersCount) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.familyMembersCount;
                      return newErrors;
                    });
                  }
                  
                  // Só atualizar formData se houver um valor válido
                  if (value !== '' && value !== '-') {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue > 0) {
                      updateFormData('familyMembersCount', numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  // Quando sair do campo, garantir que há um valor válido
                  const value = e.target.value;
                  if (value === '' || value === '0' || parseInt(value) < 1) {
                    setFamilyMembersCountInput('1');
                    updateFormData('familyMembersCount', 1);
                  }
                }}
                error={errors.familyMembersCount}
                min="1"
                required
              />

              {formData.familyMembersCount > 0 && (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Quais são as idades? <span className="text-error-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                    {Array.from({ length: formData.familyMembersCount }, (_, index) => (
                      <div key={index}>
                        <label className="block text-small text-neutral-600 mb-xs">
                          Pessoa {index + 1}
                        </label>
                        <input
                          type="number"
                          value={familyAges[index] ?? ''}
                          onChange={(e) => {
                            const newAges = [...familyAges];
                            const ageValue = e.target.value === '' ? null : parseInt(e.target.value);
                            newAges[index] = ageValue;
                            setFamilyAges(newAges);
                            // Limpar erro ao editar
                            if (errors.familyMembersAges) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.familyMembersAges;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder="Idade"
                          min="0"
                          max="120"
                          className={`
                            w-full h-12 px-sm rounded-base border text-body text-neutral-900 
                            bg-white transition-all duration-base
                            ${errors.familyMembersAges 
                              ? 'border-error-500 focus:ring-2 focus:ring-error-500' 
                              : 'border-neutral-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500'
                            }
                          `}
                        />
                      </div>
                    ))}
                  </div>
                  {errors.familyMembersAges && (
                    <p className="text-small text-error-600 mt-xs">{errors.familyMembersAges}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Etapa 2: Renda */}
          {currentStep === 2 && (
            <div className="space-y-lg">
              <div className="text-center mb-md">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                  <DollarSign className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-h3 font-bold text-neutral-900 mb-xs">
                  Qual é a renda total da família?
                </h2>
                <p className="text-body text-neutral-600">
                  Some todas as fontes de renda mensal (salários, pensões, freelances, etc.)
                </p>
              </div>

              <Input
                type="number"
                label={language === 'pt-PT' ? 'Renda mensal total (€)' : 'Renda mensal total (R$)'}
                value={formData.monthlyIncome || ''}
                onChange={(e) => updateFormData('monthlyIncome', parseFloat(e.target.value) || 0)}
                error={errors.monthlyIncome}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Quais são as fontes de renda? <span className="text-error-500">*</span>
                </label>
                <textarea
                  className={`
                    w-full px-sm py-sm rounded-base border text-body text-neutral-900 
                    placeholder:text-neutral-500 bg-white transition-all duration-base resize-none
                    ${errors.incomeSources 
                      ? 'border-error-500 focus:ring-2 focus:ring-error-500' 
                      : 'border-neutral-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500'
                    }
                  `}
                  rows={3}
                  value={formData.incomeSources}
                  onChange={(e) => updateFormData('incomeSources', e.target.value)}
                  placeholder="Ex: Salário CLT, freelance de design, pensão alimentícia"
                />
                {errors.incomeSources && (
                  <p className="text-small text-error-600 mt-xs">{errors.incomeSources}</p>
                )}
              </div>

              <div className="bg-info-50 border border-info-200 rounded-base p-sm">
                <p className="text-small text-info-700">
                  <strong>Dica:</strong> Considere apenas rendas regulares e confiáveis. 
                  Evite incluir valores eventuais ou incertos.
                </p>
              </div>
            </div>
          )}

          {/* Etapa 3: Orçamento Atual */}
          {currentStep === 3 && (
            <div className="space-y-lg">
              <div className="text-center mb-md">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                  <PieChart className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-h3 font-bold text-neutral-900 mb-xs">
                  Como você gasta atualmente?
                </h2>
                <p className="text-body text-neutral-600">
                  Informe os gastos médios mensais por categoria (valores aproximados)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Alimentação (€)' : 'Alimentação (R$)'}
                  value={formData.currentExpenses.alimentacao || ''}
                  onChange={(e) => updateExpense('alimentacao', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Moradia (€)' : 'Moradia (R$)'}
                  value={formData.currentExpenses.moradia || ''}
                  onChange={(e) => updateExpense('moradia', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Transporte (€)' : 'Transporte (R$)'}
                  value={formData.currentExpenses.transporte || ''}
                  onChange={(e) => updateExpense('transporte', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Saúde (€)' : 'Saúde (R$)'}
                  value={formData.currentExpenses.saude || ''}
                  onChange={(e) => updateExpense('saude', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Educação (€)' : 'Educação (R$)'}
                  value={formData.currentExpenses.educacao || ''}
                  onChange={(e) => updateExpense('educacao', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Lazer (€)' : 'Lazer (R$)'}
                  value={formData.currentExpenses.lazer || ''}
                  onChange={(e) => updateExpense('lazer', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
                
                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Outros (€)' : 'Outros (R$)'}
                  value={formData.currentExpenses.outros || ''}
                  onChange={(e) => updateExpense('outros', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="md:col-span-2"
                />
              </div>

              {errors.currentExpenses && (
                <p className="text-small text-error-600">{errors.currentExpenses}</p>
              )}

              <div className="bg-neutral-100 rounded-base p-sm">
                <div className="flex justify-between items-center">
                  <span className="text-body font-semibold text-neutral-700">Total de Despesas:</span>
                  <span className="text-h4 font-bold text-neutral-900">
                    {formatCurrency(Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-xs">
                  <span className="text-small text-neutral-600">Saldo Disponível:</span>
                  <span className={`text-body font-semibold ${
                    formData.monthlyIncome - Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0) >= 0 
                      ? 'text-success-600' 
                      : 'text-error-600'
                  }`}>
                    {formatCurrency(formData.monthlyIncome - Object.values(formData.currentExpenses).reduce((sum, val) => sum + val, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 4: Meta Principal */}
          {currentStep === 4 && (
            <div className="space-y-lg">
              <div className="text-center mb-md">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-sm">
                  <Target className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-h3 font-bold text-neutral-900 mb-xs">
                  Qual é sua meta principal?
                </h2>
                <p className="text-body text-neutral-600">
                  Escolha o objetivo financeiro mais importante para você neste momento
                </p>
              </div>

              <div className="space-y-sm">
                {[
                  { value: 'fazer_sobrar', label: 'Fazer o dinheiro sobrar no fim do mês', description: 'Equilibrar receitas e despesas' },
                  { value: 'quitar_divida', label: 'Quitar dívidas', description: 'Sair do vermelho e recuperar o crédito' },
                  { value: 'criar_reserva', label: 'Criar reserva de emergência', description: 'Ter segurança financeira para imprevistos' },
                  { value: 'controlar_gastos', label: 'Controlar gastos impulsivos', description: 'Evitar compras desnecessárias' }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => updateFormData('primaryGoal', goal.value)}
                    className={`
                      w-full text-left p-md rounded-base border-2 transition-all duration-base
                      ${formData.primaryGoal === goal.value
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start gap-sm">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                        ${formData.primaryGoal === goal.value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'}
                      `}>
                        {formData.primaryGoal === goal.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-body font-semibold text-neutral-900">{goal.label}</p>
                        <p className="text-small text-neutral-600 mt-xs">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {errors.primaryGoal && (
                <p className="text-small text-error-600">{errors.primaryGoal}</p>
              )}

              <div className="mt-lg">
                <label className="block text-small font-medium text-neutral-700 mb-sm">
                  Como você se identifica?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  {[
                    { value: 'iniciante_perdido', label: 'Iniciante', description: 'Não sei por onde começar' },
                    { value: 'frustrado_anonimo', label: 'Frustrado', description: 'Já tentei e não funcionou' },
                    { value: 'sem_tempo', label: 'Sem Tempo', description: 'Preciso de algo rápido' },
                    { value: 'gastador_impulsivo', label: 'Impulsivo', description: 'Tenho dificuldade em controlar' }
                  ].map((persona) => (
                    <button
                      key={persona.value}
                      type="button"
                      onClick={() => updateFormData('personaType', persona.value)}
                      className={`
                        text-left p-sm rounded-base border transition-all duration-base
                        ${formData.personaType === persona.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }
                      `}
                    >
                      <p className="text-body font-semibold text-neutral-900">{persona.label}</p>
                      <p className="text-small text-neutral-600 mt-xs">{persona.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Etapa 5: WOW Moment */}
          {currentStep === 5 && (
            <div className="space-y-lg text-center">
              <div className="mb-md">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-sm animate-pulse">
                  <Sparkles className="w-8 h-8 text-success-500" />
                </div>
                <h2 className="text-h3 font-bold text-neutral-900 mb-xs">
                  Tudo pronto! 🎉
                </h2>
                <p className="text-body text-neutral-600">
                  Seu perfil financeiro foi criado com sucesso
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-lg p-lg border border-primary-100">
                <h3 className="text-h4 font-bold text-neutral-900 mb-md">
                  Aqui está o que preparamos para você:
                </h3>
                
                <div className="space-y-sm text-left">
                  <div className="flex items-start gap-sm bg-white rounded-base p-sm">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-semibold text-neutral-900">Dashboard Personalizado</p>
                      <p className="text-small text-neutral-600">Com KPIs baseados na sua realidade financeira</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-sm bg-white rounded-base p-sm">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-semibold text-neutral-900">Orçamento Inicial</p>
                      <p className="text-small text-neutral-600">Calculado com base nas suas despesas atuais</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-sm bg-white rounded-base p-sm">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-semibold text-neutral-900">Plano de Ação</p>
                      <p className="text-small text-neutral-600">Para atingir sua meta: {
                        formData.primaryGoal === 'fazer_sobrar' ? 'Fazer o dinheiro sobrar' :
                        formData.primaryGoal === 'quitar_divida' ? 'Quitar dívidas' :
                        formData.primaryGoal === 'criar_reserva' ? 'Criar reserva de emergência' :
                        'Controlar gastos impulsivos'
                      }</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-sm bg-white rounded-base p-sm">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body font-semibold text-neutral-900">Categorização Inteligente</p>
                      <p className="text-small text-neutral-600">IA que aprende seus padrões de consumo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-info-50 border border-info-200 rounded-base p-sm">
                <p className="text-small text-info-700">
                  <strong>Próximo passo:</strong> Vamos ao seu dashboard! 
                  Lá você poderá importar extratos bancários e começar a organizar suas finanças.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-lg border-t border-neutral-200 mt-xl">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
              loading={loading}
              disabled={loading}
            >
              {currentStep === 5 ? 'Ir para o Dashboard' : 'Próxima Etapa'}
              {currentStep < 5 && <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Alert Modal */}
      <AlertComponent />
    </div>
  );
}
