// Login/Signup Page
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TrendingUp, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        await signUp(formData.email, formData.password);
        navigate('/onboarding');
      } else {
        await signIn(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-lg py-xl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-xl">
          <Link to="/" className="inline-flex items-center gap-xs mb-md">
            <TrendingUp className="w-10 h-10 text-primary-500" />
            <span className="text-subtitle font-bold text-neutral-900">FamíliaFinanças</span>
          </Link>
          <h1 className="text-title font-bold text-neutral-900 mb-sm">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de Volta'}
          </h1>
          <p className="text-body text-neutral-700">
            {isSignUp 
              ? 'Comece a organizar suas finanças hoje' 
              : 'Entre para acessar seu painel financeiro'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-xl">
          <form onSubmit={handleSubmit} className="space-y-md">
            {/* Email */}
            <Input
              type="email"
              label="Email"
              placeholder="seu@email.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />

            {/* Password */}
            <div>
              <Input
                type="password"
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                helperText={isSignUp ? 'Use pelo menos 6 caracteres' : undefined}
              />
              {!isSignUp && (
                <div className="text-right mt-xs">
                  <Link
                    to="/forgot-password"
                    className="text-small text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              )}
            </div>

            {/* Confirm Password (only for signup) */}
            {isSignUp && (
              <Input
                type="password"
                label="Confirmar Senha"
                placeholder="Digite a senha novamente"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="p-md bg-error-50 border border-error-500 rounded-base text-small text-error-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>

            {/* Toggle Sign Up/In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-small text-primary-500 hover:text-primary-600 font-medium"
                disabled={loading}
              >
                {isSignUp 
                  ? 'Já tem uma conta? Entre aqui' 
                  : 'Não tem conta? Cadastre-se grátis'
                }
              </button>
            </div>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-md">
          <Link 
            to="/" 
            className="text-small text-neutral-500 hover:text-primary-500 transition-colors"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
