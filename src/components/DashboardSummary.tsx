import React from 'react';
import { ClientData } from '../types';

interface DashboardSummaryProps {
  data: ClientData | null;
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
        <h3 className="text-brand-text-muted text-sm uppercase">Fase</h3>
        <p className="text-2xl font-bold text-white">{data.projeto?.fase || 'N/A'}</p>
      </div>
      <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
        <h3 className="text-brand-text-muted text-sm uppercase">Progresso</h3>
        <p className="text-2xl font-bold text-white">{data.percentual_conclusao || 0}%</p>
      </div>
      <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
        <h3 className="text-brand-text-muted text-sm uppercase">Tarefas</h3>
        <p className="text-2xl font-bold text-white">{data.tarefas?.length || 0}</p>
      </div>
    </div>
  );
}
