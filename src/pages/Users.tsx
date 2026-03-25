import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { UserProfile, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, AlertCircle, Trash2, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { changeUserPassword, deleteUser } from '../services/api';
import { registrarHistorico } from '../services/historico';

export function Users() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, role: currentUserRole } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState<Role>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingDefaultPassword, setIsEditingDefaultPassword] = useState(false);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

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
      const oldUser = profiles.find(p => p.id === userId);
      
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, role: newRole } : p
      ));

      if (oldUser) {
        const newUser = { ...oldUser, role: newRole };
        await registrarHistorico({
          entidade: 'usuario',
          entidade_id: userId,
          acao: 'EDITADO',
          descricao: `Permissão de ${oldUser.full_name || oldUser.email} alterada para ${newRole}`,
          detalhes: {
            antes: oldUser,
            depois: newUser
          }
        });
      }

      showToast('Permissão atualizada com sucesso', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar permissão: ' + err.message, 'error');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordValue !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    if (newPasswordValue.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    
    if (!userToChangePassword) return;

    try {
      await changeUserPassword(userToChangePassword.id, newPasswordValue);
      showToast('Senha alterada com sucesso!', 'success');
      setIsPasswordModalOpen(false);
      setNewPasswordValue('');
      setConfirmPassword('');
      setUserToChangePassword(null);
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar senha.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || currentUserRole !== 'admin') return;
    
    try {
      await deleteUser(userToDelete.id);
      
      setProfiles(profiles.filter(p => p.id !== userToDelete.id));

      await registrarHistorico({
        entidade: 'usuario',
        entidade_id: userToDelete.id,
        acao: 'EXCLUIDO',
        descricao: `Usuário excluído: ${userToDelete.full_name || userToDelete.email}`
      });

      showToast('Usuário removido com sucesso', 'success');
      setUserToDelete(null);
    } catch (err: any) {
      showToast('Erro ao remover usuário: ' + err.message, 'error');
    }
  };

  const closeAddUserModal = () => {
    setIsModalOpen(false);
    setNewEmail('');
    setNewName('');
    setNewPassword('123456');
    setNewRole('viewer');
    setIsEditingDefaultPassword(false);
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
            full_name: newName,
            force_password_change: true
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
          await registrarHistorico({
            entidade: 'usuario',
            entidade_id: data.user.id,
            acao: 'CRIADO',
            descricao: `Usuário criado: ${newName || newEmail}`
          });
          showToast('Usuário criado com sucesso', 'success');
        }
      }

      closeAddUserModal();
      
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
        return 'bg-brand-gray text-brand-text-muted border border-brand-gray';
    }
  };

  return (
    <div className="min-h-screen bg-brand-black p-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded shadow-lg text-white transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-brand-text-primary">Gerenciar Usuários</h1>
          {currentUserRole === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-black font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors shadow-sm"
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

        <div className="bg-brand-dark shadow-xl overflow-hidden sm:rounded-xl border border-brand-gray">
          <table className="min-w-full divide-y divide-brand-gray">
            <thead className="bg-brand-gray">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                  Permissão
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-brand-text-muted">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-brand-text-muted">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-brand-gray/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary font-medium">
                      {profile.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-muted">
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
                              <span className="text-brand-accent italic text-xs w-[120px] font-semibold">Você</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <select
                                  value={profile.role}
                                  onChange={(e) => updateRole(profile.id, e.target.value as Role)}
                                  className="block w-[120px] py-1.5 px-3 border border-brand-gray bg-brand-black text-brand-text-primary rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="manager">Gestor</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => { setUserToChangePassword(profile); setIsPasswordModalOpen(true); }}
                                  className="text-brand-accent hover:text-brand-accent-hover p-1.5 rounded-md hover:bg-brand-accent/10 transition-colors"
                                  title="Alterar senha do usuário"
                                >
                                  <Lock size={18} />
                                </button>
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
                          <span className="text-brand-text-muted italic text-xs">Sem permissão</span>
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
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray">
            <div className="flex justify-between items-center p-6 border-b border-brand-gray">
              <h2 className="text-xl font-bold text-brand-text-primary">Adicionar Usuário</h2>
              <button 
                onClick={closeAddUserModal}
                className="text-[#BDBDBD] hover:text-brand-text-primary transition-colors"
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
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
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
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="Nome completo"
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
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                >
                  <option value="viewer">Viewer</option>
                  <option value="manager">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="p-3 bg-brand-gray/30 border border-brand-gray rounded-lg flex items-center gap-2 group">
                <button 
                  type="button"
                  onClick={() => setIsEditingDefaultPassword(!isEditingDefaultPassword)}
                  className="p-1 hover:bg-brand-gray rounded transition-colors"
                  title="Clique para editar a senha padrão"
                >
                  <Lock className="w-4 h-4 text-[#F4C400]" />
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-[#BDBDBD]">Senha padrão:</span>
                  {isEditingDefaultPassword ? (
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onBlur={() => setIsEditingDefaultPassword(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setIsEditingDefaultPassword(false);
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-transparent border-b border-[#F4C400] text-sm text-brand-text-primary outline-none px-1"
                    />
                  ) : (
                    <span 
                      className="text-sm text-brand-text-primary font-bold cursor-pointer hover:text-[#F4C400] transition-colors"
                      onClick={() => setIsEditingDefaultPassword(true)}
                    >
                      {newPassword}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="flex-1 px-4 py-2 border border-brand-gray text-[#BDBDBD] font-medium rounded-lg hover:bg-brand-gray hover:text-brand-text-primary transition-colors"
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

      {/* Password Modal */}
      {isPasswordModalOpen && userToChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray">
            <div className="flex justify-between items-center p-6 border-b border-brand-gray">
              <h2 className="text-xl font-bold text-brand-text-primary">Alterar Senha</h2>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[#BDBDBD] hover:text-brand-text-primary transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  disabled
                  value={userToChangePassword.email}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-[#BDBDBD] rounded-lg cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  required
                  minLength={6}
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#BDBDBD] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-[#F4C400] focus:border-[#F4C400] outline-none transition-all"
                  placeholder="Confirme a nova senha"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-brand-gray text-[#BDBDBD] font-medium rounded-lg hover:bg-brand-gray hover:text-brand-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#F4C400] text-black font-semibold rounded-lg hover:bg-[#FFD84D] transition-colors"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-brand-gray">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 text-red-500 mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-brand-text-primary text-center mb-2">Excluir Usuário</h3>
              <p className="text-[#BDBDBD] text-center mb-6">
                Tem certeza que deseja apagar este usuário?
                <br />
                <span className="text-brand-text-primary font-medium mt-2 block">{userToDelete.email}</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2 border border-brand-gray text-[#BDBDBD] font-medium rounded-lg hover:bg-brand-gray hover:text-brand-text-primary transition-colors"
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


