import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TasksTable } from '../components/TasksTable';
import { getProjectData, getClientData } from '../services/api';
import { getSupabase } from '../lib/supabase';
import { Projeto, Tarefa } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { ArrowLeft, FileDown, Building2 } from 'lucide-react';
import { STANDARD_TASKS_TEMPLATE } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Normalização agressiva (remove acento, múltiplos espaços e caracteres invisíveis)
const normalizeStatus = (status?: string | null) => {
  if (!status) return '';
  return status
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/\u00A0/g, ' ') // nbsp
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
};

const isNotApplicable = (t: Tarefa) => normalizeStatus((t as any).aplicacao) === 'NAO APLICA';

export function ProjectTasks() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { selectedClientId, clients, setSelectedClientId } = useCompany();

  const selectedCompany = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const [project, setProject] = useState<Projeto | null>(null);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carregarTarefas = async (idToLoad: string, showLoading = true) => {
    console.log('projectId usado:', idToLoad);
    if (!idToLoad) {
      setError('ID do projeto inválido.');
      if (showLoading) setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await getProjectData(idToLoad);
      if (data) {
        setProject(data.projeto);
        setTasks([...(data.tarefas ?? [])]);

        // Debug útil (se ainda der errado)
        const statusesRaw = (data.tarefas ?? []).map((t: any) => t.status);
        const statusesNorm = (data.tarefas ?? []).map((t: any) => normalizeStatus(t.status));
        console.log('--- DEBUG RELÓGIO ---');
        console.log('Total tarefas recebidas:', (data.tarefas ?? []).length);
        console.log('Status RAW (amostra):', statusesRaw.slice(0, 10));
        console.log('Status Normalizado (amostra):', statusesNorm.slice(0, 10));
        console.log('----------------------');
      } else {
        setError('Projeto não encontrado.');
      }
    } catch (err: any) {
      console.error('Error loading project tasks:', err);
      if (err.message?.includes('row-level security') || err.code === '42501') {
        setError('Sem permissão para carregar tarefas (RLS)');
      } else {
        setError('Erro ao carregar tarefas do projeto.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      carregarTarefas(projectId);

      const supabase = getSupabase();
      const channel = supabase
        .channel('realtime-tarefas')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tarefas', filter: `projeto_id=eq.${projectId}` },
          () => {
            carregarTarefas(projectId, false);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projetos', filter: `id=eq.${projectId}` },
          () => {
            carregarTarefas(projectId, false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [projectId]);

  // Reagir à troca de empresa no menu lateral
  useEffect(() => {
    const handleCompanyChange = async () => {
      // Se não houver empresa selecionada, limpa os dados e mostra mensagem
      if (!selectedClientId) {
        setProject(null);
        setTasks([]);
        setError('Por favor, selecione uma empresa no menu lateral.');
        setLoading(false);
        return;
      }

      // Se já temos um projeto carregado e a empresa dele é a mesma selecionada, não faz nada
      if (project && project.empresa_id === selectedClientId) return;

      try {
        const clientData = await getClientData(selectedClientId);
        
        if (clientData?.projeto) {
          // Se o projeto encontrado for diferente do atual na URL, navega
          if (clientData.projeto.id !== projectId) {
            navigate(`/project/${clientData.projeto.id}/tasks`);
          } else {
            // Se o ID é o mesmo mas o estado está vazio ou com erro (ex: vindo de uma empresa sem projeto)
            if (!project || error) {
              carregarTarefas(clientData.projeto.id);
            }
          }
        } else {
          // Empresa não tem projeto vinculado
          setProject(null);
          setTasks([]);
          setError('Esta empresa não possui um projeto de tarefas vinculado.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar projeto da empresa selecionada:', err);
        setError('Erro ao carregar dados da empresa selecionada.');
        setLoading(false);
      }
    };

    handleCompanyChange();
  }, [selectedClientId, navigate, projectId, project, error]);

  const handleBack = () => {
    if (selectedClientId) {
      navigate(`/empresa/${selectedClientId}`);
    } else {
      navigate('/empresas');
    }
  };

  const handleDownloadStandardPdf = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('Lista de Tarefas Padrão', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);

      // Table columns
      const tableColumn = ["ID", "Descrição", "Prioridade", "Departamento", "Aplicação", "Produtos"];
      
      // Table rows
      const tableRows = STANDARD_TASKS_TEMPLATE.map((task, index) => [
        index + 1,
        task.descricao,
        task.prioridade,
        task.proprietario,
        task.aplicacao,
        task.produtos
      ]);

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      });

      // Save PDF
      doc.save('tarefas_padrao.pdf');
      
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o arquivo PDF.');
    }
  };

  const handleTaskUpdate = (updatedTask: Tarefa) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleTaskAdd = (newTask: Tarefa) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // 1. Cálculo do relógio de conclusão ignorando "NAO APLICA"
  const tarefasValidas = tasks.filter(t => normalizeStatus((t as any).aplicacao) !== 'NAO APLICA');
  const totalValidas = tarefasValidas.length;
  const concluidasValidas = tarefasValidas.filter(t => normalizeStatus(t.status) === 'CONCLUIDA').length;
  const percentual = totalValidas === 0 ? 0 : Math.round((concluidasValidas / totalValidas) * 100);

  // 1. Verificação de Empresa Selecionada
  if (!selectedClientId) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-brand-dark p-8 rounded-xl shadow-2xl border border-brand-gray text-center">
          <div className="w-16 h-16 bg-brand-gray/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-brand-text-muted" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Bloqueado</h2>
          <p className="text-brand-text-muted mb-8 text-lg">
            Selecione uma empresa antes de acessar as tarefas.
          </p>
          <button
            onClick={() => navigate('/empresas')}
            className="w-full py-3 px-4 bg-brand-accent text-brand-black font-bold rounded-lg hover:bg-brand-accent-hover transition-colors shadow-lg shadow-brand-accent/20"
          >
            Ir para Empresas
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-brand-text-muted">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-brand-black p-8">
        <div className="max-w-4xl mx-auto bg-brand-dark p-8 rounded-lg shadow text-center border border-brand-gray">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Erro</h2>
          <p className="text-brand-text-muted mb-6">{error || 'Projeto não encontrado.'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-brand-accent text-brand-black rounded hover:bg-brand-accent-hover transition-colors font-medium"
          >
            Voltar para Painel da Empresa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black p-4 md:p-8 font-sans text-white">
      <header className="mb-8 max-w-6xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center text-brand-text-muted hover:text-brand-accent transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Painel da Empresa
        </button>

        {selectedCompany && (
          <div className="mb-4 inline-flex items-center px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-sm font-medium">
            <Building2 className="w-4 h-4 mr-2" />
            Empresa selecionada: {selectedCompany.nome_fantasia || selectedCompany.razao_social}
          </div>
        )}

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestão de Tarefas</h1>
            <p className="text-brand-text-muted">
              Projeto: <span className="font-semibold text-brand-accent">{project.nome}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-brand-text-muted">
              Acesso: <span className="font-semibold uppercase text-brand-accent">{role}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="bg-brand-dark rounded-lg shadow-sm border border-brand-gray p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div className="md:col-span-2">
              <span className="block text-brand-text-muted mb-1">Objetivo</span>
              <p className="font-medium text-white">{project.objetivo}</p>
            </div>

            <div>
              <span className="block text-brand-text-muted mb-1">Fase Atual</span>
              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-brand-gray text-brand-accent border border-brand-gray">
                {project.fase}
              </span>
            </div>

            <div>
              <span className="block text-brand-text-muted mb-1">Prazo</span>
              <p className="font-medium text-white">
                {new Date(project.data_inicio_prevista).toLocaleDateString()} -{' '}
                {new Date(project.data_fim_prevista).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* ✅ RELÓGIO (texto) – se você já tem o relógio visual, use completionPercent.percent nele */}
          <div className="mt-6 p-4 rounded-lg border border-brand-gray bg-brand-black">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-brand-text-muted font-bold uppercase">Relógio de Conclusão</div>
                <div className="text-2xl font-black text-white">{percentual}%</div>
                <div className="text-xs text-brand-text-muted">
                  {concluidasValidas} concluídas de {totalValidas} (total válidas)
                </div>
              </div>
            </div>
            <div className="w-full bg-brand-gray h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-accent h-full transition-all duration-500 ease-out"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>
        </div>

        <TasksTable
          tasks={tasks}
          projectId={project.id}
          role={role}
          onUpdate={() => projectId && carregarTarefas(projectId)}
          onTaskUpdate={handleTaskUpdate}
          onTaskAdd={handleTaskAdd}
          onTaskDelete={handleTaskDelete}
          onImport={handleDownloadStandardPdf}
        />
      </main>

      <footer className="mt-12 text-center text-xs text-brand-text-muted">
        <p>Sistema de Gestão Integrado &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}