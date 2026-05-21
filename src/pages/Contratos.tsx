import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Building2, Printer, RotateCcw, Edit3, Settings,
  CreditCard, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo,
  Save, CheckCircle, XCircle, AlertTriangle, Clock, History, List, Loader2,
  FileDown, Strikethrough, Indent, Outdent, Minus, PenSquare, Type, Palette
} from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { getClients } from '../services/api';
import { Empresa } from '../types';

// --- FUNÇÃO AUXILIAR: NÚMEROS POR EXTENSO EM PORTUGUÊS ---
function numeroParaExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas10 = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const escreverGrupo = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    let partes: string[] = [];
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) partes.push(centenas[c]);
    if (d === 1) { partes.push(dezenas10[u]); }
    else { if (d > 1) partes.push(dezenas[d]); if (u > 0) partes.push(unidades[u]); }
    return partes.join(' e ');
  };

  const partesMonetarias: string[] = [];
  const valorInteiro = Math.floor(valor);
  const centavos = Math.round((valor - valorInteiro) * 100);

  if (valorInteiro > 0) {
    const milhoes = Math.floor(valorInteiro / 1000000);
    const milhares = Math.floor((valorInteiro % 1000000) / 1000);
    const unidadesSimples = valorInteiro % 1000;
    if (milhoes > 0) partesMonetarias.push(milhoes === 1 ? 'un milhão' : `${escreverGrupo(milhoes)} milhões`);
    if (milhares > 0) partesMonetarias.push(milhares === 1 ? 'mil' : `${escreverGrupo(milhares)} mil`);
    if (unidadesSimples > 0) partesMonetarias.push(escreverGrupo(unidadesSimples));
    partesMonetarias.push(valorInteiro === 1 ? 'real' : 'reais');
  }
  if (centavos > 0) {
    const parteCentavos = centavos === 1 ? 'um centavo' : `${escreverGrupo(centavos)} centavos`;
    if (partesMonetarias.length > 0) partesMonetarias.push(`e ${parteCentavos}`);
    else partesMonetarias.push(parteCentavos);
  }
  return partesMonetarias.join(' e ').replace(/e e/g, 'e');
}

