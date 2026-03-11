CREATE OR REPLACE FUNCTION public.reset_test_environment()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  -- Check if the user is an admin
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Case-insensitive check for 'ADMIN'
  IF UPPER(v_role) IS DISTINCT FROM 'ADMIN' THEN
    RAISE EXCEPTION 'Not allowed: User is not an ADMIN';
  END IF;

  -- Truncate tables and restart identity
  TRUNCATE TABLE 
    public.tarefas, 
    public.participantes, 
    public.socios, 
    public.projetos, 
    public.empresas 
  RESTART IDENTITY CASCADE;
END;
$$;
