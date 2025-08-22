-- Final corrected migration to match comprehensive Smart Office Seating Planner specification
-- This creates the complete schema as specified

-- 1. Create profiles table for role-based access
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create constraints table for global configuration
CREATE TABLE public.constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_day_cap_pct NUMERIC NOT NULL DEFAULT 0.6,
  together_teams TEXT[][], -- array of string arrays (teams grouped)
  team_together_mode TEXT NOT NULL DEFAULT 'soft' CHECK (team_together_mode IN ('soft', 'hard')),
  weights JSONB DEFAULT '{}', -- e.g., { "w_seat_satisfaction": 0.4, "w_onsite_ratio": 0.3, ... }
  solver TEXT NOT NULL DEFAULT 'hungarian',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create schedules table for week-based scheduling
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create schedule_days table for daily capacity management
CREATE TABLE public.schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL CHECK (day_name IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')),
  capacity INTEGER NOT NULL,
  violations TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, day_name)
);

-- 5. Update employees table to exactly match specification
-- First backup existing data, then recreate table structure
CREATE TABLE public.employees_new (
  id TEXT PRIMARY KEY, -- employee_id
  full_name TEXT,
  department TEXT,
  team TEXT,
  priority_level INTEGER,
  preferred_work_mode TEXT CHECK (preferred_work_mode IN ('onsite', 'hybrid', 'remote')),
  needs_accessible BOOLEAN DEFAULT false,
  prefer_window BOOLEAN DEFAULT false,
  preferred_zone TEXT,
  preferred_days TEXT[], -- e.g., ["Mon","Wed"]
  client_site_ratio NUMERIC, -- 0..1
  commute_minutes INTEGER,
  availability_ratio NUMERIC, -- 0..1
  onsite_ratio NUMERIC, -- 0..1
  project_count INTEGER,
  extra JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing employee data to new structure
INSERT INTO public.employees_new (
  id, full_name, department, team, preferred_work_mode, needs_accessible, 
  prefer_window, preferred_zone, preferred_days, onsite_ratio, project_count, created_at
)
SELECT 
  employee_id,
  full_name,
  department,
  team,
  CASE 
    WHEN preferred_work_mode = 'hybrid' THEN 'hybrid'
    WHEN preferred_work_mode = 'remote' THEN 'remote'
    ELSE 'onsite'
  END,
  needs_accessible,
  prefer_window,
  preferred_zone,
  preferred_days,
  onsite_ratio,
  project_count,
  created_at
FROM public.employees;

-- Replace old employees table
DROP TABLE public.employees CASCADE;
ALTER TABLE public.employees_new RENAME TO employees;

-- 6. Update seats table to exactly match specification  
CREATE TABLE public.seats_new (
  id TEXT PRIMARY KEY, -- seat_id
  floor INTEGER NOT NULL,
  zone TEXT NOT NULL, -- "ZoneA" | "ZoneB" | "ZoneC"
  is_accessible BOOLEAN DEFAULT false,
  is_window BOOLEAN DEFAULT false,
  x INTEGER NOT NULL, -- grid col
  y INTEGER NOT NULL, -- grid row
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing seat data to new structure
INSERT INTO public.seats_new (
  id, floor, zone, is_accessible, is_window, x, y, created_at
)
SELECT 
  seat_id,
  floor,
  zone,
  is_accessible,
  is_window,
  x_coordinate,
  y_coordinate,
  created_at
FROM public.seats;

-- Replace old seats table
DROP TABLE public.seats CASCADE;
ALTER TABLE public.seats_new RENAME TO seats;

-- 7. Create assignments table to reference schedule_days
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_day_id UUID REFERENCES schedule_days(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id),
  seat_id TEXT REFERENCES seats(id),
  score NUMERIC,
  reasons JSONB, -- used for tooltips
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_day_id, employee_id)
);

-- 8. Create helpful views for the frontend
CREATE OR REPLACE VIEW v_floor_occupancy AS
SELECT 
  s.id as schedule_id,
  sd.day_name,
  st.floor,
  COUNT(a.id) as occupied,
  (SELECT COUNT(*) FROM seats WHERE floor = st.floor) as total
FROM schedules s
JOIN schedule_days sd ON s.id = sd.schedule_id
LEFT JOIN assignments a ON sd.id = a.schedule_day_id
LEFT JOIN seats st ON a.seat_id = st.id
GROUP BY s.id, sd.day_name, st.floor;

CREATE OR REPLACE VIEW v_zone_stats AS
SELECT 
  s.id as schedule_id,
  sd.day_name,
  st.zone,
  COUNT(st.id) as total_seats,
  COUNT(a.id) as occupied,
  COUNT(CASE WHEN st.is_window THEN 1 END) as window_count,
  COUNT(CASE WHEN st.is_accessible THEN 1 END) as accessible_count,
  COUNT(st.id) - COUNT(a.id) as available
FROM schedules s
JOIN schedule_days sd ON s.id = sd.schedule_id
LEFT JOIN seats st ON true -- Get all seats for zone stats
LEFT JOIN assignments a ON sd.id = a.schedule_day_id AND st.id = a.seat_id
GROUP BY s.id, sd.day_name, st.zone;

