-- Script para verificar o total real de tarefas criadas
-- Removemos o limite de visualização para você ver todas as 40 tarefas.

SELECT 
    p.nome as nome_projeto,
    COUNT(t.id) as total_tarefas_criadas,
    CASE 
        WHEN COUNT(t.id) = 40 THEN '✅ SUCESSO: Todas as 40 tarefas foram criadas.'
        ELSE '❌ ERRO: Quantidade incorreta.'
    END as status
FROM public.projetos p
JOIN public.tarefas t ON t.projeto_id = p.id
WHERE p.nome LIKE 'Projeto de Teste Automação Final%'
GROUP BY p.id, p.nome, p.created_at
ORDER BY p.created_at DESC
LIMIT 1;

-- Listagem completa das tarefas (sem limite)
SELECT 
    titulo, 
    prioridade, 
    status,
    concluida
FROM public.tarefas
WHERE projeto_id = (
    SELECT id FROM public.projetos 
    WHERE nome LIKE 'Projeto de Teste Automação Final%' 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY created_at ASC;
