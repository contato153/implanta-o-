-- Criação da tabela de histórico
CREATE TABLE IF NOT EXISTS public.historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entidade TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    acao TEXT NOT NULL,
    descricao TEXT,
    detalhes JSONB,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    usuario_nome TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar coluna detalhes se a tabela já existir
ALTER TABLE public.historico ADD COLUMN IF NOT EXISTS detalhes JSONB;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (RLS)

-- 1. Qualquer usuário autenticado pode inserir no histórico
CREATE POLICY "Usuários autenticados podem inserir histórico"
    ON public.historico
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

-- 2. Apenas administradores e gerentes podem visualizar o histórico
CREATE POLICY "Admins e gerentes podem visualizar histórico"
    ON public.historico
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- 3. Ninguém pode atualizar ou deletar o histórico (Imutabilidade)
CREATE POLICY "Ninguém pode atualizar histórico"
    ON public.historico
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "Ninguém pode deletar histórico"
    ON public.historico
    FOR DELETE
    TO authenticated
    USING (false);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_historico_entidade ON public.historico(entidade);
CREATE INDEX IF NOT EXISTS idx_historico_usuario_id ON public.historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico(data DESC);
CREATE INDEX IF NOT EXISTS idx_historico_entidade_id ON public.historico(entidade_id);
