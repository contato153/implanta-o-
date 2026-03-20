import React, { useEffect, useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { getClientData } from '../services/api';
import { ClientData } from '../types';
import { Spreadsheet } from '../components/Spreadsheet';
import { Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CompanyStatus() {
  const { selectedClientId } = useCompany();
  const { role } = useAuth();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!selectedClientId || selectedClientId === 'Todos') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const clientData = await getClientData(selectedClientId);
        setData(clientData);
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedClientId]);

  if (!selectedClientId || selectedClientId === 'Todos') {
    return (
      <div className="min-h-screen bg-brand-black p-8 flex flex-col items-center justify-center text-center">
        <Building2 size={64} className="text-brand-gray mb-4" />
        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Nenhuma Empresa Selecionada</h2>
        <p className="text-brand-text-muted mb-6">Selecione uma empresa na página de Empresas para visualizar o status do projeto.</p>
        <Link 
          to="/empresas"
          className="bg-brand-accent hover:bg-brand-accent-hover text-brand-black font-bold py-2 px-6 rounded-lg transition-all"
        >
          Ir para Empresas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black font-sans text-brand-text-primary">
      <header className="p-4 md:p-8 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-text-muted text-sm mb-2">
              <Link to="/empresas" className="hover:text-brand-accent transition-colors">Empresas</Link>
              <ChevronRight size={14} />
              <span className="text-brand-accent font-medium">Status do Projeto</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-text-primary">
              {data?.empresa?.nome_fantasia || data?.empresa?.razao_social || 'Carregando...'}
            </h1>
            <p className="text-brand-text-muted mt-1">Visualização detalhada do status e progresso do projeto</p>
          </div>
          <div className="flex items-center gap-3 bg-brand-black/50 px-4 py-2 rounded-full border border-brand-gray">
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Acesso:</span>
            <span className="text-xs font-black text-brand-accent uppercase">{role}</span>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Spreadsheet data={data} loading={loading} role={role} />
        </div>
      </main>
    </div>
  );
}
