-- Atualização da tabela de tarefas para suportar os novos campos
-- Execute este script no SQL Editor do Supabase

-- Adiciona colunas novas se não existirem
ALTER TABLE tarefas 
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS prioridade TEXT CHECK (prioridade IN ('P1', 'P2', 'P3')),
ADD COLUMN IF NOT EXISTS proprietario TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('NÃO INICIADA', 'EM EXECUÇÃO', 'CONCLUÍDA')) DEFAULT 'NÃO INICIADA',
ADD COLUMN IF NOT EXISTS data_tarefa DATE,
ADD COLUMN IF NOT EXISTS data_termino DATE,
ADD COLUMN IF NOT EXISTS aplicacao TEXT,
ADD COLUMN IF NOT EXISTS produtos TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Remove colunas antigas se necessário (opcional, manteremos por segurança)
-- ALTER TABLE tarefas DROP COLUMN IF EXISTS titulo;
-- ALTER TABLE tarefas DROP COLUMN IF EXISTS concluida;

-- Migrar dados antigos (se houver)
UPDATE tarefas 
SET 
  descricao = titulo,
  status = CASE WHEN concluida THEN 'CONCLUÍDA' ELSE 'NÃO INICIADA' END,
  prioridade = 'P2' -- Default
WHERE descricao IS NULL;
