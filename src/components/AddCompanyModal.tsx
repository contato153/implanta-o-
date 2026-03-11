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

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (empresaId: string) => void;
  companyId?: string | null;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose, onSuccess, companyId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          comp_inicial: empresa.comp_inicial || '',
          aprovado_reuniao: empresa.aprovado_reuniao || '',
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
      setFormData(prev => ({ ...prev, [name]: formatCNPJ(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSocioChange = (index: number, field: string, value: string) => {
    const newSocios = [...formData.socios];
    newSocios[index] = { ...newSocios[index], [field]: value };
    setFormData(prev => ({ ...prev, socios: newSocios }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const requiredFields = [
      'codigo_interno', 'razao_social', 'nome_fantasia', 'cnpj', 'ie', 'im',
      'ponto_focal_nome', 'ponto_focal_whatsapp', 'ponto_focal_email',
      'regime_atual', 'regime_novo', 'comp_inicial', 'aprovado_reuniao'
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
        comp_inicial: formData.comp_inicial,
        aprovado_reuniao: formData.aprovado_reuniao
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
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">CNPJ *</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600"
                  required
                />
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
                  type="date"
                  name="comp_inicial"
                  value={formData.comp_inicial}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-brand-black border border-brand-gray text-white rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all [color-scheme:dark]"
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
            </div>
          </div>

          {/* Ponto Focal */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-brand-accent border-b border-brand-gray pb-2 uppercase tracking-wider">Ponto Focal (Contato)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Nome *</label>
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
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">WhatsApp *</label>
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
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Email *</label>
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
