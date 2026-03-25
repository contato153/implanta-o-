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
import { registrarHistorico } from '../services/historico';

const ObservationCell = ({ text, onClick }: { text: string; onClick: () => void }) => {
  if (!text) return (
    <div className="flex justify-center">
      <span className="text-brand-text-muted">*</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="p-1 text-brand-text-muted hover:text-brand-accent hover:bg-brand-black border border-transparent hover:border-brand-gray rounded transition-all flex-shrink-0"
        title="Ver observação completa"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
      <span 
        className="truncate text-brand-text-muted text-xs flex-1 min-w-0" 
        title={text}
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {text}
      </span>
    </div>
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
          <h3 className="text-xl font-black text-brand-text-primary text-center mb-2 uppercase tracking-tighter leading-tight">
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
              className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-brand-text-primary transition-all text-xs uppercase tracking-widest disabled:opacity-50"
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
  companyName?: string;
  taskName: string;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({ taskId, projectId, companyName, taskName, role, setToast, onAttachmentsChange }) => {
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

      await registrarHistorico({
        entidade: 'tarefa',
        entidade_id: taskId,
        acao: 'ANEXO_ADICIONADO',
        descricao: `Arquivo anexado na tarefa: ${taskName}`,
        detalhes: {
          empresa: {
            id: projectId,
            nome: companyName || '-'
          },
          anexo: {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size
          },
          tarefa: {
            id: taskId,
            nome: taskName
          }
        }
      });
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

  const handleDownload = async (file: AnexoTarefa) => {
    try {
      const supabase = getSupabase();
      
      // Extrair o caminho do arquivo da URL salva
      // Formato esperado: .../storage/v1/object/public/task-files/projeto-id/tarefa-id/nome-arquivo.ext
      const urlParts = file.file_url.split('task-files/');
      if (urlParts.length <= 1) {
        // Se não conseguir extrair o caminho, tenta abrir a URL original
        window.open(file.file_url, '_blank');
        return;
      }
      
      const filePath = urlParts[1];
      
      // Tenta obter uma URL assinada (funciona para buckets públicos e privados)
      const { data, error } = await supabase.storage
        .from('task-files')
        .createSignedUrl(filePath, 60);
        
      if (error) {
        console.warn('Erro ao criar URL assinada, tentando URL pública:', error);
        const { data: publicData } = supabase.storage
          .from('task-files')
          .getPublicUrl(filePath);
        
        if (publicData?.publicUrl) {
          window.open(publicData.publicUrl, '_blank');
        } else {
          window.open(file.file_url, '_blank');
        }
      } else if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        window.open(file.file_url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao processar download:', error);
      window.open(file.file_url, '_blank');
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
    return role === 'admin';
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between border-b border-brand-gray pb-2">
        <h4 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
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
                  <p className="text-sm text-brand-text-primary font-medium truncate max-w-[200px] sm:max-w-xs" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {new Date(file.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="p-2 text-brand-text-muted hover:text-brand-accent hover:bg-brand-gray rounded-lg transition-all"
                  title="Abrir"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="p-2 text-brand-text-muted hover:text-green-400 hover:bg-brand-gray rounded-lg transition-all"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
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
  companyName?: string;
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const ViewAttachmentsModal: React.FC<ViewAttachmentsModalProps> = ({ task, companyName, isOpen, onClose, role, setToast, onAttachmentsChange }) => {
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
          <h3 className="text-lg font-bold text-brand-text-primary flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-brand-accent" />
            Anexos: {task.titulo || task.descricao}
          </h3>
          <button 
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text-primary p-1 rounded-full hover:bg-brand-gray transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-brand-dark">
          <div className="-mt-6"> {/* Offset the mt-6 from TaskAttachmentsSection */}
            <TaskAttachmentsSection 
              taskId={task.id} 
              projectId={task.projeto_id} 
              companyName={companyName}
              taskName={task.titulo || task.descricao}
              role={role} 
              setToast={setToast}
              onAttachmentsChange={onAttachmentsChange}
            />
          </div>
        </div>
        <div className="p-4 border-t border-brand-gray bg-brand-black flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-gray border border-brand-gray text-brand-text-primary font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm text-sm"
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
  companyName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Tarefa>) => Promise<void>;
  role: Role;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  onAttachmentsChange?: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, companyName, isOpen, onClose, onSave, role, setToast, onAttachmentsChange }) => {
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
      const dataToSave = { ...formData };
      if (dataToSave.status === 'CONCLUÍDA' && !dataToSave.data_conclusao) {
        dataToSave.data_conclusao = new Date().toISOString();
      }
      await onSave(dataToSave);
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
          <h3 className="text-xl font-bold text-brand-text-primary uppercase tracking-wider">Editar Tarefa</h3>
          <button onClick={onClose} className="p-2 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-gray rounded-full transition-all">
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
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                placeholder="Descreva a tarefa..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Prioridade</label>
              <select
                value={formData.prioridade || 'P2'}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                disabled={role !== 'admin'}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
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
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
              >
                <option value="NÃO INICIADA">NÃO INICIADA</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA">CONCLUÍDA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Departamento</label>
              <select
                value={formData.proprietario || ''}
                onChange={(e) => handleChange('proprietario', e.target.value)}
                disabled={!canEditAll}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
              >
                <option value="">-</option>
                <option value="DITE">DITE</option>
                <option value="FISCAL">FISCAL</option>
                <option value="CLIENTE">CLIENTE</option>
                <option value="PESSOAL">PESSOAL</option>
                <option value="CONTÁBIL">CONTÁBIL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Aplicação</label>
              <select
                value={formData.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}
                onChange={(e) => handleChange('aplicacao', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none appearance-none"
              >
                <option value="APLICA">APLICA</option>
                <option value="NÃO APLICA">NÃO APLICA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Início</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.data_tarefa ? formData.data_tarefa.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = formData.data_tarefa?.includes('T') ? formData.data_tarefa.split('T')[1] : '';
                    handleChange('data_tarefa', date ? (time ? `${date}T${time}` : date) : '');
                  }}
                  disabled={!canEditTasks}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                />
                <input
                  type="time"
                  value={formData.data_tarefa?.includes('T') ? formData.data_tarefa.split('T')[1] : ''}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = formData.data_tarefa ? formData.data_tarefa.split('T')[0] : getLocalISOString();
                    handleChange('data_tarefa', time ? `${date}T${time}` : date);
                  }}
                  disabled={!canEditTasks}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Término</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.data_termino ? formData.data_termino.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = formData.data_termino?.includes('T') ? formData.data_termino.split('T')[1] : '';
                    handleChange('data_termino', date ? (time ? `${date}T${time}` : date) : '');
                  }}
                  disabled={!canEditTasks}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                />
                <input
                  type="time"
                  value={formData.data_termino?.includes('T') ? formData.data_termino.split('T')[1] : ''}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = formData.data_termino ? formData.data_termino.split('T')[0] : getLocalISOString();
                    handleChange('data_termino', time ? `${date}T${time}` : date);
                  }}
                  disabled={!canEditTasks}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Observações</label>
              <textarea
                rows={4}
                value={formData.observacoes || ''}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                disabled={!canEditTasks}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent disabled:bg-brand-gray/50 disabled:text-brand-text-muted transition-all outline-none resize-none"
              />
            </div>
          </div>

          <TaskAttachmentsSection 
            taskId={task.id} 
            projectId={task.projeto_id} 
            companyName={companyName}
            taskName={task.titulo || task.descricao}
            role={role} 
            setToast={setToast}
            onAttachmentsChange={onAttachmentsChange}
          />

          <div className="flex justify-end gap-4 pt-6 border-t border-brand-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-black border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-brand-text-primary transition-all disabled:opacity-50"
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
          <h3 className="text-xl font-black text-brand-text-primary text-center mb-2 uppercase tracking-tighter leading-tight">
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
              className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-brand-text-primary transition-all text-xs uppercase tracking-widest disabled:opacity-50"
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
    data_tarefa: getLocalISOString(),
    data_termino: '',
    aplicacao: 'APLICA',
    observacoes: '',
    data_conclusao: ''
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
      const dataToSave = { ...formData };
      if (dataToSave.status === 'CONCLUÍDA' && !dataToSave.data_conclusao) {
        dataToSave.data_conclusao = new Date().toISOString();
      }
      await onSave(dataToSave);
      onClose();
      setFormData({
        titulo: '',
        prioridade: 'P2',
        proprietario: '',
        status: 'NÃO INICIADA',
        data_tarefa: getLocalISOString(),
        data_termino: '',
        aplicacao: 'APLICA',
        observacoes: '',
        data_conclusao: ''
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
          <h3 className="text-xl font-bold text-brand-text-primary uppercase tracking-wider">Nova Tarefa</h3>
          <button onClick={onClose} className="p-2 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-gray rounded-full transition-all">
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
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                placeholder="Título da tarefa"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
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
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
              >
                <option value="NÃO INICIADA">NÃO INICIADA</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA">CONCLUÍDA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Departamento</label>
              <select
                value={formData.proprietario || ''}
                onChange={(e) => handleChange('proprietario', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
              >
                <option value="">-</option>
                <option value="DITE">DITE</option>
                <option value="FISCAL">FISCAL</option>
                <option value="CLIENTE">CLIENTE</option>
                <option value="PESSOAL">PESSOAL</option>
                <option value="CONTÁBIL">CONTÁBIL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Aplicação</label>
              <select
                value={formData.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}
                onChange={(e) => handleChange('aplicacao', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none appearance-none"
              >
                <option value="APLICA">APLICA</option>
                <option value="NÃO APLICA">NÃO APLICA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Início</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.data_tarefa ? formData.data_tarefa.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = formData.data_tarefa?.includes('T') ? formData.data_tarefa.split('T')[1] : '';
                    handleChange('data_tarefa', date ? (time ? `${date}T${time}` : date) : '');
                  }}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                />
                <input
                  type="time"
                  value={formData.data_tarefa?.includes('T') ? formData.data_tarefa.split('T')[1] : ''}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = formData.data_tarefa ? formData.data_tarefa.split('T')[0] : getLocalISOString();
                    handleChange('data_tarefa', time ? `${date}T${time}` : date);
                  }}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Data Término</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.data_termino ? formData.data_termino.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = formData.data_termino?.includes('T') ? formData.data_termino.split('T')[1] : '';
                    handleChange('data_termino', date ? (time ? `${date}T${time}` : date) : '');
                  }}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                />
                <input
                  type="time"
                  value={formData.data_termino?.includes('T') ? formData.data_termino.split('T')[1] : ''}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = formData.data_termino ? formData.data_termino.split('T')[0] : getLocalISOString();
                    handleChange('data_termino', time ? `${date}T${time}` : date);
                  }}
                  className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">Observações</label>
              <textarea
                rows={4}
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                className="w-full px-4 py-3 bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-brand-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-black border border-brand-gray text-brand-text-muted font-bold rounded-lg hover:bg-brand-gray hover:text-brand-text-primary transition-all disabled:opacity-50"
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
  companyName?: string;
  role: Role;
  onUpdate: () => void;
  onTaskUpdate?: (task: Tarefa) => void;
  onTaskAdd?: (task: Tarefa) => void;
  onTaskDelete?: (taskId: string) => void;
  onImport?: () => void;
  highlightedTaskId?: string;
  initialStatusFilter?: string;
  initialDeadlineFilter?: string;
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

