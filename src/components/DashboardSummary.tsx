import React from 'react';
import { ClientData } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DashboardSummaryProps {
  data: ClientData | null;
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className={`p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-brand-dark border-brand-gray'}`}>
        <h3 className={`text-sm uppercase ${isLight ? 'text-gray-600' : 'text-brand-text-muted'}`}>Fase</h3>
        <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{data.projeto?.fase || 'N/A'}</p>
      </div>
      <div className={`p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-brand-dark border-brand-gray'}`}>
        <h3 className={`text-sm uppercase ${isLight ? 'text-gray-600' : 'text-brand-text-muted'}`}>Progresso</h3>
        <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{data.percentual_conclusao || 0}%</p>
      </div>
      <div className={`p-4 rounded-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-brand-dark border-brand-gray'}`}>
        <h3 className={`text-sm uppercase ${isLight ? 'text-gray-600' : 'text-brand-text-muted'}`}>Tarefas</h3>
        <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{data.tarefas?.length || 0}</p>
      </div>
    </div>
  );
}
