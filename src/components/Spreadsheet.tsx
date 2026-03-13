import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ClientData, Role } from '../types';
import { getSupabase } from '../lib/supabase';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface SpreadsheetProps {
  data: ClientData | null;
  loading: boolean;
  role: Role;
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({ data, loading, role }) => {
  const { empresa, projeto, socios, percentual_conclusao } = data || {};

  // ✅ Estado local do relógio baseado nas tarefas reais
  const [progress, setProgress] = useState<{
    percent: number;
    done: number;
    totalValid: number;
  }>({ percent: 0, done: 0, totalValid: 0 });

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(empresa?.logo_url || null);

  useEffect(() => {
    setLocalLogoUrl(empresa?.logo_url || null);
  }, [empresa?.logo_url]);

  const handleLogoClick = () => {
    if (!canEditCompany) return;
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa?.id) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
    if (!allowedExts.includes(fileExt || '')) {
      alert('Formato de imagem inválido. Use PNG, JPG, JPEG, WEBP ou SVG.');
      return;
    }

    try {
      setUploadingLogo(true);
      const supabase = getSupabase();
      const filePath = `${empresa.id}/logo.${fileExt}`;

      // Try to create the bucket if it doesn't exist
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'company-logos')) {
          await supabase.storage.createBucket('company-logos', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
            fileSizeLimit: 5242880 // 5MB
          });
        }
      } catch (e) {
        console.warn('Could not check/create bucket:', e);
      }

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Add cache buster to URL to force refresh if same name
      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

      // Update company in database
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: urlWithCacheBuster })
        .eq('id', empresa.id);

      if (updateError) throw updateError;

      setLocalLogoUrl(urlWithCacheBuster);
    } catch (err: any) {
      console.error('Erro ao fazer upload da logo:', err);
      if (err.message?.includes('Bucket not found')) {
        alert('Erro: O bucket "company-logos" não existe no Supabase. Por favor, crie-o no painel do Supabase Storage e defina-o como Público.');
      } else {
        alert('Erro ao fazer upload da logo. Verifique as permissões do Storage.');
      }
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper to safely get values
  const val = (v: any) => v || '';

  const canEditCompany = role === 'admin' || role === 'manager';
  const canEditTasks = role === 'admin' || role === 'manager';

  // ✅ Normalização forte (remove acentos, espaços, chars invisíveis)
  const normalizeStatus = (status: any) => {
    if (!status) return '';
    const s = String(status)
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
      .replace(/\u00A0/g, ' ') // NBSP
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    return s;
  };

  // ✅ Buscar tarefas do projeto e calcular percentual real
  useEffect(() => {
    const run = async () => {
      // sem projeto selecionado
      if (!projeto?.id) {
        setProgress({ percent: 0, done: 0, totalValid: 0 });
        return;
      }

      try {
        const supabase = getSupabase();

        // Busca somente campos necessários
        const { data: tasks, error } = await supabase
          .from('tarefas')
          .select('id,status,concluida')
          .eq('projeto_id', projeto.id);

        if (error) throw error;

        const list = tasks || [];

        // Total válido (exclui NAO APLICA)
        const valid = list.filter((t: any) => normalizeStatus(t.status) !== 'NAO APLICA');

        const totalValid = valid.length;

        // Concluídas
        const done = valid.filter((t: any) => {
          const s = normalizeStatus(t.status);
          return t.concluida === true || s === 'CONCLUIDA';
        }).length;

        const percent =
          totalValid > 0 ? Math.round((done / totalValid) * 100) : 0;

        setProgress({ percent, done, totalValid });
      } catch (e) {
        // fallback: se falhar, pelo menos exibe o percentual_conclusao vindo do data
        const p = Math.max(0, Math.min(100, Number(percentual_conclusao || 0)));
        setProgress({ percent: p, done: 0, totalValid: 0 });
        console.error('Erro ao calcular relógio:', e);
      }
    };

    run();
  }, [projeto?.id, percentual_conclusao]);

  // ✅ Se preferir, usa sempre o calculado; se totalValid=0, cai no percentual_conclusao
  const displayPercent = useMemo(() => {
    if (progress.totalValid > 0) return progress.percent;
    return Math.max(0, Math.min(100, Number(percentual_conclusao || 0)));
  }, [progress, percentual_conclusao]);

  // Format date YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      // Check if it matches YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // Format date YYYY-MM-DD to MM/YYYY
  const formatMesAno = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month] = dateString.split('-');
        return `${month}/${year}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // Format CNPJ for display
  const formatCNPJ = (value: string | undefined) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Logs temporários para verificação
  useEffect(() => {
    if (empresa) {
      console.log('Empresa carregada:', empresa);
      console.log('comp_inicial:', empresa.comp_inicial);
      console.log('aprovado_reuniao:', empresa.aprovado_reuniao);
    }
  }, [empresa]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-brand-black/80 z-10 absolute inset-0">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-brand-dark shadow-lg overflow-hidden border border-brand-gray text-sm font-sans relative text-white">
      {/* Header / Project Section */}
      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div 
          className={`col-span-3 border-r border-brand-gray p-4 flex items-center justify-center bg-brand-black text-center relative group ${canEditCompany ? 'cursor-pointer' : ''}`}
          onClick={handleLogoClick}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoUpload} 
            accept=".png,.jpg,.jpeg,.webp,.svg" 
            className="hidden" 
          />
          
          {uploadingLogo ? (
            <div className="flex flex-col items-center text-brand-accent">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mb-2"></div>
              <span className="text-xs font-medium">Enviando...</span>
            </div>
          ) : localLogoUrl ? (
            <>
              <img 
                src={localLogoUrl} 
                alt={`Logo ${empresa?.nome_fantasia || 'da Empresa'}`} 
                className="w-full h-full max-h-32 object-contain"
              />
              {canEditCompany && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Upload size={24} className="mb-2 text-brand-accent" />
                  <span className="text-xs font-medium">Alterar Logo</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-brand-text-muted group-hover:text-brand-accent transition-colors">
              <ImageIcon size={32} className="mb-2 opacity-50 group-hover:opacity-100" />
              <span className="font-bold text-xs uppercase tracking-wider">
                {canEditCompany ? 'Adicionar Logo' : 'Sem Logo'}
              </span>
            </div>
          )}
        </div>
        <div className="col-span-9">
          <div className={`border-b border-brand-gray p-2 bg-brand-black text-brand-accent text-center font-bold text-lg uppercase ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
            {val(empresa?.nome_fantasia) || val(empresa?.razao_social) || 'NOME DA EMPRESA'}
          </div>
          <div className="grid grid-cols-2">
            <div className={`p-2 border-r border-brand-gray border-b border-brand-gray ${canEditTasks ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
              <span className="font-bold block text-xs text-brand-text-muted">NOME DO PROJETO</span>
              {val(projeto?.nome)}
            </div>
            <div className={`p-2 border-b border-brand-gray ${canEditTasks ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
              <span className="font-bold block text-xs text-brand-text-muted">FASE DO PROJETO</span>
              {val(projeto?.fase)}
            </div>
            <div className={`col-span-2 p-2 border-b border-brand-gray ${canEditTasks ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
              <span className="font-bold block text-xs text-brand-text-muted">OBJETIVO DO PROJETO</span>
              {val(projeto?.objetivo)}
            </div>
            <div className={`p-2 border-r border-brand-gray ${canEditTasks ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
              <span className="font-bold block text-xs text-brand-text-muted">DATA INÍCIO PREVISTA</span>
              {formatDate(projeto?.data_inicio_prevista)}
            </div>
            <div className={`p-2 ${canEditTasks ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
              <span className="font-bold block text-xs text-brand-text-muted">DATA FIM PREVISTA</span>
              {formatDate(projeto?.data_fim_prevista)}
            </div>
          </div>
        </div>
      </div>

      {/* Company Data Section */}
      <div className="bg-brand-black p-1 font-bold text-center border-b border-brand-gray text-brand-accent">DADOS DA EMPRESA</div>
      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div className={`col-span-2 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">COD EMPRESA</span>
          {val(empresa?.codigo_interno) || val(empresa?.id)}
        </div>
        <div className={`col-span-6 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">NOME EMPRESARIAL</span>
          {val(empresa?.razao_social)}
        </div>
        <div className={`col-span-4 p-2 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">CNPJ</span>
          {formatCNPJ(empresa?.cnpj)}
        </div>
      </div>

      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div className={`col-span-6 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">INSC. ESTADUAL</span>
          {val(empresa?.ie)}
        </div>
        <div className={`col-span-6 p-2 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">INSC. MUNICIPAL</span>
          {val(empresa?.im)}
        </div>
      </div>

      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div className={`col-span-12 p-2 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">OBJETIVO DA EMPRESA</span>
          {val(empresa?.objetivo_empresa)}
        </div>
      </div>

      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div className={`col-span-4 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">PONTO FOCAL EMPRES.</span>
          {val(empresa?.ponto_focal_nome)}
        </div>
        <div className={`col-span-4 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">CONTATOS (TEL/WHATSAPP)</span>
          {val(empresa?.ponto_focal_whatsapp)}
        </div>
        <div className={`col-span-4 p-2 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">E-MAIL</span>
          {val(empresa?.ponto_focal_email)}
        </div>
      </div>

      {/* Partners Section */}
      <div className="bg-brand-black p-1 font-bold text-center border-b border-brand-gray text-brand-accent">SÓCIOS</div>
      <div className="grid grid-cols-12 border-b border-brand-gray bg-brand-black font-bold text-xs text-brand-text-muted">
        <div className="col-span-4 p-2 border-r border-brand-gray">NOME</div>
        <div className="col-span-4 p-2 border-r border-brand-gray">WHATSAPP</div>
        <div className="col-span-4 p-2">EMAIL</div>
      </div>

      {[0, 1, 2].map((i) => {
        const socio = socios?.[i];
        return (
          <div key={i} className={`grid grid-cols-12 border-b border-brand-gray h-10 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
            <div className="col-span-4 p-2 border-r border-brand-gray flex items-center">{val(socio?.nome)}</div>
            <div className="col-span-4 p-2 border-r border-brand-gray flex items-center">{val(socio?.whatsapp)}</div>
            <div className="col-span-4 p-2 flex items-center">{val(socio?.email)}</div>
          </div>
        );
      })}

      {/* Other Fields Section */}
      <div className="grid grid-cols-12 border-b border-brand-gray">
        <div className={`col-span-3 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">REGIME TRIB. ATUAL</span>
          {val(empresa?.regime_atual)}
        </div>
        <div className={`col-span-3 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">NOVO REG.</span>
          {val(empresa?.regime_novo)}
        </div>
        <div className={`col-span-3 p-2 border-r border-brand-gray ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">COMP. INICIAL</span>
          {formatMesAno(empresa?.comp_inicial)}
        </div>
        <div className={`col-span-3 p-2 ${canEditCompany ? 'cursor-pointer hover:bg-brand-gray' : ''}`}>
          <span className="font-bold block text-xs text-brand-text-muted">APROVADO EM REUNIÃO</span>
          {val(empresa?.aprovado_reuniao)}
        </div>
      </div>

      {/* Clock / Percentage Section */}
      <div className="p-6 flex flex-col items-center justify-center bg-brand-black border-t border-brand-gray">
        <div className="font-bold mb-2 text-lg text-white">RELÓGIO DE CONCLUSÃO</div>

        {/* ✅ Mostra X/Y quando tiver tarefas */}
        {progress.totalValid > 0 && (
          <div className="text-xs text-brand-text-muted font-semibold mb-3">
            {progress.done} concluídas de {progress.totalValid} válidas
          </div>
        )}

        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#1E1E1E" strokeWidth="10" fill="transparent" />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#F4C400"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * displayPercent) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold text-white">{displayPercent}%</span>
            <span className="text-xs text-brand-text-muted font-bold mt-1">CONCLUÍDO</span>
          </div>
        </div>
      </div>
    </div>
  );
};