export type Role = 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: Role;
}

export interface Empresa {
  id: string;
  codigo_interno: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  im: string;
  ponto_focal_nome: string;
  ponto_focal_whatsapp: string;
  ponto_focal_email: string;
  regime_atual: string;
  regime_novo: string;
  comp_inicial: string;
  aprovado_reuniao: string;
  objetivo_empresa?: string;
  logo_url?: string;
}

export interface Socio {
  id: string;
  empresa_id: string;
  nome: string;
  whatsapp?: string;
  email?: string;
}

export interface Projeto {
  id: string;
  empresa_id: string;
  nome: string;
  objetivo?: string;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  fase?: string; // "A FAZER", "EM ANDAMENTO", "CONCLUÍDO"
  competencia_inicial?: string;
  aprovado_em_reuniao?: boolean | string;
}

export interface Participante {
  id: string;
  projeto_id: string;
  nome: string;
  role?: string;
}

export interface Tarefa {
  id: string;
  projeto_id: string;
  descricao: string;
  prioridade: 'P1' | 'P2' | 'P3';
  proprietario: string;
  status: string;
  data_tarefa?: string;
  data_termino?: string;
  aplicacao?: string;
  produtos?: string;
  observacoes?: string;
  created_at?: string;
  ordem?: number;
  titulo?: string;
  concluida?: boolean;
}

export interface AnexoTarefa {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  uploaded_by: string;
}

export interface ClientData {
  empresa: Empresa;
  projeto: Projeto;
  socios: Socio[];
  participantes: Participante[];
  tarefas: Tarefa[];
  percentual_conclusao: number;
}
