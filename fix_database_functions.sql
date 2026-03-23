-- 1. Tabela de Template de Tarefas
CREATE TABLE IF NOT EXISTS public.tarefas_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    prioridade TEXT DEFAULT 'P2',
    proprietario TEXT,
    aplicacao TEXT,
    observacoes TEXT,
    ordem SERIAL
);

-- 2. Limpar e Inserir Tarefas Padrão no Template
TRUNCATE public.tarefas_template;

INSERT INTO public.tarefas_template (descricao, prioridade, proprietario, aplicacao, observacoes) VALUES
('Ler a Passagem de Bastão', 'P1', 'Consultor X', 'Gestão', ''),
('Verificar se o Sistema/ERP está implantado para Lucro Real e gerando SPED', 'P1', 'Técnico Y', 'TI', ''),
('Revisão do Cadastro de Produtos Saneados', 'P2', 'Analista A', 'Fiscal', ''),
('Orientar o cliente na emissão de NF-e e CT-e/CTE-OS no novo regime tributário', 'P1', 'Consultor X', 'Fiscal', ''),
('Realizar o treinamento do SIEG ao cliente', 'P2', 'Consultor X', 'Sistemas', ''),
('Realizar o treinamento do Portal Consulta Tributária (se contratado)', 'P3', 'Consultor X', 'Sistemas', ''),
('Explicação da aplicação dos benefícios fiscais por operação', 'P1', 'Consultor X', 'Fiscal', ''),
('Verificar se a conta de energia está em nome da empresa', 'P2', 'Adm', 'Adm', ''),
('Constituir a empresa CSC conforme modelo oficial', 'P1', 'Jurídico', 'Societário', ''),
('Firmar contrato de locação do imóvel sede da CSC', 'P2', 'Jurídico', 'Jurídico', ''),
('Levantar o quadro de funcionários para portabilidade', 'P2', 'RH', 'DP', ''),
('Realizar a portabilidade dos funcionários selecionados', 'P1', 'RH', 'DP', ''),
('Anexar o Alvará de Funcionamento da CSC', 'P2', 'Adm', 'Legalização', ''),
('Realizar abertura da conta corrente da CSC', 'P1', 'Financeiro', 'Financeiro', ''),
('Elaborar contrato de serviços com CSC conforme cargos', 'P2', 'Jurídico', 'Jurídico', ''),
('Orientar a emissão das notas fiscais de serviços segregadas e recibos de aluguel e locações', 'P2', 'Fiscal', 'Fiscal', ''),
('Conferir a emissão e pagamento via transferência da terceirização, aluguéis e locações', 'P2', 'Financeiro', 'Financeiro', ''),
('Realizar levantamento patrimonial com documentos fiscais', 'P2', 'Contábil', 'Contábil', ''),
('Levantar o estoque de abertura para fins de créditos', 'P1', 'Fiscal', 'Fiscal', ''),
('Elaborar contrato de aluguel do imóvel da empresa no Lucro Real', 'P2', 'Jurídico', 'Jurídico', ''),
('Elaborar contrato de locação dos veículos', 'P3', 'Jurídico', 'Jurídico', ''),
('Elaborar contrato de locação de máquinas e equipamentos', 'P3', 'Jurídico', 'Jurídico', ''),
('Implantar rotina de baixas de perdas', 'P2', 'Operacional', 'Processos', ''),
('Implantar rotina de baixas de PDD', 'P2', 'Financeiro', 'Processos', ''),
('Realizar treinamento de desagregação ou desmembramento (açougue)', 'P2', 'Consultor X', 'Operacional', ''),
('Realizar formação de KIT, se aplicável', 'P3', 'Consultor X', 'Operacional', ''),
('Realizar transposição de estoque para uso, consumo ou ativo', 'P2', 'Fiscal', 'Fiscal', ''),
('Realizar transposição de estoque para insumo', 'P2', 'Fiscal', 'Fiscal', ''),
('Segregar e enviar ao escritório as compras de insumos da fabricação de alimentos (padaria e lanchonete)', 'P2', 'Cliente', 'Fiscal', ''),
('Realizar treinamento das compras de terceiros para uso e consumo na operação e apresentar modelo de recibo para exceções', 'P2', 'Consultor X', 'Compras', ''),
('Orientar sobre compras fora do Simples Nacional e como lançar o crédito mesmo que baixo', 'P2', 'Fiscal', 'Compras', ''),
('Verificar se o departamento fiscal está depreciando os bens e tomando créditos de PIS, COFINS e ICMS', 'P1', 'Fiscal', 'Fiscal', ''),
('Verificar se o departamento contábil está contabilizando provisões, seguros, juros, taxas de cartão e boletos', 'P1', 'Contábil', 'Contábil', ''),
('Verificar se a provisão de férias, 13º salário e encargos está sendo feita pelo departamento pessoal', 'P1', 'DP', 'DP', ''),
('Agendar a exclusão do Simples Nacional da empresa', 'P1', 'Societário', 'Legalização', ''),
('Mapear toda a operação do cliente no novo regime tributário', 'P1', 'Consultor X', 'Gestão', ''),
('Emitir cartilha para o cliente com as rotinas operacionais (modelo supermercado já existente)', 'P2', 'Consultor X', 'Operacional', ''),
('Verificar se as rotinas de NF-e das compras exclusivas da padaria e as NF-e de transposição de estoque estão sendo segregadas para aproveitamento de créditos de PIS e COFINS', 'P2', 'Fiscal', 'Fiscal', ''),
('Mapear todas as apólices de seguros e contratos de empréstimos e financiamentos da empresa', 'P2', 'Financeiro', 'Financeiro', ''),
('Emitir tarefa para o departamento fiscal gerar recibos de locação e lançar no Domínio Escrita Fiscal para apuração dos impostos referentes às locações', 'P2', 'Fiscal', 'Fiscal', '');

-- 3. Função RPC para Alterar Senha de Usuário (Admin Only)
-- Esta função deve ser executada como SECURITY DEFINER para ter permissões de admin no auth.users
CREATE OR REPLACE FUNCTION public.admin_update_user_password(user_id UUID, new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verifica se o usuário que está chamando é admin na tabela profiles
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permissão negada: Apenas administradores podem alterar senhas.';
  END IF;
  
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id;
END;
$$;

-- 4. Garantir que a automação de projetos use o template
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

INSERT INTO public.tarefas (
    id,
    projeto_id,
    titulo,
    descricao,
    concluida,
    prioridade,
    proprietario,
    status,
    data_tarefa,
    data_termino,
    aplicacao,
    observacoes,
    created_at
)

SELECT
    gen_random_uuid()::text,
    NEW.id,
    descricao,
    descricao,
    false,
    prioridade,
    proprietario,
    'NÃO INICIADA',
    NULL,
    NULL,
    aplicacao,
    observacoes,
    now()

FROM public.tarefas_template
ORDER BY ordem;

RETURN NEW;

END;
$$;

-- Recriar trigger se necessário
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;
CREATE TRIGGER on_project_created
AFTER INSERT ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_project();
