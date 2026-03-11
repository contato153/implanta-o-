-- Solução Definitiva aplicada (baseada no feedback do usuário)
-- Este script reflete a configuração atual do banco de dados.

-- 1. Remover trigger e função antigos
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;
DROP FUNCTION IF EXISTS public.handle_new_project();

-- 2. Criar função novamente (com SECURITY DEFINER e campos corretos)
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
    produtos,
    observacoes,
    created_at
)

SELECT
    gen_random_uuid()::text,
    NEW.id,
    descricao, -- titulo recebe a descricao
    descricao,
    false, -- assumindo que a coluna concluida existe
    prioridade,
    proprietario,
    'NÃO INICIADA',
    NULL,
    NULL,
    aplicacao,
    produtos,
    observacoes,
    now()

FROM public.tarefas_template
ORDER BY ordem;

RETURN NEW;

END;
$$;

-- 3. Recriar trigger
CREATE TRIGGER on_project_created
AFTER INSERT ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_project();
