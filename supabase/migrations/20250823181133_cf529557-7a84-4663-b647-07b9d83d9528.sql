-- First drop all policies that depend on the get_user_role function
DROP POLICY IF EXISTS "Viewers can select constraints" ON public.constraints;
DROP POLICY IF EXISTS "Managers can insert constraints" ON public.constraints;
DROP POLICY IF EXISTS "Managers can update constraints" ON public.constraints;
DROP POLICY IF EXISTS "Admins can delete constraints" ON public.constraints;

DROP POLICY IF EXISTS "Viewers can select schedules" ON public.schedules;
DROP POLICY IF EXISTS "Managers can insert schedules" ON public.schedules;
DROP POLICY IF EXISTS "Managers can update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admins can delete schedules" ON public.schedules;

DROP POLICY IF EXISTS "Viewers can select schedule_days" ON public.schedule_days;
DROP POLICY IF EXISTS "Managers can insert schedule_days" ON public.schedule_days;
DROP POLICY IF EXISTS "Managers can update schedule_days" ON public.schedule_days;
DROP POLICY IF EXISTS "Admins can delete schedule_days" ON public.schedule_days;

DROP POLICY IF EXISTS "Viewers can select assignments" ON public.assignments;
DROP POLICY IF EXISTS "Managers can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Managers can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.assignments;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- Create single get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role, 'employee') 
  FROM public.profiles 
  WHERE id = auth.uid();
$function$;

-- Recreate the policies for existing tables
CREATE POLICY "Viewers can select constraints" ON public.constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can update constraints" ON public.constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can insert constraints" ON public.constraints
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete constraints" ON public.constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Viewers can select schedules" ON public.schedules
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert schedules" ON public.schedules
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update schedules" ON public.schedules
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete schedules" ON public.schedules
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Viewers can select schedule_days" ON public.schedule_days
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert schedule_days" ON public.schedule_days
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update schedule_days" ON public.schedule_days
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete schedule_days" ON public.schedule_days
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Viewers can select assignments" ON public.assignments
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert assignments" ON public.assignments
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update assignments" ON public.assignments
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete assignments" ON public.assignments
  FOR DELETE USING (public.get_user_role() = 'admin');