-- First, let's create profiles for existing users based on their user_metadata
-- We'll create a function to sync user data from auth.users to our tables

-- Insert profiles for existing users from their user_metadata
INSERT INTO public.profiles (id, user_id, full_name, department, team, role)
SELECT 
  id,
  id as user_id,
  (raw_user_meta_data->>'full_name')::text as full_name,
  (raw_user_meta_data->>'department')::text as department,
  (raw_user_meta_data->>'team')::text as team,
  COALESCE((raw_user_meta_data->>'role')::text, 'employee') as role
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
  INSERT INTO public.profiles (id, user_id, full_name, department, team, role)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'team', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
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