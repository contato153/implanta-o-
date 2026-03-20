import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Empresas } from './pages/Empresas';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { Users } from './pages/Users';
import { ProjectTasks } from './pages/ProjectTasks';
import { ProductivityDashboard } from './pages/ProductivityDashboard';
import { TasksTemplate } from './pages/TasksTemplate';
import { CnpjConsultation } from './pages/CnpjConsultation';
import { Historico } from './pages/Historico';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedLayout } from './components/ProtectedLayout';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';

import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text-primary)]">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/empresa/:id" element={<CompanyDashboard />} />
              <Route path="/dashboard" element={<ProductivityDashboard />} />
              <Route path="/consultar-cnpj" element={<CnpjConsultation />} />
              <Route path="/project/:projectId/tasks" element={<ProjectTasks />} />
              <Route path="/" element={<Navigate to="/empresas" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
              <Route path="/historico" element={<Historico />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/users" element={<Users />} />
              <Route path="/tasks-template" element={<TasksTemplate />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;