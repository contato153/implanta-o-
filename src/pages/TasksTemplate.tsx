import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TarefasTemplate } from '../types';
import { getSupabase } from '../lib/supabase';
import { getTasksTemplate, createTemplateTask, updateTemplateTask } from '../services/api';

export function TasksTemplate() {
  const [tasks, setTasks] = useState<TarefasTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { role } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TarefasTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    descricao: '',
    prioridade: 'P1' as 'P1' | 'P2' | 'P3',
    proprietario: '',
    aplicacao: '',
    produtos: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasksTemplate();
      setTasks(data);
    } catch (err: any) {
      setError('Erro ao carregar tarefas padrão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (task?: TarefasTemplate) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        descricao: task.descricao,
        prioridade: task.prioridade,
        proprietario: task.proprietario === 'DITE' ? '' : task.proprietario,
        aplicacao: task.aplicacao || '',
        produtos: task.produtos || '',
        observacoes: task.observacoes || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        descricao: '',
        prioridade: 'P1',
        proprietario: '',
        aplicacao: '',
        produtos: '',
        observacoes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData, proprietario: formData.proprietario || null };
      if (editingTask) {
        await updateTemplateTask(editingTask.id, dataToSave);
        showToast('Tarefa padrão atualizada com sucesso!', 'success');
      } else {
        await createTemplateTask(dataToSave);
        showToast('Tarefa padrão criada com sucesso!', 'success');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      showToast('Erro ao salvar tarefa: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      const supabase = getSupabase();
      const { error: deleteError } = await supabase
        .from('tarefas_template')
        .delete()
        .eq('id', taskToDelete);

      if (deleteError) throw deleteError;

      showToast('Tarefa padrão excluída com sucesso!', 'success');
      fetchTasks();
    } catch (err: any) {
      console.error('Erro ao excluir tarefa:', err);
      showToast('Erro ao excluir tarefa: ' + err.message, 'error');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleInlineUpdate = async (id: string, field: 'proprietario' | 'aplicacao', value: string) => {
    try {
      await updateTemplateTask(id, { [field]: value });
      showToast(`Campo atualizado com sucesso!`, 'success');
      fetchTasks();
    } catch (err: any) {
      showToast('Erro ao atualizar campo: ' + err.message, 'error');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-brand-text-muted">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const ordem = { P1: 1, P2: 2, P3: 3 };
    const prioridadeA = a.prioridade as keyof typeof ordem;
    const prioridadeB = b.prioridade as keyof typeof ordem;
    return (ordem[prioridadeA] || 4) - (ordem[prioridadeB] || 4);
  });

  const filteredTasks = sortedTasks.filter(t => {
    const matchesPriority = prioridadeFiltro === 'Todas' || t.prioridade === prioridadeFiltro;
    const matchesSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-brand-black p-4 md:p-8 font-sans text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded shadow-lg text-white transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tarefas Padrão</h1>
          <p className="text-brand-text-muted">Gerencie a lista mestra de tarefas para novos projetos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-brand-text-muted uppercase">Buscar:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-brand-black border border-brand-gray text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
              placeholder="Nome da tarefa..."
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-brand-text-muted uppercase">Prioridade:</label>
            <select
              value={prioridadeFiltro}
              onChange={(e) => setPrioridadeFiltro(e.target.value)}
              className="bg-brand-black border border-brand-gray text-white rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
            >
              <option value="Todas">Todas</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-brand-black font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-brand-accent/10 whitespace-nowrap"
          >
            <Plus size={20} />
            Nova Tarefa Padrão
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-brand-dark rounded-xl border border-brand-gray shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-black border-b border-brand-gray">
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Prioridade</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Descrição</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Departamento</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Aplicação</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Produtos</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Observações</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brand-text-muted">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
                        Carregando tarefas padrão...
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brand-text-muted italic">
                      Nenhuma tarefa padrão encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-brand-gray/30 transition-colors group">
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-md text-sm font-bold ${
                          task.prioridade === 'P1' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                          task.prioridade === 'P2' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' :
                          'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                        }`}>
                          {task.prioridade}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium">{task.descricao}</td>
                      <td className="p-4 text-sm text-brand-text-muted">
                      <select
                        value={task.proprietario && task.proprietario.trim() !== 'DITE' ? task.proprietario : ''}
                        onChange={(e) => handleInlineUpdate(task.id, 'proprietario', e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-brand-text-muted focus:text-white cursor-pointer appearance-none"
                      >
                        <option value="">-</option>
                        <option value="DITE">DITE</option>
                        <option value="FISCAL">FISCAL</option>
                        <option value="CLIENTE">CLIENTE</option>
                        <option value="PESSOAL">PESSOAL</option>
                        <option value="CONTÁBIL">CONTÁBIL</option>
                      </select>
                      </td>
                      <td className="p-4 text-sm text-brand-text-muted">
                        <select
                          value={task.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}
                          onChange={(e) => handleInlineUpdate(task.id, 'aplicacao', e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-brand-text-muted focus:text-white cursor-pointer appearance-none"
                        >
                          <option value="APLICA">APLICA</option>
                          <option value="NÃO APLICA">NÃO APLICA</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-brand-text-muted">{task.produtos || '-'}</td>
                      <td className="p-4 text-sm text-brand-text-muted max-w-xs truncate" title={task.observacoes}>
                        {task.observacoes || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(task)}
                            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task.id)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h2>
            <p className="text-brand-text-muted mb-6">
              Tem certeza que deseja excluir esta tarefa padrão? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="flex-1 px-4 py-2 border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-brand-gray">
            <div className="flex justify-between items-center p-6 border-b border-brand-gray">
              <h2 className="text-xl font-bold text-white">
                {editingTask ? 'Editar Tarefa Padrão' : 'Nova Tarefa Padrão'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-brand-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Descrição *</label>
                <textarea
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Prioridade *</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as 'P1' | 'P2' | 'P3' })}
                    className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Departamento</label>
                  <select
                    value={formData.proprietario || ''}
                    onChange={(e) => setFormData({ ...formData, proprietario: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="DITE">DITE</option>
                    <option value="FISCAL">FISCAL</option>
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="PESSOAL">PESSOAL</option>
                    <option value="CONTÁBIL">CONTÁBIL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Aplicação</label>
                  <select
                    value={formData.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}
                    onChange={(e) => setFormData({ ...formData, aplicacao: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
                  >
                    <option value="APLICA">APLICA</option>
                    <option value="NÃO APLICA">NÃO APLICA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Produtos</label>
                  <input
                    type="text"
                    value={formData.produtos}
                    onChange={(e) => setFormData({ ...formData, produtos: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                  rows={2}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-accent text-brand-black font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
