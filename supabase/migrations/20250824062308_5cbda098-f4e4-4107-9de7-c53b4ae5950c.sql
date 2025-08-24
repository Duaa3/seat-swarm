-- First, let's update the profiles table to remove the role check constraint if it exists
-- and use only the user_roles table for role management

-- Drop the check constraint on profiles.role if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Also drop the role column from profiles since we're using user_roles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Now insert profiles for existing users from their user_metadata
INSERT INTO public.profiles (id, user_id, full_name, department, team)
SELECT 
  id,
  id as user_id,
  COALESCE(NULLIF(TRIM((raw_user_meta_data->>'full_name')::text), ''), 'User') as full_name,
  (raw_user_meta_data->>'department')::text as department,
  (raw_user_meta_data->>'team')::text as team
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert user roles for existing users from their user_metadata
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id as user_id,
  CASE 
    WHEN (raw_user_meta_data->>'role')::text = 'admin' THEN 'admin'::app_role
    WHEN (raw_user_meta_data->>'role')::text = 'manager' THEN 'manager'::app_role
    ELSE 'employee'::app_role
  END as role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to automatically create profiles and roles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();