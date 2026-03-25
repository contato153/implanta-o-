import { getSupabase } from '../lib/supabase';
import { ClientData, Empresa, Projeto, Socio, Participante, Tarefa, AnexoTarefa, TarefasTemplate } from '../types';
import { STANDARD_TASKS_TEMPLATE } from '../constants';
import { registrarHistorico } from './historico';

// Mock data for demonstration when Supabase is not configured
const MOCK_CLIENTS: Empresa[] = [
  { 
    id: '1', 
    codigo_interno: 'CLI-001',
    razao_social: 'Empresa Alpha Ltda', 
    nome_fantasia: 'Alpha', 
    cnpj: '12.345.678/0001-90', 
    comp_inicial: '2023-01-01',
    ie: '123.456.789.000',
    im: '987654',
    ponto_focal_nome: 'João Silva',
    ponto_focal_whatsapp: '(11) 99999-9999',
    ponto_focal_email: 'joao@alpha.com',
    regime_atual: 'Simples Nacional',
    regime_novo: 'Lucro Presumido',
    aprovado_reuniao: '2022-12-20'
  },
  { 
    id: '2', 
    codigo_interno: 'CLI-002',
    razao_social: 'Beta Soluções S.A.', 
    nome_fantasia: 'Beta', 
    cnpj: '98.765.432/0001-10', 
    comp_inicial: '2023-03-01',
    ie: '111.222.333.444',
    im: '555666',
    ponto_focal_nome: 'Maria Souza',
    ponto_focal_whatsapp: '(21) 99999-8888',
    ponto_focal_email: 'maria@beta.com',
    regime_atual: 'Lucro Real',
    regime_novo: 'Lucro Real',
    aprovado_reuniao: 'Não'
  },
];

const MOCK_DATA: Record<string, ClientData> = {
  '1': {
    empresa: {
      id: '1',
      codigo_interno: 'CLI-001',
      razao_social: 'Empresa Alpha Ltda',
      nome_fantasia: 'Alpha',
      cnpj: '12.345.678/0001-90',
      ie: '123.456.789.000',
      im: '987654',
      ponto_focal_nome: 'João Silva',
      ponto_focal_whatsapp: '(11) 99999-9999',
      ponto_focal_email: 'joao@alpha.com',
      regime_atual: 'Simples Nacional',
      regime_novo: 'Lucro Presumido',
      comp_inicial: '2023-01-01',
      aprovado_reuniao: '2022-12-20'
    },
    projeto: {
      id: 'p1',
      empresa_id: '1',
      nome: 'Implantação ERP',
      objetivo: 'Migrar sistema legado para novo ERP',
      data_inicio_prevista: '2023-01-15',
      data_fim_prevista: '2023-06-30',
      fase: 'EM ANDAMENTO',
      competencia_inicial: '01/2023',
      aprovado_em_reuniao: '2022-12-20',
    },
    socios: [
      { id: 's1', empresa_id: '1', nome: 'Carlos Alpha', whatsapp: '(11) 98888-8888', email: 'carlos@alpha.com' },
      { id: 's2', empresa_id: '1', nome: 'Ana Alpha', whatsapp: '(11) 97777-7777', email: 'ana@alpha.com' },
    ],
    participantes: [
      { id: 'par1', projeto_id: 'p1', nome: 'Consultor X' },
      { id: 'par2', projeto_id: 'p1', nome: 'Gerente Y' },
    ],
    tarefas: STANDARD_TASKS_TEMPLATE.map((t, i) => ({ ...t, id: `t${i+1}`, projeto_id: 'p1' })),
    percentual_conclusao: 50,
  },
  '2': {
    empresa: {
      id: '2',
      codigo_interno: 'CLI-002',
      razao_social: 'Beta Soluções S.A.',
      nome_fantasia: 'Beta',
      cnpj: '98.765.432/0001-10',
      ie: '111.222.333.444',
      im: '555666',
      ponto_focal_nome: 'Maria Souza',
      ponto_focal_whatsapp: '(21) 99999-8888',
      ponto_focal_email: 'maria@beta.com',
      regime_atual: 'Lucro Real',
      regime_novo: 'Lucro Real',
      comp_inicial: '2023-03-01',
      aprovado_reuniao: 'Não'
    },
    projeto: {
      id: 'p2',
      empresa_id: '2',
      nome: 'Auditoria Fiscal',
      objetivo: 'Revisão dos últimos 5 anos',
      data_inicio_prevista: '2023-03-01',
      data_fim_prevista: '2023-05-30',
      fase: 'A FAZER',
      competencia_inicial: '03/2023',
      aprovado_em_reuniao: 'Não',
    },
    socios: [
      { id: 's3', empresa_id: '2', nome: 'Roberto Beta', whatsapp: '(21) 96666-6666', email: 'roberto@beta.com' },
    ],
    participantes: [],
    tarefas: [
      { 
        id: 't5', 
        projeto_id: 'p2', 
        descricao: 'Coleta de dados fiscais', 
        prioridade: 'P3',
        proprietario: 'Auditor A',
        status: 'NÃO INICIADA',
        data_tarefa: '2023-03-05',
        data_termino: '2023-03-10',
        aplicacao: 'Excel',
        observacoes: ''
      },
    ],
    percentual_conclusao: 0,
  },
};

