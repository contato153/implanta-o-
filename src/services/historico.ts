import { getSupabase } from '../lib/supabase';

export interface RegistroHistorico {
  entidade: 'empresa' | 'tarefa' | 'usuario';
  entidade_id: string;
  acao: 'CRIADO' | 'EDITADO' | 'EXCLUIDO' | 'STATUS_ALTERADO' | 'ANEXO_ADICIONADO';
  descricao: string;
  detalhes?: any;
  usuario: {
    id: string;
    nome: string;
  };
}

export const registrarHistorico = async ({
  entidade,
  entidade_id,
  acao,
  descricao,
  detalhes
}: Omit<RegistroHistorico, 'usuario'>) => {
  try {
    const supabase = getSupabase();
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('Tentativa de registrar histórico sem usuário logado', { entidade, acao });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    const usuario_nome = profile?.full_name || session.user.email || 'Usuário Desconhecido';

    const { error } = await supabase.from('historico').insert({
      entidade,
      entidade_id,
      acao,
      descricao,
      detalhes,
      usuario_id: session.user.id,
      usuario_nome,
    });

    if (error) {
      console.error('Erro ao registrar histórico:', error);
    }
  } catch (err) {
    console.error('Exceção ao registrar histórico:', err);
  }
};

export const getHistorico = async (filtros?: {
  entidade?: string;
  usuario_id?: string;
  data_inicio?: string;
  data_fim?: string;
}) => {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('historico')
      .select('*')
      .order('data', { ascending: false })
      .limit(50);

    if (filtros) {
      if (filtros.entidade && filtros.entidade !== 'todas') {
        query = query.eq('entidade', filtros.entidade);
      }
      if (filtros.usuario_id && filtros.usuario_id !== 'todos') {
        query = query.eq('usuario_id', filtros.usuario_id);
      }
      if (filtros.data_inicio) {
        query = query.gte('data', filtros.data_inicio);
      }
      if (filtros.data_fim) {
        query = query.lte('data', filtros.data_fim + 'T23:59:59.999Z');
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    return [];
  }
};
