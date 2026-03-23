-- Script para remover qualquer referência à coluna 'produtos' nas funções do banco de dados

BEGIN;

-- 1. Recriar a função handle_new_project garantindo que não há referência a 'produtos'
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se já existem tarefas para este projeto para evitar duplicação
    IF EXISTS (SELECT 1 FROM public.tarefas WHERE projeto_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Inserir tarefas copiando do template (sem a coluna produtos)
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
        t.descricao, -- Titulo recebe a descrição
        t.descricao, -- Descrição também recebe a descrição
        FALSE,
        t.prioridade,
        t.proprietario,
        'NÃO INICIADA',
        NULL,
        NULL,
        t.aplicacao,
        t.observacoes,
        NOW()
    FROM public.tarefas_template t
    ORDER BY t.ordem;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que o trigger está apontando para a função correta
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;

CREATE TRIGGER on_project_created
AFTER INSERT ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_project();

COMMIT;