export async function getClients(): Promise<Empresa[]> {
  try {
    const supabase = getSupabase();
    
    // Strict query to fetch only valid companies with projects and tasks
    const { data, error } = await supabase
      .from('empresas')
      .select(`
        id,
        codigo_interno,
        razao_social,
        nome_fantasia,
        cnpj,
        regime_atual,
        projetos!inner (
          id,
          nome,
          fase,
          tarefas!inner ( id )
        )
      `)
      .not('cnpj', 'is', null)
      .neq('cnpj', '')
      .or('razao_social.neq.,nome_fantasia.neq.')
      .not('regime_atual', 'is', null)
      .neq('regime_atual', '')
      .not('codigo_interno', 'is', null)
      .neq('codigo_interno', '')
      .order('nome_fantasia', { ascending: true });

    if (error) throw error;
    
    // If no data, return empty array (do not fallback to mocks if we want strict filtering)
    if (!data || data.length === 0) return [];

    // Post-processing validation in JS
    const validClients = data.filter((client: any) => {
       // Validate projects and tasks existence
       if (!client.projetos || client.projetos.length === 0) return false;
       
       // Check if at least one project has tasks
       const hasTasks = client.projetos.some((p: any) => p.tarefas && Array.isArray(p.tarefas) && p.tarefas.length > 0);
       if (!hasTasks) return false;

       return true;
    });

    // Sort in JavaScript
    const sortedData = validClients.sort((a: any, b: any) => {
      const nameA = (a.nome_fantasia || a.razao_social || '').trim().toLowerCase();
      const nameB = (b.nome_fantasia || b.razao_social || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return sortedData as unknown as Empresa[];
  } catch (error) {
    console.warn('Supabase fetch failed, using mock data:', error);
    return MOCK_CLIENTS;
  }
}

export async function getClientData(clientId: string): Promise<ClientData | null> {
  try {
    const supabase = getSupabase();
    // Fetch Empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();
    
    if (empresaError) throw empresaError;

    if (!empresa) {
      return null;
    }

    // Fetch Projeto
    // We use limit(1) and order by created_at desc to get the most recent project
    // This prevents errors if a company has multiple projects (e.g. from testing)
    const { data: projetos, error: projetoError } = await supabase
      .from('projetos')
      .select('*')
      .eq('empresa_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (projetoError) throw projetoError;
    
    const projeto = projetos?.[0] || null;

    // If no project, we might still return company data, but let's assume one project per company for simplicity
    // or handle it gracefully.
    
    let socios: Socio[] = [];
    let participantes: Participante[] = [];
    let tarefas: Tarefa[] = [];
    let percentual_conclusao = 0;

    if (empresa) {
       const { data: s } = await supabase.from('socios').select('*').eq('empresa_id', clientId);
       if (s) socios = s;
    }

    if (projeto) {
       const { data: p } = await supabase.from('participantes').select('*').eq('projeto_id', projeto.id);
       if (p) participantes = p;

     const { data: t } = await supabase
  .from('tarefas')
  .select('*')
  .eq('projeto_id', projeto.id)
  .order('created_at', { ascending: true })
  .order('id', { ascending: true });
       if (t) {
         tarefas = t;
         const total = tarefas.filter(task => (task.aplicacao || '').toUpperCase() !== 'NÃO APLICA' && (task.aplicacao || '').toUpperCase() !== 'NAO APLICA').length;
         const completed = tarefas.filter(task => task.status === 'CONCLUÍDA').length;
         percentual_conclusao = total > 0 ? Math.round((completed / total) * 100) : 0;
       }
    }

    return {
      empresa: empresa || null,
      projeto: projeto || null,
      socios: socios,
      participantes: participantes,
      tarefas: tarefas,
      percentual_conclusao,
    };

  } catch (error) {
    console.error('Supabase fetch failed:', error);
    return null;
  }
}

export async function getProjectData(projectId: string): Promise<{ projeto: Projeto, tarefas: Tarefa[] } | null> {
  console.log('getProjectData called with projectId:', projectId);
  try {
    const supabase = getSupabase();
    
    if (!projectId) {
      console.error('getProjectData: projectId is undefined or null');
      throw new Error('Project ID is required');
    }

    // 1. Fetch Projeto
    const { data: projeto, error: projetoError } = await supabase
      .from('projetos')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projetoError) {
      console.error('Error fetching project:', projetoError);
      throw projetoError;
    }

    if (!projeto) {
      return null;
    }

    // 2. Fetch Tarefas (Simplified query without 'ordem')
    console.log('Fetching tasks for project:', projectId);
    const { data: tarefas, error: tarefasError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('projeto_id', projectId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (tarefasError) {
      console.error('Error fetching tasks:', tarefasError);
      throw tarefasError;
    }

    console.log(`Found ${tarefas?.length || 0} tasks`);

    return {
      projeto,
      tarefas: tarefas || []
    };

  } catch (error) {
    console.error('Supabase fetch failed:', error);
    throw error;
  }
}

export async function importStandardTasks(projectId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    
    // Check if tasks already exist
    const { count, error: countError } = await supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('projeto_id', projectId);
      
    if (countError) throw countError;
    
    if (count && count > 0) {
      // Tasks already exist
      return false;
    }
    
    // Fetch tasks from template table
    const { data: templateTasks, error: templateError } = await supabase
      .from('tarefas_template')
      .select('*');

    if (templateError) throw templateError;

    let tasksToInsert;

    if (templateTasks && templateTasks.length > 0) {
      // Prepare tasks for insertion from database template
      tasksToInsert = templateTasks.map((task, index) => ({
        projeto_id: projectId,
        titulo: task.descricao,
        descricao: task.descricao,
        prioridade: task.prioridade,
        proprietario: task.proprietario,
        aplicacao: task.aplicacao,
        observacoes: task.observacoes,
        status: 'NÃO INICIADA',
        concluida: false
      }));
    } else {
      // Fallback to hardcoded template if table is empty
      tasksToInsert = STANDARD_TASKS_TEMPLATE.map((task, index) => ({
        ...task,
        titulo: task.descricao,
        projeto_id: projectId,
        status: 'NÃO INICIADA',
        concluida: false
      }));
    }
    
    const { error: insertError } = await supabase
      .from('tarefas')
      .insert(tasksToInsert);
      
    if (insertError) throw insertError;
    
    return true;
  } catch (error) {
    console.error('Error importing standard tasks:', error);
    throw error;
  }
}

export async function getTasksTemplate(): Promise<TarefasTemplate[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tarefas_template')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function createTemplateTask(task: Omit<TarefasTemplate, 'id' | 'created_at'>): Promise<TarefasTemplate> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tarefas_template')
    .insert(task)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Erro ao criar template de tarefa.');
  return data;
}

export async function updateTemplateTask(id: string, task: Partial<TarefasTemplate>): Promise<TarefasTemplate> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tarefas_template')
    .update(task)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Erro ao atualizar template de tarefa.');
  return data;
}

export async function deleteTemplateTask(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('tarefas_template')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function createCompany(
  empresaData: Omit<Empresa, 'id'>,
  sociosData: Omit<Socio, 'id' | 'empresa_id'>[],
  projetoData?: { data_inicio_prevista?: string; data_fim_prevista?: string }
): Promise<{ empresaId: string; projetoId: string }> {
  const supabase = getSupabase();
  const empresaId = crypto.randomUUID();
  const projetoId = crypto.randomUUID();

  try {
    // 1. Insert Empresa
    const { error: empresaError } = await supabase.from('empresas').insert({
      id: empresaId,
      ...empresaData
    });
    if (empresaError) throw new Error(`Erro ao criar empresa: ${empresaError.message}`);

    // 2. Insert Socios
    if (sociosData && sociosData.length > 0) {
      const sociosToInsert = sociosData.map(socio => ({
        id: crypto.randomUUID(),
        empresa_id: empresaId,
        ...socio
      }));

      const { error: socioError } = await supabase.from('socios').insert(sociosToInsert);
      if (socioError) throw new Error(`Erro ao criar sócios: ${socioError.message}`);
    }

    // 3. Insert Projeto
    const nomeProjeto = `Projeto de Implantação - ${empresaData.nome_fantasia || empresaData.razao_social}`;
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 60);

    const { error: projetoError } = await supabase.from('projetos').insert({
      id: projetoId,
      empresa_id: empresaId,
      nome: nomeProjeto,
      fase: 'A FAZER',
      objetivo: 'Implantação e acompanhamento do cliente no novo regime.',
      data_inicio_prevista: projetoData?.data_inicio_prevista || today.toISOString().split('T')[0],
      data_fim_prevista: projetoData?.data_fim_prevista || endDate.toISOString().split('T')[0]
    });
    if (projetoError) throw new Error(`Erro ao criar projeto: ${projetoError.message}`);

    // 4. Verify Tasks (Trigger should create them)
    // Wait for a short moment to allow trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { count, error: countError } = await supabase
      .from('tarefas')
      .select('*', { count: 'exact', head: true })
      .eq('projeto_id', projetoId);

    if (countError) {
      console.warn('Erro ao verificar tarefas:', countError);
    }

    if (!count || count === 0) {
      // Fallback: If trigger didn't work, try to import manually
      console.warn('Trigger não criou tarefas. Tentando importar manualmente...');
      try {
        await importStandardTasks(projetoId);
      } catch (manualError: any) {
        throw new Error(`O projeto foi criado, mas as tarefas padrão não puderam ser geradas. Erro: ${manualError.message || JSON.stringify(manualError)}`);
      }
    } else if (count < 40) {
       console.warn(`Atenção: Foram criadas apenas ${count} tarefas (esperado: 40).`);
    }

    await registrarHistorico({
      entidade: 'empresa',
      entidade_id: empresaId,
      acao: 'CRIADO',
      descricao: `Empresa criada: ${empresaData.nome_fantasia || empresaData.razao_social}`
    });

    return { empresaId, projetoId };

  } catch (error) {
    console.error('Falha no fluxo de criação de empresa:', error);
    throw error;
  }
}

export async function getCompanyDetails(companyId: string): Promise<{ empresa: Empresa, socios: Socio[], projeto?: Projeto } | null> {
  try {
    const supabase = getSupabase();
    
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (empresaError) throw empresaError;
    if (!empresa) return null;

    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .eq('empresa_id', companyId);

    if (sociosError) throw sociosError;

    const { data: projetos, error: projetoError } = await supabase
      .from('projetos')
      .select('*')
      .eq('empresa_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (projetoError) console.warn('Erro ao carregar projeto:', projetoError);

    return {
      empresa,
      socios: socios || [],
      projeto: projetos?.[0] || undefined
    };
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
}

export async function updateCompany(
  companyId: string,
  empresaData: Partial<Empresa>,
  sociosData: Omit<Socio, 'id' | 'empresa_id'>[],
  projetoData?: { data_inicio_prevista?: string; data_fim_prevista?: string }
): Promise<void> {
  const supabase = getSupabase();

  try {
    // Get old company details before update
    const oldCompanyDetails = await getCompanyDetails(companyId);

    // 1. Update Empresa
    const { error: empresaError } = await supabase
      .from('empresas')
      .update(empresaData)
      .eq('id', companyId);

    if (empresaError) throw new Error(`Erro ao atualizar empresa: ${empresaError.message}`);

    // 2. Update Projeto
    if (projetoData) {
      const { error: projetoError } = await supabase
        .from('projetos')
        .update(projetoData)
        .eq('empresa_id', companyId);
      
      if (projetoError) console.warn('Erro ao atualizar projeto:', projetoError);
    }

    // 2. Update Socios
    // Strategy: Delete all existing socios for this company and re-insert valid ones.
    // This is simpler than tracking IDs for updates vs inserts vs deletes.
    // However, if we want to preserve IDs, we would need a more complex logic.
    // Given the requirements "atualizar os sócios existentes, inserir novos, remover vazios",
    // and the fact that socios don't seem to be linked to anything else by ID (foreign keys usually on empresa_id),
    // a full replace is acceptable and robust for this use case.

    // First, delete existing socios
    const { error: deleteError } = await supabase
      .from('socios')
      .delete()
      .eq('empresa_id', companyId);

    if (deleteError) throw new Error(`Erro ao limpar sócios antigos: ${deleteError.message}`);

    // Then insert new ones
    if (sociosData && sociosData.length > 0) {
      const sociosToInsert = sociosData.map(socio => ({
        id: crypto.randomUUID(),
        empresa_id: companyId,
        ...socio
      }));

      const { error: insertError } = await supabase
        .from('socios')
        .insert(sociosToInsert);

      if (insertError) throw new Error(`Erro ao inserir novos sócios: ${insertError.message}`);
    }

    // Get new company details after update
    const newCompanyDetails = await getCompanyDetails(companyId);

    await registrarHistorico({
      entidade: 'empresa',
      entidade_id: companyId,
      acao: 'EDITADO',
      descricao: `Empresa editada: ${empresaData.nome_fantasia || empresaData.razao_social || 'Dados atualizados'}`,
      detalhes: {
        antes: oldCompanyDetails,
        depois: newCompanyDetails
      }
    });

  } catch (error) {
    console.error('Falha ao atualizar empresa:', error);
    throw error;
  }
}

export async function deleteCompany(companyId: string): Promise<void> {
  const supabase = getSupabase();

  try {
    console.log(`Starting deletion for company: ${companyId}`);

    // Fetch company details to log the name before deleting
    let companyName = 'Empresa';
    try {
      const companyDetails = await getCompanyDetails(companyId);
      if (companyDetails && companyDetails.empresa) {
        companyName = `Empresa: ${companyDetails.empresa.nome_fantasia || companyDetails.empresa.razao_social || 'Sem nome'}`;
      }
    } catch (e) {
      console.warn('Could not fetch company details for history log', e);
    }

    // 1. Get project IDs for this company
    const { data: projects, error: projectsError } = await supabase
      .from('projetos')
      .select('id')
      .eq('empresa_id', companyId);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw new Error(`Erro ao buscar projetos: ${projectsError.message}`);
    }

    const projectIds = projects?.map(p => p.id) || [];
    console.log(`Found ${projectIds.length} projects to delete.`);

    if (projectIds.length > 0) {
      // 2. Delete Tasks
      const { error: tasksError } = await supabase
        .from('tarefas')
        .delete()
        .in('projeto_id', projectIds);
      
      if (tasksError) {
        console.error('Error deleting tasks:', tasksError);
        throw new Error(`Erro ao excluir tarefas: ${tasksError.message}`);
      }
      console.log('Tasks deleted.');

      // 3. Delete Participants
      const { error: participantsError } = await supabase
        .from('participantes')
        .delete()
        .in('projeto_id', projectIds);
      
      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        throw new Error(`Erro ao excluir participantes: ${participantsError.message}`);
      }
      console.log('Participants deleted.');
    }

    // 4. Delete Socios
    const { error: sociosError } = await supabase
      .from('socios')
      .delete()
      .eq('empresa_id', companyId);
    
    if (sociosError) {
      console.error('Error deleting socios:', sociosError);
      throw new Error(`Erro ao excluir sócios: ${sociosError.message}`);
    }
    console.log('Socios deleted.');

    // 5. Delete Projects
    // Even if projectIds is empty, we try to delete by empresa_id to be safe
    const { error: deleteProjectsError } = await supabase
      .from('projetos')
      .delete()
      .eq('empresa_id', companyId);
    
    if (deleteProjectsError) {
      console.error('Error deleting projects:', deleteProjectsError);
      throw new Error(`Erro ao excluir projetos: ${deleteProjectsError.message}`);
    }
    console.log('Projects deleted.');

    // 6. Delete Company
    const { error: companyError } = await supabase
      .from('empresas')
      .delete()
      .eq('id', companyId);
    
    if (companyError) {
      console.error('Error deleting company:', companyError);
      throw new Error(`Erro ao excluir empresa: ${companyError.message}`);
    }
    console.log('Company deleted successfully.');

    await registrarHistorico({
      entidade: 'empresa',
      entidade_id: companyId,
      acao: 'EXCLUIDO',
      descricao: companyName
    });

  } catch (error) {
    console.error('Falha crítica ao excluir empresa:', error);
    throw error;
  }
}

export async function getTaskAttachments(taskId: string): Promise<AnexoTarefa[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    return [];
  }
}

export async function uploadTaskAttachment(
  projectId: string,
  taskId: string,
  file: File,
  userId: string
): Promise<AnexoTarefa> {
  try {
    const supabase = getSupabase();
    
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${projectId}/${taskId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('task-files')
      .getPublicUrl(filePath);

    // 3. Save to Database
    const { data, error: dbError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_url: publicUrl,
        uploaded_by: userId
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error('Erro ao salvar anexo no banco de dados.');

    return data;
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    throw error;
  }
}

export async function deleteTaskAttachment(attachmentId: string, fileUrl: string): Promise<void> {
  try {
    const supabase = getSupabase();
    
    // 1. Extract path from URL to delete from storage
    // URL format: .../storage/v1/object/public/task-files/project-id/task-id/file.ext
    const urlParts = fileUrl.split('task-files/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: storageError } = await supabase.storage
        .from('task-files')
        .remove([filePath]);
      
      if (storageError) console.warn('Error removing file from storage:', storageError);
    }

    // 2. Delete from Database
    const { error: dbError } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting task attachment:', error);
    throw error;
  }
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.rpc('admin_update_user_password', {
    user_id: userId,
    new_password: newPassword,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao alterar senha.');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.rpc('admin_delete_user', {
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao excluir usuário.');
  }
}
