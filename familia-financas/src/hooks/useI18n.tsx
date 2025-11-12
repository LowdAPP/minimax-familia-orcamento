// Hook de Internacionalização
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string, userProfile?: any) => void;
  loadUserLanguage: (userLanguage?: string) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Dicionário de traduções
const translations: Record<string, Record<string, string>> = {
  'pt-PT': {
    // Common
    'common.submit': 'Submeter',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar', 
    'common.delete': 'Eliminar',
    'common.confirm': 'Confirmar',
    'common.loading': 'A carregar...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.warning': 'Aviso',
    'common.info': 'Informação',
    
    // Navigation
    'navigation.home': 'Início',
    'navigation.dashboard': 'Painel',
    'navigation.transactions': 'Movimentos',
    'navigation.budget': 'Orçamento',
    'navigation.goals': 'Metas',
    'navigation.settings': 'Configurações',
    'navigation.logout': 'Sair',
    'navigation.login': 'Entrar',
    'navigation.signup': 'Registar',
    
    // Auth
    'auth.login': 'Entrar',
    'auth.signup': 'Registar',
    'auth.email': 'Email',
    'auth.password': 'Palavra-passe',
    'auth.confirmPassword': 'Confirmar Palavra-passe',
    'auth.forgotPassword': 'Esqueci a palavra-passe',
    'auth.resetPassword': 'Repor palavra-passe',
    'auth.dontHaveAccount': 'Não tem conta?',
    'auth.alreadyHaveAccount': 'Já tem conta?',
    'auth.invalidEmail': 'Email inválido',
    'auth.passwordMismatch': 'As palavras-passe não coincidem',
    'auth.loginError': 'Erro ao iniciar sessão',
    'auth.signupError': 'Erro ao registar conta',
    'auth.signupSuccess': 'Conta criada com sucesso!',
    
    // Dashboard
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.totalBalance': 'Saldo Total',
    'dashboard.monthlyIncome': 'Rendimento Mensal',
    'dashboard.monthlyExpenses': 'Despesas Mensais',
    'dashboard.savings': 'Poupança',
    'dashboard.recentTransactions': 'Movimentos Recentes',
    'dashboard.addTransaction': 'Adicionar Movimento',
    'dashboard.uploadStatement': 'Enviar Extrato PDF',
    'dashboard.viewAll': 'Ver Todos',
    'dashboard.financialHealth': 'Saúde Financeira',
    'dashboard.good': 'Boa',
    'dashboard.needsAttention': 'Atenção Necessária',
    'dashboard.poor': 'Pobre',
    
    // Premium
    'premium.upgrade': 'Upgrade Premium',
    'premium.features': 'Funcionalidades Premium',
    'premium.unlimitedPDF': 'Importação ilimitada de PDFs',
    'premium.advancedReports': 'Relatórios avançados',
    'premium.prioritySupport': 'Suporte prioritário',
    'premium.customCategories': 'Categorias personalizadas',
    'premium.price': '29,97€',
    'premium.perYear': 'por ano',
    'premium.currentPlan': 'Plano Atual',
    'premium.premiumPlan': 'Plano Premium',
    'premium.cancelAnytime': 'Cancele a qualquer momento',
    
    // Landing Page
    'landing.title': 'Faça Sobrar no Primeiro Mês',
    'landing.subtitle': 'Sistema profissional de gestão financeira familiar que combina metodologias comprovadas para ajudar famílias a saírem do vermelho',
    'landing.getStarted': 'Começar Grátis',
    'landing.cta': 'Junte-se a mais de 73 milhões de brasileiros',
    'landing.feature1': 'Upload automático de extratos PDF',
    'landing.feature2': '3 metodologias de orçamento comprovadas',
    'landing.feature3': 'Calculadora de quitação de dívidas',
    'landing.feature4': 'Metas com gamificação',
    'landing.pricing': 'Apenas €29,97 por ano',
    'landing.moneyBack': 'Garantia de 30 dias',
    
    // Features
    'features.title': 'Metodologias Comprovadas',
    'features.subtitle': 'Baseado em pesquisa científica e casos de sucesso reais',
    'features.envelope': 'Método do Envelope',
    'features.envelopeDesc': 'Atribua um envelope digital para cada categoria de gastos',
    'features.rule503020': 'Regra 50/30/20', 
    'features.rule503020Desc': '50% necessidades, 30% desejos, 20% poupança',
    'features.debtSnowball': 'Snowball vs Avalanche',
    'features.debtSnowballDesc': 'Simulação científica de quitação de dívidas',
    'features.gamification': 'Gamificação',
    'features.gamificationDesc': 'Metas com conquistas e badges motivacionais'
  },
  
  'pt-BR': {
    // Common
    'common.submit': 'Enviar',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.confirm': 'Confirmar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.warning': 'Aviso',
    'common.info': 'Informação',
    
    // Navigation
    'navigation.home': 'Início',
    'navigation.dashboard': 'Painel',
    'navigation.transactions': 'Transações',
    'navigation.budget': 'Orçamento',
    'navigation.goals': 'Metas',
    'navigation.settings': 'Configurações',
    'navigation.logout': 'Sair',
    'navigation.login': 'Entrar',
    'navigation.signup': 'Registrar',
    
    // Auth
    'auth.login': 'Entrar',
    'auth.signup': 'Registrar',
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.confirmPassword': 'Confirmar Senha',
    'auth.forgotPassword': 'Esqueci a senha',
    'auth.resetPassword': 'Redefinir senha',
    'auth.dontHaveAccount': 'Não tem uma conta?',
    'auth.alreadyHaveAccount': 'Já tem uma conta?',
    'auth.invalidEmail': 'E-mail inválido',
    'auth.passwordMismatch': 'As senhas não coincidem',
    'auth.loginError': 'Erro ao fazer login',
    'auth.signupError': 'Erro ao registrar conta',
    'auth.signupSuccess': 'Conta criada com sucesso!',
    
    // Dashboard
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.totalBalance': 'Saldo Total',
    'dashboard.monthlyIncome': 'Renda Mensal',
    'dashboard.monthlyExpenses': 'Despesas Mensais',
    'dashboard.savings': 'Poupança',
    'dashboard.recentTransactions': 'Transações Recentes',
    'dashboard.addTransaction': 'Adicionar Transação',
    'dashboard.uploadStatement': 'Enviar Extrato PDF',
    'dashboard.viewAll': 'Ver Todos',
    'dashboard.financialHealth': 'Saúde Financeira',
    'dashboard.good': 'Boa',
    'dashboard.needsAttention': 'Atenção Necessária',
    'dashboard.poor': 'Ruim',
    
    // Premium
    'premium.upgrade': 'Upgrade Premium',
    'premium.features': 'Funcionalidades Premium',
    'premium.unlimitedPDF': 'Importação ilimitada de PDFs',
    'premium.advancedReports': 'Relatórios avançados',
    'premium.prioritySupport': 'Suporte prioritário',
    'premium.customCategories': 'Categorias personalizadas',
    'premium.price': '€ 29,97',
    'premium.perYear': 'por ano',
    'premium.currentPlan': 'Plano Atual',
    'premium.premiumPlan': 'Plano Premium',
    'premium.cancelAnytime': 'Cancele a qualquer momento',
    
    // Landing Page
    'landing.title': 'Faça Sobrar no Primeiro Mês',
    'landing.subtitle': 'Sistema profissional de gestão financeira familiar que combina metodologias comprovadas para ajudar 73 milhões de brasileiros a saírem do vermelho',
    'landing.getStarted': 'Começar Grátis',
    'landing.cta': 'Junte-se a mais de 73 milhões de brasileiros',
    'landing.feature1': 'Upload automático de extratos PDF',
    'landing.feature2': '3 metodologias de orçamento comprovadas',
    'landing.feature3': 'Calculadora de quitação de dívidas',
    'landing.feature4': 'Metas com gamificação',
    'landing.pricing': 'Apenas € 29,97 por ano',
    'landing.moneyBack': 'Garantia de 30 dias',
    
    // Features
    'features.title': 'Metodologias Comprovadas',
    'features.subtitle': 'Baseado em pesquisa científica e casos de sucesso reais',
    'features.envelope': 'Método do Envelope',
    'features.envelopeDesc': 'Atribua um envelope digital para cada categoria de gastos',
    'features.rule503020': 'Regra 50/30/20',
    'features.rule503020Desc': '50% necessidades, 30% desejos, 20% poupança',
    'features.debtSnowball': 'Snowball vs Avalanche',
    'features.debtSnowballDesc': 'Simulação científica de quitação de dívidas',
    'features.gamification': 'Gamificação',
    'features.gamificationDesc': 'Metas com conquistas e badges motivacionais'
  }
};

