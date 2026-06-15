// Página de Configurações
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { useAlert } from '../hooks/useAlert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Mail,
  Save,
  Plus,
  Trash2,
  Check,
  Crown,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface Account {
  id: string;
  nickname: string;
  institution: string;
  account_type: string;
  current_balance: number;
  is_active: boolean;
}

interface AlertConfig {
  budget_limit: boolean;
  bill_reminder: boolean;
  unusual_spending: boolean;
  savings_opportunity: boolean;
}

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const { t, setLanguage, language, formatCurrency } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'alerts' | 'subscription'>('profile');
  
  // Profile
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    monthlyIncome: profile?.monthly_income || 0,
    primaryGoal: profile?.primary_goal || 'controlar_gastos',
    personaType: profile?.persona_type || 'iniciante_perdido',
    preferredLanguage: profile?.preferred_language || 'pt-BR'
  });

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    nickname: '',
    institution: '',
    account_type: 'conta_corrente',
    initial_balance: 0
  });

  // Alerts
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    budget_limit: true,
    bill_reminder: true,
    unusual_spending: true,
    savings_opportunity: true
  });

  // Subscription
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive' | 'trial'>('trial');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');

  // Onboarding data
  const [initialBudget, setInitialBudget] = useState<{
    total_income: number;
    needs_amount: number;
    wants_amount: number;
    savings_amount: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadAccounts();
      loadAlertConfig();
      loadInitialBudget();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setAccounts(data || []);
  };

  const loadAlertConfig = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('alerts')
      .select('alert_type')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (data) {
      setAlertConfig({
        budget_limit: data.some(a => a.alert_type === 'envelope_limit'), // Atualizado
        bill_reminder: data.some(a => a.alert_type === 'due_date'), // Atualizado
        unusual_spending: data.some(a => a.alert_type === 'impulse_check'), // Atualizado
        savings_opportunity: data.some(a => a.alert_type === 'free_balance') // Atualizado
      });
    }
  };

  const loadInitialBudget = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('budgets')
      .select('total_income, needs_amount, wants_amount, savings_amount')
      .eq('user_id', user.id)
      .eq('budget_name', 'Orçamento Inicial')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setInitialBudget({
        total_income: data.total_income || 0,
        needs_amount: data.needs_amount || 0,
        wants_amount: data.wants_amount || 0,
        savings_amount: data.savings_amount || 0
      });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({
        monthly_income: profileData.monthlyIncome,
        primary_goal: profileData.primaryGoal as any,
        persona_type: profileData.personaType as any,
        preferred_language: profileData.preferredLanguage as any
      });
      
      // Atualizar o idioma imediatamente
      setLanguage(profileData.preferredLanguage, profile);
      
      showAlert({
        type: 'success',
        title: 'Sucesso!',
        message: 'Perfil atualizado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar perfil'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!user || !newAccount.nickname || !newAccount.institution) {
      showAlert({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    try {
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        nickname: newAccount.nickname,
        institution: newAccount.institution,
        account_type: newAccount.account_type,
        initial_balance: newAccount.initial_balance,
        current_balance: newAccount.initial_balance,
        is_active: true
      });

      if (error) throw error;

      setShowAccountModal(false);
      setNewAccount({
        nickname: '',
        institution: '',
        account_type: 'conta_corrente',
        initial_balance: 0
      });
      loadAccounts();
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao adicionar conta'
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadAccounts();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    }
  };

  const handleSaveAlerts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Desativar todos os alertas atuais
      await supabase
        .from('alerts')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Criar novos alertas baseados nas configurações
      const alertsToCreate = [];
      if (alertConfig.budget_limit) {
        alertsToCreate.push({
          user_id: user.id,
          alert_type: 'envelope_limit', // Corrigido para enum válido
          message: 'Você está se aproximando do limite do seu orçamento',
          is_active: true
        });
      }
      if (alertConfig.bill_reminder) {
        alertsToCreate.push({
          user_id: user.id,
          alert_type: 'due_date', // Corrigido para enum válido
          message: 'Você tem contas próximas do vencimento',
          is_active: true
        });
      }
      if (alertConfig.unusual_spending) {
        alertsToCreate.push({
          user_id: user.id,
          alert_type: 'impulse_check', // Corrigido para enum válido (ou free_balance/habit_streak)
          message: 'Detectamos um gasto incomum no seu padrão',
          is_active: true
        });
      }
      if (alertConfig.savings_opportunity) {
        alertsToCreate.push({
          user_id: user.id,
          alert_type: 'free_balance', // Corrigido para enum válido
          message: 'Você pode economizar em algumas categorias',
          is_active: true
        });
      }

      if (alertsToCreate.length > 0) {
        await supabase.from('alerts').insert(alertsToCreate);
      }

      showAlert({
        type: 'success',
        title: 'Sucesso!',
        message: 'Configurações de alertas salvas!'
      });
    } catch (error) {
      console.error('Erro ao salvar alertas:', error);
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar configurações'
      });
    } finally {
      setLoading(false);
    }
  };

  const getGoalLabel = (goal: string) => {
    const goals: Record<string, string> = {
      'fazer_sobrar': 'Fazer o dinheiro sobrar no fim do mês',
      'quitar_divida': 'Quitar dívidas',
      'criar_reserva': 'Criar reserva de emergência',
      'controlar_gastos': 'Controlar gastos impulsivos'
    };
    return goals[goal] || goal;
  };

  const getPersonaLabel = (persona: string) => {
    const personas: Record<string, { label: string; description: string }> = {
      'iniciante_perdido': { label: 'Iniciante', description: 'Não sei por onde começar' },
      'frustrado_anonimo': { label: 'Frustrado', description: 'Já tentei e não funcionou' },
      'sem_tempo': { label: 'Sem Tempo', description: 'Preciso de algo rápido' },
      'gastador_impulsivo': { label: 'Impulsivo', description: 'Tenho dificuldade em controlar' }
    };
    return personas[persona] || { label: persona, description: '' };
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div>
        <h1 className="text-h2 font-bold text-neutral-900">Configurações</h1>
        <p className="text-body text-neutral-600 mt-xs">
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Tabs */}
      <Card padding="sm">
        <div className="flex gap-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`
              flex items-center gap-xs py-sm px-md rounded-base text-body font-semibold transition-all whitespace-nowrap
              ${activeTab === 'profile'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <User className="w-4 h-4" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`
              flex items-center gap-xs py-sm px-md rounded-base text-body font-semibold transition-all whitespace-nowrap
              ${activeTab === 'accounts'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <CreditCard className="w-4 h-4" />
            Contas
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`
              flex items-center gap-xs py-sm px-md rounded-base text-body font-semibold transition-all whitespace-nowrap
              ${activeTab === 'alerts'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <Bell className="w-4 h-4" />
            Alertas
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`
              flex items-center gap-xs py-sm px-md rounded-base text-body font-semibold transition-all whitespace-nowrap
              ${activeTab === 'subscription'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-transparent text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <Crown className="w-4 h-4" />
            Assinatura
          </button>
        </div>
      </Card>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-lg">
          <Card>
            <h3 className="text-h4 font-bold text-neutral-900 mb-md">Informações Pessoais</h3>
            
            <div className="space-y-md">
              <Input
                type="email"
                label="Email"
                value={profileData.email}
                disabled
                helperText="Entre em contato para alterar o email"
              />

              <Input
                type="number"
                label={language === 'pt-PT' ? 'Renda Mensal (€)' : 'Renda Mensal (R$)'}
                value={profileData.monthlyIncome || ''}
                onChange={(e) => setProfileData({ ...profileData, monthlyIncome: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Meta Principal
                </label>
                <select
                  value={profileData.primaryGoal}
                  onChange={(e) => setProfileData({ ...profileData, primaryGoal: e.target.value as typeof profileData.primaryGoal })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="fazer_sobrar">Fazer o dinheiro sobrar</option>
                  <option value="quitar_divida">Quitar dívidas</option>
                  <option value="criar_reserva">Criar reserva de emergência</option>
                  <option value="controlar_gastos">Controlar gastos impulsivos</option>
                </select>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Perfil
                </label>
                <select
                  value={profileData.personaType}
                  onChange={(e) => setProfileData({ ...profileData, personaType: e.target.value as typeof profileData.personaType })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="iniciante_perdido">Iniciante Perdido</option>
                  <option value="frustrado_anonimo">Frustrado Anônimo</option>
                  <option value="sem_tempo">Sem Tempo</option>
                  <option value="gastador_impulsivo">Gastador Impulsivo</option>
                </select>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Idioma
                </label>
                <select
                  value={profileData.preferredLanguage}
                  onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value as typeof profileData.preferredLanguage })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                  <option value="pt-PT">🇵🇹 Português (Portugal)</option>
                </select>
                <p className="text-xs text-neutral-500 mt-xs">
                  {language === 'pt-PT' 
                    ? 'O sistema será alterado para português de Portugal, incluindo a moeda (€)'
                    : 'O sistema será alterado para português brasileiro, incluindo a moeda (R$)'}
                </p>
              </div>
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                loading={loading}
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-h4 font-bold text-neutral-900 mb-md">Onboarding</h3>
            
            {profile?.onboarding_completed ? (
              <div className="space-y-md mb-md">
                <div className="bg-success-50 border border-success-200 rounded-base p-sm mb-md">
                  <div className="flex items-center gap-sm">
                    <Check className="w-5 h-5 text-success-600 flex-shrink-0" />
                    <p className="text-body font-semibold text-success-900">
                      Onboarding completado
                    </p>
                  </div>
                </div>

                <div className="space-y-sm">
                  <div className="p-md bg-neutral-50 rounded-base">
                    <p className="text-small font-medium text-neutral-600 mb-xs">Renda Mensal</p>
                    <p className="text-h4 font-bold text-neutral-900">
                      {formatCurrency(profile.monthly_income || 0)}
                    </p>
                  </div>

                  <div className="p-md bg-neutral-50 rounded-base">
                    <p className="text-small font-medium text-neutral-600 mb-xs">Meta Principal</p>
                    <p className="text-body font-semibold text-neutral-900">
                      {getGoalLabel(profile.primary_goal || 'controlar_gastos')}
                    </p>
                  </div>

                  <div className="p-md bg-neutral-50 rounded-base">
                    <p className="text-small font-medium text-neutral-600 mb-xs">Perfil</p>
                    <p className="text-body font-semibold text-neutral-900 mb-xs">
                      {getPersonaLabel(profile.persona_type || 'iniciante_perdido').label}
                    </p>
                    <p className="text-small text-neutral-600">
                      {getPersonaLabel(profile.persona_type || 'iniciante_perdido').description}
                    </p>
                  </div>

                  {initialBudget && (
                    <div className="p-md bg-primary-50 border border-primary-200 rounded-base">
                      <p className="text-small font-medium text-primary-700 mb-sm">Orçamento Inicial (50/30/20)</p>
                      <div className="space-y-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-small text-neutral-600">Necessidades (50%)</span>
                          <span className="text-body font-semibold text-neutral-900">
                            {formatCurrency(initialBudget.needs_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-small text-neutral-600">Desejos (30%)</span>
                          <span className="text-body font-semibold text-neutral-900">
                            {formatCurrency(initialBudget.wants_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-small text-neutral-600">Poupança (20%)</span>
                          <span className="text-body font-semibold text-neutral-900">
                            {formatCurrency(initialBudget.savings_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-body text-neutral-600 mb-md">
                Complete o onboarding para personalizar sua experiência.
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/onboarding?refazer=true')}
              fullWidth
            >
              <RotateCcw className="w-4 h-4" />
              {profile?.onboarding_completed ? 'Refazer Onboarding' : 'Iniciar Onboarding'}
            </Button>
          </Card>

          <Card>
            <h3 className="text-h4 font-bold text-neutral-900 mb-md">Segurança</h3>
            
            <div className="space-y-sm">
              <Button variant="secondary" fullWidth>
                <Shield className="w-4 h-4" />
                Alterar Senha
              </Button>
              
              <Button variant="outline" fullWidth onClick={signOut}>
                Sair da Conta
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <Card>
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-h4 font-bold text-neutral-900">Minhas Contas</h3>
            <Button variant="primary" size="sm" onClick={() => setShowAccountModal(true)}>
              <Plus className="w-4 h-4" />
              Adicionar Conta
            </Button>
          </div>

          {accounts.length > 0 ? (
            <div className="space-y-sm">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-md bg-neutral-50 rounded-base"
                >
                  <div className="flex-1">
                    <p className="text-body font-semibold text-neutral-900">{account.nickname}</p>
                    <p className="text-small text-neutral-600">{account.institution}</p>
                    <p className="text-small text-neutral-500 capitalize mt-xs">
                      {account.account_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-md">
                    <div className="text-right">
                      <p className="text-small text-neutral-600">Saldo</p>
                      <p className="text-body-large font-bold text-neutral-900">
                        {formatCurrency(account.current_balance)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-base transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-lg">
              <CreditCard className="w-16 h-16 text-neutral-300 mx-auto mb-md" />
              <p className="text-body text-neutral-600 mb-xs">Nenhuma conta cadastrada</p>
              <p className="text-small text-neutral-500 mb-md">
                Adicione suas contas bancárias e cartões de crédito
              </p>
              <Button variant="primary" onClick={() => setShowAccountModal(true)}>
                <Plus className="w-4 h-4" />
                Adicionar Primeira Conta
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <Card>
          <h3 className="text-h4 font-bold text-neutral-900 mb-md">Configurações de Alertas</h3>
          <p className="text-body text-neutral-600 mb-lg">
            Escolha quais notificações você deseja receber
          </p>

          <div className="space-y-md">
            <div className="flex items-start justify-between p-md bg-neutral-50 rounded-base">
              <div className="flex-1">
                <p className="text-body font-semibold text-neutral-900">Limite de Orçamento</p>
                <p className="text-small text-neutral-600 mt-xs">
                  Receba um alerta quando estiver próximo do limite do seu orçamento
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-md">
                <input
                  type="checkbox"
                  checked={alertConfig.budget_limit}
                  onChange={(e) => setAlertConfig({ ...alertConfig, budget_limit: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-start justify-between p-md bg-neutral-50 rounded-base">
              <div className="flex-1">
                <p className="text-body font-semibold text-neutral-900">Lembrete de Contas</p>
                <p className="text-small text-neutral-600 mt-xs">
                  Lembre-me quando houver contas próximas do vencimento
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-md">
                <input
                  type="checkbox"
                  checked={alertConfig.bill_reminder}
                  onChange={(e) => setAlertConfig({ ...alertConfig, bill_reminder: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-start justify-between p-md bg-neutral-50 rounded-base">
              <div className="flex-1">
                <p className="text-body font-semibold text-neutral-900">Gasto Incomum</p>
                <p className="text-small text-neutral-600 mt-xs">
                  Alerte-me sobre gastos fora do meu padrão habitual
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-md">
                <input
                  type="checkbox"
                  checked={alertConfig.unusual_spending}
                  onChange={(e) => setAlertConfig({ ...alertConfig, unusual_spending: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-start justify-between p-md bg-neutral-50 rounded-base">
              <div className="flex-1">
                <p className="text-body font-semibold text-neutral-900">Oportunidade de Economia</p>
                <p className="text-small text-neutral-600 mt-xs">
                  Mostre-me dicas para economizar baseadas nos meus gastos
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-md">
                <input
                  type="checkbox"
                  checked={alertConfig.savings_opportunity}
                  onChange={(e) => setAlertConfig({ ...alertConfig, savings_opportunity: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
            <Button
              variant="primary"
              onClick={handleSaveAlerts}
              loading={loading}
            >
              <Save className="w-4 h-4" />
              Salvar Preferências
            </Button>
          </div>
        </Card>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-lg">
          <Card>
            <div className="flex items-start gap-md mb-lg">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-h4 font-bold text-neutral-900">Plano Família Finanças Premium</h3>
                <p className="text-body text-neutral-600 mt-xs">
                  Acesso total a todas as funcionalidades
                </p>
              </div>
              <div className="text-right">
                <p className="text-h3 font-bold text-primary-500">€29,97</p>
                <p className="text-small text-neutral-600">por ano</p>
              </div>
            </div>

            <div className="space-y-sm mb-lg">
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">Upload ilimitado de PDFs</p>
              </div>
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">Categorização automática com IA</p>
              </div>
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">3 metodologias de orçamento</p>
              </div>
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">Calculadora de quitação de dívidas</p>
              </div>
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">Alertas inteligentes personalizados</p>
              </div>
              <div className="flex items-center gap-sm">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                <p className="text-body text-neutral-700">Suporte prioritário</p>
              </div>
            </div>

            <div className="p-md bg-success-50 border border-success-200 rounded-base mb-lg">
              <div className="flex items-center gap-sm">
                <Sparkles className="w-5 h-5 text-success-600" />
                <p className="text-body font-semibold text-success-900">
                  Período de teste grátis ativo
                </p>
              </div>
              <p className="text-small text-success-700 mt-xs">
                Você está experimentando todos os recursos premium gratuitamente
              </p>
            </div>

            <Button variant="primary" fullWidth size="lg">
              <Crown className="w-5 h-5" />
              Assinar Agora - €29,97/ano
            </Button>
          </Card>

          <Card>
            <h3 className="text-h4 font-bold text-neutral-900 mb-md">Precisa de Ajuda?</h3>
            <p className="text-body text-neutral-600 mb-md">
              Nossa equipe está pronta para ajudar você a ter sucesso com suas finanças
            </p>
            <Button variant="outline" fullWidth>
              <Mail className="w-4 h-4" />
              Entrar em Contato
            </Button>
          </Card>
        </div>
      )}

      {/* Modal: Nova Conta */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-lg w-full">
            <h3 className="text-h4 font-bold text-neutral-900 mb-lg">Nova Conta</h3>
            
            <div className="space-y-md">
              <Input
                label="Apelido da Conta"
                value={newAccount.nickname}
                onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })}
                placeholder="Ex: Conta Salário"
                required
              />

              <Input
                label="Instituição"
                value={newAccount.institution}
                onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                placeholder="Ex: Banco do Brasil"
                required
              />

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Tipo de Conta <span className="text-error-500">*</span>
                </label>
                <select
                  value={newAccount.account_type}
                  onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="conta_corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="divida">Dívida</option>
                </select>
              </div>

              <Input
                type="number"
                label={language === 'pt-PT' ? 'Saldo Inicial (€)' : 'Saldo Inicial (R$)'}
                value={newAccount.initial_balance || ''}
                onChange={(e) => setNewAccount({ ...newAccount, initial_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                step="0.01"
              />
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => setShowAccountModal(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddAccount}
                fullWidth
              >
                Adicionar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
      <AlertComponent />
    </div>
  );
}
