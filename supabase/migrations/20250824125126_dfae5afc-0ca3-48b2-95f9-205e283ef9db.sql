-- Fix all RLS policies that reference non-existent role column
-- Update schedules policies
DROP POLICY IF EXISTS "Viewers can select schedules" ON schedules;
CREATE POLICY "Viewers can select schedules" 
ON schedules 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['viewer'::text, 'manager'::text, 'admin'::text]));

-- Update employee_attendance policies  
DROP POLICY IF EXISTS "Viewers can select employee_attendance" ON employee_attendance;
CREATE POLICY "Viewers can select employee_attendance" 
ON employee_attendance 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['viewer'::text, 'manager'::text, 'admin'::text]));

-- Update assignment_changes policies
DROP POLICY IF EXISTS "Viewers can select assignment_changes" ON assignment_changes;
CREATE POLICY "Viewers can select assignment_changes" 
ON assignment_changes 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['viewer'::text, 'manager'::text, 'admin'::text]));