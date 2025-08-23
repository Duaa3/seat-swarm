-- Drop all versions of get_user_role function
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

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

-- Enable RLS on all new tables that were created (they may not have RLS enabled yet)
ALTER TABLE public.global_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for global constraints
DROP POLICY IF EXISTS "Viewers can select global_constraints" ON public.global_constraints;
CREATE POLICY "Viewers can select global_constraints" ON public.global_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can update global_constraints" ON public.global_constraints;
CREATE POLICY "Managers can update global_constraints" ON public.global_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

-- Create RLS policies for team constraints
DROP POLICY IF EXISTS "Viewers can select team_constraints" ON public.team_constraints;
CREATE POLICY "Viewers can select team_constraints" ON public.team_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can insert team_constraints" ON public.team_constraints;
CREATE POLICY "Managers can insert team_constraints" ON public.team_constraints
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Managers can update team_constraints" ON public.team_constraints;
CREATE POLICY "Managers can update team_constraints" ON public.team_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Admins can delete team_constraints" ON public.team_constraints;
CREATE POLICY "Admins can delete team_constraints" ON public.team_constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for employee constraints
DROP POLICY IF EXISTS "Viewers can select employee_constraints" ON public.employee_constraints;
CREATE POLICY "Viewers can select employee_constraints" ON public.employee_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can insert employee_constraints" ON public.employee_constraints;
CREATE POLICY "Managers can insert employee_constraints" ON public.employee_constraints
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Managers can update employee_constraints" ON public.employee_constraints;
CREATE POLICY "Managers can update employee_constraints" ON public.employee_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Admins can delete employee_constraints" ON public.employee_constraints;
CREATE POLICY "Admins can delete employee_constraints" ON public.employee_constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for seat locks
DROP POLICY IF EXISTS "Viewers can select seat_locks" ON public.seat_locks;
CREATE POLICY "Viewers can select seat_locks" ON public.seat_locks
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can insert seat_locks" ON public.seat_locks;
CREATE POLICY "Managers can insert seat_locks" ON public.seat_locks
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Managers can update seat_locks" ON public.seat_locks;
CREATE POLICY "Managers can update seat_locks" ON public.seat_locks
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Admins can delete seat_locks" ON public.seat_locks;
CREATE POLICY "Admins can delete seat_locks" ON public.seat_locks
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for assignment changes
DROP POLICY IF EXISTS "Viewers can select assignment_changes" ON public.assignment_changes;
CREATE POLICY "Viewers can select assignment_changes" ON public.assignment_changes
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can insert assignment_changes" ON public.assignment_changes;
CREATE POLICY "Managers can insert assignment_changes" ON public.assignment_changes
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

-- Create RLS policies for employee attendance
DROP POLICY IF EXISTS "Viewers can select employee_attendance" ON public.employee_attendance;
CREATE POLICY "Viewers can select employee_attendance" ON public.employee_attendance
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

DROP POLICY IF EXISTS "Managers can insert employee_attendance" ON public.employee_attendance;
CREATE POLICY "Managers can insert employee_attendance" ON public.employee_attendance
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS "Managers can update employee_attendance" ON public.employee_attendance;
CREATE POLICY "Managers can update employee_attendance" ON public.employee_attendance
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));