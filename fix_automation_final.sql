-- Script de Correção Final da Automação
-- Baseado na solicitação explícita do usuário

BEGIN;

-- 1. Limpeza de objetos anteriores para evitar conflitos
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;
DROP FUNCTION IF EXISTS public.handle_new_project();
DROP TABLE IF EXISTS public.tarefas_template;

-- 2. Criar tabela tarefas_template conforme especificado
CREATE TABLE public.tarefas_template (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    proprietario TEXT,
    aplicacao TEXT,
    produtos TEXT,
    observacoes TEXT,
    ordem SERIAL
);

-- 3. Inserir as 40 tarefas padrão
INSERT INTO public.tarefas_template (descricao, prioridade, proprietario, aplicacao, produtos, observacoes, ordem)
VALUES
    ('Ler a Passagem de Bastão', 'P1', 'Consultor X', 'Gestão', 'Checklist', '', 1),
    ('Verificar se o Sistema/ERP está implantado para Lucro Real e gerando SPED', 'P1', 'Técnico Y', 'TI', 'Relatório', '', 2),
    ('Revisão do Cadastro de Produtos Saneados', 'P2', 'Analista A', 'Fiscal', 'Cadastro', '', 3),
    ('Orientar o cliente na emissão de NF-e e CT-e/CTE-OS no novo regime tributário', 'P1', 'Consultor X', 'Fiscal', 'Treinamento', '', 4),
    ('Realizar o treinamento do SIEG ao cliente', 'P2', 'Consultor X', 'Sistemas', 'Treinamento', '', 5),
    ('Realizar o treinamento do Portal Consulta Tributária (se contratado)', 'P3', 'Consultor X', 'Sistemas', 'Treinamento', '', 6),
    ('Explicação da aplicação dos benefícios fiscais por operação', 'P1', 'Consultor X', 'Fiscal', 'Reunião', '', 7),
    ('Verificar se a conta de energia está em nome da empresa', 'P2', 'Adm', 'Adm', 'Verificação', '', 8),
    ('Constituir a empresa CSC conforme modelo oficial', 'P1', 'Jurídico', 'Societário', 'Contrato Social', '', 9),
    ('Firmar contrato de locação do imóvel sede da CSC', 'P2', 'Jurídico', 'Jurídico', 'Contrato', '', 10),
    ('Levantar o quadro de funcionários para portabilidade', 'P2', 'RH', 'DP', 'Planilha', '', 11),
    ('Realizar a portabilidade dos funcionários selecionados', 'P1', 'RH', 'DP', 'Portabilidade', '', 12),
    ('Anexar o Alvará de Funcionamento da CSC', 'P2', 'Adm', 'Legalização', 'Documento', '', 13),
    ('Realizar abertura da conta corrente da CSC', 'P1', 'Financeiro', 'Financeiro', 'Conta', '', 14),
    ('Elaborar contrato de serviços com CSC conforme cargos', 'P2', 'Jurídico', 'Jurídico', 'Contrato', '', 15),
    ('Orientar a emissão das notas fiscais de serviços segregadas e recibos de aluguel e locações', 'P2', 'Fiscal', 'Fiscal', 'Orientação', '', 16),
    ('Conferir a emissão e pagamento via transferência da terceirização, aluguéis e locações', 'P2', 'Financeiro', 'Financeiro', 'Conferência', '', 17),
    ('Realizar levantamento patrimonial com documentos fiscais', 'P2', 'Contábil', 'Contábil', 'Inventário', '', 18),
    ('Levantar o estoque de abertura para fins de créditos', 'P1', 'Fiscal', 'Fiscal', 'Relatório', '', 19),
    ('Elaborar contrato de aluguel do imóvel da empresa no Lucro Real', 'P2', 'Jurídico', 'Jurídico', 'Contrato', '', 20),
    ('Elaborar contrato de locação dos veículos', 'P3', 'Jurídico', 'Jurídico', 'Contrato', '', 21),
    ('Elaborar contrato de locação de máquinas e equipamentos', 'P3', 'Jurídico', 'Jurídico', 'Contrato', '', 22),
    ('Implantar rotina de baixas de perdas', 'P2', 'Operacional', 'Processos', 'Procedimento', '', 23),
    ('Implantar rotina de baixas de PDD', 'P2', 'Financeiro', 'Processos', 'Procedimento', '', 24),
    ('Realizar treinamento de desagregação ou desmembramento (açougue)', 'P2', 'Consultor X', 'Operacional', 'Treinamento', '', 25),
    ('Realizar formação de KIT, se aplicável', 'P3', 'Consultor X', 'Operacional', 'Treinamento', '', 26),
    ('Realizar transposição de estoque para uso, consumo ou ativo', 'P2', 'Fiscal', 'Fiscal', 'Ajuste', '', 27),
    ('Realizar transposição de estoque para insumo', 'P2', 'Fiscal', 'Fiscal', 'Ajuste', '', 28),
    ('Segregar e enviar ao escritório as compras de insumos da fabricação de alimentos (padaria e lanchonete)', 'P2', 'Cliente', 'Fiscal', 'Envio', '', 29),
    ('Realizar treinamento das compras de terceiros para uso e consumo na operação e apresentar modelo de recibo para exceções', 'P2', 'Consultor X', 'Compras', 'Treinamento', '', 30),
    ('Orientar sobre compras fora do Simples Nacional e como lançar o crédito mesmo que baixo', 'P2', 'Fiscal', 'Compras', 'Orientação', '', 31),
    ('Verificar se o departamento fiscal está depreciando os bens e tomando créditos de PIS, COFINS e ICMS', 'P1', 'Fiscal', 'Fiscal', 'Verificação', '', 32),
    ('Verificar se o departamento contábil está contabilizando provisões, seguros, juros, taxas de cartão e boletos', 'P1', 'Contábil', 'Contábil', 'Verificação', '', 33),
    ('Verificar se a provisão de férias, 13º salário e encargos está sendo feita pelo departamento pessoal', 'P1', 'DP', 'DP', 'Verificação', '', 34),
    ('Agendar a exclusão do Simples Nacional da empresa', 'P1', 'Societário', 'Legalização', 'Agendamento', '', 35),
    ('Mapear toda a operação do cliente no novo regime tributário', 'P1', 'Consultor X', 'Gestão', 'Mapa', '', 36),
    ('Emitir cartilha para o cliente com as rotinas operacionais (modelo supermercado já existente)', 'P2', 'Consultor X', 'Operacional', 'Cartilha', '', 37),
    ('Verificar se as rotinas de NF-e das compras exclusivas da padaria e as NF-e de transposição de estoque estão sendo segregadas para aproveitamento de créditos de PIS e COFINS', 'P2', 'Fiscal', 'Fiscal', 'Verificação', '', 38),
    ('Mapear todas as apólices de seguros e contratos de empréstimos e financiamentos da empresa', 'P2', 'Financeiro', 'Financeiro', 'Mapa', '', 39),
    ('Emitir tarefa para o departamento fiscal gerar recibos de locação e lançar no Domínio Escrita Fiscal para apuração dos impostos referentes às locações', 'P2', 'Fiscal', 'Fiscal', 'Tarefa', '', 40);

-- 4. Criar Função de Automação
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se já existem tarefas para este projeto para evitar duplicação
    IF EXISTS (SELECT 1 FROM public.tarefas WHERE projeto_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Inserir tarefas copiando do template
    INSERT INTO public.tarefas (
        id,
        projeto_id,
        titulo, -- Preenchido com a descrição do template
        descricao,
        concluida,
        prioridade,
        proprietario,
        status,
        data_tarefa,
        data_termino,
        aplicacao,
        produtos,
        observacoes,
        created_at
    )
    SELECT
        gen_random_uuid()::text, -- ID gerado como texto
        NEW.id,
        t.descricao, -- Titulo recebe a descrição (NOT NULL)
        t.descricao, -- Descrição também recebe a descrição
        FALSE, -- Padrão: false
        t.prioridade,
        t.proprietario,
        'NÃO INICIADA', -- Padrão: NÃO INICIADA
        NULL, -- Padrão: null
        NULL, -- Padrão: null
        t.aplicacao,
        t.produtos,
        t.observacoes,
        NOW() -- Padrão: now()
    FROM public.tarefas_template t
    ORDER BY t.ordem;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar Trigger
CREATE TRIGGER on_project_created
AFTER INSERT ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_project();

COMMIT;
