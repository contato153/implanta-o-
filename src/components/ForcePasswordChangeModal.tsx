import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function ForcePasswordChangeModal() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if the user needs to change their password
  const needsPasswordChange = user?.user_metadata?.force_password_change === true;

  if (!needsPasswordChange) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabase();
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          force_password_change: false // Remove the flag
        }
      });

      if (updateError) throw updateError;
      
      // Reload the page to ensure the new user metadata is loaded
      window.location.reload();
      
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError('Erro ao atualizar a senha: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[var(--color-brand-dark)] border border-[var(--color-brand-gray)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[var(--color-brand-gray)]">
          <div className="w-12 h-12 bg-[#F4C400]/10 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Lock className="w-6 h-6 text-[#F4C400]" />
          </div>
          <h2 className="text-xl font-bold text-center text-[var(--color-brand-text-primary)]">
            Atualização de Senha Obrigatória
          </h2>
          <p className="text-sm text-center text-[var(--color-brand-text-muted)] mt-2">
            Para sua segurança, é necessário alterar a senha padrão antes de continuar usando o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-brand-text-muted)] mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[var(--color-brand-black)] border border-[var(--color-brand-gray)] text-[var(--color-brand-text-primary)] rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-brand-text-muted)] mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[var(--color-brand-black)] border border-[var(--color-brand-gray)] text-[var(--color-brand-text-primary)] rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all pr-10"
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-[#F4C400] text-black font-bold rounded-lg hover:bg-[#F4C400]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
