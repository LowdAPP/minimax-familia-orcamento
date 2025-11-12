// Forgot Password Page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar o email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-lg py-xl">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-xl">
            <Link to="/" className="inline-flex items-center gap-xs mb-md">
              <TrendingUp className="w-10 h-10 text-primary-500" />
              <span className="text-subtitle font-bold text-neutral-900">FamíliaFinanças</span>
            </Link>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-lg shadow-lg p-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-md">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h1 className="text-title font-bold text-neutral-900 mb-sm">
                Email Enviado
              </h1>
              <p className="text-body text-neutral-700 mb-lg">
                Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
              </p>
              <p className="text-small text-neutral-600 mb-xl">
                Verifique sua caixa de entrada e spam. O link expira em 60 minutos.
              </p>
              <Link to="/login">
                <Button fullWidth>
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Resend */}
          <div className="text-center mt-md">
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="text-small text-neutral-500 hover:text-primary-500 transition-colors"
            >
              Não recebeu o email? Tente novamente
            </button>
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
            Recuperar Senha
          </h1>
          <p className="text-body text-neutral-700">
            Digite seu email cadastrado e enviaremos um link para redefinir sua senha
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {/* Error Message */}
            {error && (
              <div className="p-md bg-error-50 border border-error-500 rounded-base text-small text-error-600">
                {error}
              </div>
            )}

            {/* Info Message */}
            <div className="p-md bg-primary-50 border border-primary-200 rounded-base text-small text-neutral-700">
              Você receberá um email com um link seguro para criar uma nova senha.
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Enviar Email de Recuperação
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-xs text-small text-primary-500 hover:text-primary-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
