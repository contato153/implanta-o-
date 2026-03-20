import React from 'react';

export const WorkloadCard = () => {
  return (
    <div className="bg-brand-dark rounded-3xl p-6 border border-white/5 shadow-2xl w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-brand-text-muted text-xs font-semibold uppercase tracking-widest">WORKLOAD</h3>
        <button className="text-brand-accent text-xs font-semibold uppercase tracking-widest hover:text-brand-accent-hover">Manage &gt;</button>
      </div>
      <div className="relative bg-gradient-to-br from-[#2d1b4e] to-[#4c1d95] rounded-2xl p-6 h-40 flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent"></div>
        <div className="relative z-10">
          <p className="text-brand-text-muted/80 text-xs font-medium uppercase tracking-widest">Current</p>
          <p className="text-4xl font-bold text-brand-text-primary tracking-tight">56%</p>
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <p className="text-brand-text-muted/80 text-xs font-medium uppercase tracking-widest">Max. 93%</p>
        </div>
      </div>
    </div>
  );
};
