-- Insert mock employees data directly
INSERT INTO public.employees (id, full_name, team, department, preferred_work_mode, needs_accessible, prefer_window, preferred_zone, onsite_ratio, project_count, preferred_days, priority_level, client_site_ratio, commute_minutes, availability_ratio) VALUES
('E001', 'Aisha Rahman', 'Network', 'Core', 'hybrid', false, true, 'ZoneA', 0.7, 3, ARRAY['Mon','Wed'], 3, 0.2, 25, 0.85),
('E002', 'Hilal Ahmed', 'CoreOps', 'GoToMarket', 'remote', false, false, 'ZoneB', 0.4, 2, ARRAY['Tue','Thu'], 1, 0.1, 45, 0.9),
('E003', 'Maya Chen', 'Design', 'Operations', 'onsite', true, true, 'ZoneC', 0.9, 4, ARRAY['Mon','Fri'], 4, 0.3, 15, 0.95),
('E004', 'David Kim', 'Network', 'Core', 'hybrid', false, true, 'ZoneA', 0.6, 1, ARRAY['Mon','Tue','Wed'], 2, 0.4, 35, 0.8),
('E005', 'Sofia Garcia', 'CoreOps', 'GoToMarket', 'hybrid', false, false, 'ZoneB', 0.8, 5, ARRAY['Wed','Thu'], 5, 0.15, 20, 0.88);

-- Insert more employees (sample of 20 more for testing)
INSERT INTO public.employees (id, full_name, team, department, preferred_work_mode, needs_accessible, prefer_window, preferred_zone, onsite_ratio, project_count, preferred_days, priority_level, client_site_ratio, commute_minutes, availability_ratio) 
SELECT 
  'E' || LPAD((ROW_NUMBER() OVER() + 5)::text, 3, '0'),
  (ARRAY['James Wilson', 'Elena Petrov', 'Ahmad Hassan', 'Lisa Thompson', 'Roberto Silva', 'Sarah Johnson', 'Michael Brown', 'Priya Patel', 'Carlos Martinez', 'Emma Davis', 'Hassan Ali', 'Fatima Khan', 'Alex Lee', 'Nina Miller', 'Omar Jones', 'Lucia Smith', 'Mark Lopez', 'Zara Clark', 'Sam Nguyen', 'Leila Taylor'])[ROW_NUMBER() OVER()],
  (ARRAY['Network', 'CoreOps', 'Design', 'Sales', 'Data', 'QA', 'Security', 'DevOps', 'Product', 'Support'])[(ROW_NUMBER() OVER() % 10) + 1],
  (ARRAY['Core', 'GoToMarket', 'Operations'])[(ROW_NUMBER() OVER() % 3) + 1],
  (ARRAY['hybrid', 'remote', 'onsite'])[(ROW_NUMBER() OVER() % 3) + 1],
  (ROW_NUMBER() OVER() % 5 = 0),
  (ROW_NUMBER() OVER() % 3 = 0),
  (ARRAY['ZoneA', 'ZoneB', 'ZoneC'])[(ROW_NUMBER() OVER() % 3) + 1],
  0.3 + (ROW_NUMBER() OVER() % 60) / 100.0,
  (ROW_NUMBER() OVER() % 6) + 1,
  CASE (ROW_NUMBER() OVER() % 5)
    WHEN 0 THEN ARRAY['Mon','Wed']
    WHEN 1 THEN ARRAY['Tue','Thu'] 
    WHEN 2 THEN ARRAY['Mon','Fri']
    WHEN 3 THEN ARRAY['Wed','Thu']
    ELSE ARRAY['Mon','Tue','Wed']
  END,
  (ROW_NUMBER() OVER() % 5) + 1,
  (ROW_NUMBER() OVER() % 50) / 100.0,
  10 + (ROW_NUMBER() OVER() % 50),
  0.8 + (ROW_NUMBER() OVER() % 20) / 100.0
FROM generate_series(1, 20);

-- Insert seats data
INSERT INTO public.seats (id, floor, zone, is_accessible, is_window, x, y) VALUES
('F1-S01', 1, 'ZoneA', true, true, 1, 1),
('F1-S02', 1, 'ZoneA', true, false, 2, 1),
('F1-S03', 1, 'ZoneB', true, false, 3, 1),
('F1-S04', 1, 'ZoneB', false, false, 4, 1),
('F1-S05', 1, 'ZoneC', false, false, 5, 1),
('F1-S06', 1, 'ZoneC', false, false, 6, 1),
('F1-S07', 1, 'ZoneA', false, false, 7, 1),
('F1-S08', 1, 'ZoneA', false, true, 8, 1),
('F2-S01', 2, 'ZoneA', true, true, 1, 1),
('F2-S02', 2, 'ZoneB', true, false, 2, 1),
('F2-S03', 2, 'ZoneC', false, false, 3, 1),
('F2-S04', 2, 'ZoneA', false, true, 4, 1);

-- Generate more seats for Floor 1 (total 48)
INSERT INTO public.seats (id, floor, zone, is_accessible, is_window, x, y)
SELECT 
  'F1-S' || LPAD((ROW_NUMBER() OVER() + 8)::text, 2, '0'),
  1,
  (ARRAY['ZoneA', 'ZoneB', 'ZoneC'])[(ROW_NUMBER() OVER() % 3) + 1],
  (ROW_NUMBER() OVER() <= 4), -- First 4 additional seats are accessible
  ((ROW_NUMBER() OVER() + 8) % 8 IN (1, 0)) OR ((ROW_NUMBER() OVER() + 8) > 32), -- Edge seats are windows
  ((ROW_NUMBER() OVER() + 8 - 1) % 8) + 1,
  ((ROW_NUMBER() OVER() + 8 - 1) / 8) + 1
FROM generate_series(1, 40);

-- Generate seats for Floor 2 (total 50) 
INSERT INTO public.seats (id, floor, zone, is_accessible, is_window, x, y)
SELECT 
  'F2-S' || LPAD((ROW_NUMBER() OVER() + 4)::text, 2, '0'),
  2,
  (ARRAY['ZoneA', 'ZoneB', 'ZoneC'])[(ROW_NUMBER() OVER() % 3) + 1],
  (ROW_NUMBER() OVER() <= 6), -- First 6 additional seats are accessible
  ((ROW_NUMBER() OVER() + 4) % 10 IN (1, 0)) OR ((ROW_NUMBER() OVER() + 4) > 40), -- Edge seats are windows
  ((ROW_NUMBER() OVER() + 4 - 1) % 10) + 1,
  ((ROW_NUMBER() OVER() + 4 - 1) / 10) + 1
FROM generate_series(1, 46);

-- Insert global constraints
INSERT INTO public.global_constraints (floor_1_capacity, floor_2_capacity, allow_team_splitting, max_consecutive_office_days, min_client_site_ratio, max_client_site_ratio) 
VALUES (48, 50, false, 3, 0.40, 0.60);

-- Insert employee constraints
INSERT INTO public.employee_constraints (employee_id, preferred_days, avoid_days, max_weekly_office_days, preferred_zone, preferred_floor, needs_accessible_seat)
SELECT 
  e.id,
  e.preferred_days,
  ARRAY[]::text[],
  CASE 
    WHEN e.preferred_work_mode = 'remote' THEN 2
    WHEN e.preferred_work_mode = 'onsite' THEN 5
    ELSE 3
  END,
  e.preferred_zone,
  CASE WHEN random() < 0.5 THEN (random() * 2)::int + 1 ELSE NULL END,
  e.needs_accessible
FROM public.employees e;