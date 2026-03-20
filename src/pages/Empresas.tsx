import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCnpj } from '../lib/formatters';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { AddCompanyModal } from '../components/AddCompanyModal';
import { deleteCompany, getClientData } from '../services/api';

export function Empresas() {
  const { clients, loading, carregarEmpresas, setSelectedClientId } = useCompany();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchCnpj, setSearchCnpj] = useState('');
  const [searchCode, setSearchCode] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesName = (client.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCnpj = client.cnpj?.includes(searchCnpj);
      const matchesCode = client.codigo_interno?.includes(searchCode);
      
      return matchesName && matchesCnpj && matchesCode;
    });
  }, [clients, searchTerm, searchCnpj, searchCode]);

  const handleAdd = () => {
    setEditingCompanyId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingCompanyId(id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (role !== 'admin') {
      alert('Permissão negada: Apenas administradores podem excluir empresas.');
      return;
    }
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteCompany(showDeleteConfirm);
      await carregarEmpresas();
      setShowDeleteConfirm(null);
      alert('Empresa excluída com sucesso!');
    } catch (error: any) {
      alert(`Erro ao excluir empresa: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDashboard = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate(`/empresa/${clientId}`);
  };

  const handleSuccess = async (newId: string) => {
    await carregarEmpresas();
    setIsModalOpen(false);
    setEditingCompanyId(null);
  };

  const selectedCompanyToDelete = clients.find(c => c.id === showDeleteConfirm);

  return (
    <div className="min-h-screen bg-brand-black p-6 md:p-10 font-sans text-brand-text-primary">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text-primary mb-1">Empresas</h1>
            <p className="text-brand-text-muted text-sm">Gerencie o cadastro de empresas do sistema</p>
          </div>
          <button 
            onClick={carregarEmpresas}
            className="p-2 text-brand-text-muted hover:text-brand-text-primary transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="bg-brand-dark/50 p-4 rounded-xl border border-brand-gray/50 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
            <input 
              type="text"
              placeholder="Buscar empresa (Nome ou Fantasia)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-brand-accent outline-none transition-colors"
            />
          </div>
          <div className="w-48 relative">
            <input 
              type="text"
              placeholder="Buscar CNPJ..."
              value={searchCnpj}
              onChange={(e) => setSearchCnpj(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg py-2.5 px-4 text-sm focus:border-brand-accent outline-none transition-colors"
            />
          </div>
          <div className="w-32 relative">
            <input 
              type="text"
              placeholder="Código..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg py-2.5 px-4 text-sm focus:border-brand-accent outline-none transition-colors"
            />
          </div>
          <button 
            onClick={handleAdd}
            className="bg-brand-accent hover:bg-brand-accent-hover text-brand-black font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand-accent/10 whitespace-nowrap"
          >
            <Plus size={20} />
            Nova Empresa
          </button>
        </div>

        {/* Table */}
        <div className="bg-brand-dark/50 rounded-xl border border-brand-gray/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-gray/50 text-[10px] uppercase tracking-wider text-brand-text-muted font-bold">
                  <th className="px-6 py-4 w-24">Código</th>
                  <th className="px-6 py-4">Nome Empresarial</th>
                  <th className="px-6 py-4">CNPJ</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray/30">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-brand-text-muted">
                      <div className="flex justify-center items-center gap-2 relative">
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
                         Carregando empresas...
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-brand-text-muted italic">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr 
                      key={client.id} 
                      onClick={() => handleOpenDashboard(client.id)}
                      className="hover:bg-brand-gray/10 transition-colors group cursor-pointer border-b border-brand-gray/20 last:border-0"
                    >
                      <td className="px-6 py-4 text-brand-accent font-mono text-sm font-bold">
                        {client.codigo_interno || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-text-primary leading-tight uppercase">{client.razao_social}</div>
                        <div className="text-[11px] text-brand-text-muted uppercase mt-0.5">{client.nome_fantasia}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-text-muted">
                        {client.cnpj ? formatCnpj(client.cnpj) : '-'}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-4">
                          <button 
                            onClick={() => handleOpenDashboard(client.id)}
                            className="text-brand-accent hover:text-brand-accent-hover transition-colors"
                            title="Acessar Painel"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(client.id)}
                            className="text-brand-text-muted hover:text-brand-text-primary transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          {role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteClick(client.id)}
                              className="text-red-500 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
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
      </div>

      {/* Modals */}
      <AddCompanyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
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
              <h3 className="text-xl font-black text-brand-text-primary text-center mb-2 uppercase tracking-tighter leading-tight">
                TEM CERTEZA QUE DESEJA APAGAR ESTA EMPRESA?
              </h3>
              <div className="bg-brand-black/50 rounded-lg p-3 mb-4 border border-brand-gray/30">
                <p className="text-brand-accent text-sm font-bold text-center">
                  {selectedCompanyToDelete?.nome_fantasia || selectedCompanyToDelete?.razao_social}
                </p>
              </div>
              <p className="text-brand-text-muted text-xs text-center mb-8 font-medium uppercase tracking-widest">
                "Essa ação não poderá ser desfeita."
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 border border-brand-gray text-brand-text-muted font-bold rounded-lg bg-brand-black hover:bg-brand-gray hover:text-brand-text-primary transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
