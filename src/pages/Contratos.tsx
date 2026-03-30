import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Building2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Empresa } from '../types';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

export function Contratos() {
  const [tipoContrato, setTipoContrato] = useState<'terceirizacao' | 'aluguel'>('terceirizacao');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contratanteId, setContratanteId] = useState('');
  const [contratadoId, setContratadoId] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  
  // Specific fields
  const [valor, setValor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dadosBancarios, setDadosBancarios] = useState('');
  
  const [prazos, setPrazos] = useState('');
  const [dataContrato, setDataContrato] = useState('');

  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.from('empresas').select('*').order('nome_fantasia');
        if (data) {
          setEmpresas(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    }
    fetchEmpresas();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTemplateFile(e.target.files[0]);
    }
  };

  const generateDocument = async () => {
    if (!templateFile) {
      alert('Por favor, faça o upload do modelo do contrato (.docx).');
      return;
    }

    const contratante = empresas.find(e => e.id === contratanteId);
    const contratado = empresas.find(e => e.id === contratadoId);

    if (!contratante || !contratado) {
      alert('Por favor, selecione o contratante e o contratado.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const content = event.target?.result;
      if (!content) return;

      try {
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Prepare data for replacement
        const data = {
          contratante_razao_social: contratante.razao_social,
          contratante_cnpj: contratante.cnpj,
          contratante_ie: contratante.ie,
          contratante_im: contratante.im,
          contratado_razao_social: contratado.razao_social,
          contratado_cnpj: contratado.cnpj,
          contratado_ie: contratado.ie,
          contratado_im: contratado.im,
          
          ...(tipoContrato === 'terceirizacao' ? {
            valor: valor,
            data_inicio: dataInicio,
            dados_bancarios: dadosBancarios,
          } : {
            valor_aluguel: valor,
            inicio_contrato: dataInicio,
            prazos: prazos,
            data_contrato: dataContrato,
          })
        };

        doc.render(data);

        const out = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        saveAs(out, `Contrato_${tipoContrato}_${contratado.nome_fantasia || contratado.razao_social}.docx`);
      } catch (error) {
        console.error('Error generating document:', error);
        alert('Erro ao gerar o documento. Verifique se as tags no modelo estão corretas.');
      }
    };
    reader.readAsBinaryString(templateFile);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#F4C400]/20 rounded-lg">
          <FileText className="text-[#F4C400]" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gerador de Contratos</h1>
          <p className="text-[#BDBDBD] text-sm">Gere contratos automaticamente a partir de modelos .docx</p>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-6 shadow-lg mb-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTipoContrato('terceirizacao')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              tipoContrato === 'terceirizacao'
                ? 'bg-[#F4C400] text-[#0B0B0B]'
                : 'bg-[#1E1E1E] text-[#BDBDBD] hover:bg-[#2A2A2A]'
            }`}
          >
            Contrato de Terceirização
          </button>
          <button
            onClick={() => setTipoContrato('aluguel')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              tipoContrato === 'aluguel'
                ? 'bg-[#F4C400] text-[#0B0B0B]'
                : 'bg-[#1E1E1E] text-[#BDBDBD] hover:bg-[#2A2A2A]'
            }`}
          >
            Contrato de Aluguel
          </button>
        </div>

        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium text-[#BDBDBD] mb-2">
              Modelo do Contrato (.docx)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#1E1E1E] border-dashed rounded-lg cursor-pointer bg-[#111111] hover:bg-[#1A1A1A] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-[#BDBDBD]" />
                  <p className="mb-2 text-sm text-[#BDBDBD]">
                    <span className="font-semibold text-[#F4C400]">Clique para fazer upload</span> ou arraste o arquivo
                  </p>
                  <p className="text-xs text-[#888888]">Apenas arquivos .docx</p>
                </div>
                <input type="file" className="hidden" accept=".docx" onChange={handleFileChange} />
              </label>
            </div>
            {templateFile && (
              <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                <FileText size={16} /> {templateFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contratante */}
            <div>
              <label className="block text-sm font-medium text-[#BDBDBD] mb-2 flex items-center gap-2">
                <Building2 size={16} /> Contratante
              </label>
              <select
                value={contratanteId}
                onChange={(e) => setContratanteId(e.target.value)}
                className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
              >
                <option value="">Selecione a empresa contratante</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia || emp.razao_social} ({emp.cnpj})
                  </option>
                ))}
              </select>
            </div>

            {/* Contratado */}
            <div>
              <label className="block text-sm font-medium text-[#BDBDBD] mb-2 flex items-center gap-2">
                <Building2 size={16} /> Contratado
              </label>
              <select
                value={contratadoId}
                onChange={(e) => setContratadoId(e.target.value)}
                className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
              >
                <option value="">Selecione a empresa contratada</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome_fantasia || emp.razao_social} ({emp.cnpj})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1E1E1E]">
            {tipoContrato === 'terceirizacao' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Valor</label>
                  <input
                    type="text"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex: R$ 5.000,00"
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Data de Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Dados Bancários</label>
                  <input
                    type="text"
                    value={dadosBancarios}
                    onChange={(e) => setDadosBancarios(e.target.value)}
                    placeholder="Banco, Agência, Conta, PIX..."
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Valor do Aluguel</label>
                  <input
                    type="text"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex: R$ 2.500,00"
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Início do Contrato</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Prazos (Meses/Anos)</label>
                  <input
                    type="text"
                    value={prazos}
                    onChange={(e) => setPrazos(e.target.value)}
                    placeholder="Ex: 12 meses"
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#BDBDBD] mb-2">Data do Contrato</label>
                  <input
                    type="date"
                    value={dataContrato}
                    onChange={(e) => setDataContrato(e.target.value)}
                    className="w-full bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F4C400] transition-colors"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={generateDocument}
            className="flex items-center gap-2 bg-[#F4C400] text-[#0B0B0B] px-6 py-3 rounded-lg font-bold hover:bg-[#FFD84D] transition-colors"
          >
            <Download size={20} />
            Gerar Contrato
          </button>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#1E1E1E] rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">Variáveis Disponíveis no Modelo</h2>
        <p className="text-[#BDBDBD] text-sm mb-4">
          Utilize as tags abaixo no seu arquivo .docx para que elas sejam substituídas automaticamente:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111111] p-4 rounded-lg border border-[#1E1E1E]">
            <h3 className="text-[#F4C400] font-semibold mb-2">Gerais</h3>
            <ul className="text-sm text-[#BDBDBD] space-y-1 font-mono">
              <li>{`{contratante_razao_social}`}</li>
              <li>{`{contratante_cnpj}`}</li>
              <li>{`{contratante_ie}`}</li>
              <li>{`{contratante_im}`}</li>
              <li className="pt-2">{`{contratado_razao_social}`}</li>
              <li>{`{contratado_cnpj}`}</li>
              <li>{`{contratado_ie}`}</li>
              <li>{`{contratado_im}`}</li>
            </ul>
          </div>
          <div className="bg-[#111111] p-4 rounded-lg border border-[#1E1E1E]">
            <h3 className="text-[#F4C400] font-semibold mb-2">Específicas</h3>
            {tipoContrato === 'terceirizacao' ? (
              <ul className="text-sm text-[#BDBDBD] space-y-1 font-mono">
                <li>{`{valor}`}</li>
                <li>{`{data_inicio}`}</li>
                <li>{`{dados_bancarios}`}</li>
              </ul>
            ) : (
              <ul className="text-sm text-[#BDBDBD] space-y-1 font-mono">
                <li>{`{valor_aluguel}`}</li>
                <li>{`{inicio_contrato}`}</li>
                <li>{`{prazos}`}</li>
                <li>{`{data_contrato}`}</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
