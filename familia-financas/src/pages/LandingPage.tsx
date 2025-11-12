// Landing Page - Marketing
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import { ArrowRight, CheckCircle, TrendingUp, Shield, Users } from 'lucide-react';
import { LanguageSelector } from '../components/ui/LanguageSelector';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-lg py-sm flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            <span className="text-subtitle font-semibold text-neutral-900">FamíliaFinanças</span>
          </div>
          <div className="flex items-center gap-md">
            <LanguageSelector />
            <button
              onClick={() => navigate('/login')}
              className="text-body text-neutral-700 hover:text-primary-500 transition-colors"
            >
              {t('auth.login')}
            </button>
            <button
              onClick={handleGetStarted}
              className="px-md py-sm bg-primary-500 text-white rounded-base font-semibold hover:bg-primary-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {t('landing.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-lg py-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-hero font-bold text-neutral-900 leading-tight mb-md">
            {t('landing.title')}
          </h1>
          <p className="text-body-large text-neutral-700 leading-loose mb-xl max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-xs px-xl py-lg bg-primary-500 text-white rounded-base text-body-large font-semibold hover:bg-primary-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {t('landing.getStarted')}
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-small text-neutral-500 mt-md">
            Sem planilhas complexas. Resultados em 7 dias.
          </p>
        </div>
      </section>

      {/* Problem Section - 3 Column Stats */}
      <section className="bg-surface py-2xl">
        <div className="container mx-auto px-lg">
          <h2 className="text-title font-bold text-neutral-900 text-center mb-xl">
            O Problema das Famílias Brasileiras
          </h2>
          <div className="grid md:grid-cols-3 gap-md">
            <StatCard
              value="66%"
              label="sofrem ansiedade financeira"
              color="error"
            />
            <StatCard
              value="84%"
              label="saúde mental afetada por dívidas"
              color="warning"
            />
            <StatCard
              value="77,6%"
              label="famílias endividadas no Brasil"
              color="error"
            />
          </div>
        </div>
      </section>

      {/* Solution Section - 4 Features */}
      <section className="container mx-auto px-lg py-2xl">
        <h2 className="text-title font-bold text-neutral-900 text-center mb-xl">
          Nossa Solução
        </h2>
        <div className="grid md:grid-cols-2 gap-md">
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Categorização Automática"
            description="Upload de PDFs bancários com parsing inteligente. Sem digitação manual."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Metodologias Comprovadas"
            description="Envelope, 50/30/20, Zero-Based Budget. Escolha o método ideal para seu perfil."
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Metas e Progresso Visual"
            description="Acompanhe objetivos financeiros com badges, streaks e visualizações claras."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Alertas Inteligentes"
            description="Notificações empáticas que previnem problemas antes que aconteçam."
          />
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="bg-surface py-2xl">
        <div className="container mx-auto px-lg">
          <h2 className="text-title font-bold text-neutral-900 text-center mb-xl">
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-md max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Escolha seu Perfil"
              description="Iniciante, Frustrado, Sem Tempo ou Gastador Impulsivo"
            />
            <StepCard
              number="2"
              title="Informe sua Renda"
              description="Apenas 4 contas principais. Sem burocracia."
            />
            <StepCard
              number="3"
              title="Veja seu Orçamento"
              description="Saldo livre visível em 5 minutos. Primeira meta ativa."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-lg py-2xl">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-xl border-2 border-primary-500">
          <h3 className="text-subtitle font-semibold text-neutral-900 mb-md text-center">
            Plano Anual
          </h3>
          <div className="text-center mb-md">
            <span className="text-hero font-bold text-primary-500">29,97€</span>
            <span className="text-body text-neutral-500">/ano</span>
          </div>
          <ul className="space-y-sm mb-xl">
            <li className="flex items-center gap-xs text-body text-neutral-700">
              <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
              Upload ilimitado de PDFs
            </li>
            <li className="flex items-center gap-xs text-body text-neutral-700">
              <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
              Todas as metodologias financeiras
            </li>
            <li className="flex items-center gap-xs text-body text-neutral-700">
              <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
              Alertas inteligentes ilimitados
            </li>
            <li className="flex items-center gap-xs text-body text-neutral-700">
              <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
              Suporte via email
            </li>
          </ul>
          <button
            onClick={handleGetStarted}
            className="w-full py-lg bg-primary-500 text-white rounded-base font-semibold hover:bg-primary-600 transition-all hover:-translate-y-0.5"
          >
            Começar Agora
          </button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary-500 py-2xl">
        <div className="container mx-auto px-lg text-center">
          <h2 className="text-title font-bold text-white mb-md">
            Pronto para Fazer Sobrar?
          </h2>
          <p className="text-body-large text-white/90 mb-xl max-w-2xl mx-auto">
            Junte-se a milhares de famílias que já organizaram suas finanças
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-xs px-xl py-lg bg-white text-primary-500 rounded-base font-semibold hover:bg-neutral-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Comece Grátis Agora
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-xl">
        <div className="container mx-auto px-lg text-center">
          <p className="text-body text-neutral-500">
            © 2025 FamíliaFinanças. Desenvolvido por MiniMax Agent.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function StatCard({ value, label, color }: { value: string; label: string; color: 'error' | 'warning' }) {
  const colorClass = color === 'error' ? 'text-error-500' : 'text-warning-500';
  
  return (
    <div className="bg-white rounded-lg p-lg shadow-sm border border-neutral-200 text-center">
      <div className={`text-title font-bold ${colorClass} mb-sm`}>{value}</div>
      <div className="text-body text-neutral-700">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 mb-md">
        {icon}
      </div>
      <h3 className="text-subtitle font-semibold text-neutral-900 mb-sm">{title}</h3>
      <p className="text-body text-neutral-700">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-subtitle font-bold mx-auto mb-md">
        {number}
      </div>
      <h3 className="text-body-large font-semibold text-neutral-900 mb-sm">{title}</h3>
      <p className="text-body text-neutral-700">{description}</p>
    </div>
  );
}