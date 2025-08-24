-- Fix the get_user_role function to use the correct user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role::text, 'employee') 
  FROM public.user_roles 
  WHERE user_id = auth.uid();
$function$;