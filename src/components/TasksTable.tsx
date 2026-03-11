import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Tarefa, Role, AnexoTarefa } from '../types';
import { getSupabase } from '../lib/supabase';
import { 
  Plus, Save, Trash2, X, Edit2, Eye, Check, 
  AlertCircle, FileDown, Paperclip, Download, Trash, 
  FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon,
  Loader2
} from 'lucide-react';
import { 
  getTaskAttachments, 
  uploadTaskAttachment, 
  deleteTaskAttachment 
} from '../services/api';

const ObservationCell = ({ text }: { text: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!text) return <td className="px-4 py-3 text-brand-text-muted">-</td>;

  return (
    <>
      <td
        className="px-4 py-3 text-brand-text-muted relative group align-top"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="flex items-center justify-between gap-2 max-w-xs cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <span className="truncate block flex-1">{text}</span>
          <Eye className="w-4 h-4 text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {showTooltip && !showModal && (
          <div className="absolute z-50 right-0 top-full mt-1 w-72 p-3 bg-brand-black text-white text-xs rounded-lg shadow-xl whitespace-normal break-words pointer-events-none border border-brand-gray">
            {text.length > 200 ? text.slice(0, 200) + '... (clique para ver mais)' : text}
          </div>
        )}
      </td>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-brand-dark rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col transform transition-all scale-100 border border-brand-gray"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-brand-gray">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-accent" />
                Observações Completas
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-brand-text-muted hover:text-white p-1 rounded-full hover:bg-brand-gray transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="whitespace-pre-wrap text-brand-text-muted leading-relaxed text-sm md:text-base">{text}</p>
            </div>
            <div className="p-4 border-t border-brand-gray bg-brand-black rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-brand-gray border border-brand-gray text-white font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface DeleteAttachmentConfirmationModalProps {
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAttachmentConfirmationModal: React.FC<DeleteAttachmentConfirmationModalProps> = ({ fileName, isOpen, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 text-red-500 mx-auto mb-6 border border-red-900/30">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tighter leading-tight">
            TEM CERTEZA QUE DESEJA APAGAR ESTE ANEXO?
          </h3>
          <div className="bg-brand-black/50 rounded-lg p-3 mb-4 border border-brand-gray/30">
            <p className="text-brand-accent text-sm font-bold text-center truncate">
              {fileName}
            </p>
          </div>
          <p className="text-brand-text-muted text-xs text-center mb-8 font-medium uppercase tracking-widest">
            "Essa ação não poderá ser desfeita."
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-white transition-all text-xs uppercase tracking-widest disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4" />
                  Confirmar exclusão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TaskAttachmentsSectionProps {
  taskId: string;
  projectId: string;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({ taskId, projectId, role, setToast, onAttachmentsChange }) => {
  const [attachments, setAttachments] = useState<AnexoTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<AnexoTarefa | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    setLoading(true);
    const data = await getTaskAttachments(taskId);
    setAttachments(data);
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      await uploadTaskAttachment(projectId, taskId, file, userId);
      await loadAttachments();
      if (onAttachmentsChange) onAttachmentsChange();
      setToast({ message: 'Arquivo anexado com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro no upload:', error);
      setToast({ message: 'Erro ao anexar arquivo. Verifique se a tabela task_attachments e o bucket task-files existem.', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment: AnexoTarefa) => {
    try {
      await deleteTaskAttachment(attachment.id, attachment.file_url);
      await loadAttachments();
      if (onAttachmentsChange) onAttachmentsChange();
      setToast({ message: 'Anexo removido com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setToast({ message: 'Erro ao remover anexo.', type: 'error' });
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-4 h-4" />;
    if (['pdf'].includes(ext || '')) return <FileText className="w-4 h-4 text-red-400" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-4 h-4 text-blue-400" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const canDelete = (attachment: AnexoTarefa) => {
    return role === 'admin' || attachment.uploaded_by === userId;
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between border-b border-brand-gray pb-2">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-brand-accent" />
          Anexos
        </h4>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-black border border-brand-gray text-brand-accent text-xs font-bold rounded-lg hover:bg-brand-gray transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Anexar Arquivo
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-brand-text-muted italic py-2">Nenhum anexo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-brand-black border border-brand-gray rounded-lg group hover:border-brand-accent/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-brand-gray/30 rounded-lg text-brand-text-muted group-hover:text-brand-accent transition-colors">
                  {getFileIcon(file.file_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate max-w-[200px] sm:max-w-xs" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {new Date(file.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-brand-text-muted hover:text-brand-accent hover:bg-brand-gray rounded-lg transition-all"
                  title="Abrir"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <a
                  href={file.file_url}
                  download={file.file_name}
                  className="p-2 text-brand-text-muted hover:text-green-400 hover:bg-brand-gray rounded-lg transition-all"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </a>
                {canDelete(file) && (
                  <button
                    type="button"
                    onClick={() => setDeletingAttachment(file)}
                    className="p-2 text-brand-text-muted hover:text-red-400 hover:bg-brand-gray rounded-lg transition-all"
                    title="Remover"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingAttachment && (
        <DeleteAttachmentConfirmationModal
          fileName={deletingAttachment.file_name}
          isOpen={!!deletingAttachment}
          onClose={() => setDeletingAttachment(null)}
          onConfirm={() => handleDelete(deletingAttachment)}
        />
      )}
    </div>
  );
};

interface ViewAttachmentsModalProps {
  task: Tarefa;
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const ViewAttachmentsModal: React.FC<ViewAttachmentsModalProps> = ({ task, isOpen, onClose, role, setToast, onAttachmentsChange }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-brand-dark rounded-xl shadow-2xl max-w-lg w-full border border-brand-gray overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-brand-gray bg-brand-black">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-brand-accent" />
            Anexos: {task.titulo || task.descricao}
          </h3>
          <button 
            onClick={onClose}
            className="text-brand-text-muted hover:text-white p-1 rounded-full hover:bg-brand-gray transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-brand-dark">
          <div className="-mt-6"> {/* Offset the mt-6 from TaskAttachmentsSection */}
            <TaskAttachmentsSection 
              taskId={task.id} 
              projectId={task.projeto_id} 
              role={role} 
              setToast={setToast}
              onAttachmentsChange={onAttachmentsChange}
            />
          </div>
        </div>
        <div className="p-4 border-t border-brand-gray bg-brand-black flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-gray border border-brand-gray text-white font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditTaskModalProps {
  task: Tarefa;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Tarefa>) => Promise<void>;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave, role, setToast, onAttachmentsChange }) => {
  const [formData, setFormData] = useState<Partial<Tarefa>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      setFormData({ ...task });
      setError(null);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Tarefa, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao) {
      setError('A descrição é obrigatória.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const canEditAll = role === 'admin';
  const canEditTasks = role === 'admin' || role === 'manager';
  const canEditStatus = role === 'admin' || role === 'manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-brand-gray">
        <div className="flex justify-between items-center p-6 border-b border-brand-gray sticky top-0 bg-brand-dark z-10">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Editar Tarefa</h3>
          <button onClick={onClose} className="p-2 text-brand-text-muted hover:text-white hover:bg-brand-gray rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm border border-red-900/50 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Descrição *</label>
              <input
                type="text"
                value={formData.descricao || ''}
                onChange={(e) => handleChange('descricao', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                placeholder="Descreva a tarefa..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Prioridade</label>
              <select
                value={formData.prioridade || 'P2'}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
              >
                <option value="P1">P1 - Alta</option>
                <option value="P2">P2 - Média</option>
                <option value="P3">P3 - Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Status</label>
              <select
                value={formData.status || 'NÃO INICIADA'}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={!canEditStatus}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
              >
                <option value="NÃO INICIADA">NÃO INICIADA</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA">CONCLUÍDA</option>
                <option value="NÃO APLICA">NÃO APLICA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Proprietário</label>
              <input
                type="text"
                value={formData.proprietario || ''}
                onChange={(e) => handleChange('proprietario', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Aplicação</label>
              <input
                type="text"
                value={formData.aplicacao || ''}
                onChange={(e) => handleChange('aplicacao', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Início</label>
              <input
                type="date"
                value={formData.data_tarefa || ''}
                onChange={(e) => handleChange('data_tarefa', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Término</label>
              <input
                type="date"
                value={formData.data_termino || ''}
                onChange={(e) => handleChange('data_termino', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Produtos</label>
              <input
                type="text"
                value={formData.produtos || ''}
                onChange={(e) => handleChange('produtos', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Observações</label>
              <textarea
                rows={4}
                value={formData.observacoes || ''}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none resize-none"
              />
            </div>
          </div>

          <TaskAttachmentsSection 
            taskId={task.id} 
            projectId={task.projeto_id} 
            role={role} 
            setToast={setToast}
            onAttachmentsChange={onAttachmentsChange}
          />

          <div className="flex justify-end gap-4 pt-6 border-t border-brand-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-black border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-white transition-all disabled:opacity-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-brand-accent text-brand-black font-black rounded-lg hover:bg-brand-accent-hover transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmationModalProps {
  task: Tarefa;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ task, isOpen, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray">
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 text-red-500 mx-auto mb-6 border border-red-900/30">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tighter leading-tight">
            TEM CERTEZA QUE DESEJA APAGAR ESTA TAREFA?
          </h3>
          <div className="bg-brand-black/50 rounded-lg p-3 mb-4 border border-brand-gray/30">
            <p className="text-brand-accent text-sm font-bold text-center">
              {task.titulo || task.descricao}
            </p>
          </div>
          <p className="text-brand-text-muted text-xs text-center mb-8 font-medium uppercase tracking-widest">
            "Essa ação não poderá ser desfeita."
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-white transition-all text-xs uppercase tracking-widest disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirmar exclusão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => Promise<void>;
  projectId: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, projectId }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    prioridade: 'P2',
    proprietario: '',
    status: 'NÃO INICIADA',
    data_tarefa: new Date().toISOString().split('T')[0],
    data_termino: '',
    aplicacao: '',
    produtos: '',
    observacoes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) {
      setError('O título é obrigatório.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
      setFormData({
        titulo: '',
        prioridade: 'P2',
        proprietario: '',
        status: 'NÃO INICIADA',
        data_tarefa: new Date().toISOString().split('T')[0],
        data_termino: '',
        aplicacao: '',
        produtos: '',
        observacoes: ''
      });
    } catch (err: any) {
      console.error('Erro ao criar tarefa:', err);
      setError(err.message || 'Erro ao criar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-brand-gray">
        <div className="flex justify-between items-center p-6 border-b border-brand-gray sticky top-0 bg-brand-dark z-10">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Nova Tarefa</h3>
          <button onClick={onClose} className="p-2 text-brand-text-muted hover:text-white hover:bg-brand-gray rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm border border-red-900/50 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                placeholder="Título da tarefa"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
              >
                <option value="P1">P1 - Alta</option>
                <option value="P2">P2 - Média</option>
                <option value="P3">P3 - Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
              >
                <option value="NÃO INICIADA">NÃO INICIADA</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA">CONCLUÍDA</option>
                <option value="NÃO APLICA">NÃO APLICA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Proprietário</label>
              <input
                type="text"
                value={formData.proprietario}
                onChange={(e) => handleChange('proprietario', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Aplicação</label>
              <input
                type="text"
                value={formData.aplicacao}
                onChange={(e) => handleChange('aplicacao', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Início</label>
              <input
                type="date"
                value={formData.data_tarefa}
                onChange={(e) => handleChange('data_tarefa', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Término</label>
              <input
                type="date"
                value={formData.data_termino}
                onChange={(e) => handleChange('data_termino', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Produtos</label>
              <input
                type="text"
                value={formData.produtos}
                onChange={(e) => handleChange('produtos', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Observações</label>
              <textarea
                rows={4}
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-brand-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-black border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-white transition-all disabled:opacity-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-brand-accent text-brand-black font-black rounded-lg hover:bg-brand-accent-hover transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Tarefa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TasksTableProps {
  tasks: Tarefa[];
  projectId: string;
  role: Role;
  onUpdate: () => void;
  onTaskUpdate?: (task: Tarefa) => void;
  onTaskAdd?: (task: Tarefa) => void;
  onTaskDelete?: (taskId: string) => void;
  onImport?: () => void;
}

/**
 * Normalização robusta do status (remove acentos, espaços extras, caixa alta)
 */
const normalizeStatus = (status?: string | null) =>
  (status || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();

const isNotApplicable = (t: Tarefa) => normalizeStatus(t.status) === 'NAO APLICA';
const isDone = (t: Tarefa) => (t as any).concluida === true || normalizeStatus(t.status) === 'CONCLUIDA';
const isDoing = (t: Tarefa) => normalizeStatus(t.status) === 'EM EXECUCAO';
const isNotStarted = (t: Tarefa) => normalizeStatus(t.status) === 'NAO INICIADA';

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  projectId,
  role,
  onUpdate,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
  onImport
}) => {
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [deletingTask, setDeletingTask] = useState<Tarefa | null>(null);
  const [viewingAttachmentsTask, setViewingAttachmentsTask] = useState<Tarefa | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});

  const canEditAll = role === 'admin';
  const canCreateTasks = role === 'admin' || role === 'manager';
  const canImportStandard = role === 'admin' || role === 'manager';
  const isViewer = role === 'viewer';

  // ✅ Contadores corrigidos (exclui "NÃO APLICA" e normaliza)
  const { totalValid, completed, inProgress, notStarted, notApplicable, percentCompleted } = useMemo(() => {
    const notApplicableCount = tasks.filter(isNotApplicable).length;
    const valid = tasks.filter((t) => !isNotApplicable(t));

    const done = valid.filter(isDone).length;
    const doing = valid.filter(isDoing).length;
    const todo = valid.filter(isNotStarted).length;

    const percent = valid.length > 0 ? Math.round((done / valid.length) * 100) : 0;

    return {
      totalValid: valid.length,
      completed: done,
      inProgress: doing,
      notStarted: todo,
      notApplicable: notApplicableCount,
      percentCompleted: percent
    };
  }, [tasks]);

  const fetchAttachmentCounts = useCallback(async () => {
    if (tasks.length === 0) return;
    
    try {
      const supabase = getSupabase();
      const taskIds = tasks.map(t => t.id);
      
      const { data, error } = await supabase
        .from('task_attachments')
        .select('task_id')
        .in('task_id', taskIds);
        
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.task_id] = (counts[item.task_id] || 0) + 1;
      });
      setAttachmentCounts(counts);
    } catch (err) {
      console.error('Error fetching attachment counts:', err);
    }
  }, [tasks]);

  useEffect(() => {
    fetchAttachmentCounts();
  }, [fetchAttachmentCounts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleEditClick = (task: Tarefa) => {
    if (isViewer) return;
    setEditingTask(task);
  };

  const handleSaveTask = async (updatedTask: Partial<Tarefa>) => {
    if (!editingTask) return;

    const supabase = getSupabase();

    const payload = {
      descricao: updatedTask.descricao,
      prioridade: updatedTask.prioridade,
      status: updatedTask.status,
      proprietario: updatedTask.proprietario,
      data_tarefa: updatedTask.data_tarefa,
      data_termino: updatedTask.data_termino,
      aplicacao: updatedTask.aplicacao,
      produtos: updatedTask.produtos,
      observacoes: updatedTask.observacoes,
      // ✅ concluida coerente com status (normalizado)
      concluida: normalizeStatus(updatedTask.status) === 'CONCLUIDA'
    };

    const { data, error } = await supabase.from('tarefas').update(payload).eq('id', editingTask.id).select().single();

    if (error) throw error;

    setToast({ message: 'Tarefa salva com sucesso!', type: 'success' });

    if (onTaskUpdate) {
      const updated = { ...editingTask, ...updatedTask, ...(data || {}) } as Tarefa;
      onTaskUpdate(updated);
    } else {
      onUpdate();
    }
  };

  const handleAddTask = async (formData: any) => {
    try {
      const supabase = getSupabase();

      const payload = {
        projeto_id: projectId,
        titulo: formData.titulo,
        descricao: formData.titulo,
        prioridade: formData.prioridade,
        proprietario: formData.proprietario,
        status: formData.status,
        data_tarefa: formData.data_tarefa,
        data_termino: formData.data_termino,
        aplicacao: formData.aplicacao,
        produtos: formData.produtos,
        observacoes: formData.observacoes,
        concluida: normalizeStatus(formData.status) === 'CONCLUIDA'
      };

      const { data, error } = await supabase.from('tarefas').insert(payload).select().single();
      if (error) throw error;

      setToast({ message: 'Tarefa criada com sucesso!', type: 'success' });

      if (onTaskAdd) {
        onTaskAdd(data as Tarefa);
      } else {
        onUpdate();
      }
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const handleDeleteClick = (task: Tarefa) => {
    setDeletingTask(task);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('tarefas').delete().eq('id', deletingTask.id);

      if (error) throw error;

      setToast({ message: 'Tarefa excluída com sucesso!', type: 'success' });

      if (onTaskDelete) {
        onTaskDelete(deletingTask.id);
      } else {
        onUpdate();
      }

      setDeletingTask(null);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setToast({ message: err.message || 'Erro ao excluir tarefa.', type: 'error' });
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'P1':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'P2':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P3':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (s: string) => {
    const ns = normalizeStatus(s);
    switch (ns) {
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800';
      case 'EM EXECUCAO':
        return 'bg-blue-100 text-blue-800';
      case 'NAO APLICA':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-8 relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[110] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-full duration-300 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* ✅ Indicadores corrigidos */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-brand-dark p-4 rounded-lg shadow-sm border border-brand-gray text-center">
          <span className="block text-2xl font-bold text-white">{totalValid}</span>
          <span className="text-xs text-brand-text-muted font-bold uppercase">Total (Válidas)</span>
        </div>

        <div className="bg-brand-dark p-4 rounded-lg shadow-sm border border-green-900/50 text-center">
          <span className="block text-2xl font-bold text-green-500">{completed}</span>
          <span className="text-xs text-green-500 font-bold uppercase">Concluídas</span>
        </div>

        <div className="bg-brand-dark p-4 rounded-lg shadow-sm border border-blue-900/50 text-center">
          <span className="block text-2xl font-bold text-blue-500">{inProgress}</span>
          <span className="text-xs text-blue-500 font-bold uppercase">Em Execução</span>
        </div>

        <div className="bg-brand-dark p-4 rounded-lg shadow-sm border border-brand-gray text-center">
          <span className="block text-2xl font-bold text-brand-text-muted">{notStarted}</span>
          <span className="text-xs text-gray-500 font-bold uppercase">Não Iniciadas</span>
        </div>

        <div className="bg-brand-dark p-4 rounded-lg shadow-sm border border-brand-gray text-center">
          <span className="block text-2xl font-bold text-gray-500">{notApplicable}</span>
          <span className="text-xs text-gray-600 font-bold uppercase">Não Aplica</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white uppercase">Lista de Tarefas</h3>
        {canCreateTasks && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-3 py-2 bg-brand-accent text-brand-black text-sm font-medium rounded hover:bg-brand-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Tarefa
          </button>
        )}
      </div>

      <div className="bg-brand-dark shadow border border-brand-gray rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray text-sm">
            <thead className="bg-brand-black">
              <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider w-16 sm:w-20">Prior.</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider">Tarefa</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider hidden lg:table-cell">Proprietário</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider w-24 sm:w-32">Status</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider">Data</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider hidden md:table-cell">Término</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider hidden xl:table-cell">Aplicação</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider hidden xl:table-cell">Produtos</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-bold text-brand-text-muted uppercase tracking-wider hidden sm:table-cell">Observações</th>
                {!isViewer && <th className="px-2 py-2 sm:px-4 sm:py-3 text-center font-bold text-brand-text-muted uppercase tracking-wider w-20 sm:w-24 sticky right-0 z-20 border-l border-brand-gray bg-brand-black">Ações</th>}
              </tr>
            </thead>
            <tbody className="bg-brand-dark divide-y divide-brand-gray">
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={role === 'viewer' ? 9 : 10} className="px-4 py-12 text-center text-brand-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-medium mb-2 text-white">Nenhuma tarefa cadastrada</p>
                      <p className="text-sm mb-4 text-gray-500">Este projeto ainda não possui tarefas.</p>
                      {canImportStandard && onImport && (
                        <button
                          onClick={onImport}
                          className="flex items-center px-4 py-2 bg-brand-gray text-brand-accent text-sm font-medium rounded-lg hover:bg-brand-black transition-colors border border-brand-gray"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Importar Padrão
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {tasks.map((task, idx) => {
                const rowClass = idx % 2 === 0 ? 'bg-brand-dark' : 'bg-brand-black';

                return (
                  <tr key={task.id} className={`${rowClass} hover:bg-brand-gray transition-colors group`}>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold border ${getPriorityColor(task.prioridade)}`}>
                        {task.prioridade}
                      </span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px] sm:max-w-none" title={task.descricao}>{task.descricao}</span>
                        {attachmentCounts[task.id] > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingAttachmentsTask(task);
                            }}
                            className="flex items-center gap-1 px-1 py-0.5 bg-brand-gray/50 rounded text-[9px] sm:text-[10px] text-brand-accent border border-brand-accent/20 hover:bg-brand-gray hover:border-brand-accent transition-all cursor-pointer"
                            title="Ver anexos"
                          >
                            <Paperclip className="w-2.5 h-2.5 sm:w-3 h-3" />
                            {attachmentCounts[task.id]}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-brand-text-muted hidden lg:table-cell">{task.proprietario}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-brand-text-muted whitespace-nowrap text-xs sm:text-sm">{task.data_tarefa}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-brand-text-muted whitespace-nowrap hidden md:table-cell text-xs sm:text-sm">{task.data_termino}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-brand-text-muted hidden xl:table-cell">{task.aplicacao}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-brand-text-muted hidden xl:table-cell">{task.produtos}</td>
                    <td className="hidden sm:table-cell px-2 py-2 sm:px-4 sm:py-3">
                      <ObservationCell text={task.observacoes || ''} />
                    </td>
                    {!isViewer && (
                      <td className={`px-2 py-2 sm:px-4 sm:py-3 text-center whitespace-nowrap sticky right-0 z-10 border-l border-brand-gray ${rowClass} group-hover:bg-brand-gray transition-colors`}>
                        <button
                          onClick={() => handleEditClick(task)}
                          className="text-brand-accent hover:text-brand-accent-hover mr-1 sm:mr-2 p-1 rounded hover:bg-brand-black"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                        </button>
                        {canEditAll && (
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          isOpen={!!editingTask} 
          onClose={() => setEditingTask(null)} 
          onSave={handleSaveTask} 
          role={role} 
          setToast={setToast}
          onAttachmentsChange={fetchAttachmentCounts}
        />
      )}

      <AddTaskModal isOpen={isAdding} onClose={() => setIsAdding(false)} onSave={handleAddTask} projectId={projectId} />

      {deletingTask && (
        <DeleteConfirmationModal task={deletingTask} isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={confirmDelete} />
      )}

      {viewingAttachmentsTask && (
        <ViewAttachmentsModal 
          task={viewingAttachmentsTask} 
          isOpen={!!viewingAttachmentsTask} 
          onClose={() => setViewingAttachmentsTask(null)} 
          role={role} 
          setToast={setToast}
          onAttachmentsChange={fetchAttachmentCounts}
        />
      )}
    </div>
  );
};