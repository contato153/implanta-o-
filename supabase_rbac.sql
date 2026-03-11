-- Garante que a role tenha um valor padrão e não seja nula
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'viewer',
  ALTER COLUMN role SET NOT NULL;

-- Adiciona constraint para garantir apenas as roles permitidas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('admin', 'manager', 'viewer'));
  END IF;
END $$;
