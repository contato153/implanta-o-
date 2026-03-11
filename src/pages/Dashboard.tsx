import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spreadsheet } from '../components/Spreadsheet';
import { getClientData } from '../services/api';
import { ClientData } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';

export function Dashboard() {
  const { role } = useAuth();
  const { selectedClientId, loading: companyLoading } = useCompany();
  
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load client data when selected
  useEffect(() => {
    if (!selectedClientId) {
      setClientData(null);
      setError(null);
      return;
    }
    loadData(selectedClientId);
  }, [selectedClientId]);

  const loadData = async (clientId: string) => {
    setLoadingData(true);
    setError(null);
    try {
      const data = await getClientData(clientId);
      if (!data) {
        setError('Dados do cliente não encontrados.');
      }
      setClientData(data);
    } catch (error) {
      console.error('Failed to load client data', error);
      setError('Erro ao carregar dados do cliente. Tente novamente.');
      setClientData(null);
    } finally {
      setLoadingData(false);
    }
  };

  const isLoading = companyLoading || loadingData;

  return (
    <div className="min-h-screen bg-brand-black p-4 md:p-8 font-sans text-white">
      <header className="mb-8 text-center relative">
        <h1 className="text-3xl font-bold text-white mb-2">Empresas</h1>
        <p className="text-brand-text-muted">Selecione um cliente para visualizar o status do projeto</p>
        <div className="mt-2 text-xs text-brand-text-muted">
          Acesso: <span className="font-semibold uppercase text-brand-accent">{role}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        {companyLoading && !selectedClientId ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
            <p className="text-brand-text-muted">Carregando sistema...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {selectedClientId ? (
                <>
                  <Spreadsheet data={clientData} loading={isLoading} role={role} />
                  {clientData?.projeto && (
                    <div className="mt-6 flex justify-end">
                      <Link 
                        to={`/project/${clientData.projeto.id}/tasks`}
                        className="inline-flex items-center px-4 py-2 bg-brand-accent text-brand-black font-medium rounded-lg hover:bg-brand-accent-hover transition-colors shadow-sm"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Gerenciar Tarefas do Projeto
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-brand-dark p-12 rounded-lg shadow-sm border border-brand-gray text-center text-brand-text-muted">
                  <p className="text-lg text-white">Nenhum cliente selecionado.</p>
                  <p className="text-sm mt-2">Utilize o menu lateral para selecionar uma empresa.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <footer className="mt-12 text-center text-xs text-brand-text-muted">
        <p>Sistema de Gestão Integrado &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
