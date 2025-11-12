// Reset Password Page (after clicking email link)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TrendingUp, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Verificar se há um hash de recuperação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (!accessToken) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-lg py-xl">
        <div className="w-full max-w-md">
          <div className="text-center mb-xl">
            <Link to="/" className="inline-flex items-center gap-xs mb-md">
              <TrendingUp className="w-10 h-10 text-primary-500" />
              <span className="text-subtitle font-bold text-neutral-900">FamíliaFinanças</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-md">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h1 className="text-title font-bold text-neutral-900 mb-sm">
                Senha Redefinida
              </h1>
              <p className="text-body text-neutral-700 mb-lg">
                Sua senha foi alterada com sucesso!
              </p>
              <p className="text-small text-neutral-600 mb-xl">
                Você será redirecionado para o login em alguns segundos...
              </p>
              <Link to="/login">
                <Button fullWidth>
                  Ir para o Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Criar Nova Senha
          </h1>
          <p className="text-body text-neutral-700">
            Digite sua nova senha abaixo
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-xl">
          <form onSubmit={handleSubmit} className="space-y-md">
            {/* New Password */}
            <Input
              type="password"
              label="Nova Senha"
              placeholder="Mínimo 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              helperText="Use pelo menos 6 caracteres"
            />

            {/* Confirm Password */}
            <Input
              type="password"
              label="Confirmar Nova Senha"
              placeholder="Digite a senha novamente"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

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
              Redefinir Senha
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-small text-neutral-500 hover:text-primary-500 transition-colors"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
