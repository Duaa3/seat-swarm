-- Clear existing employee data
DELETE FROM employees;

-- Insert 350 employees with Arabic-inspired names
INSERT INTO employees (id, full_name, team, department, preferred_work_mode, needs_accessible, prefer_window, preferred_zone, onsite_ratio, project_count, preferred_days, priority_level, client_site_ratio, commute_minutes, availability_ratio) VALUES
-- Generate 350 employees with Arabic names
('E001', 'Ahmad Hassan', 'Network', 'Core', 'hybrid', false, true, 'ZoneA', 0.67, 3, ARRAY['Mon','Wed'], 3, 0.15, 25, 0.85),
('E002', 'Fatma Al-Zahra', 'CoreOps', 'GoToMarket', 'remote', false, true, 'ZoneB', 0.45, 2, ARRAY['Tue','Thu'], 2, 0.23, 45, 0.92),
('E003', 'Hilal Rahman', 'Design', 'Operations', 'onsite', true, false, 'ZoneC', 0.89, 5, ARRAY['Mon','Fri'], 4, 0.08, 15, 0.88),
('E004', 'Omar Khalil', 'Sales', 'Core', 'hybrid', false, true, 'ZoneA', 0.56, 1, ARRAY['Mon','Tue','Wed'], 1, 0.31, 55, 0.95),
('E005', 'Aisha Noor', 'Data', 'GoToMarket', 'remote', false, false, 'ZoneB', 0.78, 4, ARRAY['Wed','Thu'], 5, 0.12, 20, 0.83),
('E006', 'Yusuf Malik', 'QA', 'Operations', 'hybrid', true, true, 'ZoneC', 0.64, 2, ARRAY['Fri'], 2, 0.27, 38, 0.91),
('E007', 'Layla Ahmed', 'Security', 'Core', 'onsite', false, true, 'ZoneA', 0.72, 6, ARRAY['Mon','Wed','Fri'], 3, 0.19, 42, 0.87),
('E008', 'Khalid Ibrahim', 'DevOps', 'GoToMarket', 'hybrid', false, false, 'ZoneB', 0.53, 3, ARRAY['Tue','Thu'], 4, 0.35, 28, 0.94),
('E009', 'Maryam Said', 'Product', 'Operations', 'remote', true, true, 'ZoneC', 0.81, 1, ARRAY['Mon','Tue','Wed','Thu'], 1, 0.06, 33, 0.89),
('E010', 'Hassan Ali', 'Support', 'Core', 'onsite', false, false, 'ZoneA', 0.69, 4, ARRAY['Wed','Thu','Fri'], 5, 0.22, 18, 0.86);

-- Continue with more employees using a procedural approach
DO $$
DECLARE
    first_names TEXT[] := ARRAY['Ahmad', 'Fatma', 'Hilal', 'Omar', 'Aisha', 'Yusuf', 'Layla', 'Khalid', 'Maryam', 'Hassan', 'Zahra', 'Ali', 'Nadia', 'Tariq', 'Amina', 'Samir', 'Leila', 'Karim', 'Yasmin', 'Fadi', 'Samira', 'Marwan', 'Dina', 'Jamal', 'Rania', 'Sami', 'Hala', 'Nasser', 'Lina', 'Adel', 'Salma', 'Bassam', 'Nour', 'Walid', 'Rana', 'Majid', 'Laith', 'Sahar', 'Zaid', 'Maya', 'Bilal', 'Sara', 'Fares', 'Dalia', 'Mazen', 'Hind', 'Salam', 'Nada', 'Rami', 'Zeina'];
    last_names TEXT[] := ARRAY['Hassan', 'Al-Zahra', 'Rahman', 'Khalil', 'Noor', 'Malik', 'Ahmed', 'Ibrahim', 'Said', 'Ali', 'Mustafa', 'Mahmoud', 'Farouk', 'Rashid', 'Youssef', 'Qasim', 'Habib', 'Nazir', 'Fouad', 'Saleh', 'Zidan', 'Khoury', 'Mansour', 'Fayyad', 'Haddad', 'Ghanem', 'Darwish', 'Hijazi', 'Sabbagh', 'Nassar', 'Shakir', 'Karam', 'Hakim', 'Badran', 'Safadi', 'Tahir', 'Masri', 'Jaber', 'Khatib', 'Amara'];
    teams TEXT[] := ARRAY['Network', 'CoreOps', 'Design', 'Sales', 'Data', 'QA', 'Security', 'DevOps', 'Product', 'Support'];
    departments TEXT[] := ARRAY['Core', 'GoToMarket', 'Operations'];
    work_modes TEXT[] := ARRAY['hybrid', 'remote', 'onsite'];
    zones TEXT[] := ARRAY['ZoneA', 'ZoneB', 'ZoneC'];
    
    i INTEGER;
    emp_id TEXT;
    full_name TEXT;
    team TEXT;
    dept TEXT;
    work_mode TEXT;
    zone TEXT;
    needs_acc BOOLEAN;
    prefer_win BOOLEAN;
    onsite_r NUMERIC;
    proj_count INTEGER;
    pref_days TEXT[];
    priority INTEGER;
    client_ratio NUMERIC;
    commute INTEGER;
    avail_ratio NUMERIC;
    day_combo_idx INTEGER;
