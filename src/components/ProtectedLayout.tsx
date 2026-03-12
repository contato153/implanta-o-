import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function ProtectedLayout() {
  return (
    <div className="flex min-h-screen bg-brand-black overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
