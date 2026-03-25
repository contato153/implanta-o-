-- Função RPC para Excluir Usuário (Admin Only)
-- Esta função deve ser executada como SECURITY DEFINER para ter permissões de admin no auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verifica se o usuário que está chamando é admin na tabela profiles
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permissão negada: Apenas administradores podem excluir usuários.';
  END IF;
  
  -- Exclui o usuário da tabela auth.users
  -- Nota: Se houver uma FK em public.profiles para auth.users com ON DELETE CASCADE,
  -- o profile será excluído automaticamente. Caso contrário, precisamos excluir manualmente.
  DELETE FROM public.profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
