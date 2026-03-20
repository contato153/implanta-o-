import React from 'react';
import { Building2, MapPin, Phone, Mail, Users, Briefcase, FileText, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  descricao_motivo_situacao_cadastral: string;
  data_inicio_atividade: string;
  natureza_juridica: string;
  porte: string;
  descricao_porte: string;
  opcao_pelo_simples: boolean | null;
  opcao_pelo_mei: boolean | null;
  capital_social: number;
  
  // Endereço
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  
  // Contato
  email: string | null;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  
  // Atividades
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: Array<{
    codigo: number;
    descricao: string;
  }>;
  
  // Sócios
  qsa: Array<{
    nome_socio: string;
    qualificacao_socio: string;
    faixa_etaria: string;
    data_entrada_sociedade: string;
    cnpj_cpf_do_socio: string;
  }>;
  
  // Tributário
  regime_tributario?: Array<{
    ano: number;
    forma_de_tributacao: string;
    quantidade_de_escrituracoes: number;
  }>;
}

interface CnpjDetailsViewerProps {
  data: CnpjData | null;
}

export const CnpjDetailsViewer: React.FC<CnpjDetailsViewerProps> = ({ data }) => {
  if (!data) return null;

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatCEP = (cep: string) => {
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const isActive = data.descricao_situacao_cadastral === 'ATIVA';

  const latestRegime = data.regime_tributario && data.regime_tributario.length > 0
    ? data.regime_tributario.reduce((latest, current) => current.ano > latest.ano ? current : latest)
    : null;

  return (
    <div className="bg-brand-black border border-brand-gray rounded-xl overflow-hidden shadow-lg text-brand-text-primary max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-brand-dark p-6 border-b border-brand-gray relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Building2 size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-brand-accent">{data.razao_social}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {isActive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {data.descricao_situacao_cadastral}
              </span>
            </div>
            {data.nome_fantasia && (
              <p className="text-gray-400 text-lg mb-1">{data.nome_fantasia}</p>
            )}
            <p className="text-brand-text-muted font-mono">{formatCNPJ(data.cnpj)}</p>
          </div>
          
          <div className="bg-brand-black/50 p-4 rounded-lg border border-brand-gray/50 backdrop-blur-sm">
            <p className="text-xs text-brand-text-muted uppercase mb-1">Início da Atividade</p>
            <p className="font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-brand-accent" />
              {formatDate(data.data_inicio_atividade)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Info & Contact */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Informações Gerais */}
          <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
            <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={18} />
              Informações Gerais
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-text-muted uppercase">Natureza Jurídica</p>
                <p className="font-medium">{data.natureza_juridica}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-brand-text-muted uppercase">Porte</p>
                  <p className="font-medium">{data.porte}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted uppercase">Capital Social</p>
                  <p className="font-medium">{formatCurrency(data.capital_social)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-brand-text-muted uppercase">Optante Simples</p>
                  <p className="font-medium">{data.opcao_pelo_simples ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted uppercase">Optante MEI</p>
                  <p className="font-medium">{data.opcao_pelo_mei ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              {latestRegime && (
                <div className="pt-2 border-t border-brand-gray/30">
                  <p className="text-xs text-brand-text-muted uppercase">Regime Tributário (Mais Recente)</p>
                  <p className="font-medium text-brand-accent">
                    {latestRegime.forma_de_tributacao}
                    <span className="text-brand-text-muted text-xs ml-2 font-normal">
                      (Ano: {latestRegime.ano})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
            <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <Phone size={18} />
              Contato
            </h3>
            <div className="space-y-4">
              {data.email && (
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-brand-text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-text-muted uppercase">Email</p>
                    <p className="font-medium break-all">{data.email}</p>
                  </div>
                </div>
              )}
              {data.ddd_telefone_1 && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-brand-text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-text-muted uppercase">Telefone Principal</p>
                    <p className="font-medium">{data.ddd_telefone_1}</p>
                  </div>
                </div>
              )}
              {data.ddd_telefone_2 && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-brand-text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-text-muted uppercase">Telefone Secundário</p>
                    <p className="font-medium">{data.ddd_telefone_2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
            <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={18} />
              Endereço
            </h3>
            <div className="space-y-2">
              <p className="font-medium">
                {data.descricao_tipo_de_logradouro} {data.logradouro}, {data.numero}
                {data.complemento && ` - ${data.complemento}`}
              </p>
              <p className="text-gray-300">{data.bairro}</p>
              <p className="text-gray-300">{data.municipio} - {data.uf}</p>
              <p className="text-brand-text-muted font-mono">{formatCEP(data.cep)}</p>
            </div>
          </div>

        </div>

        {/* Right Column - Activities, Partners, Taxes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Atividades Econômicas */}
          <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
            <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase size={18} />
              Atividades Econômicas (CNAE)
            </h3>
            
            <div className="mb-6">
              <p className="text-xs text-brand-text-muted uppercase mb-2">Atividade Principal</p>
              <div className="bg-brand-black p-4 rounded-lg border border-brand-gray/50 flex gap-4 items-start">
                <div className="bg-brand-accent/10 text-brand-accent px-2 py-1 rounded font-mono text-sm shrink-0">
                  {data.cnae_fiscal}
                </div>
                <p className="font-medium">{data.cnae_fiscal_descricao}</p>
              </div>
            </div>

            {data.cnaes_secundarios && data.cnaes_secundarios.length > 0 && (
              <div>
                <p className="text-xs text-brand-text-muted uppercase mb-2">Atividades Secundárias</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {data.cnaes_secundarios.map((cnae, idx) => (
                    <div key={idx} className="bg-brand-black p-3 rounded-lg border border-brand-gray/30 flex gap-4 items-start">
                      <div className="text-gray-400 px-2 py-1 rounded font-mono text-xs shrink-0 bg-brand-dark">
                        {cnae.codigo}
                      </div>
                      <p className="text-sm text-gray-300">{cnae.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quadro Societário */}
          <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
            <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={18} />
              Quadro Societário (QSA)
            </h3>
            
            {data.qsa && data.qsa.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.qsa.map((socio, idx) => (
                  <div key={idx} className="bg-brand-black p-4 rounded-lg border border-brand-gray/50">
                    <p className="font-bold text-brand-text-primary mb-1">{socio.nome_socio}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-brand-accent uppercase">{socio.qualificacao_socio}</p>
                      <p className="text-xs text-gray-400">Entrada: {formatDate(socio.data_entrada_sociedade)}</p>
                      {socio.faixa_etaria && (
                        <p className="text-xs text-gray-400">Idade: {socio.faixa_etaria}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-text-muted text-sm italic">Nenhum sócio registrado ou informação indisponível.</p>
            )}
          </div>

          {/* Regime Tributário Histórico */}
          {data.regime_tributario && data.regime_tributario.length > 0 && (
            <div className="bg-brand-dark/50 rounded-xl p-5 border border-brand-gray/30">
              <h3 className="text-sm font-bold text-brand-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={18} />
                Histórico de Regime Tributário
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-brand-text-muted uppercase bg-brand-black">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Ano</th>
                      <th className="px-4 py-3">Forma de Tributação</th>
                      <th className="px-4 py-3 rounded-tr-lg">Escriturações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regime_tributario.map((regime, idx) => (
                      <tr key={idx} className="border-b border-brand-gray/30 last:border-0">
                        <td className="px-4 py-3 font-mono">{regime.ano}</td>
                        <td className="px-4 py-3">{regime.forma_de_tributacao}</td>
                        <td className="px-4 py-3">{regime.quantidade_de_escrituracoes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
