import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistorico, RegistroHistorico } from '../services/historico';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { AlertCircle, Clock, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const nomesCampos: Record<string, string> = {
  descricao: "Descrição",
  prioridade: "Prioridade",
  status: "Status",
  departamento: "Departamento",
  aplicacao: "Aplicação",
  data_inicio: "Data Início",
  data_termino: "Data Término",
  observacoes: "Observações"
};

const camposEmpresa: Record<string, string> = {
  codigo_interno: "Código Interno",
  cnpj: "CNPJ",
  razao_social: "Razão Social",
  nome_fantasia: "Nome Fantasia",
  ie: "Inscrição Estadual",
  im: "Inscrição Municipal",
  regime_atual: "Regime Atual",
  regime_novo: "Regime Novo",
  data_inicio_prevista: "Data Início Prevista",
  data_fim_prevista: "Data Fim Prevista",
  passar_bastao_link: "Passar Bastão",
  comp_inicial: "Competência Inicial",
  aprovado_reuniao: "Aprovado em Reunião",
  objetivo: "Objetivo",
  ponto_focal_nome: "Ponto Focal",
  ponto_focal_whatsapp: "WhatsApp",
  ponto_focal_email: "Email",
  socios: "Sócios"
};

const formatValue = (value: any, campo?: string): string => {
  if (value === null || value === undefined || value === "") return "-";

  // ARRAY (ex: sócios)
  if (Array.isArray(value)) {
    if (value.length === 0) return "Nenhum";
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          // Se for sócio ou tiver campos específicos, mostrar mais detalhes
          const parts = [];
          const nome = item.nome || item.name || "(Sem nome)";
          parts.push(`• ${nome}`);
          
          if (item.cpf) parts.push(`(CPF: ${item.cpf})`);
          if (item.whatsapp) parts.push(`[Zap: ${item.whatsapp}]`);
          if (item.email) parts.push(`<${item.email}>`);
          if (item.participacao !== undefined) parts.push(`${item.participacao}%`);
          if (item.cargo) parts.push(`[${item.cargo}]`);
          
          if (parts.length > 0) return parts.join(" ");
          return `• ${JSON.stringify(item)}`;
        }
        return `• ${String(item)}`;
      })
      .join("\n");
  }

  // OBJETO
  if (typeof value === "object" && value !== null) {
    // Se for empresa
    if (value.razao_social || value.nome_fantasia) {
      return `${value.nome_fantasia || value.razao_social} ${
        value.cnpj ? `(CNPJ: ${value.cnpj})` : ""
      }`.trim();
    }

    // Se for um objeto genérico, tentar mostrar algo útil
    const parts = [];
    if (value.nome || value.name) parts.push(value.nome || value.name);
    if (value.email) parts.push(`<${value.email}>`);
    if (value.id && parts.length === 0) parts.push(`ID: ${value.id}`);
    
    if (parts.length > 0) return parts.join(" ");
    return JSON.stringify(value);
  }

  // DATA
  if ((campo?.includes("data") || (typeof value === "string" && value.includes("T"))) && typeof value === "string") {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR");
      }
    } catch {
      return value;
    }
  }

  return String(value);
};

const getAlteracoes = (antes: any, depois: any, entidade?: string) => {
  if (!antes || !depois) return [];

  // Pega todas as chaves de ambos os objetos para garantir que nada seja ignorado
  const allKeys = Array.from(new Set([...Object.keys(antes), ...Object.keys(depois)]));

  return allKeys.filter(
    (key) => {
      // Ignora campos internos ou sensíveis
      if (['password', 'token', 'id', 'created_at', 'updated_at', 'usuario_id', 'empresa_id'].includes(key)) return false;
      
      const valorAntes = antes[key] ?? null;
      const valorDepois = depois[key] ?? null;
      
      // Compara os valores brutos para garantir que qualquer mudança seja detectada
      return JSON.stringify(valorAntes) !== JSON.stringify(valorDepois);
    }
  );
};

const markdownFields = ['descricao', 'observacoes', 'objetivo_empresa', 'objetivo'];

const RenderValue = ({ value, campo, className }: { value: string, campo?: string, className?: string }) => {
  if (campo && markdownFields.includes(campo) && value !== "-") {
    return (
      <div className={`markdown-body ${className}`}>
        <ReactMarkdown>{value}</ReactMarkdown>
      </div>
    );
  }
  return <span className={`whitespace-pre-wrap ${className}`}>{value}</span>;
};

