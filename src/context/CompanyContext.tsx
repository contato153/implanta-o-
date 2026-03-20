import React, { createContext, useContext, useState, useEffect } from 'react';
import { Empresa } from '../types';
import { getClients } from '../services/api';
import { getSupabase } from '../lib/supabase';

interface CompanyContextType {
  clients: Empresa[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  loading: boolean;
  carregarEmpresas: () => Promise<void>;
  isSidebarMinimized: boolean;
  setIsSidebarMinimized: (minimized: boolean) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Empresa[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebar-minimized');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-minimized', String(isSidebarMinimized));
  }, [isSidebarMinimized]);

  const carregarEmpresas = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    carregarEmpresas();

    const supabase = getSupabase();
    const channel = supabase
      .channel('realtime-empresas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empresas' },
        () => {
          carregarEmpresas(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projetos' },
        () => {
          carregarEmpresas(false);
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <CompanyContext.Provider value={{ 
      clients, 
      selectedClientId, 
      setSelectedClientId, 
      loading, 
      carregarEmpresas,
      isSidebarMinimized,
      setIsSidebarMinimized
    }}>
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
