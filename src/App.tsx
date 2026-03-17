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
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedLayout } from './components/ProtectedLayout';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <div className="min-h-screen bg-black">
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

                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/users" element={<Users />} />
                  <Route path="/tasks-template" element={<TasksTemplate />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </div>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;