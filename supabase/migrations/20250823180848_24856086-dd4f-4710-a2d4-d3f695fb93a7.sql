-- Enable RLS on all new tables that were created
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

-- Create triggers for updated_at
CREATE TRIGGER update_global_constraints_updated_at
  BEFORE UPDATE ON public.global_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_constraints_updated_at
  BEFORE UPDATE ON public.team_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_constraints_updated_at
  BEFORE UPDATE ON public.employee_constraints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fix search path for all existing functions
CREATE OR REPLACE FUNCTION public.week_schedule(week_start date)
 RETURNS TABLE(day_name text, employee_id text, seat_id text, floor integer, zone text, score numeric, reasons jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    sd.day_name,
    a.employee_id,
    a.seat_id,
    st.floor,
    st.zone,
    a.score,
    a.reasons
  FROM schedules s
  JOIN schedule_days sd ON s.id = sd.schedule_id
  JOIN assignments a ON sd.id = a.schedule_day_id
  JOIN seats st ON a.seat_id = st.id
  WHERE s.week_start = $1
  ORDER BY sd.day_name, a.employee_id;
$function$;

CREATE OR REPLACE FUNCTION public.zone_summary(p_schedule_id uuid, p_day_name text)
 RETURNS TABLE(zone text, total_seats bigint, occupied bigint, window_count bigint, accessible_count bigint, available bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    st.zone,
    COUNT(st.id) as total_seats,
    COUNT(a.id) as occupied,
    COUNT(CASE WHEN st.is_window THEN 1 END) as window_count,
    COUNT(CASE WHEN st.is_accessible THEN 1 END) as accessible_count,
    COUNT(st.id) - COUNT(a.id) as available
  FROM seats st
  CROSS JOIN (SELECT id FROM schedules WHERE id = p_schedule_id) s
  CROSS JOIN (SELECT id FROM schedule_days WHERE schedule_id = p_schedule_id AND day_name = p_day_name) sd
  LEFT JOIN assignments a ON sd.id = a.schedule_day_id AND st.id = a.seat_id
  GROUP BY st.zone;
$function$;

CREATE OR REPLACE FUNCTION public.floor_occupancy(p_schedule_id uuid, p_day_name text)
 RETURNS TABLE(floor integer, occupied bigint, total bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    st.floor,
    COUNT(a.id) as occupied,
    COUNT(st.id) as total
  FROM seats st
  CROSS JOIN (SELECT id FROM schedule_days WHERE schedule_id = p_schedule_id AND day_name = p_day_name) sd
  LEFT JOIN assignments a ON sd.id = a.schedule_day_id AND st.id = a.seat_id
  GROUP BY st.floor;
$function$;