const HistoricoItem = ({ item, getActionColor, formatDate }: any) => {
  const navigate = useNavigate();
  const { clients, loading: loadingClients, setSelectedClientId } = useCompany();
  const detalhes = typeof item.detalhes === 'string' ? JSON.parse(item.detalhes) : item.detalhes;
  const isEmpresa = item.entidade === 'empresa';
  const [expanded, setExpanded] = useState(false);
  
  const isAnexo = item.acao === 'ANEXO_ADICIONADO';
  
  // Check if it's the new format (tarefas) or the old format (empresas, usuarios)
  const isNewFormat = item.entidade === 'tarefa' && detalhes && !detalhes.antes && !detalhes.depois && !isAnexo;
  
  const alteracoesNew = isNewFormat ? (detalhes.alteracoes || detalhes) : {};
  const hasNewDetails = Object.keys(alteracoesNew).filter(k => k !== 'empresa' && k !== 'tarefa').length > 0;
  
  const rawAntes = detalhes?.antes;
  const rawDepois = detalhes?.depois;
  const hasOldDetails = rawAntes && rawDepois;

  // Achata os dados de empresa para mostrar campos individuais (Razão Social, CNPJ, etc)
  let antes = rawAntes;
  let depois = rawDepois;
  if (isEmpresa && rawAntes && (rawAntes.empresa || rawAntes.socios || rawAntes.projeto)) {
    antes = {
      ...(rawAntes.empresa || {}),
      socios: rawAntes.socios || [],
      ...(rawAntes.projeto || {})
    };
    depois = {
      ...(rawDepois.empresa || {}),
      socios: rawDepois.socios || [],
      ...(rawDepois.projeto || {})
    };
  }
  
  const alteracoesOld = hasOldDetails ? getAlteracoes(antes, depois, item.entidade) : [];
  
  const hasDetails = hasNewDetails || (hasOldDetails && alteracoesOld.length > 0);

  const isProjetoOuEmpresaAtiva = (id: string) => {
    if (loadingClients) return true;
    // Verifica se é um ID de empresa
    if (clients.some(c => c.id === id)) return true;
    // Verifica se é um ID de projeto
    return clients.some(c => {
      const projetos = (c as any).projetos;
      if (Array.isArray(projetos)) {
        return projetos.some((p: any) => p.id === id);
      }
      return false;
    });
  };

  const isTarefaAtiva = (id: string) => {
    if (loadingClients) return true;
    return clients.some(c => {
      const projetos = (c as any).projetos;
      if (Array.isArray(projetos)) {
        return projetos.some((p: any) => {
          const tarefas = p.tarefas;
          if (Array.isArray(tarefas)) {
            return tarefas.some((t: any) => t.id === id);
          }
          return false;
        });
      }
      return false;
    });
  };

  const isClickable = () => {
    if (item.entidade === 'tarefa') {
      return isTarefaAtiva(item.entidade_id);
    }
    if (item.entidade === 'empresa') {
      return isProjetoOuEmpresaAtiva(item.entidade_id);
    }
    if (item.entidade === 'usuario') {
      return true;
    }
    return false;
  };

  const handleEntityClick = () => {
    if (!isClickable()) return;

    if (item.entidade === 'tarefa' && detalhes?.empresa?.id) {
      setSelectedClientId(detalhes.empresa.id);
      navigate(`/project/${detalhes.empresa.id}/tasks`, { state: { highlightTaskId: item.entidade_id } });
    } else if (item.entidade === 'empresa') {
      setSelectedClientId(item.entidade_id);
      navigate(`/empresa/${item.entidade_id}`);
    } else if (item.entidade === 'usuario') {
      navigate('/users');
    }
  };

  return (
    <div className="relative pl-6 md:pl-8">
      {/* Timeline dot */}
      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-brand-dark ${getActionColor(item.acao)}`} />
      
      <div className="bg-brand-black border border-brand-gray rounded-lg p-4 hover:border-brand-gray/80 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-text-primary">{item.usuario_nome}</span>
            <span 
              onClick={handleEntityClick}
              className={`text-xs text-brand-text-muted uppercase tracking-wider px-2 py-0.5 rounded bg-brand-dark border border-brand-gray transition-all ${
                isClickable()
                  ? 'cursor-pointer hover:bg-brand-gray hover:text-brand-accent hover:border-brand-accent/50' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              title={
                !isClickable() ? (item.entidade === 'tarefa' ? 'Tarefa excluída' : 'Empresa excluída') :
                item.entidade === 'tarefa' ? 'Ir para tarefas do projeto' :
                item.entidade === 'empresa' ? 'Ver detalhes da empresa' :
                item.entidade === 'usuario' ? 'Ver lista de usuários' : ''
              }
            >
              {item.entidade}
            </span>
          </div>
          <span className="text-xs text-brand-text-muted font-mono">
            {formatDate(item.data)}
          </span>
        </div>
        
        <div className="flex justify-between items-start">
          <div className="text-sm text-brand-text-muted">
            {item.entidade === 'tarefa' && (
              <div className="mb-2">
                <div className="text-xs text-gray-400">
                  Empresa: <span 
                    onClick={() => {
                      if (detalhes?.empresa?.id && isProjetoOuEmpresaAtiva(detalhes.empresa.id)) {
                        setSelectedClientId(detalhes.empresa.id);
                        navigate(`/project/${detalhes.empresa.id}/tasks`);
                      }
                    }}
                    className={`font-medium ${detalhes?.empresa?.id && isProjetoOuEmpresaAtiva(detalhes.empresa.id) ? 'text-blue-300 cursor-pointer hover:underline' : 'text-red-500 cursor-not-allowed'}`}
                    title={detalhes?.empresa?.id && !isProjetoOuEmpresaAtiva(detalhes.empresa.id) ? 'Empresa excluída' : ''}
                  >
                    {detalhes?.empresa?.nome || "-"}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  ↳ Tarefa: <span 
                    onClick={() => {
                      if (detalhes?.empresa?.id && isTarefaAtiva(item.entidade_id)) {
                        setSelectedClientId(detalhes.empresa.id);
                        navigate(`/project/${detalhes.empresa.id}/tasks`, { state: { highlightTaskId: item.entidade_id } });
                      }
                    }}
                    className={`font-medium ${isTarefaAtiva(item.entidade_id) ? 'text-brand-text-primary cursor-pointer hover:underline' : 'text-gray-500 cursor-not-allowed'}`}
                    title={!isTarefaAtiva(item.entidade_id) ? 'Tarefa excluída' : ''}
                  >
                    {detalhes?.tarefa?.nome || (item.acao !== 'ANEXO_ADICIONADO' ? item.descricao.replace('Tarefa editada: ', '').replace('Status alterado para ', '') : item.descricao)}
                  </span>
                </div>
              </div>
            )}
            <span className="font-medium text-brand-text-primary/80 mr-2">
              {item.acao === 'CRIADO' && 'Criou'}
              {item.acao === 'EDITADO' && 'Editou'}
              {item.acao === 'EXCLUIDO' && 'Excluiu'}
              {item.acao === 'STATUS_ALTERADO' && 'Alterou status'}
              {item.acao === 'ANEXO_ADICIONADO' && 'Adicionou um anexo'}
            </span>
            {item.acao === 'EXCLUIDO' ? (
              <span className="text-red-500 font-bold">
                {item.entidade === 'empresa' && (detalhes?.nome_fantasia || detalhes?.razao_social)
                  ? `Empresa: ${detalhes.nome_fantasia || detalhes.razao_social}`
                  : item.descricao}
              </span>
            ) : (
              item.acao !== 'ANEXO_ADICIONADO' && (
                (item.entidade === 'empresa' || item.entidade === 'tarefa') && !isClickable() ? (
                  <>
                    {item.descricao.includes(': ') ? (
                      <>
                        {item.descricao.split(': ')[0]}: <span className="text-red-500 font-bold">{item.descricao.split(': ').slice(1).join(': ')}</span>
                      </>
                    ) : (
                      <span className="text-red-500 font-bold">{item.descricao}</span>
                    )}
                  </>
                ) : item.descricao
              )
            )}
            
            {detalhes?.anexo && (
              <div className="mt-2 text-sm">
                <span className="text-yellow-400">📎 Anexo:</span>{" "}
                <span className="text-brand-text-primary">
                  {detalhes.anexo.nome}
                </span>
                <span className="text-gray-400 ml-2">
                  ({(detalhes.anexo.tamanho / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
          
          {hasDetails && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs flex items-center gap-1 text-brand-accent hover:text-brand-accent-hover transition-colors"
            >
              {expanded ? (
                <>Ocultar Detalhes <ChevronUp size={14} /></>
              ) : (
                <>Ver Detalhes <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        {expanded && hasDetails && (
          <div className="mt-4 pt-4 border-t border-brand-gray/50 bg-brand-dark/30 rounded p-3">
            <h4 className="text-xs font-bold text-brand-text-muted uppercase mb-3">Alterações:</h4>
            <div className="space-y-3">
              {isNewFormat ? (
                Object.entries(alteracoesNew).map(([campo, valores]: [string, any]) => {
                  if (campo === 'empresa' || campo === 'tarefa') return null;
                  return (
                    <div key={campo} className="text-sm bg-brand-black/50 p-2 rounded border border-brand-gray/30">
                      <div className="font-mono text-xs text-brand-text-muted mb-1 capitalize">
                        {nomesCampos[campo] || campo.replace(/_/g, ' ')}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <RenderValue 
                          value={formatValue(valores?.antes, campo)} 
                          campo={campo} 
                          className="text-red-400 line-through bg-red-400/10 px-2 py-1 rounded flex-1 break-all" 
                        />
                        <span className="text-brand-text-muted hidden sm:inline">→</span>
                        <RenderValue 
                          value={formatValue(valores?.depois, campo)} 
                          campo={campo} 
                          className="text-green-400 bg-green-400/10 px-2 py-1 rounded flex-1 break-all" 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                alteracoesOld.map((campo) => (
                  <div key={campo} className="text-sm bg-brand-black/50 p-3 rounded border border-brand-gray/30">
                    <div className="font-mono text-xs text-brand-accent mb-2 uppercase tracking-widest font-bold">
                      {item.entidade === 'empresa' ? (camposEmpresa[campo] || campo) : (nomesCampos[campo] || campo.replace(/_/g, ' '))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-red-500 uppercase font-bold tracking-tighter">Antes</span>
                        <RenderValue 
                          value={formatValue(antes[campo], campo)} 
                          campo={campo} 
                          className="text-red-400/80 bg-red-400/5 px-2 py-1.5 rounded border border-red-400/10 break-all text-xs" 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-green-500 uppercase font-bold tracking-tighter">Depois</span>
                        <RenderValue 
                          value={formatValue(depois[campo], campo)} 
                          campo={campo} 
                          className="text-green-400 bg-green-400/10 px-2 py-1.5 rounded border border-green-400/20 break-all text-xs font-medium" 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function Historico() {
  const [historico, setHistorico] = useState<(RegistroHistorico & { id: string; data: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 50;
  const { role } = useAuth();

  // Filtros
  const [entidadeFiltro, setEntidadeFiltro] = useState<string>('todas');
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  // Lista de usuários únicos para o filtro
  const [usuariosUnicos, setUsuariosUnicos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    fetchHistorico(true);
  }, [entidadeFiltro, usuarioFiltro, dataInicio, dataFim]);

  const fetchHistorico = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      
      const currentOffset = reset ? 0 : offset;
      
      const { data, count } = await getHistorico({
        entidade: entidadeFiltro,
        usuario_id: usuarioFiltro,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: LIMIT,
        offset: currentOffset,
      });

      if (reset) {
        setHistorico(data as any);
        setOffset(data.length);
      } else {
        setHistorico(prev => [...prev, ...(data as any)]);
        setOffset(prev => prev + data.length);
      }

      setHasMore(currentOffset + data.length < count);

      // Extrair usuários únicos se ainda não tivermos
      if (usuariosUnicos.length === 0 && data.length > 0) {
        const uniqueUsers = Array.from(new Map(data.map((item: any) => [item.usuario_id, { id: item.usuario_id, nome: item.usuario_nome }])).values());
        setUsuariosUnicos(uniqueUsers as any);
      }
    } catch (err: any) {
      setError('Erro ao carregar histórico: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand-text-primary mb-2">Acesso Negado</h1>
          <p className="text-brand-text-muted">Apenas administradores e gerentes podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const getActionColor = (acao: string) => {
    switch (acao) {
      case 'CRIADO':
        return 'bg-green-500';
      case 'EDITADO':
      case 'STATUS_ALTERADO':
        return 'bg-yellow-500';
      case 'EXCLUIDO':
        return 'bg-red-500';
      default:
        return 'bg-brand-gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-brand-black p-4 md:p-8 font-sans text-brand-text-primary">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8 text-brand-accent" />
          Histórico de Ações
        </h1>
        <p className="text-brand-text-muted">Acompanhe todas as atividades realizadas no sistema</p>
      </header>

      <div className="bg-brand-dark rounded-xl border border-brand-gray p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4 text-brand-text-muted font-bold uppercase text-sm">
          <Filter size={18} />
          <span>Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Entidade</label>
            <select
              value={entidadeFiltro}
              onChange={(e) => setEntidadeFiltro(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
            >
              <option value="todas">Todas</option>
              <option value="empresa">Empresas</option>
              <option value="tarefa">Tarefas</option>
              <option value="usuario">Usuários</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Usuário</label>
            <select
              value={usuarioFiltro}
              onChange={(e) => setUsuarioFiltro(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
            >
              <option value="todos">Todos</option>
              {usuariosUnicos.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-brand-black border border-brand-gray text-brand-text-primary rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-brand-dark rounded-xl border border-brand-gray shadow-xl p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-12 text-brand-text-muted">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="relative border-l border-brand-gray ml-3 md:ml-4 space-y-8 pb-4">
            {historico.map((item) => (
              <HistoricoItem 
                key={item.id} 
                item={item} 
                getActionColor={getActionColor} 
                formatDate={formatDate} 
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchHistorico(false)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-brand-dark border border-brand-gray text-brand-accent rounded-lg hover:bg-brand-gray transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-accent"></div>
                      Carregando...
                    </>
                  ) : (
                    <>Carregar Mais</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
