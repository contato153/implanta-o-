-- Script de Teste da Automação
-- Este script cria um projeto fictício vinculado à primeira empresa encontrada no banco
-- e retorna a quantidade de tarefas que foram criadas automaticamente para ele.

WITH projeto_novo AS (
    INSERT INTO public.projetos (empresa_id, nome, objetivo, fase, data_inicio_prevista)
    SELECT 
        id, 
        'Projeto Teste Automação - ' || to_char(now(), 'DD/MM/YYYY HH24:MI:SS'), 
        'Testando a criação automática de tarefas via Trigger', 
        'A FAZER', 
        CURRENT_DATE
    FROM public.empresas 
    LIMIT 1 -- Pega a primeira empresa disponível para vincular o projeto
    RETURNING id, nome
)
SELECT 
    pn.nome as nome_projeto,
    count(t.id) as tarefas_criadas,
    CASE 
        WHEN count(t.id) > 0 THEN 'SUCESSO: Automação funcionou!' 
        ELSE 'FALHA: Nenhuma tarefa criada. Verifique se o trigger foi configurado.' 
    END as status
FROM projeto_novo pn
LEFT JOIN public.tarefas t ON t.projeto_id = pn.id
GROUP BY pn.nome;
