import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogIn } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Logo URLs
  const darkLogo = "https://i.imgur.com/8SuQt5R.png";
  const lightLogo = "https://i.imgur.com/xjIoTJO.png";
  const currentLogo = theme === 'dark' ? darkLogo : lightLogo;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Falha ao fazer login. Verifique suas credenciais.';
      
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Erro de conexão com o servidor. Verifique se as variáveis de ambiente do Supabase estão configuradas corretamente no Vercel.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[var(--color-brand-black)]">
      {/* Subtle background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl pointer-events-none bg-[var(--color-brand-accent)]/5"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-3xl pointer-events-none bg-[var(--color-brand-accent)]/5"></div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full rounded-2xl shadow-2xl border p-8 relative z-10 bg-[var(--color-brand-dark)] border-[var(--color-brand-gray)]">
        
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <img 
            src={currentLogo} 
            alt="L&M Logo" 
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-brand-text-primary)]">Bem-vindo de volta</h1>
          <p className="text-[var(--color-brand-text-muted)] mt-2">Faça login para acessar o sistema</p>
        </div>

        {error && (
          <div className="border-l-4 p-4 mb-6 rounded-md bg-red-900/20 border-red-500">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-[var(--color-brand-text-muted)]">
              Email corporativo
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-accent)] focus:border-[var(--color-brand-accent)] transition-colors bg-[var(--color-brand-dark)] border-[var(--color-brand-gray)] text-[var(--color-brand-text-primary)] placeholder-[var(--color-brand-text-muted)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-[var(--color-brand-text-muted)]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-accent)] focus:border-[var(--color-brand-accent)] transition-colors bg-[var(--color-brand-dark)] border-[var(--color-brand-gray)] text-[var(--color-brand-text-primary)] placeholder-[var(--color-brand-text-muted)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[var(--color-brand-black)] bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-brand-black)] transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-brand-black)]"></div>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
