-- Script para criar um projeto de teste e verificar a automação

WITH new_project AS (
    INSERT INTO public.projetos (
        id,
        empresa_id,
        nome,
        objetivo,
        fase,
        data_inicio_prevista
    )
    SELECT
        gen_random_uuid()::text, -- Gera um ID novo
        id, -- Pega o ID da primeira empresa encontrada
        'Projeto de Teste Automação Final - ' || to_char(now(), 'DD/MM/YYYY HH24:MI:SS'),
        'Verificação da criação automática de tarefas',
        'A FAZER',
        CURRENT_DATE
    FROM public.empresas
    LIMIT 1
    RETURNING id, nome
)
SELECT
    np.nome as projeto_criado,
    count(t.id) as total_tarefas_geradas,
    CASE
        WHEN count(t.id) = 40 THEN 'SUCESSO: 40 tarefas criadas!'
        ELSE 'FALHA: Quantidade incorreta de tarefas (' || count(t.id) || ')'
    END as status_teste
FROM new_project np
LEFT JOIN public.tarefas t ON t.projeto_id = np.id
GROUP BY np.nome;

-- Listar algumas tarefas para conferência visual
SELECT titulo, descricao, prioridade, status, concluida
FROM public.tarefas
WHERE projeto_id = (
    SELECT id FROM public.projetos
    WHERE nome LIKE 'Projeto de Teste Automação Final%'
    ORDER BY created_at DESC
    LIMIT 1
)
LIMIT 5;