// Formatação regional
const currencyFormatters: Record<string, (amount: number) => string> = {
  'pt-PT': (amount) => new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount),
  'pt-BR': (amount) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
};

const dateFormatters: Record<string, (date: string) => string> = {
  'pt-PT': (date) => new Intl.DateTimeFormat('pt-PT').format(new Date(date)),
  'pt-BR': (date) => new Intl.DateTimeFormat('pt-BR').format(new Date(date))
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'pt-BR'; // Default Brasil
  });

  // Função para salvar preferência no perfil do usuário e localStorage
  const setLanguage = (lang: string, userProfile?: any) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Se usuário estiver logado, salvar no perfil
    if (userProfile && lang !== userProfile.preferred_language) {
      saveUserLanguagePreference(lang);
    }
  };

  // Função para carregar preferência do usuário (chamado externamente)
  const loadUserLanguage = (userLanguage?: string) => {
    if (userLanguage) {
      setLanguageState(userLanguage);
      localStorage.setItem('language', userLanguage);
    }
  };

  // Função para salvar no perfil do usuário
  const saveUserLanguagePreference = async (lang: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            preferred_language: lang
          });
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key] || key;
    return translation;
  };

  const formatCurrency = (amount: number): string => {
    return currencyFormatters[language]?.(amount) || amount.toString();
  };

  const formatDate = (date: string): string => {
    return dateFormatters[language]?.(date) || date;
  };

  const value = {
    language,
    setLanguage: (lang: string, userProfile?: any) => setLanguage(lang, userProfile),
    loadUserLanguage,
    t,
    formatCurrency,
    formatDate
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}