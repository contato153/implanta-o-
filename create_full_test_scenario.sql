-- Script para criar Cliente Novo + Projeto e validar as Observações
-- Execute todo este script no SQL Editor

-- 1. Inserir Empresa e Projeto
WITH nova_empresa AS (
    INSERT INTO public.empresas (
        id,
        razao_social,
        nome_fantasia,
        cnpj,
        codigo_interno
    ) VALUES (
        gen_random_uuid(),
        'Cliente Validação ' || to_char(now(), 'DD/MM HH24:MI:SS'),
        'Cliente Novo ' || to_char(now(), 'HH24:MI:SS'),
        '00.' || (floor(random() * 899 + 100)::int)::text || '.' || (floor(random() * 899 + 100)::int)::text || '/0001-00',
        'CLI-' || (floor(random() * 9999)::int)::text
    )
    RETURNING id, nome_fantasia
),
novo_projeto AS (
    INSERT INTO public.projetos (
        id,
        empresa_id,
        nome,
        objetivo,
        fase,
        data_inicio_prevista
    )
    SELECT
        gen_random_uuid(),
        id,
        'Projeto de Implementação - ' || nome_fantasia,
        'Validar observações automáticas',
        'A FAZER',
        CURRENT_DATE
    FROM nova_empresa
    RETURNING id
)
SELECT nome_fantasia as cliente_criado FROM nova_empresa;

-- 2. Listar as tarefas geradas para conferir as observações
-- (Pega o último projeto criado que corresponde ao padrão do nome)
SELECT 
    left(t.titulo, 40) as titulo_resumido,
    t.observacoes
FROM public.tarefas t
JOIN public.projetos p ON p.id = t.projeto_id
WHERE p.nome LIKE 'Projeto de Implementação - Cliente Novo %'
ORDER BY p.created_at DESC, t.created_at ASC
LIMIT 20;