-- 9. Create RPC helpers for the frontend (in public schema)
CREATE OR REPLACE FUNCTION public.week_schedule(week_start DATE)
RETURNS TABLE (
  day_name TEXT,
  employee_id TEXT,
  seat_id TEXT,
  floor INTEGER,
  zone TEXT,
  score NUMERIC,
  reasons JSONB
) 
LANGUAGE sql STABLE AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.zone_summary(schedule_id UUID, day_name TEXT)
RETURNS TABLE (
  zone TEXT,
  total_seats INTEGER,
  occupied INTEGER,
  window_count INTEGER,
  accessible_count INTEGER,
  available INTEGER
)
LANGUAGE sql STABLE AS $$
  SELECT * FROM v_zone_stats 
  WHERE v_zone_stats.schedule_id = $1 AND v_zone_stats.day_name = $2;
$$;

CREATE OR REPLACE FUNCTION public.floor_occupancy(schedule_id UUID, day_name TEXT)
RETURNS TABLE (
  floor INTEGER,
  occupied BIGINT,
  total BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT * FROM v_floor_occupancy 
  WHERE v_floor_occupancy.schedule_id = $1 AND v_floor_occupancy.day_name = $2;
$$;

-- 10. Enable RLS on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 11. Create role-based RLS policies

-- Profiles: users can only see/update their own record
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper function for role checks
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Viewer policies (SELECT only)
CREATE POLICY "Viewers can select employees" ON public.employees
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

CREATE POLICY "Viewers can select seats" ON public.seats
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

CREATE POLICY "Viewers can select constraints" ON public.constraints
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

CREATE POLICY "Viewers can select schedules" ON public.schedules
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

CREATE POLICY "Viewers can select schedule_days" ON public.schedule_days
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

CREATE POLICY "Viewers can select assignments" ON public.assignments
  FOR SELECT USING (public.get_user_role() IN ('viewer', 'manager', 'admin'));

-- Manager policies (SELECT, INSERT, UPDATE)
CREATE POLICY "Managers can insert employees" ON public.employees
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update employees" ON public.employees
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert seats" ON public.seats
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update seats" ON public.seats
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert constraints" ON public.constraints
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update constraints" ON public.constraints
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert schedules" ON public.schedules
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update schedules" ON public.schedules
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert schedule_days" ON public.schedule_days
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update schedule_days" ON public.schedule_days
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert assignments" ON public.assignments
  FOR INSERT WITH CHECK (public.get_user_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update assignments" ON public.assignments
  FOR UPDATE USING (public.get_user_role() IN ('manager', 'admin'));

-- Admin policies (ALL operations)
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete seats" ON public.seats
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete constraints" ON public.constraints
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete schedules" ON public.schedules
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete schedule_days" ON public.schedule_days
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete assignments" ON public.assignments
  FOR DELETE USING (public.get_user_role() = 'admin');

-- 12. Create update triggers for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON public.constraints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_days_updated_at BEFORE UPDATE ON public.schedule_days
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON public.seats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Create indexes for performance
CREATE INDEX idx_schedules_week_start ON schedules(week_start);
CREATE INDEX idx_schedule_days_schedule_id ON schedule_days(schedule_id);
CREATE INDEX idx_assignments_schedule_day_id ON assignments(schedule_day_id);
CREATE INDEX idx_assignments_employee_id ON assignments(employee_id);
CREATE INDEX idx_assignments_seat_id ON assignments(seat_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_team ON employees(team);
CREATE INDEX idx_seats_floor_zone ON seats(floor, zone);

-- 14. Seed data
-- Insert default constraints
INSERT INTO public.constraints (dept_day_cap_pct, team_together_mode, weights, solver) 
VALUES (0.6, 'soft', '{}', 'hungarian');

-- Create a schedule for next Monday
WITH next_monday AS (
  SELECT CASE 
    WHEN EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN CURRENT_DATE  -- If today is Monday
    ELSE CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE) * INTERVAL '1 day' + INTERVAL '1 day'
  END as monday
)
INSERT INTO public.schedules (week_start, status)
SELECT monday, 'draft' FROM next_monday;

-- Create schedule_days for the week
WITH next_monday AS (
  SELECT CASE 
    WHEN EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN CURRENT_DATE
    ELSE CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE) * INTERVAL '1 day' + INTERVAL '1 day'
  END as monday
),
schedule_id_cte AS (
  SELECT id FROM schedules WHERE week_start = (SELECT monday FROM next_monday)
),
seat_count AS (
  SELECT COUNT(*) as total FROM seats
)
INSERT INTO public.schedule_days (schedule_id, day_name, capacity)
SELECT 
  s.id,
  day_name,
  sc.total
FROM schedule_id_cte s
CROSS JOIN (VALUES ('Mon'), ('Tue'), ('Wed'), ('Thu'), ('Fri')) AS days(day_name)
CROSS JOIN seat_count sc;