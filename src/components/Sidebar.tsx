import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, CheckSquare, Users, LogOut, Search, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ControlPanel } from './ControlPanel';
import { useCompany } from '../context/CompanyContext';
import { getClientData } from '../services/api';

export function Sidebar() {
  const { signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedClientId, clients } = useCompany();
  const [isNavigatingTasks, setIsNavigatingTasks] = useState(false);

  const selectedCompany = clients.find(c => c.id === selectedClientId);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleTasksClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Selecione uma empresa primeiro.');
      return;
    }
    
    setIsNavigatingTasks(true);
    try {
      const data = await getClientData(selectedClientId);
      if (data?.projeto?.id) {
        navigate(`/project/${data.projeto.id}/tasks`);
      } else {
        alert('Nenhum projeto encontrado para a empresa selecionada.');
      }
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      alert('Erro ao acessar tarefas do projeto.');
    } finally {
      setIsNavigatingTasks(false);
    }
  };

  const isTasksActive = location.pathname.includes('/tasks');

  return (
    <aside className="sticky top-0 min-h-screen w-[260px] flex-shrink-0 bg-brand-dark border-r border-brand-gray flex flex-col shadow-xl z-50">
      <div className="p-6">
        <div className="flex justify-center items-center mb-8 py-6">
          <img 
            src="https://i.imgur.com/8SuQt5R.png" 
            alt="L&M Logo" 
            className="h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col">
          <NavLink
            to={selectedClientId ? `/empresa/${selectedClientId}` : "/empresas"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                (isActive || location.pathname.includes('/empresa/')) && !isTasksActive
                  ? 'text-brand-accent bg-brand-gray shadow-md'
                  : 'text-brand-text-muted hover:bg-brand-gray hover:text-white'
              }`
            }
          >
            <Building2 size={20} />
            <span className="font-medium">Empresas</span>
          </NavLink>
          {selectedCompany && (
            <div className="flex flex-col mt-1 ml-6 border-l-2 border-brand-gray/30 pl-2 gap-1">
              <div className="px-3 py-1.5 rounded-md bg-brand-gray/20 border border-brand-gray/30 flex flex-col gap-0.5">
                <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Empresa Selecionada</span>
                <span className="text-xs text-brand-accent font-mono font-bold truncate" title={selectedCompany.nome_fantasia || selectedCompany.razao_social}>
                  {selectedCompany.codigo_interno ? `${selectedCompany.codigo_interno} - ` : ''}
                  {selectedCompany.nome_fantasia || selectedCompany.razao_social}
                </span>
              </div>
              <button
                onClick={handleTasksClick}
                disabled={isNavigatingTasks}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isTasksActive
                    ? 'text-brand-accent bg-brand-gray shadow-md'
                    : 'text-brand-text-muted hover:bg-brand-gray hover:text-white'
                } ${isNavigatingTasks ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CheckSquare size={18} />
                <span className="font-medium text-sm">
                  {isNavigatingTasks ? 'Carregando...' : 'Tarefas'}
                </span>
              </button>
            </div>
          )}
        </div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-brand-accent bg-brand-gray shadow-md'
                : 'text-brand-text-muted hover:bg-brand-gray hover:text-white'
            }`
          }
        >
          <BarChart2 size={20} />
          <span className="font-medium">Dashboard Geral</span>
        </NavLink>
        <NavLink
          to="/consultar-cnpj"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-brand-accent bg-brand-gray shadow-md'
                : 'text-brand-text-muted hover:bg-brand-gray hover:text-white'
            }`
          }
        >
          <Search size={20} />
          <span className="font-medium">Consultar CNPJ</span>
        </NavLink>

        {role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-brand-accent bg-brand-gray shadow-md'
                  : 'text-brand-text-muted hover:bg-brand-gray hover:text-white'
              }`
            }
          >
            <Users size={20} />
            <span className="font-medium">Usuários</span>
          </NavLink>
        )}
      </nav>
      <div className="p-4 border-t border-brand-gray">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-200 text-brand-text-muted hover:bg-red-900/20 hover:text-red-400"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
