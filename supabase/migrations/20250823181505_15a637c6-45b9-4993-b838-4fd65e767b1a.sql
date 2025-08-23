-- Enable RLS and create policies for the new tables
ALTER TABLE public.global_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for global constraints
CREATE POLICY "Viewers can select global_constraints" ON public.global_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can update global_constraints" ON public.global_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

-- Create RLS policies for team constraints
CREATE POLICY "Viewers can select team_constraints" ON public.team_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert team_constraints" ON public.team_constraints
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update team_constraints" ON public.team_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete team_constraints" ON public.team_constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for employee constraints
CREATE POLICY "Viewers can select employee_constraints" ON public.employee_constraints
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert employee_constraints" ON public.employee_constraints
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update employee_constraints" ON public.employee_constraints
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete employee_constraints" ON public.employee_constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for seat locks
CREATE POLICY "Viewers can select seat_locks" ON public.seat_locks
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert seat_locks" ON public.seat_locks
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update seat_locks" ON public.seat_locks
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Admins can delete seat_locks" ON public.seat_locks
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Create RLS policies for assignment changes
CREATE POLICY "Viewers can select assignment_changes" ON public.assignment_changes
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert assignment_changes" ON public.assignment_changes
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

-- Create RLS policies for employee attendance
CREATE POLICY "Viewers can select employee_attendance" ON public.employee_attendance
  FOR SELECT USING (public.get_user_role() = ANY (ARRAY['viewer', 'manager', 'admin']));

CREATE POLICY "Managers can insert employee_attendance" ON public.employee_attendance
  FOR INSERT WITH CHECK (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Managers can update employee_attendance" ON public.employee_attendance
  FOR UPDATE USING (public.get_user_role() = ANY (ARRAY['manager', 'admin']));

-- Create triggers for updated_at columns
CREATE TRIGGER update_global_constraints_updated_at
  BEFORE UPDATE ON public.global_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_constraints_updated_at
  BEFORE UPDATE ON public.team_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_constraints_updated_at
  BEFORE UPDATE ON public.employee_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();