-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: empresas
CREATE TABLE empresas (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    codigo_interno TEXT,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT NOT NULL,
    ie TEXT,
    im TEXT,
    ponto_focal_nome TEXT,
    ponto_focal_whatsapp TEXT,
    ponto_focal_email TEXT,
    regime_atual TEXT,
    regime_novo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: projetos
CREATE TABLE projetos (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    objetivo TEXT,
    data_inicio_prevista DATE,
    data_fim_prevista DATE,
    fase TEXT, -- Ex: "A FAZER", "EM ANDAMENTO", "CONCLUÍDO"
    competencia_inicial TEXT,
    aprovado_em_reuniao TEXT, -- Pode ser boolean ou string conforme uso (ex: data ou "Sim/Não")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: socios
CREATE TABLE socios (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: participantes
CREATE TABLE participantes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    projeto_id TEXT REFERENCES projetos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: tarefas
CREATE TABLE tarefas (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    projeto_id TEXT REFERENCES projetos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    concluida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Dados de Exemplo (Mock Data)

-- Empresa 1: Alpha
INSERT INTO empresas (id, codigo_interno, razao_social, nome_fantasia, cnpj, ie, im, ponto_focal_nome, ponto_focal_whatsapp, ponto_focal_email, regime_atual, regime_novo)
VALUES 
('11111111-1111-1111-1111-111111111111', 'CLI-001', 'Empresa Alpha Ltda', 'Alpha', '12.345.678/0001-90', '123.456.789.000', '987654', 'João Silva', '(11) 99999-9999', 'joao@alpha.com', 'Simples Nacional', 'Lucro Presumido');

-- Projeto 1: Alpha
INSERT INTO projetos (id, empresa_id, nome, objetivo, data_inicio_prevista, data_fim_prevista, fase, competencia_inicial, aprovado_em_reuniao)
VALUES
('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Implantação ERP', 'Migrar sistema legado para novo ERP', '2023-01-15', '2023-06-30', 'EM ANDAMENTO', '01/2023', '2022-12-20');

-- Sócios 1: Alpha
INSERT INTO socios (empresa_id, nome, whatsapp, email)
VALUES
('11111111-1111-1111-1111-111111111111', 'Carlos Alpha', '(11) 98888-8888', 'carlos@alpha.com'),
('11111111-1111-1111-1111-111111111111', 'Ana Alpha', '(11) 97777-7777', 'ana@alpha.com');

-- Participantes 1: Alpha
INSERT INTO participantes (projeto_id, nome, role)
VALUES
('p1111111-1111-1111-1111-111111111111', 'Consultor X', 'Consultor'),
('p1111111-1111-1111-1111-111111111111', 'Gerente Y', 'Gerente');

-- Tarefas 1: Alpha
INSERT INTO tarefas (projeto_id, titulo, concluida)
VALUES
('p1111111-1111-1111-1111-111111111111', 'Levantamento', TRUE),
('p1111111-1111-1111-1111-111111111111', 'Configuração', TRUE),
('p1111111-1111-1111-1111-111111111111', 'Treinamento', FALSE),
('p1111111-1111-1111-1111-111111111111', 'Go-live', FALSE);


-- Empresa 2: Beta
INSERT INTO empresas (id, codigo_interno, razao_social, nome_fantasia, cnpj, ie, im, ponto_focal_nome, ponto_focal_whatsapp, ponto_focal_email, regime_atual, regime_novo)
VALUES 
('22222222-2222-2222-2222-222222222222', 'CLI-002', 'Beta Soluções S.A.', 'Beta', '98.765.432/0001-10', '111.222.333.444', '555666', 'Maria Souza', '(21) 99999-8888', 'maria@beta.com', 'Lucro Real', 'Lucro Real');

-- Projeto 2: Beta
INSERT INTO projetos (id, empresa_id, nome, objetivo, data_inicio_prevista, data_fim_prevista, fase, competencia_inicial, aprovado_em_reuniao)
VALUES
('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Auditoria Fiscal', 'Revisão dos últimos 5 anos', '2023-03-01', '2023-05-30', 'A FAZER', '03/2023', 'Não');

-- Sócios 2: Beta
INSERT INTO socios (empresa_id, nome, whatsapp, email)
VALUES
('22222222-2222-2222-2222-222222222222', 'Roberto Beta', '(21) 96666-6666', 'roberto@beta.com');

-- Tarefas 2: Beta
INSERT INTO tarefas (projeto_id, titulo, concluida)
VALUES
('p2222222-2222-2222-2222-222222222222', 'Coleta de dados', FALSE);