const isNotApplicable = (t: Tarefa) => normalizeStatus(t.aplicacao) === 'NAO APLICA';
const isDone = (t: Tarefa) => (t as any).concluida === true || normalizeStatus(t.status) === 'CONCLUIDA';
const isDoing = (t: Tarefa) => normalizeStatus(t.status) === 'EM EXECUCAO';
const isNotStarted = (t: Tarefa) => normalizeStatus(t.status) === 'NAO INICIADA';

type DeadlineStatus = 'OVERDUE' | 'TODAY' | 'FUTURE' | 'NO_DATE' | 'COMPLETED';

const getDeadlineStatus = (task: Tarefa): DeadlineStatus => {
  if (isDone(task)) return 'COMPLETED';
  if (!task.data_termino) return 'NO_DATE';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(task.data_termino);
  if (isNaN(taskDate.getTime())) return 'NO_DATE';
  
  const taskDateOnly = new Date(taskDate);
  taskDateOnly.setHours(0, 0, 0, 0);

  if (taskDateOnly < today) return 'OVERDUE';
  if (taskDateOnly.getTime() === today.getTime()) return 'TODAY';
  return 'FUTURE';
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  
  if (!dateStr.includes('T')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
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
      return 'bg-green-100 text-green-800 border-green-200';
    case 'EM EXECUCAO':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const DeadlineIndicator: React.FC<{ status: DeadlineStatus }> = ({ status }) => {
  if (status === 'OVERDUE') {
    return (
      <div className="group relative inline-flex items-center ml-1">
        <span className="text-red-500 cursor-help text-xs">🔴</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-max px-2 py-1 bg-brand-black text-brand-text-primary text-[10px] font-bold rounded shadow-lg border border-brand-gray z-50">
          Atrasada
        </div>
      </div>
    );
  }
  if (status === 'TODAY') {
    return (
      <div className="group relative inline-flex items-center ml-1">
        <span className="text-yellow-500 cursor-help text-xs">🟡</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-max px-2 py-1 bg-brand-black text-brand-text-primary text-[10px] font-bold rounded shadow-lg border border-brand-gray z-50">
          Vence hoje
        </div>
      </div>
    );
  }
  if (status === 'FUTURE') {
    return (
      <div className="group relative inline-flex items-center ml-1">
        <span className="text-green-500 cursor-help text-xs">🟢</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-max px-2 py-1 bg-brand-black text-brand-text-primary text-[10px] font-bold rounded shadow-lg border border-brand-gray z-50">
          Dentro do prazo
        </div>
      </div>
    );
  }
  return null;
};

interface TaskCardProps {
  task: Tarefa;
  isViewer: boolean;
  canEditAll: boolean;
  attachmentCount: number;
  onEdit: (task: Tarefa) => void;
  onDelete: (task: Tarefa) => void;
  onViewAttachments: (task: Tarefa) => void;
  onViewObservation: (text: string) => void;
  isSelected: boolean;
  onToggle: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isViewer, 
  canEditAll, 
  attachmentCount,
  onEdit,
  onDelete,
  onViewAttachments,
  onViewObservation,
  isSelected,
  onToggle
}) => {
  const deadlineStatus = getDeadlineStatus(task);

  return (
    <div className={`bg-brand-dark border ${isSelected ? 'border-brand-accent' : 'border-brand-gray'} rounded-xl p-4 space-y-4 shadow-sm flex gap-3`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1"
      />
      <div className="flex justify-between items-start gap-2 flex-1">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.prioridade)}`}>
              {task.prioridade}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
          <h4 className="text-brand-text-primary font-bold text-sm leading-tight">{task.descricao}</h4>
        </div>
        {!isViewer && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="text-brand-accent hover:text-brand-accent-hover p-2 rounded bg-brand-black border border-brand-gray"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {canEditAll && (
              <button
                onClick={() => onDelete(task)}
                className="text-red-500 hover:text-red-400 p-2 rounded bg-brand-black border border-brand-gray"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-brand-gray/50">
        <div>
          <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-0.5">Departamento</span>
          <span className="text-xs text-brand-text-primary">{task.proprietario || '-'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-0.5">Aplicação</span>
          <span className="text-xs text-brand-text-primary">{task.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-0.5">Início</span>
          <span className="text-xs text-brand-text-primary">{task.data_tarefa || '-'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-0.5">Término</span>
          <span className="text-xs text-brand-text-primary flex items-center gap-1">
            {task.data_termino || '-'}
            {task.data_termino && <DeadlineIndicator status={deadlineStatus} />}
          </span>
        </div>
        {task.observacoes && (
          <div className="col-span-2">
            <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mb-0.5">Observações</span>
            <div className="flex items-center gap-2 bg-brand-black/30 p-2 rounded border border-brand-gray/30">
              <button
                onClick={() => onViewObservation(task.observacoes || '')}
                className="p-1 text-brand-accent hover:text-brand-accent-hover flex-shrink-0"
                title="Ver observação completa"
              >
                <Eye className="w-4 h-4" />
              </button>
              <p 
                className="text-xs text-brand-text-muted truncate flex-1"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {task.observacoes}
              </p>
            </div>
          </div>
        )}
        {attachmentCount > 0 && (
          <div className="col-span-2 pt-1">
            <button 
              onClick={() => onViewAttachments(task)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-black rounded-lg text-xs text-brand-accent border border-brand-gray hover:border-brand-accent transition-all"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {attachmentCount} Anexo(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  projectId,
  companyName,
  role,
  onUpdate,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete,
  onImport,
  highlightedTaskId,
  initialStatusFilter = "ALL",
  initialDeadlineFilter = "ALL"
}) => {
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [deletingTask, setDeletingTask] = useState<Tarefa | null>(null);
  const [viewingAttachmentsTask, setViewingAttachmentsTask] = useState<Tarefa | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [deadlineFilter, setDeadlineFilter] = useState(initialDeadlineFilter);
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightedTaskId && highlightedRowRef.current) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightedTaskId, tasks]);

  const canEditAll = role === 'admin';
  const canCreateTasks = role === 'admin';
  const canImportStandard = role === 'admin';
  const isViewer = role === 'viewer';

  const [viewingObservation, setViewingObservation] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
    const deadlineOrder: Record<DeadlineStatus, number> = { OVERDUE: 1, TODAY: 2, FUTURE: 3, NO_DATE: 4, COMPLETED: 5 };

    return [...tasks]
      .filter(task => {
        const priorityMatch = priorityFilter === "ALL" || task.prioridade === priorityFilter;
        
        let deadlineMatch = true;
        if (deadlineFilter !== "ALL") {
          const status = getDeadlineStatus(task);
          if (deadlineFilter === "OVERDUE") deadlineMatch = status === 'OVERDUE';
          else if (deadlineFilter === "TODAY") deadlineMatch = status === 'TODAY';
          else if (deadlineFilter === "FUTURE") deadlineMatch = status === 'FUTURE';
        }
        
        const departmentMatch = departmentFilter === "ALL" || task.proprietario === departmentFilter;

        let statusMatch = true;
        if (statusFilter !== "ALL") {
          if (statusFilter === "CONCLUIDA") statusMatch = isDone(task) && !isNotApplicable(task);
          else if (statusFilter === "FAZENDO") statusMatch = isDoing(task) && !isNotApplicable(task);
          else if (statusFilter === "A_FAZER") statusMatch = isNotStarted(task) && !isNotApplicable(task);
          else if (statusFilter === "NAO_APLICA") statusMatch = isNotApplicable(task);
        }
        
        return priorityMatch && deadlineMatch && departmentMatch && statusMatch;
      })
      .sort((a, b) => {
        const orderA = priorityOrder[a.prioridade as keyof typeof priorityOrder] || 99;
        const orderB = priorityOrder[b.prioridade as keyof typeof priorityOrder] || 99;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // Secondary sort by created_at
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        
        // Fallback to id to guarantee stable sort
        return (a.id || '').localeCompare(b.id || '');
      });
  }, [tasks, priorityFilter, deadlineFilter, departmentFilter, statusFilter]);

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

  const handleBulkUpdate = async (field: 'proprietario' | 'aplicacao', novoValor: string) => {
    if (field === 'proprietario' && role !== 'admin') {
      setToast({ message: 'Apenas administradores podem alterar o departamento.', type: 'error' });
      return;
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('tarefas').update({ [field]: novoValor }).in('id', selectedTasks);
    if (error) {
      setToast({ message: 'Erro ao atualizar tarefas.', type: 'error' });
    } else {
      setToast({ message: 'Tarefas atualizadas com sucesso!', type: 'success' });
      setSelectedTasks([]);
      if (onUpdate) onUpdate();
    }
  };


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
      prioridade: role === 'admin' ? updatedTask.prioridade : editingTask.prioridade,
      status: updatedTask.status,
      proprietario: updatedTask.proprietario,
      data_tarefa: updatedTask.data_tarefa,
      data_termino: updatedTask.data_termino,
      aplicacao: updatedTask.aplicacao,
      observacoes: updatedTask.observacoes,
      data_conclusao: updatedTask.data_conclusao,
      // ✅ concluida coerente com status (normalizado)
      concluida: normalizeStatus(updatedTask.status) === 'CONCLUIDA'
    };

    const { data, error } = await supabase.from('tarefas').update(payload).eq('id', editingTask.id).select().maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Tarefa não encontrada ou sem permissão para atualizar.');

    const tarefaAntes: Record<string, any> = {
      descricao: editingTask.descricao,
      prioridade: editingTask.prioridade,
      status: editingTask.status,
      departamento: editingTask.proprietario,
      aplicacao: editingTask.aplicacao,
      data_inicio: editingTask.data_tarefa,
      data_termino: editingTask.data_termino,
      observacoes: editingTask.observacoes
    };

    const updatedData = { ...editingTask, ...updatedTask, ...(data || {}) };
    const tarefaDepois: Record<string, any> = {
      descricao: updatedData.descricao,
      prioridade: updatedData.prioridade,
      status: updatedData.status,
      departamento: updatedData.proprietario,
      aplicacao: updatedData.aplicacao,
      data_inicio: updatedData.data_tarefa,
      data_termino: updatedData.data_termino,
      observacoes: updatedData.observacoes
    };

    const getAlteracoes = (antes: Record<string, any>, depois: Record<string, any>) => {
      const alteracoes: Record<string, any> = {};
      Object.keys(depois).forEach((campo) => {
        const valorAntes = antes[campo] ?? null;
        const valorDepois = depois[campo] ?? null;
        if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
          alteracoes[campo] = {
            antes: valorAntes,
            depois: valorDepois
          };
        }
      });
      return alteracoes;
    };

    const alteracoes = getAlteracoes(tarefaAntes, tarefaDepois);

    await registrarHistorico({
      entidade: 'tarefa',
      entidade_id: editingTask.id,
      acao: editingTask.status !== updatedTask.status ? 'STATUS_ALTERADO' : 'EDITADO',
      descricao: editingTask.status !== updatedTask.status 
        ? `Status alterado para ${updatedTask.status}`
        : `Tarefa editada: ${updatedTask.descricao}`,
      detalhes: {
        empresa: {
          id: projectId,
          nome: companyName || '-'
        },
        tarefa: {
          id: editingTask.id,
          nome: updatedTask.descricao || editingTask.descricao
        },
        alteracoes: alteracoes
      }
    });

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
        observacoes: formData.observacoes,
        data_conclusao: formData.data_conclusao,
        concluida: normalizeStatus(formData.status) === 'CONCLUIDA'
      };

      const { data, error } = await supabase.from('tarefas').insert(payload).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Erro ao criar tarefa. Sem permissão ou dados inválidos.');

      await registrarHistorico({
        entidade: 'tarefa',
        entidade_id: data.id,
        acao: 'CRIADO',
        descricao: `Tarefa criada: ${data.descricao}`,
        detalhes: {
          empresa: {
            id: projectId,
            nome: companyName || '-'
          },
          tarefa: {
            id: data.id,
            nome: data.descricao
          }
        }
      });

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

      await registrarHistorico({
        entidade: 'tarefa',
        entidade_id: deletingTask.id,
        acao: 'EXCLUIDO',
        descricao: `Tarefa excluída: ${deletingTask.descricao}`,
        detalhes: {
          empresa: {
            id: projectId,
            nome: companyName || '-'
          },
          tarefa: {
            id: deletingTask.id,
            nome: deletingTask.descricao
          }
        }
      });

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
        <button 
          onClick={() => setStatusFilter('ALL')}
          className={`bg-brand-dark p-4 rounded-lg shadow-sm border text-center cursor-pointer transition-colors ${statusFilter === 'ALL' ? 'border-brand-accent bg-brand-black/40' : 'border-brand-gray hover:bg-brand-black/20'}`}
        >
          <span className="block text-2xl font-bold text-brand-text-primary">{totalValid}</span>
          <span className="text-xs text-brand-text-muted font-bold uppercase">Total (Válidas)</span>
        </button>

        <button 
          onClick={() => setStatusFilter('CONCLUIDA')}
          className={`bg-brand-dark p-4 rounded-lg shadow-sm border text-center cursor-pointer transition-colors ${statusFilter === 'CONCLUIDA' ? 'border-green-500 bg-green-900/20' : 'border-green-900/50 hover:bg-green-900/10'}`}
        >
          <span className="block text-2xl font-bold text-green-500">{completed}</span>
          <span className="text-xs text-green-500 font-bold uppercase">Concluídas</span>
        </button>

        <button 
          onClick={() => setStatusFilter('FAZENDO')}
          className={`bg-brand-dark p-4 rounded-lg shadow-sm border text-center cursor-pointer transition-colors ${statusFilter === 'FAZENDO' ? 'border-blue-500 bg-blue-900/20' : 'border-blue-900/50 hover:bg-blue-900/10'}`}
        >
          <span className="block text-2xl font-bold text-blue-500">{inProgress}</span>
          <span className="text-xs text-blue-500 font-bold uppercase">Em Execução</span>
        </button>

        <button 
          onClick={() => setStatusFilter('A_FAZER')}
          className={`bg-brand-dark p-4 rounded-lg shadow-sm border text-center cursor-pointer transition-colors ${statusFilter === 'A_FAZER' ? 'border-brand-text-muted bg-brand-black/40' : 'border-brand-gray hover:bg-brand-black/20'}`}
        >
          <span className="block text-2xl font-bold text-brand-text-muted">{notStarted}</span>
          <span className="text-xs text-gray-500 font-bold uppercase">Não Iniciadas</span>
        </button>

        <button 
          onClick={() => setStatusFilter('NAO_APLICA')}
          className={`bg-brand-dark p-4 rounded-lg shadow-sm border text-center cursor-pointer transition-colors ${statusFilter === 'NAO_APLICA' ? 'border-gray-500 bg-brand-black/40' : 'border-brand-gray hover:bg-brand-black/20'}`}
        >
          <span className="block text-2xl font-bold text-gray-500">{notApplicable}</span>
          <span className="text-xs text-gray-600 font-bold uppercase">Não Aplica</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-bold text-brand-text-primary uppercase">Lista de Tarefas</h3>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-black border border-brand-gray text-brand-text-primary text-xs font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            >
              <option value="ALL">Todos</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="FAZENDO">Fazendo</option>
              <option value="A_FAZER">A Fazer</option>
              <option value="NAO_APLICA">N/A</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Prioridade:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-brand-black border border-brand-gray text-brand-text-primary text-xs font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            >
              <option value="ALL">Todas</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Prazo:</span>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="bg-brand-black border border-brand-gray text-brand-text-primary text-xs font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            >
              <option value="ALL">Todos</option>
              <option value="OVERDUE">Atrasada</option>
              <option value="TODAY">Vence hoje</option>
              <option value="FUTURE">Dentro do prazo</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-brand-black border border-brand-gray text-brand-text-primary text-xs font-medium rounded px-2 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            >
              <option value="ALL">Todos</option>
              <option value="DITE">DITE</option>
              <option value="FISCAL">FISCAL</option>
              <option value="CLIENTE">CLIENTE</option>
              <option value="PESSOAL">PESSOAL</option>
              <option value="CONTÁBIL">CONTÁBIL</option>
            </select>
          </div>
          {canCreateTasks && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-3 py-2 bg-brand-accent text-brand-black text-sm font-medium rounded hover:bg-brand-accent-hover transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </button>
          )}
        </div>
      </div>

      <div className="bg-brand-dark shadow overflow-hidden border border-brand-gray rounded-lg flex flex-col">
        {/* Mobile View: Cards */}
        <div className="block lg:hidden p-4 space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="px-4 py-12 text-center text-brand-text-muted">
              <div className="flex flex-col items-center justify-center">
                <p className="text-lg font-medium mb-2 text-brand-text-primary">
                  {priorityFilter === 'ALL' ? 'Nenhuma tarefa cadastrada' : 'Nenhuma tarefa encontrada'}
                </p>
                <p className="text-sm mb-4 text-gray-500">
                  {priorityFilter === 'ALL' ? 'Este projeto ainda não possui tarefas.' : `Não há tarefas com prioridade ${priorityFilter}.`}
                </p>
                {/* Removed Importar Padrão button */}
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isViewer={isViewer}
                canEditAll={canEditAll}
                attachmentCount={attachmentCounts[task.id] || 0}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onViewAttachments={setViewingAttachmentsTask}
                onViewObservation={setViewingObservation}
                isSelected={selectedTasks.includes(task.id)}
                onToggle={() => {
                  if (selectedTasks.includes(task.id)) {
                    setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                  } else {
                    setSelectedTasks([...selectedTasks, task.id]);
                  }
                }}
              />
            ))
          )}
        </div>

        {selectedTasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-brand-gray rounded-lg mb-4 border border-brand-accent/20">
            <span className="text-brand-text-primary font-bold">{selectedTasks.length} tarefas selecionadas</span>
            
            <div className="flex items-center gap-2 border-l border-brand-gray/50 pl-4">
              <span className="text-xs text-brand-text-muted uppercase font-bold">Aplicação:</span>
              <button 
                onClick={() => handleBulkUpdate('aplicacao', 'APLICA')} 
                className="px-3 py-1.5 bg-brand-accent text-brand-black font-bold rounded hover:bg-brand-accent-hover transition-all text-[10px] uppercase tracking-widest"
              >
                APLICA
              </button>
              <button 
                onClick={() => handleBulkUpdate('aplicacao', 'NÃO APLICA')} 
                className="px-3 py-1.5 bg-red-600 text-white font-bold rounded hover:bg-red-500 transition-all text-[10px] uppercase tracking-widest"
              >
                NÃO APLICA
              </button>
            </div>

            {role === 'admin' && (
              <div className="flex items-center gap-2 border-l border-brand-gray/50 pl-4">
                <span className="text-xs text-brand-text-muted uppercase font-bold">Departamento:</span>
                <select
                  onChange={(e) => handleBulkUpdate('proprietario', e.target.value)}
                  value=""
                  className="px-3 py-1.5 bg-brand-black text-brand-text-primary font-bold rounded hover:bg-brand-gray transition-all text-[10px] uppercase tracking-widest border border-brand-gray/50 cursor-pointer outline-none"
                >
                  <option value="" disabled>Alterar para...</option>
                  <option value="">-</option>
                  <option value="DITE">DITE</option>
                  <option value="FISCAL">FISCAL</option>
                  <option value="CLIENTE">CLIENTE</option>
                  <option value="PESSOAL">PESSOAL</option>
                  <option value="CONTÁBIL">CONTÁBIL</option>
                </select>
              </div>
            )}
          </div>
        )}
        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-brand-gray text-sm relative border-collapse">
            <thead className="bg-brand-black sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-0 py-4 text-center font-bold text-brand-text-muted uppercase tracking-wider w-[30px] min-w-[30px] max-w-[30px] bg-brand-black sticky left-0 z-40">Prior.</th>
                <th className="px-6 py-4 text-left font-bold text-brand-text-muted uppercase tracking-wider w-[25%] max-w-[300px] min-w-[200px] bg-brand-black sticky left-[29px] z-40 border-r border-brand-gray/30">Tarefa</th>
                <th className="px-6 py-4 text-left font-bold text-brand-text-muted uppercase tracking-wider min-w-[100px]">Departamento</th>
                <th className="px-6 py-4 text-center font-bold text-brand-text-muted uppercase tracking-wider w-[120px]">Status</th>
                <th className="px-6 py-4 text-center font-bold text-brand-text-muted uppercase tracking-wider w-[90px]">Início</th>
                <th className="px-6 py-4 text-center font-bold text-brand-text-muted uppercase tracking-wider w-[90px]">Término</th>
                <th className="px-6 py-4 text-left font-bold text-brand-text-muted uppercase tracking-wider min-w-[100px]">Aplicação</th>
                <th className="px-3 py-4 text-center w-[40px] bg-brand-black border-r border-brand-gray/30">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(filteredTasks.map(t => t.id));
                      } else {
                        setSelectedTasks([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-left font-bold text-brand-text-muted uppercase tracking-wider min-w-[180px]">Observações</th>
                {!isViewer && <th className="px-6 py-4 text-center font-bold text-brand-text-muted uppercase tracking-wider w-[80px] bg-brand-black sticky right-0 z-40 border-l border-brand-gray/30">Ações</th>}
              </tr>
            </thead>
            <tbody className="bg-brand-dark divide-y divide-brand-gray">
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={role === 'viewer' ? 9 : 10} className="px-4 py-12 text-center text-brand-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-medium mb-2 text-brand-text-primary">
                        {priorityFilter === 'ALL' ? 'Nenhuma tarefa cadastrada' : 'Nenhuma tarefa encontrada'}
                      </p>
                      <p className="text-sm mb-4 text-gray-500">
                        {priorityFilter === 'ALL' ? 'Este projeto ainda não possui tarefas.' : `Não há tarefas com prioridade ${priorityFilter}.`}
                      </p>
                      {/* Removed Importar Padrão button */}
                    </div>
                  </td>
                </tr>
              )}

              {filteredTasks.map((task, idx) => {
                const rowClass = idx % 2 === 0 ? 'bg-brand-dark' : 'bg-brand-black';
                const deadlineStatus = getDeadlineStatus(task);

                return (
                  <tr 
                    key={task.id} 
                    ref={task.id === highlightedTaskId ? highlightedRowRef : null}
                    className={`${rowClass} hover:bg-brand-gray/50 transition-colors group ${task.id === highlightedTaskId ? 'animate-highlight-task highlighted-task-row' : ''} ${selectedTasks.includes(task.id) ? 'bg-brand-accent/10' : ''}`}
                  >
                  <td className={`px-0 py-3 whitespace-nowrap sticky left-0 z-20 ${rowClass} group-hover:bg-brand-gray/50 transition-colors w-[30px] min-w-[30px] max-w-[30px] text-center`}>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getPriorityColor(task.prioridade)}`}>
                      {task.prioridade}
                    </span>
                  </td>
                  <td className={`px-6 py-3 text-brand-text-primary font-bold sticky left-[29px] z-20 border-r border-brand-gray/10 ${rowClass} group-hover:bg-brand-gray/50 transition-colors w-[25%] max-w-[300px] min-w-[200px]`}>
                      <div className="flex items-center gap-2">
                        <span className="whitespace-normal break-words leading-[1.4]" title={task.descricao}>{task.descricao}</span>
                        {attachmentCounts[task.id] > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingAttachmentsTask(task);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-gray/50 rounded text-[10px] text-brand-accent border border-brand-accent/20 hover:bg-brand-gray hover:border-brand-accent transition-all cursor-pointer flex-shrink-0"
                            title="Ver anexos"
                          >
                            <Paperclip className="w-3 h-3" />
                            {attachmentCounts[task.id]}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-brand-text-muted text-xs truncate max-w-[120px]" title={task.proprietario || ''}>
                      {task.proprietario || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span 
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(task.status)} cursor-default`}
                        >
                          {task.status}
                        </span>
                        {normalizeStatus(task.status) === 'CONCLUIDA' && task.data_conclusao && (
                          <span className="text-xs text-brand-text-muted font-medium">
                            {formatDateOnly(task.data_conclusao)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-brand-text-muted text-xs text-center whitespace-nowrap">{formatDateTime(task.data_tarefa)}</td>
                    <td className="px-6 py-3 text-brand-text-muted text-xs text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {formatDateTime(task.data_termino)}
                        {task.data_termino && <DeadlineIndicator status={deadlineStatus} />}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-brand-text-muted text-xs truncate max-w-[120px]" title={task.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}>
                      {task.aplicacao === 'NÃO APLICA' ? 'NÃO APLICA' : 'APLICA'}
                    </td>
                    <td className={`px-3 py-3 text-center ${rowClass} group-hover:bg-brand-gray transition-colors`}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            if (!selectedTasks.includes(task.id)) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            }
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer accent-brand-accent"
                      />
                    </td>
                    <td className="px-6 py-3 text-brand-text-muted text-xs max-w-[250px]">
                      <ObservationCell 
                        text={task.observacoes || ''} 
                        onClick={() => setViewingObservation(task.observacoes || '')}
                      />
                    </td>
                    {!isViewer && (
                      <td className={`px-6 py-3 text-center whitespace-nowrap sticky right-0 z-20 border-l border-brand-gray/10 ${rowClass} group-hover:bg-brand-gray transition-colors`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(task)}
                            className="text-brand-accent hover:text-brand-accent-hover p-1.5 rounded hover:bg-brand-black border border-transparent hover:border-brand-gray transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {canEditAll && (
                            <button
                              onClick={() => handleDeleteClick(task)}
                              className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/20 border border-transparent hover:border-red-900/30 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observation Modal */}
      {viewingObservation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setViewingObservation(null)}
        >
          <div
            className="bg-brand-dark rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col transform transition-all scale-100 border border-brand-gray"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-brand-gray">
              <h3 className="text-lg font-bold text-brand-text-primary flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-accent" />
                Observações Completas
              </h3>
              <button
                onClick={() => setViewingObservation(null)}
                className="text-brand-text-muted hover:text-brand-text-primary p-1 rounded-full hover:bg-brand-gray transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="whitespace-pre-wrap text-brand-text-muted leading-relaxed text-sm md:text-base">{viewingObservation}</p>
            </div>
            <div className="p-4 border-t border-brand-gray bg-brand-black rounded-b-xl flex justify-end">
              <button
                onClick={() => setViewingObservation(null)}
                className="px-4 py-2 bg-brand-gray border border-brand-gray text-brand-text-primary font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          companyName={companyName}
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
          companyName={companyName}
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