BEGIN
    FOR i IN 11..350 LOOP
        emp_id := 'E' || LPAD(i::TEXT, 3, '0');
        full_name := first_names[((i-1) % array_length(first_names, 1)) + 1] || ' ' || 
                     last_names[((i-1) % array_length(last_names, 1)) + 1];
        team := teams[((i-1) % array_length(teams, 1)) + 1];
        dept := departments[((i-1) % array_length(departments, 1)) + 1];
        work_mode := work_modes[((i-1) % array_length(work_modes, 1)) + 1];
        zone := zones[((i-1) % array_length(zones, 1)) + 1];
        needs_acc := (random() < 0.15);
        prefer_win := (random() < 0.6);
        onsite_r := ROUND((0.3 + random() * 0.6)::NUMERIC, 2);
        proj_count := FLOOR(random() * 6) + 1;
        priority := FLOOR(random() * 5) + 1;
        client_ratio := ROUND((random() * 0.5)::NUMERIC, 2);
        commute := FLOOR(random() * 60) + 10;
        avail_ratio := ROUND((0.8 + random() * 0.2)::NUMERIC, 2);
        
        -- Assign preferred days based on pattern
        day_combo_idx := (i % 10) + 1;
        CASE day_combo_idx
            WHEN 1 THEN pref_days := ARRAY['Mon','Wed'];
            WHEN 2 THEN pref_days := ARRAY['Tue','Thu'];
            WHEN 3 THEN pref_days := ARRAY['Mon','Fri'];
            WHEN 4 THEN pref_days := ARRAY['Mon','Tue','Wed'];
            WHEN 5 THEN pref_days := ARRAY['Wed','Thu'];
            WHEN 6 THEN pref_days := ARRAY['Fri'];
            WHEN 7 THEN pref_days := ARRAY['Mon','Wed','Fri'];
            WHEN 8 THEN pref_days := ARRAY['Tue','Thu'];
            WHEN 9 THEN pref_days := ARRAY['Mon','Tue','Wed','Thu'];
            WHEN 10 THEN pref_days := ARRAY['Wed','Thu','Fri'];
            ELSE pref_days := ARRAY['Mon','Wed'];
        END CASE;
        
        INSERT INTO employees (
            id, full_name, team, department, preferred_work_mode, 
            needs_accessible, prefer_window, preferred_zone, onsite_ratio, 
            project_count, preferred_days, priority_level, client_site_ratio, 
            commute_minutes, availability_ratio
        ) VALUES (
            emp_id, full_name, team, dept, work_mode, 
            needs_acc, prefer_win, zone, onsite_r, 
            proj_count, pref_days, priority, client_ratio, 
            commute, avail_ratio
        );
    END LOOP;
END $$;