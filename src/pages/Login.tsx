import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-brand-black px-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-brand-dark rounded-2xl shadow-2xl border border-brand-gray p-8 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <img 
            src="https://i.imgur.com/8SuQt5R.png" 
            alt="L&M Logo" 
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-brand-text-muted mt-2">Faça login para acessar o sistema</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-muted mb-2">
              Email corporativo
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-brand-black border border-brand-gray rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors placeholder-[#333333]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-text-muted mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-brand-black border border-brand-gray rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors placeholder-[#333333]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-brand-black bg-brand-accent hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-accent transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-black"></div>
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
