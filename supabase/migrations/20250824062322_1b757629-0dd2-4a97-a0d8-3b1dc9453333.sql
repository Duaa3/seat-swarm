-- Fix the security definer function by setting the search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, user_id, full_name, department, team)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'team'
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role')::text = 'admin' THEN 'admin'::app_role
      WHEN (NEW.raw_user_meta_data->>'role')::text = 'manager' THEN 'manager'::app_role
      ELSE 'employee'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;