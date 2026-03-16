import React, { useState, useMemo } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2, ExternalLink, Search, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddCompanyModal } from '../components/AddCompanyModal';
import { deleteCompany } from '../services/api';

export function Companies() {
  const { clients, setSelectedClientId, refreshClients, loading } = useCompany();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterCnpj, setFilterCnpj] = useState('');
  const [filterCode, setFilterCode] = useState('');

  const handleEdit = (id: string) => {
    setEditingCompanyId(id);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompanyId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (role !== 'admin') return;
    if (window.confirm(`Tem certeza que deseja excluir a empresa ${name}?`)) {
      try {
        await deleteCompany(id);
        await refreshClients();
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        alert('Erro ao excluir empresa.');
      }
    }
  };

  const handleSelect = (id: string) => {
    setSelectedClientId(id);
    navigate('/status-empresa');
  };

  const formatCNPJ = (value: string | undefined) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Frontend filtering logic
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const nameMatch = (client.razao_social || '').toLowerCase().includes(filterName.toLowerCase()) || 
                        (client.nome_fantasia || '').toLowerCase().includes(filterName.toLowerCase());
      const cnpjMatch = (client.cnpj || '').replace(/\D/g, '').includes(filterCnpj.replace(/\D/g, ''));
      const codeMatch = (client.codigo_interno || '').toLowerCase().includes(filterCode.toLowerCase()) ||
                        client.id.toLowerCase().includes(filterCode.toLowerCase());
      
      return nameMatch && cnpjMatch && codeMatch;
    });
  }, [clients, filterName, filterCnpj, filterCode]);

  return (
    <div className="min-h-screen bg-brand-black p-4 md:p-8 font-sans text-white">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Empresas</h1>
          <p className="text-brand-text-muted">Gerencie o cadastro de empresas do sistema</p>
        </div>
        <button
          onClick={refreshClients}
          className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors"
          title="Atualizar lista"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filter Bar */}
        <div className="bg-brand-dark p-4 rounded-xl border border-brand-gray shadow-xl flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
            <input
              type="text"
              placeholder="Buscar empresa (Nome ou Fantasia)..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray rounded-lg py-2 pl-10 pr-4 text-sm focus:border-brand-accent outline-none transition-all"
            />
          </div>
          
          <div className="w-full md:w-48">
            <input
              type="text"
              placeholder="Buscar CNPJ..."
              value={filterCnpj}
              onChange={(e) => setFilterCnpj(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray rounded-lg py-2 px-4 text-sm focus:border-brand-accent outline-none transition-all"
            />
          </div>

          <div className="w-full md:w-32">
            <input
              type="text"
              placeholder="Código..."
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray rounded-lg py-2 px-4 text-sm focus:border-brand-accent outline-none transition-all"
            />
          </div>

          {(role === 'admin' || role === 'manager') && (
            <button
              onClick={handleAdd}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-brand-black font-bold py-2 px-6 rounded-lg transition-all shadow-lg shadow-brand-accent/10 whitespace-nowrap"
            >
              <Plus size={20} />
              Nova Empresa
            </button>
          )}
        </div>

        {/* Companies Table */}
        <div className="bg-brand-dark rounded-xl border border-brand-gray shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-black border-b border-brand-gray">
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Código</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Nome Empresarial</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">CNPJ</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">I.E.</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">I.M.</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Objetivo</th>
                  <th className="p-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brand-text-muted">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent"></div>
                        Carregando empresas...
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brand-text-muted italic">
                      {clients.length === 0 ? 'Nenhuma empresa cadastrada.' : 'Nenhuma empresa encontrada para os filtros aplicados.'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-brand-gray/30 transition-colors group">
                      <td className="p-4 font-mono text-brand-accent text-xs">
                        {client.codigo_interno || client.id.slice(0, 8)}
                      </td>
                      <td className="p-4 font-medium">
                        {client.razao_social}
                        {client.nome_fantasia && (
                          <span className="block text-xs text-brand-text-muted">{client.nome_fantasia}</span>
                        )}
                      </td>
                      <td className="p-4 text-xs">{formatCNPJ(client.cnpj)}</td>
                      <td className="p-4 text-xs">{client.ie || '-'}</td>
                      <td className="p-4 text-xs">{client.im || '-'}</td>
                      <td className="p-4 text-xs max-w-xs truncate" title={client.objetivo_empresa}>
                        {client.objetivo_empresa || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSelect(client.id)}
                            className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                            title="Selecionar e Ver Dashboard"
                          >
                            <ExternalLink size={18} />
                          </button>
                          {(role === 'admin' || role === 'manager') && (
                            <button
                              onClick={() => handleEdit(client.id)}
                              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {role === 'admin' && (
                            <button
                              onClick={() => handleDelete(client.id, client.razao_social)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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

      <AddCompanyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={async (id) => {
          await refreshClients();
          setIsModalOpen(false);
        }} 
        companyId={editingCompanyId}
      />
    </div>
  );
}
