-- Script para adicionar um Cliente de Teste completo
-- Copie e cole este código no SQL Editor do Supabase e clique em RUN

WITH nova_empresa AS (
    INSERT INTO empresas (
        razao_social, 
        nome_fantasia, 
        cnpj, 
        codigo_interno, 
        ponto_focal_nome, 
        ponto_focal_email, 
        regime_atual
    )
    VALUES (
        'Tecnologia Inovadora Ltda', 
        'InovaTech', 
        '99.999.999/0001-99', 
        'CLI-TESTE-01', 
        'Mariana Teste', 
        'mariana@inovatech.com.br', 
        'Lucro Presumido'
    )
    RETURNING id
),
novo_projeto AS (
    INSERT INTO projetos (
        empresa_id, 
        nome, 
        objetivo, 
        fase, 
        data_inicio_prevista, 
        competencia_inicial
    )
    SELECT 
        id, 
        'Migração de Dados', 
        'Testar a visualização no dashboard', 
        'A FAZER', 
        CURRENT_DATE, 
        '10/2023'
    FROM nova_empresa
    RETURNING id
),
novos_socios AS (
    INSERT INTO socios (empresa_id, nome, email)
    SELECT id, 'Sócio Teste 1', 'socio1@inovatech.com.br'
    FROM nova_empresa
)
INSERT INTO tarefas (projeto_id, titulo, concluida)
SELECT id, 'Validar cadastro', FALSE
FROM novo_projeto;
