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
      
      // If no client is selected but we have clients, select the first one
      if (!selectedClientId && data && data.length > 0) {
        setSelectedClientId(data[0].id);
      } else if (selectedClientId && data && !data.find(c => c.id === selectedClientId)) {
        // If selected client no longer exists, clear selection or select first
        setSelectedClientId(data.length > 0 ? data[0].id : '');
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
