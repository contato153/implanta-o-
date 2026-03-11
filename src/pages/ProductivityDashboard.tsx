import React, { useEffect, useState, useMemo } from 'react';
import { getSupabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Filter } from 'lucide-react';

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  data_tarefa: string;
  data_termino: string;
  proprietario: string;
  projeto_id: string;
  projetos: {
    id: string;
    nome: string;
    empresa_id: string;
    data_inicio_prevista?: string;
    data_fim_prevista?: string;
    empresas: {
      id?: string;
      nome_fantasia: string;
      codigo_interno?: string;
      razao_social?: string;
      cnpj?: string;
    };
  };
}

interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  codigo_interno: string;
}

export function ProductivityDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('Todos');
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabase();

    const tasksPromise = supabase
      .from('tarefas')
      .select(`
        *,
        projetos (
          id,
          nome,
          empresa_id,
          data_inicio_prevista,
          data_fim_prevista,
          empresas (
            id,
            nome_fantasia,
            razao_social,
            cnpj,
            codigo_interno
          )
        )
      `);

    const companiesPromise = supabase
      .from('empresas')
      .select('id, nome_fantasia, razao_social, cnpj, codigo_interno')
      .order('nome_fantasia', { ascending: true });

    const [tasksResponse, companiesResponse] = await Promise.all([tasksPromise, companiesPromise]);

    if (!tasksResponse.error) {
      setTasks(tasksResponse.data || []);
    } else {
      console.error('Error fetching tasks:', tasksResponse.error);
      setTasks([]);
    }

    if (!companiesResponse.error) {
      const sortedCompanies = (companiesResponse.data || []).sort((a: any, b: any) => {
        const nameA = a.nome_fantasia || a.razao_social || '';
        const nameB = b.nome_fantasia || b.razao_social || '';
        return nameA.localeCompare(nameB);
      });
      setCompanies(sortedCompanies);
    } else {
      console.error('Error fetching companies:', companiesResponse.error);
      setCompanies([]);
    }

    setLoading(false);
  };

  // ✅ helper: evita "undefined" aparecendo na tela
  const safeText = (v: any) => (v === null || v === undefined ? '' : String(v));

  // ✅ Helper to normalize status (removendo acentos + chars invisíveis)
  const normalizeStatus = (status: string | undefined | null): string => {
    if (!status) return '';
    return status
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width/invisíveis
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, ' ') // colapsa espaços
      .toUpperCase();
  };

  // ✅ Compute available years based on projects
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    tasks.forEach(task => {
      const dateStr = task.projetos?.data_inicio_prevista || task.projetos?.data_fim_prevista || task.data_termino || task.data_tarefa;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear().toString();
        if (year !== 'NaN') {
          years.add(year);
        }
      }
    });
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); // Always include current year as fallback
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Descending
  }, [tasks]);

  // ✅ Filter tasks by year/month/company
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const projectDateStr = task.projetos?.data_inicio_prevista || task.projetos?.data_fim_prevista || task.data_termino || task.data_tarefa;
      const projectDate = new Date(projectDateStr);
      const projectYear = projectDate.getFullYear().toString();
      const projectMonth = (projectDate.getMonth() + 1).toString();

      const yearMatch = year === 'Todos' || projectYear === year;
      const monthMatch = month === 'Todos' || projectMonth === month;
      const companyMatch = selectedCompanyId === 'Todos' || task.projetos?.empresa_id === selectedCompanyId;

      return yearMatch && monthMatch && companyMatch;
    });
  }, [tasks, year, month, selectedCompanyId]);

  // ✅ Métricas gerais
  const metrics = useMemo(() => {
    const projects: Record<string, { total: number; completed: number; inProgress: number; notStarted: number; delayed: number }> = {};

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

 let totalValidTasks = 0;
let countDoingTasks = 0;
let countDoneTasks = 0;

// esses 2 agora serão CONTAGEM DE PROJETOS/EMPRESAS
let countTodoOnTime = 0;
let countDoingOnTime = 0;

const validTasks = filteredTasks.filter(t => normalizeStatus(t.status) !== 'NAO APLICA');
totalValidTasks = validTasks.length;

validTasks.forEach(t => {
  const s = normalizeStatus(t.status);

  if (s === 'CONCLUIDA') {
    countDoneTasks++;
  } else if (s === 'EM EXECUCAO') {
    countDoingTasks++;
  }

  const pid = t.projeto_id;
  if (!projects[pid]) {
    projects[pid] = { total: 0, completed: 0, inProgress: 0, notStarted: 0, delayed: 0 };
  }

  projects[pid].total++;
  if (s === 'CONCLUIDA') projects[pid].completed++;
  if (s === 'EM EXECUCAO') projects[pid].inProgress++;
  if (s === 'NAO INICIADA') projects[pid].notStarted++;

  if (s !== 'CONCLUIDA' && t.data_termino && t.data_termino < todayIso) {
    projects[pid].delayed++;
  }
});

const countTodoTasks = Math.max(0, totalValidTasks - countDoneTasks - countDoingTasks);

// classificação de PROJETOS / EMPRESAS
let countTodo = 0;
let countDoing = 0;
let countDone = 0;

Object.values(projects).forEach(p => {
  const percentCompleted = p.total > 0 ? (p.completed / p.total) * 100 : 0;
  const todo = Math.max(0, p.total - p.completed - p.inProgress);

  // FEITO
  if (percentCompleted === 100) {
    countDone++;
    return;
  }

  // FAZENDO
  if (percentCompleted > 0 || p.inProgress > 0) {
    countDoing++;

    // Fazendo no prazo = projeto em andamento sem tarefas atrasadas
    if (p.delayed === 0) {
      countDoingOnTime++;
    }
    return;
  }

  // A FAZER
  countTodo++;

  // A fazer no prazo = projeto não iniciado e sem tarefas atrasadas
  if (todo > 0 && p.delayed === 0) {
    countTodoOnTime++;
  }
});

return {
  countTodo,
  countDoing,
  countDone,
  totalProjects: countTodo + countDoing + countDone,
  totalValidTasks,
  countTodoTasks,
  countDoingTasks,
  countDoneTasks,
  countTodoOnTime,
  countDoingOnTime,
};

  }, [filteredTasks]);

  // ✅ Cards/top charts
  const donutTodoData = [
    { name: 'A Fazer', value: metrics.countTodo, color: '#EF4444' },
    { name: 'Outros', value: metrics.totalProjects - metrics.countTodo, color: '#374151' },
  ];

  const donutDoingData = [
    { name: 'Fazendo', value: metrics.countDoing, color: '#F59E0B' },
    { name: 'Outros', value: metrics.totalProjects - metrics.countDoing, color: '#374151' },
  ];

  const donutDoneData = [
    { name: 'Feito', value: metrics.countDone, color: '#10B981' },
    { name: 'Outros', value: metrics.totalProjects - metrics.countDone, color: '#374151' },
  ];

  const pieDoingDoneData = [
  { name: 'Fazendo', value: metrics.countDoing, color: '#F59E0B' },
  { name: 'Feitos', value: metrics.countDone, color: '#10B981' },
].filter(d => d.value > 0);

  // ✅ Agrupa PROJETOS por status (A Fazer / Fazendo / Feito)
  const projectsByStatus = useMemo(() => {
    const grouped: Record<
      string,
      {
        id: string;
        project: string;
        company: string;
        code: string;
        todo: number;
        doing: number;
        done: number;
        total: number;
        delayed: number;
      }
    > = {};

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

    filteredTasks.forEach(t => {
      const pid = t.projeto_id;

      if (!grouped[pid]) {
        grouped[pid] = {
          id: pid,
          project: t.projetos?.nome || 'N/A',
          company: t.projetos?.empresas?.nome_fantasia || t.projetos?.empresas?.razao_social || 'N/A',
          code: t.projetos?.empresas?.codigo_interno || '',
          todo: 0,
          doing: 0,
          done: 0,
          total: 0,
          delayed: 0,
        };
      }

      const s = normalizeStatus(t.status);

      if (s !== 'NAO APLICA') grouped[pid].total++;
      if (s === 'CONCLUIDA') grouped[pid].done++;
      if (s === 'EM EXECUCAO') grouped[pid].doing++;

      if (s !== 'CONCLUIDA' && s !== 'NAO APLICA' && t.data_termino && t.data_termino < todayIso) {
        grouped[pid].delayed++;
      }
    });

    const list = Object.values(grouped);

    const todoList: typeof list = [];
    const doingList: typeof list = [];
    const doneList: typeof list = [];

    list.forEach(p => {
      p.todo = Math.max(0, p.total - p.done - p.doing);
      const percentCompleted = p.total > 0 ? (p.done / p.total) * 100 : 0;

      if (percentCompleted === 100) doneList.push(p);
      else if (percentCompleted >= 10 || p.doing > 0) doingList.push(p);
      else todoList.push(p);
    });

    return {
      todo: todoList.sort((a, b) => b.total - a.total),
      doing: doingList.sort((a, b) => b.total - a.total),
      done: doneList.sort((a, b) => b.total - a.total),
    };
  }, [filteredTasks]);

  // ✅ LISTA: Tarefas "Não iniciadas"
  const todoNotStartedTasks = useMemo(() => {
    const list = filteredTasks
      .filter(t => normalizeStatus(t.status) === 'NAO INICIADA')
      .slice();

    // ordena por prazo (mais próximo primeiro)
    list.sort((a, b) => {
      const aEnd = a.data_termino || '9999-12-31';
      const bEnd = b.data_termino || '9999-12-31';
      return aEnd.localeCompare(bEnd);
    });

    return list;
  }, [filteredTasks]);

  // ✅ LISTA: Tarefas "Em Execução"
  const doingTasks = useMemo(() => {
    const list = filteredTasks
      .filter(t => normalizeStatus(t.status) === 'EM EXECUCAO')
      .slice();

    // ordena por prazo (mais próximo primeiro)
    list.sort((a, b) => {
      const aEnd = a.data_termino || '9999-12-31';
      const bEnd = b.data_termino || '9999-12-31';
      return aEnd.localeCompare(bEnd);
    });

    return list;
  }, [filteredTasks]);

  // ✅ LISTA: Tarefas "Concluídas"
  const doneTasks = useMemo(() => {
    const list = filteredTasks
      .filter(t => normalizeStatus(t.status) === 'CONCLUIDA')
      .slice();

    // ordena por data (mais recente primeiro)
    list.sort((a, b) => {
      const aEnd = a.data_termino || a.data_tarefa || '0000-01-01';
      const bEnd = b.data_termino || b.data_tarefa || '0000-01-01';
      return bEnd.localeCompare(aEnd);
    });

    return list;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-gradient-to-b from-[#111111] to-[#0a0a0a] text-gray-200 p-4 md:p-8 font-sans selection:bg-brand-accent selection:text-brand-black">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-brand-accent rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
          <div className="flex flex-col">
            <h2 className="text-4xl text-white font-extrabold tracking-tight">Dashboard de Produtividade</h2>
            <p className="text-sm text-brand-text-muted/50 font-medium tracking-wide mt-1">Visão geral e acompanhamento de projetos</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-[#161616]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex items-center px-4 border-r border-white/5">
            <Filter className="w-4 h-4 text-brand-text-muted" />
          </div>

          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-transparent text-gray-300 text-xs font-semibold uppercase tracking-wider rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer hover:text-white hover:bg-white/5 transition-all appearance-none"
          >
            <option value="Todos" className="bg-[#161616]">Todos Anos</option>
            {availableYears.map(y => (
              <option key={y} value={y} className="bg-[#161616]">{y}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent text-gray-300 text-xs font-semibold uppercase tracking-wider rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer hover:text-white hover:bg-white/5 transition-all appearance-none"
          >
            <option value="Todos" className="bg-[#161616]">Todos Meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()} className="bg-[#161616]">
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className="bg-transparent text-gray-300 text-xs font-semibold uppercase tracking-wider rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer hover:text-white hover:bg-white/5 transition-all appearance-none max-w-[220px]"
          >
            <option value="Todos" className="bg-[#161616]">Todas Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id} className="bg-[#161616]">
                {c.nome_fantasia || c.razao_social}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Row 1: Main Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* A Fazer */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col items-center relative overflow-hidden group hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
          
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 z-10">A Fazer</h3>
          
          <p className="text-7xl font-light text-white tracking-tight z-10 group-hover:scale-105 transition-transform duration-500">{metrics.countTodo}</p>
          <span className="text-[10px] text-brand-text-muted/50 uppercase tracking-widest mb-6 z-10">Projetos Pendentes</span>
          
          <div className="h-40 w-40 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutTodoData}
                  innerRadius={68}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                  cornerRadius={10}
                >
                  {donutTodoData.map((entry, index) => (
                    <Cell key={`cell-todo-${index}`} fill={entry.color} style={{ filter: index === 0 ? `drop-shadow(0px 0px 6px ${entry.color}80)` : 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-light text-white tracking-tight mt-1">
                {metrics.totalProjects > 0 ? Math.round((metrics.countTodo / metrics.totalProjects) * 100) : 0}<span className="text-sm text-brand-text-muted/50 font-normal">%</span>
              </span>
              <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-widest mt-0.5">Projetos</span>
            </div>
          </div>
        </div>

        {/* Fazendo */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col items-center relative overflow-hidden group hover:border-yellow-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
          
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 z-10">Fazendo</h3>
          
          <p className="text-7xl font-light text-white tracking-tight z-10 group-hover:scale-105 transition-transform duration-500">{metrics.countDoing}</p>
          <span className="text-[10px] text-brand-text-muted/50 uppercase tracking-widest mb-6 z-10">Projetos Em Andamento</span>
          
          <div className="h-40 w-40 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutDoingData}
                  innerRadius={68}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                  cornerRadius={10}
                >
                  {donutDoingData.map((entry, index) => (
                    <Cell key={`cell-doing-${index}`} fill={entry.color} style={{ filter: index === 0 ? `drop-shadow(0px 0px 6px ${entry.color}80)` : 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-light text-white tracking-tight mt-1">
                {metrics.totalProjects > 0 ? Math.round((metrics.countDoing / metrics.totalProjects) * 100) : 0}<span className="text-sm text-brand-text-muted/50 font-normal">%</span>
              </span>
              <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-widest mt-0.5">Projetos</span>
            </div>
          </div>
        </div>

        {/* Feito */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col items-center relative overflow-hidden group hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
          
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 z-10">Feito</h3>
          
          <p className="text-7xl font-light text-white tracking-tight z-10 group-hover:scale-105 transition-transform duration-500">{metrics.countDone}</p>
          <span className="text-[10px] text-brand-text-muted/50 uppercase tracking-widest mb-6 z-10">Projetos Concluídos</span>
          
          <div className="h-40 w-40 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutDoneData}
                  innerRadius={68}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  animationBegin={400}
                  animationDuration={1500}
                  cornerRadius={10}
                >
                  {donutDoneData.map((entry, index) => (
                    <Cell key={`cell-done-${index}`} fill={entry.color} style={{ filter: index === 0 ? `drop-shadow(0px 0px 6px ${entry.color}80)` : 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-light text-white tracking-tight mt-1">
                {metrics.totalProjects > 0 ? Math.round((metrics.countDone / metrics.totalProjects) * 100) : 0}<span className="text-sm text-brand-text-muted/50 font-normal">%</span>
              </span>
              <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-widest mt-0.5">Projetos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Deadline Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* A Fazer (no prazo) */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col justify-center h-56 relative overflow-hidden group hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">A Fazer (No Prazo)</h3>
          <div className="flex items-baseline gap-3">
            <p className="text-7xl font-light text-white tracking-tight">{metrics.countTodoOnTime}</p>
            <span className="text-red-500/80 text-xs font-semibold uppercase tracking-widest">Projetos</span>
          </div>
          <p className="text-[11px] text-brand-text-muted/60 mt-4 font-medium leading-relaxed">
            Empresas / projetos a fazer<br/>dentro do cronograma
          </p>
        </div>

        {/* Fazendo (no prazo) */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col justify-center h-56 relative overflow-hidden group hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Fazendo (No Prazo)</h3>
          <div className="flex items-baseline gap-3">
            <p className="text-7xl font-light text-white tracking-tight">{metrics.countDoingOnTime}</p>
            <span className="text-yellow-500/80 text-xs font-semibold uppercase tracking-widest">Projetos</span>
          </div>
          <p className="text-[11px] text-brand-text-muted/60 mt-4 font-medium leading-relaxed">
            Empresas / projetos em andamento<br/>sem atrasos detectados
          </p>
        </div>

        {/* Fazendo x Feitos */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col items-center justify-center h-56 relative group hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-brand-text-muted/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 w-full text-center absolute top-6">
            Projetos: Fazendo x Feitos
          </h3>
          <div className="w-full h-[160px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieDoingDoneData} 
                  innerRadius={52} 
                  outerRadius={58} 
                  dataKey="value" 
                  paddingAngle={8} 
                  stroke="none"
                  animationBegin={400}
                  animationDuration={1500}
                  cornerRadius={10}
                >
                  {pieDoingDoneData.map((entry, index) => (
                    <Cell key={`cell-dd-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 4px ${entry.color}60)` }} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161616',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={20} 
                  iconSize={8} 
                  wrapperStyle={{ 
                    fontSize: '10px', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    paddingTop: '12px',
                    color: '#9CA3AF'
                  }}
                  formatter={(value: string, entry: any) => {
                    const total = pieDoingDoneData.reduce((sum, item) => sum + item.value, 0);
                    const item = pieDoingDoneData.find(d => d.name === value);
                    const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
                    return `${value} (${percent}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Project Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A FAZER */}
        <div className="bg-[#121212]/80 rounded-3xl shadow-2xl border border-white/5 flex flex-col backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
              A Fazer
            </h3>
            <span className="text-[10px] font-semibold text-brand-text-muted bg-white/5 px-3 py-1 rounded-full border border-white/5">{projectsByStatus.todo.length}</span>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar max-h-[650px]">
            {projectsByStatus.todo.map((p, idx) => (
              <ProjectCard key={idx} project={p} statusColor="red" />
            ))}
            {projectsByStatus.todo.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-brand-text-muted/40 text-xs font-semibold uppercase tracking-widest">Nenhum projeto</p>
              </div>
            )}
          </div>
        </div>

        {/* FAZENDO */}
        <div className="bg-[#121212]/80 rounded-3xl shadow-2xl border border-white/5 flex flex-col backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              Fazendo
            </h3>
            <span className="text-[10px] font-semibold text-brand-text-muted bg-white/5 px-3 py-1 rounded-full border border-white/5">{projectsByStatus.doing.length}</span>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar max-h-[650px]">
            {projectsByStatus.doing.map((p, idx) => (
              <ProjectCard key={idx} project={p} statusColor="yellow" />
            ))}
            {projectsByStatus.doing.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-brand-text-muted/40 text-xs font-semibold uppercase tracking-widest">Nenhum projeto</p>
              </div>
            )}
          </div>
        </div>

        {/* FEITO */}
        <div className="bg-[#121212]/80 rounded-3xl shadow-2xl border border-white/5 flex flex-col backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              Feito
            </h3>
            <span className="text-[10px] font-semibold text-brand-text-muted bg-white/5 px-3 py-1 rounded-full border border-white/5">{projectsByStatus.done.length}</span>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar max-h-[650px]">
            {projectsByStatus.done.map((p, idx) => (
              <ProjectCard key={idx} project={p} statusColor="green" />
            ))}
            {projectsByStatus.done.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-brand-text-muted/40 text-xs font-semibold uppercase tracking-widest">Nenhum projeto</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Card de Projeto Modernizado
const ProjectCard = ({ project, statusColor }: any) => {
  const percent = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
  
  const borderColors = {
    red: 'border-l-red-500/70',
    yellow: 'border-l-yellow-500/70',
    green: 'border-l-green-500/70'
  };

  const progressColors = {
    red: 'bg-gradient-to-r from-red-600 to-red-400',
    yellow: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
    green: 'bg-gradient-to-r from-green-600 to-green-400'
  };

  const glowColors = {
    red: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    yellow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    green: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
  };

  return (
    <div className={`bg-[#161616] p-5 rounded-2xl border border-white/5 border-l-4 ${borderColors[statusColor as keyof typeof borderColors]} transition-all duration-300 group ${glowColors[statusColor as keyof typeof glowColors]} hover:-translate-y-0.5`}>
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-semibold text-brand-text-muted bg-white/5 px-2.5 py-1 rounded-md border border-white/5 uppercase tracking-wider">
              {project.code || 'SEM COD'}
            </span>
          </div>
          <h4 className="text-[15px] font-semibold text-white leading-tight tracking-wide group-hover:text-gray-200 transition-colors">{project.company}</h4>
          <p className="text-[11px] text-brand-text-muted/70 mt-1.5 font-medium tracking-wide line-clamp-1">{project.project}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-start">
          <span className="text-2xl font-light text-white tracking-tight">{percent}<span className="text-xs ml-0.5 text-brand-text-muted/50 font-normal">%</span></span>
        </div>
      </div>

      <div className="w-full bg-[#0a0a0a] rounded-full h-1.5 mb-5 overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColors[statusColor as keyof typeof progressColors]}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center bg-[#0a0a0a]/50 p-3 rounded-xl border border-white/5">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-white">{project.total}</span>
          <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-wider">Total</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-green-500/90">{project.done}</span>
          <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-wider">Conc.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-yellow-500/90">{project.doing}</span>
          <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-wider">Exec.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-brand-text-muted">{project.todo}</span>
          <span className="text-[9px] font-medium text-brand-text-muted/60 uppercase tracking-wider">Fazer</span>
        </div>
      </div>

      {project.delayed > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 bg-red-500/5 py-2.5 rounded-xl border border-red-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
          <span className="text-[10px] font-semibold text-red-500/90 uppercase tracking-wider">{project.delayed} Tarefas Atrasadas</span>
        </div>
      )}
    </div>
  );
};