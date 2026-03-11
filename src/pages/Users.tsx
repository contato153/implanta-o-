import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { UserProfile, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export function Users() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, role: currentUserRole } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfiles = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: Role) => {
    if (currentUserRole !== 'admin') return;
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, role: newRole } : p
      ));
      showToast('Permissão atualizada com sucesso', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar permissão: ' + err.message, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || currentUserRole !== 'admin') return;
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;
      
      setProfiles(profiles.filter(p => p.id !== userToDelete.id));
      showToast('Usuário removido com sucesso', 'success');
      setUserToDelete(null);
    } catch (err: any) {
      showToast('Erro ao remover usuário: ' + err.message, 'error');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Usuário não autenticado.', 'error');
      return;
    }
    if (currentUserRole !== 'admin') return;
    
    setIsSubmitting(true);
    try {
      // Abordagem para evitar sobrescrever a sessão atual do admin:
      // Criamos um client temporário do Supabase com persistSession = false.
      // Assim, o signUp não afeta o localStorage nem a sessão ativa do navegador.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configurações do Supabase ausentes.');
      }

      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });

      const { data, error } = await tempSupabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Usa o client principal (autenticado como admin) para salvar o profile
        const supabase = getSupabase();
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: newEmail,
            full_name: newName,
            role: newRole
          });

        if (profileError) {
          console.error('Erro ao salvar perfil:', profileError);
          showToast('Usuário criado na autenticação, mas houve erro ao salvar o perfil.', 'error');
        } else {
          showToast('Usuário criado com sucesso', 'success');
        }
      }

      setIsModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('viewer');
      
      fetchProfiles(); // Recarrega a lista
    } catch (err: any) {
      showToast('Erro ao criar usuário: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/50 text-purple-300 border border-purple-700/50';
      case 'manager':
        return 'bg-green-900/50 text-green-300 border border-green-700/50';
      case 'viewer':
      default:
        return 'bg-[#1E1E1E] text-[#BDBDBD] border border-[#333333]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] p-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded shadow-lg text-white transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Gerenciar Usuários</h1>
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F4C400] text-black font-semibold rounded-lg hover:bg-[#FFD84D] transition-colors shadow-sm"
            >
              <Plus size={20} />
              Adicionar Usuário
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-[#161616] shadow-xl overflow-hidden sm:rounded-xl border border-[#1E1E1E]">
          <table className="min-w-full divide-y divide-[#1E1E1E]">
            <thead className="bg-[#1E1E1E]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                  Permissão
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#BDBDBD]">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C400]"></div>
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#BDBDBD]">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {profile.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#BDBDBD]">
                      {profile.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(profile.role)}`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-4">
                        {currentUserRole === 'admin' ? (
                          <>
                            {profile.id === user?.id ? (
                              <span className="text-[#F4C400] italic text-xs w-[120px] font-semibold">Você</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <select
                                  value={profile.role}
                                  onChange={(e) => updateRole(profile.id, e.target.value as Role)}
                                  className="block w-[120px] py-1.5 px-3 border border-[#333333] bg-[#0B0B0B] text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] sm:text-sm transition-colors"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="manager">Gestor</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => setUserToDelete(profile)}
                                  className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                                  title="Remover usuário"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[#BDBDBD] italic text-xs">Sem permissão</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#1E1E1E]">
            <div className="flex justify-between items-center p-6 border-b border-[#1E1E1E]">
              <h2 className="text-xl font-bold text-white">Adicionar Usuário</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#BDBDBD] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0B0B0B] border border-[#333333] text-white rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="exemplo@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0B0B0B] border border-[#333333] text-white rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Senha Temporária
                </label>
                <input
                  type="text"
                  id="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0B0B0B] border border-[#333333] text-white rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Permissão
                </label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-4 py-2 bg-[#0B0B0B] border border-[#333333] text-white rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                >
                  <option value="viewer">Viewer</option>
                  <option value="manager">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#333333] text-[#BDBDBD] font-medium rounded-lg hover:bg-[#1E1E1E] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#F4C400] text-black font-semibold rounded-lg hover:bg-[#FFD84D] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Criando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161616] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#1E1E1E]">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 text-red-500 mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Excluir Usuário</h3>
              <p className="text-[#BDBDBD] text-center mb-6">
                Tem certeza que deseja apagar este usuário?
                <br />
                <span className="text-white font-medium mt-2 block">{userToDelete.email}</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2 border border-[#333333] text-[#BDBDBD] font-medium rounded-lg hover:bg-[#1E1E1E] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


