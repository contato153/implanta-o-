import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, CheckSquare, Users, LogOut, Search, Building2, ClipboardList, Clock, Menu, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { getClientData } from '../services/api';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const { signOut, role, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedClientId, clients, isSidebarMinimized, setIsSidebarMinimized } = useCompany();
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
    <aside className={`sidebar fixed top-0 left-0 h-screen ${isSidebarMinimized ? 'w-[80px]' : 'w-[260px]'} flex-shrink-0 bg-[#161616] border-r border-[#1E1E1E] flex flex-col shadow-xl z-50 transition-all duration-300`}>
      <div className="p-4 relative flex-shrink-0">
        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="absolute -right-3 top-6 bg-[#F4C400] text-[#0B0B0B] rounded-full p-1 shadow-md hover:bg-[#FFD84D] transition-all z-10"
        >
          <Menu size={16} />
        </button>
        <div className="flex justify-center items-center mb-4 py-2">
          <img 
            src="https://i.imgur.com/8SuQt5R.png" 
            alt="L&M Logo" 
            className={`object-contain transition-all duration-300 ${isSidebarMinimized ? 'h-8 w-8' : 'h-12 w-auto'}`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar min-h-0 pb-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
            }`
          }
          title={isSidebarMinimized ? "Dashboard Geral" : ""}
        >
          <BarChart2 size={20} />
          {!isSidebarMinimized && <span className="font-medium">Dashboard Geral</span>}
        </NavLink>

        <div className="flex flex-col">
          <NavLink
            to={selectedClientId ? `/empresa/${selectedClientId}` : "/empresas"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                (isActive || location.pathname.includes('/empresa/')) && !isTasksActive
                  ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                  : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
              }`
            }
            title={isSidebarMinimized ? "Empresas" : ""}
          >
            <Building2 size={20} />
            {!isSidebarMinimized && <span className="font-medium">Empresas</span>}
          </NavLink>
          {selectedCompany && !isSidebarMinimized && (
            <div className="flex flex-col mt-1 ml-6 border-l-2 border-[#1E1E1E]/30 pl-2 gap-1">
              <div className="px-3 py-1.5 rounded-md bg-[#1E1E1E]/20 border border-[#1E1E1E]/30 flex flex-col gap-0.5">
                <span className="text-[10px] text-[#BDBDBD] uppercase tracking-wider font-semibold">Empresa Selecionada</span>
                <span className="text-xs text-[#F4C400] font-mono font-bold truncate" title={selectedCompany.nome_fantasia || selectedCompany.razao_social}>
                  {selectedCompany.codigo_interno ? `${selectedCompany.codigo_interno} - ` : ''}
                  {selectedCompany.nome_fantasia || selectedCompany.razao_social}
                </span>
              </div>
              <button
                onClick={handleTasksClick}
                disabled={isNavigatingTasks}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isTasksActive
                    ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                    : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
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
          to="/contratos"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
            }`
          }
          title={isSidebarMinimized ? "Gerador de Contratos" : ""}
        >
          <FileText size={20} />
          {!isSidebarMinimized && <span className="font-medium">Gerador de Contratos</span>}
        </NavLink>

        {role === 'admin' && (
          <NavLink
            to="/tasks-template"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                  : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
              }`
            }
            title={isSidebarMinimized ? "Tarefas Padrão" : ""}
          >
            <ClipboardList size={20} />
            {!isSidebarMinimized && <span className="font-medium">Tarefas Padrão</span>}
          </NavLink>
        )}

        {role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                  : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
              }`
            }
            title={isSidebarMinimized ? "Usuários" : ""}
          >
            <Users size={20} />
            {!isSidebarMinimized && <span className="font-medium">Usuários</span>}
          </NavLink>
        )}

        {(role === 'admin' || role === 'manager') && (
          <NavLink
            to="/historico"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-[#F4C400] bg-[#1E1E1E] shadow-md'
                  : 'text-[#BDBDBD] hover:bg-[#1E1E1E] hover:text-white'
              }`
            }
            title={isSidebarMinimized ? "Histórico" : ""}
          >
            <Clock size={20} />
            {!isSidebarMinimized && <span className="font-medium">Histórico</span>}
          </NavLink>
        )}
      </nav>
      <div className="p-4 border-t border-[#1E1E1E] flex flex-col gap-2 flex-shrink-0">
        {profile && (
          <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-[#1E1E1E]/50 border border-[#1E1E1E] ${isSidebarMinimized ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#F4C400]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F4C400] font-bold text-sm">
                {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            {!isSidebarMinimized && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">
                  {profile.full_name || profile.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-[#BDBDBD] uppercase tracking-wider">
                  {role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gerente' : 'Visualizador'}
                </span>
              </div>
            )}
          </div>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-200 text-[#BDBDBD] hover:bg-red-900/20 hover:text-red-400"
          title={isSidebarMinimized ? "Sair" : ""}
        >
          <LogOut size={20} />
          {!isSidebarMinimized && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
