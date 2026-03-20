import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { CnpjDetailsViewer } from '../components/CnpjDetailsViewer';

export const CnpjConsultation: React.FC = () => {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cnpjData, setCnpjData] = useState<any | null>(null);

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      setError('CNPJ inválido. Digite 14 números.');
      return;
    }

    setLoading(true);
    setError(null);
    setCnpjData(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado ou erro na consulta.');
      }
      
      const data = await response.json();
      setCnpjData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar CNPJ. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Consulta de CNPJ</h1>
        <p className="text-brand-text-muted">Consulte os dados completos de qualquer empresa pelo CNPJ.</p>
      </div>

      <div className="bg-brand-black border border-brand-gray rounded-xl p-6 shadow-lg mb-8 max-w-2xl">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">
              Digite o CNPJ
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-3 bg-brand-dark border border-brand-gray text-brand-text-primary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all placeholder-gray-600 text-lg font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || cnpj.replace(/\D/g, '').length !== 14}
            className="bg-brand-accent text-brand-black px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[52px]"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Search size={20} />
            )}
            Consultar
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {cnpjData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CnpjDetailsViewer data={cnpjData} />
        </div>
      )}
    </div>
  );
};
