import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { createCompany, getCompanyDetails, updateCompany } from '../services/api';
import { Empresa, Socio } from '../types';

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatMesAno(value: string) {
  if (!value) return '';
  // Se for YYYY-MM-DD, converte para MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `${month}/${year}`;
  }

  let v = value.replace(/\D/g, '');
  if (v.length > 6) v = v.slice(0, 6);
  
  if (v.length >= 2) {
    let month = parseInt(v.substring(0, 2), 10);
    if (month > 12) {
      v = '12' + v.substring(2);
    } else if (month === 0 && v.length >= 2) {
      v = '01' + v.substring(2);
    }
  }
  
  if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d)/, '$1/$2');
  }
  
  return v;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (empresaId: string) => void;
  companyId?: string | null;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose, onSuccess, companyId }) => {
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFoundFields, setNotFoundFields] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    codigo_interno: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ie: '',
    im: '',
    ponto_focal_nome: '',
    ponto_focal_whatsapp: '',
    ponto_focal_email: '',
    regime_atual: '',
    regime_novo: '',
    comp_inicial: '',
    aprovado_reuniao: '',
    objetivo_empresa: '',
    data_inicio_prevista: '',
    data_fim_prevista: '',
    socios: [
      { nome: '', whatsapp: '', email: '' },
      { nome: '', whatsapp: '', email: '' },
      { nome: '', whatsapp: '', email: '' }
    ]
  });

  useEffect(() => {
    if (isOpen) {
      if (companyId) {
        loadCompanyData(companyId);
      } else {
        // Reset form for new company
        setNotFoundFields([]);
        setFormData({
          codigo_interno: '',
          razao_social: '',
          nome_fantasia: '',
          cnpj: '',
          ie: '',
          im: '',
          ponto_focal_nome: '',
          ponto_focal_whatsapp: '',
          ponto_focal_email: '',
          regime_atual: '',
          regime_novo: '',
          comp_inicial: '',
          aprovado_reuniao: '',
          objetivo_empresa: '',
          data_inicio_prevista: '',
          data_fim_prevista: '',
          socios: [
            { nome: '', whatsapp: '', email: '' },
            { nome: '', whatsapp: '', email: '' },
            { nome: '', whatsapp: '', email: '' }
          ]
        });
      }
    }
  }, [isOpen, companyId]);

  const loadCompanyData = async (id: string) => {
    setLoading(true);
    try {
      const data = await getCompanyDetails(id);
      if (data) {
        const { empresa, socios, projeto } = data;
        
        // Prepare socios array (ensure always 3 items)
        const loadedSocios = [
          { nome: '', whatsapp: '', email: '' },
          { nome: '', whatsapp: '', email: '' },
          { nome: '', whatsapp: '', email: '' }
        ];

        if (socios && socios.length > 0) {
          socios.forEach((s, index) => {
            if (index < 3) {
              loadedSocios[index] = {
                nome: s.nome,
                whatsapp: s.whatsapp || '',
                email: s.email || ''
              };
            }
          });
        }

        setFormData({
          codigo_interno: empresa.codigo_interno || '',
          razao_social: empresa.razao_social || '',
          nome_fantasia: empresa.nome_fantasia || '',
          cnpj: formatCNPJ(empresa.cnpj || ''),
          ie: empresa.ie || '',
          im: empresa.im || '',
          ponto_focal_nome: empresa.ponto_focal_nome || '',
          ponto_focal_whatsapp: empresa.ponto_focal_whatsapp || '',
          ponto_focal_email: empresa.ponto_focal_email || '',
          regime_atual: empresa.regime_atual || '',
          regime_novo: empresa.regime_novo || '',
          comp_inicial: formatMesAno(empresa.comp_inicial || ''),
          aprovado_reuniao: empresa.aprovado_reuniao || '',
          objetivo_empresa: empresa.objetivo_empresa || '',
          data_inicio_prevista: projeto?.data_inicio_prevista || '',
          data_fim_prevista: projeto?.data_fim_prevista || '',
          socios: loadedSocios
        });
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados da empresa.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      const formatted = formatCNPJ(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      
      const cleanCnpj = formatted.replace(/\D/g, '');
      if (cleanCnpj.length === 14) {
        fetchCnpjData(cleanCnpj);
      }
    } else if (name === 'comp_inicial') {
      const formatted = formatMesAno(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSocioChange = (index: number, field: string, value: string) => {
    const newSocios = [...formData.socios];
    newSocios[index] = { ...newSocios[index], [field]: value };
    setFormData(prev => ({ ...prev, socios: newSocios }));
  };

  const fetchCnpjData = async (cnpj: string) => {
    if (cnpj.length !== 14) return;

    setLoadingCnpj(true);
    setError(null);
    setNotFoundFields([]);
    try {
      // Tenta primeiro a API publica.cnpj.ws que costuma retornar Inscrição Estadual
      try {
        const responseWs = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
        if (responseWs.ok) {
          const dataWs = await responseWs.json();
          const ie = dataWs.estabelecimento?.inscricoes_estaduais?.[0]?.inscricao_estadual || '';
          const im = dataWs.estabelecimento?.inscricao_municipal || '';
          
          const missing: string[] = [];
          if (!dataWs.razao_social) missing.push('razao_social');
          if (!dataWs.estabelecimento?.nome_fantasia && !dataWs.razao_social) missing.push('nome_fantasia');
          if (!ie) missing.push('ie');
          if (!im) missing.push('im');

          setFormData(prev => {
            let regime = prev.regime_atual;
            let foundRegime = false;
            if (dataWs.simples) {
              if (dataWs.simples.optante_mei === true || dataWs.simples.optante_mei === 'S' || dataWs.simples.optante_mei === 'Sim') {
                regime = 'MEI';
                foundRegime = true;
              } else if (dataWs.simples.optante_simples === true || dataWs.simples.optante_simples === 'S' || dataWs.simples.optante_simples === 'Sim') {
                regime = 'Simples Nacional';
                foundRegime = true;
              }
            }
            if (!foundRegime) missing.push('regime_atual');

            const sociosWs = dataWs.socios || [];
            const newSocios = [...prev.socios];
            for (let i = 0; i < 3; i++) {
              const socioName = sociosWs[i]?.nome || sociosWs[i]?.nome_socio || sociosWs[i]?.razao_social || '';
              if (socioName) {
                newSocios[i] = { ...newSocios[i], nome: socioName };
              } else if (i === 0) {
                missing.push(`socio_${i}`);
              }
            }

            return {
              ...prev,
              razao_social: dataWs.razao_social || prev.razao_social,
              nome_fantasia: dataWs.estabelecimento?.nome_fantasia || dataWs.razao_social || prev.nome_fantasia,
              ie: ie || prev.ie,
              im: im || prev.im,
              regime_atual: regime,
              socios: newSocios,
            };
          });
          setNotFoundFields(missing);
          setLoadingCnpj(false);
          return; // Sucesso, não precisa chamar a API de fallback
        }
      } catch (e) {
        console.warn("Falha na API publica.cnpj.ws, tentando fallback...", e);
      }

      // Fallback para BrasilAPI caso a primeira falhe (ex: limite de requisições)
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) {
        throw new Error('CNPJ não encontrado na base de dados.');
      }
      const data = await response.json();
      
      const missing: string[] = ['ie', 'im'];
      if (!data.razao_social) missing.push('razao_social');
      if (!data.nome_fantasia && !data.razao_social) missing.push('nome_fantasia');

      setFormData(prev => {
        let regime = prev.regime_atual;
        let foundRegime = false;
        if (data.opcao_pelo_mei === true || data.opcao_pelo_mei === 'S' || data.opcao_pelo_mei === 'Sim') {
          regime = 'MEI';
          foundRegime = true;
        } else if (data.opcao_pelo_simples === true || data.opcao_pelo_simples === 'S' || data.opcao_pelo_simples === 'Sim') {
          regime = 'Simples Nacional';
          foundRegime = true;
        }
        if (!foundRegime) missing.push('regime_atual');

        const sociosApi = data.qsa || [];
        const newSocios = [...prev.socios];
        for (let i = 0; i < 3; i++) {
          const socioName = sociosApi[i]?.nome_socio || sociosApi[i]?.nome || '';
          if (socioName) {
            newSocios[i] = { ...newSocios[i], nome: socioName };
          } else if (i === 0) {
            missing.push(`socio_${i}`);
          }
        }

        return {
          ...prev,
          razao_social: data.razao_social || prev.razao_social,
          nome_fantasia: data.nome_fantasia || data.razao_social || prev.nome_fantasia,
          regime_atual: regime,
          socios: newSocios,
        };
      });
      setNotFoundFields(missing);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar CNPJ.');
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleCnpjBlur = () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length === 14) {
      fetchCnpjData(cleanCnpj);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const requiredFields = [
      'codigo_interno', 'razao_social', 'nome_fantasia', 'cnpj', 'ie', 'im',
      'ponto_focal_nome', 'ponto_focal_whatsapp', 'ponto_focal_email',
      'regime_atual', 'regime_novo', 'comp_inicial', 'aprovado_reuniao', 'objetivo_empresa'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      setError('Todos os campos da empresa e ponto focal são obrigatórios.');
      return;
    }

    if (!formData.socios[0].nome) {
      setError('Nome do Sócio 1 é obrigatório.');
      return;
    }

    setLoading(true);

    try {
      // Normalize CNPJ
      const cleanCnpj = formData.cnpj.replace(/\D/g, '');

      // Convert MM/YYYY to YYYY-MM-01
      let compInicialFormatada = formData.comp_inicial;
      if (/^\d{2}\/\d{4}$/.test(formData.comp_inicial)) {
        const [month, year] = formData.comp_inicial.split('/');
        compInicialFormatada = `${year}-${month}-01`;
      }

      const empresaData: Partial<Empresa> = {
        codigo_interno: formData.codigo_interno,
        razao_social: formData.razao_social,
        nome_fantasia: formData.nome_fantasia,
        cnpj: cleanCnpj,
        ie: formData.ie,
        im: formData.im,
        ponto_focal_nome: formData.ponto_focal_nome,
        ponto_focal_whatsapp: formData.ponto_focal_whatsapp,
        ponto_focal_email: formData.ponto_focal_email,
        regime_atual: formData.regime_atual,
        regime_novo: formData.regime_novo,
        comp_inicial: compInicialFormatada,
        aprovado_reuniao: formData.aprovado_reuniao,
        objetivo_empresa: formData.objetivo_empresa
      };

      const sociosData: Omit<Socio, 'id' | 'empresa_id'>[] = formData.socios
        .filter(s => s.nome.trim() !== '')
        .map(s => ({
          nome: s.nome,
          whatsapp: s.whatsapp,
          email: s.email
        }));

      const projetoData = {
        data_inicio_prevista: formData.data_inicio_prevista || undefined,
        data_fim_prevista: formData.data_fim_prevista || undefined
      };

      if (companyId) {
        // Update existing company
        await updateCompany(companyId, empresaData, sociosData, projetoData);
        onSuccess(companyId);
      } else {
        // Create new company
        const { empresaId } = await createCompany(empresaData as Omit<Empresa, 'id'>, sociosData, projetoData);
        onSuccess(empresaId);
      }
      
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-brand-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-brand-gray">
        <div className="flex justify-between items-center p-6 border-b border-brand-gray sticky top-0 bg-brand-dark z-10">
          <h2 className="text-xl font-bold text-white">
            {companyId ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-1 rounded-full hover:bg-brand-gray">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-900/20 border-l-4 border-red-500 p-4 text-red-400 text-sm rounded-r-lg">
              {error}
            </div>
          )}

          {/* Empresa Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-brand-accent border-b border-brand-gray pb-2 uppercase tracking-wider">Dados da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Código Interno *</label>
                <input
                  type="text"
                  name="codigo_interno"
                  value={formData.codigo_interno}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">CNPJ *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    onBlur={handleCnpjBlur}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                    required
                  />
                  {loadingCnpj && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Razão Social *</label>
                <input
                  type="text"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
                {notFoundFields.includes('razao_social') && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Nome Fantasia *</label>
                <input
                  type="text"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
                {notFoundFields.includes('nome_fantasia') && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Inscrição Estadual *</label>
                <input
                  type="text"
                  name="ie"
                  value={formData.ie}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
                {notFoundFields.includes('ie') && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Inscrição Municipal *</label>
                <input
                  type="text"
                  name="im"
                  value={formData.im}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
                {notFoundFields.includes('im') && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Regime Atual *</label>
                <select
                  name="regime_atual"
                  value={formData.regime_atual}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                  <option value="MEI">MEI</option>
                </select>
                {notFoundFields.includes('regime_atual') && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Regime Novo *</label>
                <select
                  name="regime_novo"
                  value={formData.regime_novo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                  <option value="MEI">MEI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Data Início Prevista</label>
                <input
                  type="date"
                  name="data_inicio_prevista"
                  value={formData.data_inicio_prevista}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Data Fim Prevista</label>
                <input
                  type="date"
                  name="data_fim_prevista"
                  value={formData.data_fim_prevista}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Comp. Inicial *</label>
                <input
                  type="text"
                  name="comp_inicial"
                  value={formData.comp_inicial}
                  onChange={handleChange}
                  placeholder="MM/AAAA"
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Aprovado em Reunião *</label>
                <textarea
                  name="aprovado_reuniao"
                  value={formData.aprovado_reuniao}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">OBJETIVO DA EMPRESA *</label>
                <textarea
                  name="objetivo_empresa"
                  value={formData.objetivo_empresa}
                  onChange={handleChange}
                  placeholder="Descreva o objetivo da empresa ou o propósito do projeto"
                  rows={4}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Ponto Focal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">PONTO FOCAL *</label>
                <input
                  type="text"
                  name="ponto_focal_nome"
                  value={formData.ponto_focal_nome}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">CONTATO TELEFÔNICO / WHATSAPP *</label>
                <input
                  type="text"
                  name="ponto_focal_whatsapp"
                  value={formData.ponto_focal_whatsapp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">EMAIL *</label>
                <input
                  type="email"
                  name="ponto_focal_email"
                  value={formData.ponto_focal_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
              </div>
            </div>

          {/* Sócios */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-brand-accent border-b border-brand-gray pb-2 uppercase tracking-wider">Sócios</h3>
            
            {formData.socios.map((socio, index) => (
              <div key={index} className="bg-brand-black p-5 rounded-xl border border-brand-gray shadow-inner">
                <h4 className="text-xs font-black text-brand-accent mb-4 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-accent text-brand-black flex items-center justify-center text-[10px]">
                    {index + 1}
                  </div>
                  Sócio {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Nome {index === 0 && '*'}</label>
                    <input
                      type="text"
                      value={socio.nome}
                      onChange={(e) => handleSocioChange(index, 'nome', e.target.value)}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                      required={index === 0}
                    />
                    {notFoundFields.includes(`socio_${index}`) && <span className="text-[10px] text-brand-accent mt-1 block">Não encontrado automaticamente</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={socio.whatsapp}
                      onChange={(e) => handleSocioChange(index, 'whatsapp', e.target.value)}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={socio.email}
                      onChange={(e) => handleSocioChange(index, 'email', e.target.value)}
                      className="w-full px-4 py-2 bg-brand-dark border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-brand-gray sticky bottom-0 bg-brand-dark pb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-brand-gray rounded-lg shadow-sm text-sm font-bold text-brand-text-muted bg-brand-black hover:bg-brand-gray hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray transition-all"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-8 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-black text-brand-black bg-brand-accent hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 transition-all uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Empresa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
