import React, { useState } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { AddCompanyModal } from './AddCompanyModal';
import { deleteCompany } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';

export const ControlPanel: React.FC = () => {
  const { clients, selectedClientId, setSelectedClientId, loading, refreshClients } = useCompany();
  const { role } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSuccess = async (newId: string) => {
    await refreshClients();
    setSelectedClientId(newId);
    setEditingCompanyId(null);
  };

  const handleEdit = () => {
    if (selectedClientId) {
      setEditingCompanyId(selectedClientId);
      setIsModalOpen(true);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedClientId) return;

    if (role !== 'admin') {
      alert('Permissão negada: Apenas administradores podem excluir empresas.');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedClientId) return;

    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await deleteCompany(selectedClientId);
      await refreshClients();
      setSelectedClientId('');
      // Using a simple alert for success as per existing pattern, but the request was about the confirmation
      alert('Empresa excluída com sucesso!');
    } catch (error: any) {
      alert(`Erro ao excluir empresa: ${error.message || 'Erro desconhecido'}`);
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompanyId(null);
  };

  const handleAdd = () => {
    setEditingCompanyId(null);
    setIsModalOpen(true);
  };

  const selectedCompany = clients.find(c => c.id === selectedClientId);

  return (
    <div className="bg-brand-dark p-4 shadow-md rounded-lg flex flex-col gap-3 border border-brand-gray w-full">
      <div className="w-full">
        <label htmlFor="client-select" className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
          Selecionar Empresa
        </label>
        <select
          id="client-select"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="block w-full rounded-md border-brand-gray bg-brand-black text-white shadow-sm focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border"
          disabled={loading || isDeleting}
        >
          <option value="">-- Selecione --</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nome_fantasia || client.razao_social}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 w-full">
        {(role === 'admin' || role === 'manager') && (
          <>
            <button
              onClick={handleAdd}
              className="flex-1 inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-brand-black bg-brand-accent hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent h-[36px] transition-colors"
              title="Adicionar Nova Empresa"
              disabled={loading || isDeleting}
            >
              <Plus className="w-4 h-4" />
            </button>

            {selectedClientId && (
              <button
                onClick={handleEdit}
                className="flex-1 inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-brand-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white h-[36px] transition-colors"
                title="Editar Empresa"
                disabled={loading || isDeleting}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {role === 'admin' && selectedClientId && (
          <button
            onClick={handleDeleteClick}
            className="flex-1 inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md text-red-400 bg-red-900/20 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 h-[36px] transition-colors"
            title="Excluir Empresa"
            disabled={loading || isDeleting}
          >
            {isDeleting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}

        {role !== 'viewer' && (
          <button
            onClick={refreshClients}
            disabled={loading || isDeleting}
            className="flex-1 inline-flex items-center justify-center px-2 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-brand-black bg-brand-accent hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed h-[36px] transition-colors"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <AddCompanyModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleSuccess} 
        companyId={editingCompanyId}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-brand-gray">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 text-red-500 mx-auto mb-6 border border-red-900/30">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tighter leading-tight">
                TEM CERTEZA QUE DESEJA APAGAR ESTA EMPRESA?
              </h3>
              <div className="bg-brand-black/50 rounded-lg p-3 mb-4 border border-brand-gray/30">
                <p className="text-brand-accent text-sm font-bold text-center">
                  {selectedCompany?.nome_fantasia || selectedCompany?.razao_social}
                </p>
              </div>
              <p className="text-brand-text-muted text-xs text-center mb-8 font-medium uppercase tracking-widest">
                "Essa ação não poderá ser desfeita."
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-white transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all text-xs uppercase tracking-widest"
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
};
