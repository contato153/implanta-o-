import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useCompany } from '../context/CompanyContext';
import { ForcePasswordChangeModal } from './ForcePasswordChangeModal';

export function ProtectedLayout() {
  const { isSidebarMinimized } = useCompany();
  
  return (
    <div className="flex min-h-screen bg-[var(--color-brand-black)] overflow-x-hidden relative">
      <ForcePasswordChangeModal />
      {/* Spacer for fixed sidebar */}
      <div className={`${isSidebarMinimized ? 'w-[80px]' : 'w-[260px]'} flex-shrink-0 transition-all duration-300`} />
      
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