function parseMoney(valueStr: string): number {
  const clean = valueStr.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

// --- MODELOS DE CONTRATO ---
const DEFAULT_TEMPLATE_TERCEIRIZACAO = `CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS

{{contratante_razao_social}}, pessoa jurídica de direito privado constituída sob a forma de sociedade empresária limitada, inscrita no Cadastro Nacional da Pessoa Jurídica do Ministério da Fazenda (CNPJ/MF) sob o n.º {{contratante_cnpj}}, e no Cadastro de Contribuintes do ICMS do Estado de Minas Gerais (CCICMS/MG) sob o n.º {{contratante_ie}}, estabelecida à {{contratante_endereco}}, representada por {{contratante_representante_nome}}, inscrito no Cadastro de Pessoas Físicas (CPF/MF) do Ministério da Fazenda sob o n.º {{contratante_representante_cpf}}, neste ato denominada CONTRATANTE e;

{{contrada_razao_social}}, pessoa jurídica de direito privado constituída sob a forma de sociedade empresária limitada, inscrita no CNPJ‐MF sob o n.º {{contrada_cnpj}}, estabelecida na {{contrada_endereco}}, representada por {{contrada_representante_nome}}, inscrito no CPF/MF sob o n.º {{contrada_representante_cpf}}, neste ato denominada como CONTRATADA; têm entre si como justo e acertado o presente contrato de prestação de serviços que se regerá pelas seguintes cláusulas e condições.

CLÁUSULA PRIMEIRA – DO OBJETO
O objeto do presente contrato é a prestação dos serviços profissionais e especializados pela CONTRATADA à CONTRATANTE sem qualquer exclusividade, e de acordo com as necessidades, condições e especificações informadas por esta última.
Parágrafo único ‐ Fica expressamente vedada, no todo ou em parte, a transferência ou cessão dos serviços de que trata o presente instrumento.

CLÁUSULA SEGUNDA – DA EXECUÇÃO DOS SERVIÇOS
Os serviços informados na cláusula primeira serão executados pelos empregados/prepostos da CONTRATADA sob sua exclusiva responsabilidade, na sede da CONTRATANTE, de acordo com a necessidade da CONTRATANTE embasado na legislação trabalhista vigente.

CLÁUSULA TERCEIRA – DA REMUNERAÇÃO
Os valores devidos pelos serviços prestados serão apurados mensalmente pela CONTRATADA e informados à CONTRATANTE através de relatório descritivo. O pagamento deverá ser realizado pela CONTRATANTE até o {{dia_util_vencimento}}º dia útil do mês subsequente ao dos serviços prestados, através depósito na conta corrente de titularidade da CONTRATADA, mediante a apresentação da competente nota fiscal de serviços.
§1º ‐ Os valores devidos pela CONTRATANTE serão apurados conforme a aplicação dos valores definidos mediante contrato de trabalho firmado entre empregados/prepostos e a CONTRATADA.
§2º – A remuneração inclui todos os encargos trabalhistas, sociais, previdenciários, securitários e outros não nominados; gastos e despesas relativos aos serviços executados no período, nada mais sendo devido pela CONTRATANTE à CONTRATADA, a qualquer título que seja.
§3º ‐ A remuneração paga após a data indicada no caput sujeitará a CONTRATANTE à multa de 10%, atualização monetária pelo Índice Geral de Preços do Mercado (IGP‐M) e juros moratórios de 1% ao mês, calculados pró‐rata dia.
O valor mensal da prestação de serviços acordada é de R$ {{valor_servico}} ({{valor_servico_extenso}}).
Dados bancários para pagamento: {{dados_bancarios}}.

CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATANTE
Durante a vigência deste contrato, a CONTRATANTE se obriga a:
• Prestar as informações necessárias à realização dos serviços contratados, devendo especificar os detalhes necessários à perfeita consecução dos mesmos;
• Fornecer à CONTRATADA os materiais e insumos necessários para a prestação do serviço;
• Efetuar o pagamento na forma e condições estabelecidas na cláusula terceira;
• Comunicar por escrito à CONTRATADA, reclamações de seus empregados/prepostos, para que sejam tomadas as medidas disciplinares necessárias;
• Garantir as condições de segurança, higiene e salubridade dos empregados/prepostos da CONTRATADA;

CLÁUSULA QUINTA – DAS OBRIGAÇÕES DA CONTRATADA
Durante a vigência deste contrato, a CONTRATADA se obriga a:
• Prestar os serviços contratados na forma e modo ajustados, utilizando a melhor técnica e visando sempre atingir o melhor resultado;
• Efetuar o pagamento da remuneração de seus empregados/prepostos, e cumprir as obrigações de natureza trabalhista, fiscal ou previdenciária decorrentes dos serviços objeto do presente contrato;
• Apurar eventuais reclamações apresentadas pela CONTRATANTE em relação à conduta de seus empregados/prepostos, e ressarcir eventuais prejuízos causados por ação ou omissão destes à CONTRATANTE na execução dos serviços contratados;
• Apresentar relatório mensal, com todas as atividades desenvolvidas no período acompanhado de comprovante de recolhimento do FGTS e do INSS de seus empregados.
• Não utilizar trabalho infantil ou escravo em suas atividades e observar as normas relativas à saúde e segurança ocupacional.

CLÁUSULA SEXTA – DA VIGÊNCIA E RESCISÃO
O presente contrato é firmado por prazo indeterminado, podendo ser rescindido por qualquer uma das partes mediante aviso prévio escrito com antecedência mínima de 30 dias.
Parágrafo único – Além da hipótese prevista no caput, o contrato poderá ser rescindido:
• Por insolvência, dissolução parcial ou integral, pedido de recuperação judicial, decretação de falência da CONTRATANTE ou da CONTRATADA;
• Por força maior, conforme previsto e definido no art. 393, parágrafo único do Código Civil Brasileiro (CCB/02);
• Pelo descumprimento reiterado de qualquer das cláusulas e condições pactuadas neste instrumento.

CLÁUSULA SÉTIMA – DAS PENALIDADES
O descumprimento das obrigações previstas neste instrumento, em especial daquelas estabelecidas nas cláusulas quarta e quinta, resultará em multa para a parte infratora no total de 20% s/ o valor da última remuneração apurada, e ressarcimento dos prejuízos devidamente comprovados.

CLÁUSULA OITAVA – DAS DISPOSIÇÕES GERAIS
Ajustam as partes que não há qualquer subordinação administrativa ou funcional entre a CONTRATADA, seus funcionários e/ou prepostos utilizados na execução dos serviços ora contratados com a CONTRATANTE, não se estabelecendo desta forma, qualquer vínculo empregatício entre os mesmos.

CLÁUSULA NONA – DO FORO
Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da Comarca de {{foro_comarca}}, com expressa renúncia a qualquer outro, por mais especial e privilegiado que seja.
Por estarem assim justos e de acordo, firmam o presente instrumento, em duas vias de igual teor, juntamente com 2 (duas) testemunhas.

{{contrato_cidade}}, {{contrato_dia}} de {{contrato_mes}} de {{contrato_ano}}.


________________________________________________________________
{{contratante_razao_social}}
CONTRATANTE


________________________________________________________________
{{contrada_razao_social}}
CONTRATADA


___________________________________         ___________________________________
Testemunha 1:                               Testemunha 2:
CPF:                                        CPF:`;

const DEFAULT_TEMPLATE_ALUGUEL = `CONTRATO DE LOCAÇÃO DE IMÓVEL COMERCIAL

LOCADOR: {{contratante_razao_social}}, com sede à {{contratante_endereco}}, inscrita no CNPJ sob o n.º {{contratante_cnpj}}, neste ato representada por {{contratante_representante_nome}}, CPF n.º {{contratante_representante_cpf}}.

LOCATÁRIO: {{contrada_razao_social}}, com sede à {{contrada_endereco}}, inscrita no CNPJ sob o n.º {{contrada_cnpj}}, neste ato representada por {{contrada_representante_nome}}, CPF n.º {{contrada_representante_cpf}}.

As partes acima qualificadas têm, entre si, justo e contratado a locação do imóvel comercial situado à {{contrada_endereco}}, mediante as seguintes cláusulas:

CLÁUSULA PRIMEIRA - DO VALOR DO ALUGUEL
O valor do aluguel mensal é de R$ {{valor_servico}} ({{valor_servico_extenso}}), a ser pago até o {{dia_util_vencimento}}º dia útil de cada mês vencido.
Os pagamentos serão efetuados via transferência bancária conforme dados a seguir: {{dados_bancarios}}.

CLÁUSULA SEGUNDA - DO PRAZO
O prazo da locação é por tempo indeterminado, iniciando-se em {{contrato_dia}} de {{contrato_mes}} de {{contrato_ano}}.
A rescisão poderá ocorrer mediante aviso prévio por escrito de 30 (trinta) dias.

CLÁUSULA TERCEIRA - DO FORO
Fica eleito o foro da Comarca de {{foro_comarca}} para dirimir qualquer dúvida ou controvérsia decorrente deste contrato.

{{contrato_cidade}}, {{contrato_dia}} de {{contrato_mes}} de {{contrato_ano}}.


________________________________________________________________
{{contratante_razao_social}}
LOCADOR


________________________________________________________________
{{contrada_razao_social}}
LOCATÁRIO`;

interface ExtraData {
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  representante_nome: string;
  representante_cpf: string;
}

const emptyExtraData: ExtraData = {
  rua: '', numero: '', bairro: '', cep: '', cidade: '', uf: '',
  representante_nome: '', representante_cpf: ''
};

interface VersionEntry {
  id: string;
  date: string;
  label: string;
  html: string;
}

interface ValidationCheck {
  label: string;
  ok: boolean;
  critical: boolean;
}

export function Contratos() {
  const [tipoContrato, setTipoContrato] = useState<'terceirizacao' | 'aluguel'>('terceirizacao');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contratanteId, setContratanteId] = useState('');
  const [contratadoId, setContratadoId] = useState('');
  const [contratanteExtra, setContratanteExtra] = useState<ExtraData>(emptyExtraData);
  const [contratadoExtra, setContratadoExtra] = useState<ExtraData>(emptyExtraData);

  // Parâmetros do Contrato
  const [valor, setValor] = useState('5.000,00');
  const [diaUtil, setDiaUtil] = useState('1º');
  const [dadosBancarios, setDadosBancarios] = useState('');
  const [foro, setForo] = useState('Belo Horizonte');
  const today = new Date();
  const [cidadeAssinatura, setCidadeAssinatura] = useState('Belo Horizonte');
  const [dataAssinatura, setDataAssinatura] = useState(today.toISOString().split('T')[0]);

  // Template Editor
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE_TERCEIRIZACAO);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Modo de Edição Direta Estilo Word
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState('');
  const [savedContractHtml, setSavedContractHtml] = useState<string | null>(null);

  // Modelos Personalizados
  const [savedDocuments, setSavedDocuments] = useState<Array<{ id: string; name: string; tipo: string; html: string }>>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  // PDF + Validação
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pdf' | 'print' | null>(null);

  // Histórico de Versões
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Cor de texto no editor
  const [textColor, setTextColor] = useState('#000000');

  const previewRef = useRef<HTMLDivElement>(null);

  // --- CARREGAR MODELOS PERSONALIZADOS SALVOS (mas NÃO auto-carregar HTML estático por empresa) ---
  // O preview sempre mostra a substituição dinâmica ao vivo.
  // savedContractHtml só é preenchido quando o usuário EXPLICITAMENTE carrega um modelo salvo.

  useEffect(() => {
    const saved = localStorage.getItem('contratos_salvos_custom');
    if (saved) {
      try { setSavedDocuments(JSON.parse(saved)); } catch (e) { console.error(e); }
    }

    // Limpar cache antigo de contratos estáticos por empresa (que congelavam o preview)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('contrato_editado_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);


  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const data = await getClients();
        if (data && data.length > 0) setEmpresas(data);
      } catch (error) { console.error('Error fetching companies:', error); }
    }
    fetchEmpresas();
  }, []);

  useEffect(() => {
    const savedTemplate = localStorage.getItem(`modelo_contrato_${tipoContrato}`);
    if (savedTemplate) setTemplateText(savedTemplate);
    else setTemplateText(tipoContrato === 'terceirizacao' ? DEFAULT_TEMPLATE_TERCEIRIZACAO : DEFAULT_TEMPLATE_ALUGUEL);
  }, [tipoContrato]);

  // Carregar dados extras do Contratante — primeiro do localStorage (memória), senão busca da empresa
  useEffect(() => {
    if (!contratanteId) { setContratanteExtra(emptyExtraData); return; }

    const saved = localStorage.getItem(`empresa_dados_contrato_${contratanteId}`);
    if (saved) {
      // Dados já preenchidos antes: restaura automaticamente da memória
      try { setContratanteExtra(JSON.parse(saved)); } catch { setContratanteExtra(emptyExtraData); }
      return;
    }

    // Primeira vez selecionando esta empresa: busca o nome do representante nos sócios cadastrados
    // e usa ponto_focal_nome da empresa como fallback
    const empresa = empresas.find(e => e.id === contratanteId);
    const pontoFocal = empresa?.ponto_focal_nome || '';

    async function inicializarDadosEmpresa() {
      try {
        const supabase = getSupabase();
        const { data: socios } = await supabase
          .from('socios')
          .select('nome')
          .eq('empresa_id', contratanteId)
          .limit(5);

        const socioNome = socios && socios[0] ? socios[0].nome : pontoFocal;
        const defaultExtra: ExtraData = { ...emptyExtraData, representante_nome: socioNome };
        setContratanteExtra(defaultExtra);
        localStorage.setItem(`empresa_dados_contrato_${contratanteId}`, JSON.stringify(defaultExtra));
      } catch {
        const defaultExtra: ExtraData = { ...emptyExtraData, representante_nome: pontoFocal };
        setContratanteExtra(defaultExtra);
      }
    }
    inicializarDadosEmpresa();
  }, [contratanteId, empresas]);

  // Carregar dados extras do Contratado — mesmo padrão
  useEffect(() => {
    if (!contratadoId) { setContratadoExtra(emptyExtraData); return; }

    const saved = localStorage.getItem(`empresa_dados_contrato_${contratadoId}`);
    if (saved) {
      try { setContratadoExtra(JSON.parse(saved)); } catch { setContratadoExtra(emptyExtraData); }
      return;
    }

    const empresa = empresas.find(e => e.id === contratadoId);
    const pontoFocal = empresa?.ponto_focal_nome || '';

    async function inicializarDadosEmpresa() {
      try {
        const supabase = getSupabase();
        const { data: socios } = await supabase
          .from('socios')
          .select('nome')
          .eq('empresa_id', contratadoId)
          .limit(5);

        const socioNome = socios && socios[0] ? socios[0].nome : pontoFocal;
        const defaultExtra: ExtraData = { ...emptyExtraData, representante_nome: socioNome };
        setContratadoExtra(defaultExtra);
        localStorage.setItem(`empresa_dados_contrato_${contratadoId}`, JSON.stringify(defaultExtra));
      } catch {
        const defaultExtra: ExtraData = { ...emptyExtraData, representante_nome: pontoFocal };
        setContratadoExtra(defaultExtra);
      }
    }
    inicializarDadosEmpresa();
  }, [contratadoId, empresas]);

  useEffect(() => {
    if (!isDirectEditing) setEditedHtml('');
  }, [contratanteId, contratadoId, contratanteExtra, contratadoExtra, valor, diaUtil, dadosBancarios, foro, cidadeAssinatura, dataAssinatura, tipoContrato, isDirectEditing]);

  // Carregar histórico ao mudar empresas
  useEffect(() => {
    if (contratanteId && contratadoId) {
      const key = `contrato_historico_${tipoContrato}_${contratanteId}_${contratadoId}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        try { setVersionHistory(JSON.parse(existing)); } catch { setVersionHistory([]); }
      } else {
        setVersionHistory([]);
      }
    }
  }, [contratanteId, contratadoId, tipoContrato]);

  // --- VALIDAÇÃO ---
  const getValidationStatus = (): ValidationCheck[] => [
    { label: 'Empresa Contratante selecionada', ok: !!contratanteId, critical: true },
    { label: 'Empresa Contratada selecionada', ok: !!contratadoId, critical: true },
    { label: 'Nome do representante do Contratante', ok: !!contratanteExtra.representante_nome.trim(), critical: true },
    { label: 'CPF do representante do Contratante', ok: !!contratanteExtra.representante_cpf.trim(), critical: true },
    { label: 'Endereço do Contratante (rua)', ok: !!contratanteExtra.rua.trim(), critical: true },
    { label: 'Nome do representante do Contratado', ok: !!contratadoExtra.representante_nome.trim(), critical: true },
    { label: 'CPF do representante do Contratado', ok: !!contratadoExtra.representante_cpf.trim(), critical: true },
    { label: 'Endereço do Contratado (rua)', ok: !!contratadoExtra.rua.trim(), critical: true },
    { label: 'Valor do contrato maior que zero', ok: parseMoney(valor) > 0, critical: false },
    { label: 'Dados bancários para pagamento', ok: !!dadosBancarios.trim(), critical: false },
  ];

  const hasCriticalErrors = () => getValidationStatus().some(v => !v.ok && v.critical);

  // --- HISTÓRICO DE VERSÕES ---
  const saveVersion = (html: string) => {
    if (!contratanteId || !contratadoId) return;
    const key = `contrato_historico_${tipoContrato}_${contratanteId}_${contratadoId}`;
    const existing: VersionEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const newVersion: VersionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      label: `Versão ${existing.length + 1} — ${new Date().toLocaleString('pt-BR')}`,
      html,
    };
    const updated = [newVersion, ...existing].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
    setVersionHistory(updated);
  };

  const restoreVersion = (entry: VersionEntry) => {
    if (confirm(`Restaurar "${entry.label}"? O conteúdo atual será substituído.`)) {
      setSavedContractHtml(entry.html);
      setEditedHtml(entry.html);
      setIsDirectEditing(true);
      setShowHistoryModal(false);
    }
  };

  // --- MODELOS PERSONALIZADOS ---
  const handleLoadDocument = (id: string) => {
    if (!id) {
      setActiveDocumentId(null); setSavedContractHtml(null);
      setIsDirectEditing(false); setEditedHtml(''); return;
    }
    const doc = savedDocuments.find(d => d.id === id);
    if (doc) {
      setActiveDocumentId(doc.id); setSavedContractHtml(doc.html);
      setEditedHtml(doc.html); setIsDirectEditing(true);
      setTipoContrato(doc.tipo as 'terceirizacao' | 'aluguel');
    }
  };

  const handleDeleteDocument = () => {
    if (!activeDocumentId) return;
    const doc = savedDocuments.find(d => d.id === activeDocumentId);
    if (!doc) return;
    if (confirm(`Excluir permanentemente o modelo "${doc.name}"?`)) {
      const updated = savedDocuments.filter(d => d.id !== activeDocumentId);
      setSavedDocuments(updated);
      localStorage.setItem('contratos_salvos_custom', JSON.stringify(updated));
      setActiveDocumentId(null); setSavedContractHtml(null);
      setIsDirectEditing(false); setEditedHtml('');
    }
  };

  const handleCreateNewDocument = (name: string) => {
    if (!name.trim()) { alert('Por favor, insira um nome válido.'); return; }
    const htmlToSave = isDirectEditing ? editedHtml : generateSubstitutedHtml();
    const newDoc = { id: Math.random().toString(36).substr(2, 9), name: name.trim(), tipo: tipoContrato, html: htmlToSave };
    const updated = [...savedDocuments, newDoc];
    setSavedDocuments(updated);
    localStorage.setItem('contratos_salvos_custom', JSON.stringify(updated));
    setActiveDocumentId(newDoc.id); setSavedContractHtml(htmlToSave);
    setIsDirectEditing(true); setEditedHtml(htmlToSave);
    setShowSaveModal(false);
    alert(`Modelo "${name}" salvo com sucesso!`);
  };

  const handleSaveEditedContract = () => {
    const html = isDirectEditing ? editedHtml : generateSubstitutedHtml();
    saveVersion(savedContractHtml || '');

    if (activeDocumentId) {
      const updated = savedDocuments.map(doc => doc.id === activeDocumentId ? { ...doc, html } : doc);
      setSavedDocuments(updated);
      localStorage.setItem('contratos_salvos_custom', JSON.stringify(updated));
      setSavedContractHtml(html);
      alert('Modelo personalizado atualizado!');
    } else {
      if (!contratanteId || !contratadoId) {
        alert('Selecione o Contratante e o Contratado para salvar.'); return;
      }
      setNewDocName(`Modelo ${tipoContrato === 'terceirizacao' ? 'Prestação' : 'Locação'} — ${new Date().toLocaleDateString()}`);
      setShowSaveModal(true);
    }
  };

  const handleDiscardEditedContract = () => {
    if (confirm('Descartar edições manuais e voltar ao modelo dinâmico?')) {
      setSavedContractHtml(null);
      setEditedHtml('');
      setIsDirectEditing(false);
      setActiveDocumentId(null);
    }
  };

  // --- EXTRAS DAS PARTES ---
  const handleContratanteExtraChange = (field: keyof ExtraData, value: string) => {
    if (!contratanteId) return;
    const updated = { ...contratanteExtra, [field]: value };
    setContratanteExtra(updated);
    localStorage.setItem(`empresa_dados_contrato_${contratanteId}`, JSON.stringify(updated));
  };

  const handleContratadoExtraChange = (field: keyof ExtraData, value: string) => {
    if (!contratadoId) return;
    const updated = { ...contratadoExtra, [field]: value };
    setContratadoExtra(updated);
    localStorage.setItem(`empresa_dados_contrato_${contratadoId}`, JSON.stringify(updated));
  };

  // --- TEMPLATE ---
  const handleSaveTemplate = () => {
    localStorage.setItem(`modelo_contrato_${tipoContrato}`, templateText);
    setIsEditing(false);
    alert('Modelo salvo com sucesso!');
  };

  const handleResetTemplate = () => {
    if (confirm('Restaurar o modelo original? Suas alterações serão perdidas.')) {
      const original = tipoContrato === 'terceirizacao' ? DEFAULT_TEMPLATE_TERCEIRIZACAO : DEFAULT_TEMPLATE_ALUGUEL;
      setTemplateText(original);
      localStorage.removeItem(`modelo_contrato_${tipoContrato}`);
      setIsEditing(false);
    }
  };

  // --- ENDEREÇO FORMATADO ---
  const getFullAddress = (extra: ExtraData) => {
    const parts = [
      extra.rua ? `${extra.rua}` : '',
      extra.numero ? `, nº ${extra.numero}` : '',
      extra.bairro ? `, Bairro ${extra.bairro}` : '',
      extra.cep ? `, CEP ${extra.cep}` : '',
      extra.cidade && extra.uf ? `, ${extra.cidade} - ${extra.uf}` : extra.cidade || extra.uf || ''
    ];
    const full = parts.filter(Boolean).join('').trim();
    return full.startsWith(',') ? full.substring(1).trim() : full;
  };

  // --- DATA DE ASSINATURA ---
  const parseDataAssinatura = () => {
    if (!dataAssinatura) return { dia: '___', mes: '________', ano: '20__' };
    const date = new Date(dataAssinatura + 'T12:00:00');
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return { dia: String(date.getDate()), mes: meses[date.getMonth()], ano: String(date.getFullYear()) };
  };

  // --- SUBSTITUIÇÃO DE TAGS ---
  const getSubstitutedText = () => {
    const contratante = empresas.find(e => e.id === contratanteId);
    const contratado = empresas.find(e => e.id === contratadoId);
    const { dia, mes, ano } = parseDataAssinatura();
    const valorNumerico = parseMoney(valor);
    const valorExtensoStr = numeroParaExtenso(valorNumerico);
    let text = templateText;
    text = text.replace(/{{contratante_razao_social}}/g, contratante?.razao_social || '____________________________');
    text = text.replace(/{{contratante_cnpj}}/g, contratante?.cnpj || '________________');
    text = text.replace(/{{contratante_ie}}/g, contratante?.ie || '__________________');
    text = text.replace(/{{contratante_endereco}}/g, getFullAddress(contratanteExtra) || '________________________________________________________');
    text = text.replace(/{{contratante_representante_nome}}/g, contratanteExtra.representante_nome || '____________________________');
    text = text.replace(/{{contratante_representante_cpf}}/g, contratanteExtra.representante_cpf || '______________');
    text = text.replace(/{{contrada_razao_social}}/g, contratado?.razao_social || '____________________________');
    text = text.replace(/{{contrada_cnpj}}/g, contratado?.cnpj || '________________');
    text = text.replace(/{{contrada_ie}}/g, contratado?.ie || '__________________');
    text = text.replace(/{{contrada_endereco}}/g, getFullAddress(contratadoExtra) || '________________________________________________________');
    text = text.replace(/{{contrada_representante_nome}}/g, contratadoExtra.representante_nome || '____________________________');
    text = text.replace(/{{contrada_representante_cpf}}/g, contratadoExtra.representante_cpf || '______________');
    text = text.replace(/{{valor_servico}}/g, valor || '_______');
    text = text.replace(/{{valor_servico_extenso}}/g, valorExtensoStr || '____________________________');
    text = text.replace(/{{dia_util_vencimento}}/g, diaUtil || '___');
    text = text.replace(/{{dados_bancarios}}/g, dadosBancarios || '_____________________________________________');
    text = text.replace(/{{foro_comarca}}/g, foro || '____________________');
    text = text.replace(/{{contrato_cidade}}/g, cidadeAssinatura || '____________________');
    text = text.replace(/{{contrato_dia}}/g, dia);
    text = text.replace(/{{contrato_mes}}/g, mes);
    text = text.replace(/{{contrato_ano}}/g, ano);
    return text;
  };

  // --- GERAR HTML DO CONTRATO ---
  const generateSubstitutedHtml = () => {
    const rawText = getSubstitutedText();
    const lines = rawText.split('\n');
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return `<p style="margin:0;padding:0;font-family:'Arial';font-size:6pt;line-height:1.0;min-height:6pt;">&nbsp;</p>`;
      if (trimmed.toUpperCase().startsWith('CONTRATO') || trimmed.toUpperCase().startsWith('LOCADOR') && trimmed.endsWith(':')) {
        return `<p style="text-align:center;font-weight:bold;margin-top:8pt;margin-bottom:8pt;font-family:'Arial';font-size:13pt;text-transform:uppercase;">${line}</p>`;
      }
      if (trimmed.toUpperCase().startsWith('CLÁUSULA')) {
        return `<p style="text-align:left;font-weight:bold;margin-top:10pt;margin-bottom:4pt;font-family:'Arial';font-size:11pt;">${line}</p>`;
      }
      if (trimmed.startsWith('___') || trimmed.includes('CONTRATANTE') || trimmed.includes('CONTRATADA') || trimmed.includes('LOCADOR') || trimmed.includes('LOCATÁRIO') || trimmed.includes('Testemunha')) {
        return `<p style="text-align:left;margin-top:3pt;margin-bottom:3pt;font-family:'Arial';font-size:11pt;line-height:1.2;overflow-wrap:break-word;">${line}</p>`;
      }
      return `<p style="text-align:justify;text-justify:inter-word;text-align-last:left;margin-bottom:6pt;font-family:'Arial';font-size:11pt;line-height:1.5;overflow-wrap:break-word;">${line}</p>`;
    }).join('');
  };

  // --- IMPRESSÃO (navegador) ---
  const handlePrint = () => {
    if (!contratanteId || !contratadoId) {
      alert('Selecione o Contratante e o Contratado antes de imprimir.');
      return;
    }
    window.print();
  };

  // --- GERAÇÃO DE PDF via html2canvas + jsPDF ---
  const handleGeneratePdf = async () => {
    if (!contratanteId || !contratadoId) {
      alert('Selecione o Contratante e o Contratado antes de gerar o PDF.'); return;
    }
    if (hasCriticalErrors()) {
      setPendingAction('pdf');
      setShowValidationModal(true);
      return;
    }
    await executePdfGeneration();
  };

  const executePdfGeneration = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = previewRef.current;
      if (!element) { alert('Elemento de preview não encontrado.'); return; }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Numeração de páginas
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      }

      const contratado = empresas.find(e => e.id === contratadoId);
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `Contrato_${tipoContrato === 'terceirizacao' ? 'PrestacaoServicos' : 'Locacao'}_${contratado?.nome_fantasia || 'Gerado'}_${dateStr}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
      setPendingAction(null);
    }
  };

  // --- DOWNLOAD .DOC ---
  const handleDownloadDoc = () => {
    if (!contratanteId || !contratadoId) { alert('Selecione o Contratante e o Contratado antes de baixar.'); return; }
    const contratado = empresas.find(e => e.id === contratadoId);
    const rawHtml = isDirectEditing ? editedHtml : (savedContractHtml || generateSubstitutedHtml());
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>Contrato</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page{size:21cm 29.7cm;margin:2.5cm}body{font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5}</style></head><body>`;
    const sourceHTML = header + rawHtml + '</body></html>';
    const blob = new Blob(['\ufeff' + sourceHTML], { type: 'application/msword;charset=utf-8' });
    const fileName = `Contrato_${tipoContrato === 'terceirizacao' ? 'PrestacaoServicos' : 'Locacao'}_${contratado?.nome_fantasia || 'Gerado'}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // --- ESTILIZAÇÃO DO MODO WORD ---
  const applyBlockStyle = (property: string, value: string) => {
    const selection = window.getSelection();
    if (!selection) return;
    try {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const getParagraphs = (node: Node): HTMLElement[] => {
        const paragraphs: HTMLElement[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
          const p = node.parentElement?.closest('p');
          if (p) paragraphs.push(p);
        } else if (node instanceof HTMLElement) {
          const p = node.closest('p');
          if (p) paragraphs.push(p);
          else node.querySelectorAll('p').forEach(child => paragraphs.push(child as HTMLElement));
        }
        return Array.from(new Set(paragraphs));
      };
      const paras = getParagraphs(container);
      if (paras.length > 0) {
        paras.forEach(p => p.style.setProperty(property, value));
        const editor = document.querySelector('.print-preview-text');
        if (editor) setEditedHtml(editor.innerHTML);
      }
    } catch (error) { console.error('Error applying block style:', error); }
  };

  const applyInlineStyle = (property: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    if (selection.isCollapsed) { applyBlockStyle(property, value); return; }
    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.setProperty(property, value);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
      const editor = document.querySelector('.print-preview-text');
      if (editor) setEditedHtml(editor.innerHTML);
    } catch {
      applyBlockStyle(property, value);
    }
  };

  const insertHR = () => {
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #333;margin:12pt 0;" /><p><br></p>');
    const editor = document.querySelector('.print-preview-text');
    if (editor) setEditedHtml(editor.innerHTML);
  };

  const insertSignatureBlock = () => {
    const sigHtml = `
<p style="margin-top:40pt;margin-bottom:3pt;font-family:'Arial';font-size:11pt;">________________________________________________________________</p>
<p style="margin-top:0;margin-bottom:2pt;font-family:'Arial';font-size:11pt;">Nome:</p>
<p style="margin-top:0;margin-bottom:2pt;font-family:'Arial';font-size:11pt;">CPF:</p>
<p style="margin-top:0;margin-bottom:2pt;font-family:'Arial';font-size:11pt;">Cargo:</p>
<p><br></p>`;
    document.execCommand('insertHTML', false, sigHtml);
    const editor = document.querySelector('.print-preview-text');
    if (editor) setEditedHtml(editor.innerHTML);
  };

  // Verificar validação no início ao mudar dados
  const validationChecks = getValidationStatus();
  const totalOk = validationChecks.filter(v => v.ok).length;
  const totalChecks = validationChecks.length;
  const progressPct = Math.round((totalOk / totalChecks) * 100);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto printable-container">
      {/* ESTILOS DE IMPRESSÃO */}
      <style>{`
        @media print {
          @page { size: A4; margin: 2.5cm; }
          body, html, #root { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
          aside, nav, header, button, select, input, label, textarea, .no-print { display: none !important; }
          .printable-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .a4-container { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; display: block !important; overflow: visible !important; }
          .print-no-grid { display: block !important; width: 100% !important; }
          .print-full-width { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-preview-a4 { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; background: white !important; color: black !important; width: 100% !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
          p, h1, h2, h3, h4, h5, h6 { page-break-inside: avoid; }
          .print-preview-text { font-family: 'Arial', sans-serif !important; color: black !important; }
          .print-preview-text p { font-family: 'Arial', sans-serif !important; font-size: 11pt !important; line-height: 1.5 !important; text-align: justify !important; text-justify: inter-word !important; text-align-last: left !important; margin-bottom: 6pt !important; overflow-wrap: break-word !important; }
        }
      `}</style>

      {/* TÍTULO E TOPBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#F4C400]/20 rounded-lg">
            <FileText className="text-[#F4C400]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gerador de Contratos</h1>
            <p className="text-[#BDBDBD] text-sm">Geração profissional de contratos — totalmente autônoma, sem Word ou Adobe</p>
          </div>
        </div>

        {/* TIPOS DE CONTRATO */}
        <div className="flex bg-[#111111] p-1 border border-[#1E1E1E] rounded-lg">
          <button
            onClick={() => setTipoContrato('terceirizacao')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${tipoContrato === 'terceirizacao' ? 'bg-[#F4C400] text-[#0B0B0B] font-bold' : 'text-[#BDBDBD] hover:text-white'}`}
          >
            Prestação de Serviços
          </button>
          <button
            onClick={() => setTipoContrato('aluguel')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${tipoContrato === 'aluguel' ? 'bg-[#F4C400] text-[#0B0B0B] font-bold' : 'text-[#BDBDBD] hover:text-white'}`}
          >
            Locação Comercial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print-no-grid">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-5 space-y-6 no-print">

          {/* CHECKLIST DE PREENCHIMENTO */}
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-[#F4C400] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={14} />
                Completude do Contrato
              </h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${progressPct === 100 ? 'bg-green-500/20 text-green-400' : progressPct >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {totalOk}/{totalChecks}
              </span>
            </div>
            <div className="w-full bg-[#1E1E1E] rounded-full h-1.5 mb-3">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-green-500' : progressPct >= 70 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="space-y-1.5">
              {validationChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2">
                  {check.ok
                    ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                    : <XCircle size={12} className={`flex-shrink-0 ${check.critical ? 'text-red-400' : 'text-yellow-400'}`} />
                  }
                  <span className={`text-[11px] ${check.ok ? 'text-[#888]' : check.critical ? 'text-red-300' : 'text-yellow-300'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PARTES CONTRATANTES */}
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-6 shadow-lg">
            <h2 className="text-md font-bold text-[#F4C400] mb-5 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} />
              Partes Contratantes
            </h2>

            <div className="space-y-5">
              {/* CONTRATANTE */}
              <div className="space-y-3 pb-5 border-b border-[#1E1E1E]">
                <label className="block text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">1. Empresa Contratante</label>
                <select
                  value={contratanteId}
                  onChange={(e) => setContratanteId(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]"
                >
                  <option value="">Selecione a empresa contratante...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia || emp.razao_social} ({emp.cnpj})</option>
                  ))}
                </select>

                {contratanteId && (
                  <div className="space-y-3 bg-[#111111] p-3 rounded-lg border border-[#1E1E1E]">
                    <p className="text-[10px] text-[#F4C400] font-bold uppercase tracking-widest">Motor de Dados — Memorização Ativa</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Rua *</label>
                        <input type="text" value={contratanteExtra.rua} onChange={(e) => handleContratanteExtraChange('rua', e.target.value)} placeholder="Ex: Av. Afonso Pena" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Número *</label>
                        <input type="text" value={contratanteExtra.numero} onChange={(e) => handleContratanteExtraChange('numero', e.target.value)} placeholder="Ex: 1500" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Bairro *</label>
                        <input type="text" value={contratanteExtra.bairro} onChange={(e) => handleContratanteExtraChange('bairro', e.target.value)} placeholder="Ex: Centro" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">CEP</label>
                        <input type="text" value={contratanteExtra.cep} onChange={(e) => handleContratanteExtraChange('cep', e.target.value)} placeholder="Ex: 30130-003" maxLength={9} className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Cidade *</label>
                        <input type="text" value={contratanteExtra.cidade} onChange={(e) => handleContratanteExtraChange('cidade', e.target.value)} placeholder="Ex: Belo Horizonte" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Estado (UF) *</label>
                        <input type="text" value={contratanteExtra.uf} onChange={(e) => handleContratanteExtraChange('uf', e.target.value)} placeholder="Ex: MG" maxLength={2} className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A2A2A]">
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Nome do Rep. *</label>
                        <input type="text" value={contratanteExtra.representante_nome} onChange={(e) => handleContratanteExtraChange('representante_nome', e.target.value)} placeholder="Ex: Carlos Silva" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">CPF do Rep. *</label>
                        <input type="text" value={contratanteExtra.representante_cpf} onChange={(e) => handleContratanteExtraChange('representante_cpf', e.target.value)} placeholder="000.000.000-00" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONTRATADA */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">2. Empresa Contratada</label>
                <select
                  value={contratadoId}
                  onChange={(e) => setContratadoId(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]"
                >
                  <option value="">Selecione a empresa contratada...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia || emp.razao_social} ({emp.cnpj})</option>
                  ))}
                </select>

                {contratadoId && (
                  <div className="space-y-3 bg-[#111111] p-3 rounded-lg border border-[#1E1E1E]">
                    <p className="text-[10px] text-[#F4C400] font-bold uppercase tracking-widest">Motor de Dados — Memorização Ativa</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Rua *</label>
                        <input type="text" value={contratadoExtra.rua} onChange={(e) => handleContratadoExtraChange('rua', e.target.value)} placeholder="Ex: Rua da Bahia" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Número *</label>
                        <input type="text" value={contratadoExtra.numero} onChange={(e) => handleContratadoExtraChange('numero', e.target.value)} placeholder="Ex: 200" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Bairro *</label>
                        <input type="text" value={contratadoExtra.bairro} onChange={(e) => handleContratadoExtraChange('bairro', e.target.value)} placeholder="Ex: Lourdes" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">CEP</label>
                        <input type="text" value={contratadoExtra.cep} onChange={(e) => handleContratadoExtraChange('cep', e.target.value)} placeholder="Ex: 30160-011" maxLength={9} className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Cidade *</label>
                        <input type="text" value={contratadoExtra.cidade} onChange={(e) => handleContratadoExtraChange('cidade', e.target.value)} placeholder="Ex: Belo Horizonte" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Estado (UF) *</label>
                        <input type="text" value={contratadoExtra.uf} onChange={(e) => handleContratadoExtraChange('uf', e.target.value)} placeholder="Ex: MG" maxLength={2} className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A2A2A]">
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">Nome do Rep. *</label>
                        <input type="text" value={contratadoExtra.representante_nome} onChange={(e) => handleContratadoExtraChange('representante_nome', e.target.value)} placeholder="Ex: Roberto Gomes" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#888888] mb-0.5">CPF do Rep. *</label>
                        <input type="text" value={contratadoExtra.representante_cpf} onChange={(e) => handleContratadoExtraChange('representante_cpf', e.target.value)} placeholder="111.111.111-11" className="w-full bg-[#161616] border border-[#1E1E1E] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F4C400]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONDIÇÕES DO CONTRATO */}
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-6 shadow-lg">
            <h2 className="text-md font-bold text-[#F4C400] mb-5 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={18} />
              Condições do Contrato
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Valor Mensal (R$)</label>
                <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex: 5.000,00" className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]" />
                <span className="text-[10px] text-green-400 mt-1 block italic">Extenso: {numeroParaExtenso(parseMoney(valor))}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Dia útil de vencimento</label>
                  <input type="text" value={diaUtil} onChange={(e) => setDiaUtil(e.target.value)} placeholder="Ex: 1º ou 5º" className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Comarca do Foro</label>
                  <input type="text" value={foro} onChange={(e) => setForo(e.target.value)} placeholder="Ex: Belo Horizonte" className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Dados Bancários para Depósito</label>
                <input type="text" value={dadosBancarios} onChange={(e) => setDadosBancarios(e.target.value)} placeholder="Ex: Banco Itaú, Ag. 1234, CC 56789-0, PIX CNPJ..." className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1E1E1E]">
                <div>
                  <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Cidade de Assinatura</label>
                  <input type="text" value={cidadeAssinatura} onChange={(e) => setCidadeAssinatura(e.target.value)} placeholder="Ex: Belo Horizonte" className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#BDBDBD] uppercase mb-1">Data do Contrato</label>
                  <input type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400] [color-scheme:dark]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-7 space-y-6 print-full-width">

          {/* BARRA DE MODELOS */}
          <div className="flex flex-wrap items-center gap-3 bg-[#161616] border border-[#1E1E1E] rounded-xl p-4 shadow-lg no-print">
            <span className="text-xs font-bold text-[#F4C400] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} />Modelos Salvos:
            </span>
            <select
              value={activeDocumentId || ''}
              onChange={(e) => handleLoadDocument(e.target.value)}
              className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#F4C400] min-w-[200px]"
            >
              <option value="">-- Modelo Dinâmico Padrão --</option>
              {savedDocuments.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name} ({doc.tipo === 'terceirizacao' ? 'Prestação' : 'Locação'})</option>
              ))}
            </select>
            {activeDocumentId && (
              <button onClick={handleDeleteDocument} className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/30 border border-red-900/50 text-red-400 text-xs font-bold rounded-lg transition-all">Excluir</button>
            )}
            {contratanteId && contratadoId && versionHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/30 border border-purple-700/50 text-purple-300 hover:bg-purple-900/50 text-xs font-bold rounded-lg transition-all"
                title="Ver histórico de versões"
              >
                <History size={12} />
                Versões ({versionHistory.length})
              </button>
            )}
            <button
              onClick={() => { setNewDocName(`Modelo ${tipoContrato === 'terceirizacao' ? 'Prestação' : 'Locação'} — ${new Date().toLocaleDateString()}`); setShowSaveModal(true); }}
              className="ml-auto flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md shadow-green-700/20"
            >
              <Save size={12} />Salvar como Novo Modelo
            </button>
          </div>

          {/* BARRA DE AÇÕES */}
          <div className="flex flex-wrap gap-3 justify-end items-center bg-[#161616] border border-[#1E1E1E] rounded-xl p-4 shadow-lg no-print">
            <button
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              className="flex items-center gap-2 px-4 py-2 border border-[#1E1E1E] rounded-lg text-sm text-[#BDBDBD] hover:text-white hover:bg-[#1E1E1E] transition-all"
            >
              <Settings size={16} />
              {showTemplateEditor ? 'Ocultar Estrutura' : 'Ver Estrutura'}
            </button>

            <button
              onClick={() => {
                if (!contratanteId || !contratadoId) { alert('Selecione o Contratante e o Contratado antes de editar.'); return; }
                if (!isDirectEditing) setEditedHtml(generateSubstitutedHtml());
                setIsDirectEditing(!isDirectEditing);
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-all ${isDirectEditing ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20' : 'border-[#1E1E1E] text-[#BDBDBD] hover:text-white hover:bg-[#1E1E1E]'}`}
            >
              <Edit3 size={16} />
              {isDirectEditing ? 'Visualizar Contrato' : 'Editar no Modo Word'}
            </button>

            {isDirectEditing && (
              <button onClick={handleSaveEditedContract} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-md shadow-green-600/20">
                <Save size={16} />Salvar Alterações
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#F4C400]/10 hover:bg-[#F4C400]/20 border border-[#F4C400]/30 text-[#F4C400] px-5 py-2 rounded-lg font-bold text-sm transition-all"
            >
              <Printer size={16} />Imprimir
            </button>

            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 bg-[#F4C400] hover:bg-[#FFD84D] disabled:opacity-60 disabled:cursor-wait text-[#0B0B0B] px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-md shadow-[#F4C400]/20"
            >
              {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>

            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all"
            >
              <Download size={16} />Baixar Word (.doc)
            </button>
          </div>

          {/* EDITOR DE TEMPLATE */}
          {showTemplateEditor && (
            <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-6 shadow-lg space-y-4 animate-in slide-in-from-top duration-200 no-print">
              <div className="flex justify-between items-center pb-3 border-b border-[#1E1E1E]">
                <h3 className="text-sm font-bold text-[#F4C400] uppercase tracking-wider flex items-center gap-2">
                  <Edit3 size={16} />Editor de Estrutura do Contrato
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleResetTemplate} className="flex items-center gap-1.5 px-3 py-1 bg-red-950/40 text-red-400 hover:bg-red-900/30 border border-red-900/50 text-xs font-bold rounded">
                    <RotateCcw size={12} />Restaurar Padrão
                  </button>
                  {isEditing
                    ? <button onClick={handleSaveTemplate} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded">Salvar Modelo</button>
                    : <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">Editar Modelo</button>
                  }
                </div>
              </div>
              <p className="text-xs text-[#BDBDBD]">Edite o texto padrão do contrato. As variáveis <code className="text-[#F4C400] font-mono">{"{{tags}}"}</code> serão substituídas pelos dados das empresas.</p>
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                disabled={!isEditing}
                rows={15}
                className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg p-4 font-mono text-xs text-[#BDBDBD] focus:outline-none focus:border-[#F4C400] disabled:opacity-70 leading-relaxed"
              />
            </div>
          )}

          {/* FOLHA A4 */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-2 md:p-8 flex flex-col items-center shadow-inner overflow-x-auto a4-container">

            {/* TOOLBAR RICA */}
            {isDirectEditing && (
              <div className="flex flex-wrap items-center gap-1 bg-[#161616] border border-[#1E1E1E] rounded-lg p-2 mb-4 no-print w-full max-w-[794px]">
                {/* Formatação Básica */}
                <button type="button" onClick={() => document.execCommand('bold', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-white font-bold text-sm transition-all" title="Negrito (Ctrl+B)">B</button>
                <button type="button" onClick={() => document.execCommand('italic', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-white italic text-sm transition-all" title="Itálico (Ctrl+I)">I</button>
                <button type="button" onClick={() => document.execCommand('underline', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-white underline text-sm transition-all" title="Sublinhado (Ctrl+U)">U</button>
                <button type="button" onClick={() => document.execCommand('strikeThrough', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Tachado">
                  <Strikethrough size={14} />
                </button>
                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />

                {/* Alinhamento */}
                <button type="button" onClick={() => document.execCommand('justifyLeft', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Alinhar à Esquerda"><AlignLeft size={14} /></button>
                <button type="button" onClick={() => document.execCommand('justifyCenter', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Centralizar"><AlignCenter size={14} /></button>
                <button type="button" onClick={() => document.execCommand('justifyRight', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Alinhar à Direita"><AlignRight size={14} /></button>
                <button type="button" onClick={() => document.execCommand('justifyFull', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Justificar"><AlignJustify size={14} /></button>
                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />

                {/* Listas e Recuo */}
                <button type="button" onClick={() => document.execCommand('insertUnorderedList', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Lista com Marcadores"><List size={14} /></button>
                <button type="button" onClick={() => document.execCommand('insertOrderedList', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Lista Numerada">
                  <span className="text-[10px] font-bold">1.</span>
                </button>
                <button type="button" onClick={() => document.execCommand('indent', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Aumentar Recuo"><Indent size={14} /></button>
                <button type="button" onClick={() => document.execCommand('outdent', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Diminuir Recuo"><Outdent size={14} /></button>
                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />

                {/* Inserções */}
                <button type="button" onClick={insertHR} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Inserir Linha Divisória"><Minus size={14} /></button>
                <button type="button" onClick={insertSignatureBlock} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Inserir Bloco de Assinatura"><PenSquare size={14} /></button>
                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />

                {/* Desfazer / Refazer */}
                <button type="button" onClick={() => document.execCommand('undo', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Desfazer (Ctrl+Z)"><Undo size={14} /></button>
                <button type="button" onClick={() => document.execCommand('redo', false)} className="w-8 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white transition-all" title="Refazer"><Redo size={14} /></button>
                <button type="button" onClick={() => document.execCommand('removeFormat', false)} className="px-2 h-8 flex items-center justify-center hover:bg-[#2A2A2A] rounded text-[#BDBDBD] hover:text-white text-xs font-mono transition-all" title="Limpar Formatação">Tx</button>
                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />

                {/* Cor de Texto */}
                <div className="flex items-center gap-1" title="Cor do Texto">
                  <Palette size={12} className="text-[#BDBDBD]" />
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      applyInlineStyle('color', e.target.value);
                    }}
                    className="w-6 h-6 cursor-pointer rounded border-0 bg-transparent"
                    title="Cor do Texto"
                  />
                </div>

                {/* Família de Fonte */}
                <select
                  onChange={(e) => applyInlineStyle('font-family', e.target.value)}
                  defaultValue=""
                  className="bg-[#111111] border border-[#1E1E1E] rounded px-2 h-8 text-white text-xs focus:outline-none focus:border-[#F4C400] transition-all cursor-pointer"
                  title="Família de Fonte"
                >
                  <option value="" disabled><Type size={12} /> Fonte</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Calibri', sans-serif">Calibri</option>
                  <option value="'Garamond', serif">Garamond</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>

                {/* Tamanho da Fonte */}
                <select
                  onChange={(e) => applyInlineStyle('font-size', e.target.value)}
                  defaultValue=""
                  className="bg-[#111111] border border-[#1E1E1E] rounded px-2 h-8 text-white text-xs focus:outline-none focus:border-[#F4C400] transition-all cursor-pointer"
                  title="Tamanho da Fonte"
                >
                  <option value="" disabled>Tam.</option>
                  <option value="9pt">9pt</option>
                  <option value="10pt">10pt</option>
                  <option value="11pt">11pt ✓</option>
                  <option value="12pt">12pt</option>
                  <option value="14pt">14pt</option>
                  <option value="16pt">16pt</option>
                  <option value="18pt">18pt</option>
                  <option value="20pt">20pt</option>
                  <option value="24pt">24pt</option>
                </select>

                {/* Espaçamento */}
                <select
                  onChange={(e) => applyBlockStyle('line-height', e.target.value)}
                  defaultValue=""
                  className="bg-[#111111] border border-[#1E1E1E] rounded px-2 h-8 text-white text-xs focus:outline-none focus:border-[#F4C400] transition-all cursor-pointer"
                  title="Espaçamento entre Linhas"
                >
                  <option value="" disabled>Espaç.</option>
                  <option value="1.0">1.0</option>
                  <option value="1.15">1.15</option>
                  <option value="1.2">1.2</option>
                  <option value="1.5">1.5 ✓</option>
                  <option value="2.0">2.0</option>
                </select>

                <div className="h-6 w-px bg-[#2A2A2A] mx-1" />
                <button type="button" onClick={handleSaveEditedContract} className="flex items-center gap-1.5 px-3 h-8 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-bold transition-all ml-auto" title="Salvar Alterações">
                  <Save size={12} />Salvar
                </button>
              </div>
            )}

            {/* ALERTA: usuário está vendo modelo personalizado salvo */}
            {!isDirectEditing && savedContractHtml && (
              <div className="flex items-center justify-between gap-4 bg-amber-950/40 border border-amber-900/50 rounded-xl p-4 mb-4 no-print w-full max-w-[794px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-full text-amber-500"><FileText size={18} /></div>
                  <div>
                    <p className="font-bold text-white text-xs">Exibindo Modelo Personalizado: {savedDocuments.find(d => d.id === activeDocumentId)?.name || 'Salvo'}</p>
                    <p className="text-[#BDBDBD] text-[11px]">Este é um modelo fixo salvo. Para retornar ao preview dinâmico com os dados atuais, clique em "Voltar ao Dinâmico".</p>
                  </div>
                </div>
                <button onClick={handleDiscardEditedContract} className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 text-xs font-bold rounded-lg transition-all whitespace-nowrap">Voltar ao Dinâmico</button>
              </div>
            )}

            {/* FOLHA A4 */}
            <div
              ref={previewRef}
              className="print-preview-a4 bg-white text-black shadow-2xl rounded border border-gray-300 flex flex-col justify-between"
              style={{ width: '794px', minHeight: '1123px', padding: '2.5cm', boxSizing: 'border-box' }}
            >
              {isDirectEditing ? (
                /* MODO WORD: contenteditable com o HTML editado */
                <div
                  className="print-preview-text text-gray-900 outline-none w-full min-h-[900px]"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEditedHtml(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: editedHtml }}
                  style={{ fontFamily: 'Arial, sans-serif', outline: 'none', border: 'none' }}
                />
              ) : savedContractHtml && activeDocumentId ? (
                /* MODELO PERSONALIZADO SALVO: mostra o HTML fixo do modelo */
                <div
                  className="print-preview-text text-gray-900"
                  dangerouslySetInnerHTML={{ __html: savedContractHtml }}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
              ) : (
                /* MODO DINÂMICO: SEMPRE renderiza com os valores atuais dos campos */
                <div
                  className="print-preview-text text-gray-900"
                  dangerouslySetInnerHTML={{ __html: generateSubstitutedHtml() }}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
              )}

              <div className="mt-8 pt-2 border-t border-gray-200 text-center text-[10px] text-gray-400 no-print">
                Visualização de alta fidelidade A4 — Gerador de Contratos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 bg-[#161616] border border-[#1E1E1E] rounded-xl p-5 shadow-lg no-print flex items-center gap-4 text-xs text-[#BDBDBD]">
        <div className="p-2 bg-[#F4C400]/20 rounded-full text-[#F4C400]"><FileText size={18} /></div>
        <div>
          <p className="font-bold text-white mb-1">Como funciona a memorização?</p>
          <p>Ao preencher os dados de endereço e representante de uma empresa, o sistema salva automaticamente essas informações no navegador. Na próxima vez que a empresa for selecionada, todos os dados são restaurados automaticamente — sem precisar redigitar nada.</p>
        </div>
      </div>

      {/* MODAL SALVAR MODELO */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1E1E1E]">
              <div className="p-2.5 bg-[#F4C400]/10 border border-[#F4C400]/25 rounded-lg text-[#F4C400]"><Save size={20} /></div>
              <div>
                <h3 className="text-md font-bold text-white">Salvar como Reutilizável</h3>
                <p className="text-xs text-[#BDBDBD] mt-0.5">O modelo ficará disponível para uso global no sistema.</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">Nome do Modelo</label>
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Ex: Contrato de TI Padrão — BH"
                className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C400] transition-colors"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#1E1E1E]">
              <button type="button" onClick={() => setShowSaveModal(false)} className="px-4 py-2 border border-[#1E1E1E] rounded-lg text-sm text-[#BDBDBD] hover:text-white hover:bg-[#1E1E1E] transition-all">Cancelar</button>
              <button type="button" onClick={() => handleCreateNewDocument(newDocName)} className="px-5 py-2 bg-[#F4C400] hover:bg-[#FFD84D] text-[#0B0B0B] rounded-lg font-bold text-sm transition-all">Salvar Modelo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VALIDAÇÃO */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1E1E1E]">
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="text-md font-bold text-white">Campos Obrigatórios Incompletos</h3>
                <p className="text-xs text-[#BDBDBD] mt-0.5">Preencha todos os campos obrigatórios antes de gerar o PDF.</p>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {check.ok
                    ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    : <XCircle size={14} className={`flex-shrink-0 ${check.critical ? 'text-red-400' : 'text-yellow-400'}`} />
                  }
                  <span className={`text-xs ${check.ok ? 'text-[#666]' : check.critical ? 'text-red-300 font-medium' : 'text-yellow-300'}`}>
                    {check.label}
                    {!check.ok && check.critical && <span className="ml-1 text-[10px] bg-red-500/20 text-red-400 px-1 rounded">obrigatório</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3 pt-3 border-t border-[#1E1E1E]">
              <button type="button" onClick={() => setShowValidationModal(false)} className="px-4 py-2 border border-[#1E1E1E] rounded-lg text-sm text-[#BDBDBD] hover:text-white hover:bg-[#1E1E1E] transition-all">Voltar e Corrigir</button>
              {!hasCriticalErrors() && (
                <button
                  type="button"
                  onClick={async () => { setShowValidationModal(false); await executePdfGeneration(); }}
                  className="px-5 py-2 bg-[#F4C400] hover:bg-[#FFD84D] text-[#0B0B0B] rounded-lg font-bold text-sm transition-all"
                >
                  Gerar assim mesmo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE VERSÕES */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/25 rounded-lg text-purple-400"><History size={20} /></div>
                <div>
                  <h3 className="text-md font-bold text-white">Histórico de Versões</h3>
                  <p className="text-xs text-[#BDBDBD] mt-0.5">Últimas {versionHistory.length} versão(ões) salvas</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-[#888] hover:text-white text-xl font-bold">×</button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {versionHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 bg-[#111111] border border-[#1E1E1E] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">{entry.label}</p>
                      <p className="text-[10px] text-[#666]">{new Date(entry.date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreVersion(entry)}
                    className="px-3 py-1 bg-purple-700/40 hover:bg-purple-700/70 border border-purple-600/40 text-purple-300 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3 border-t border-[#1E1E1E]">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 border border-[#1E1E1E] rounded-lg text-sm text-[#BDBDBD] hover:text-white hover:bg-[#1E1E1E] transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
