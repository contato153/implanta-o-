import React, { createContext, useContext, useState, useEffect } from 'react';
import { Empresa } from '../types';
import { getClients } from '../services/api';

interface CompanyContextType {
  clients: Empresa[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  loading: boolean;
  refreshClients: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Empresa[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const refreshClients = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data || []);
      
      // Check if selected client still exists
      if (selectedClientId && data && !data.find(c => c.id === selectedClientId)) {
        setSelectedClientId('');
      }
    } catch (error) {
      console.error('Failed to load clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClients();
  }, []);

  return (
    <CompanyContext.Provider value={{ clients, selectedClientId, setSelectedClientId, loading, refreshClients }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
