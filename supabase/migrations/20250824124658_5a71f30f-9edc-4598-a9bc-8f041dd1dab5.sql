-- Check current RLS status and policies for schedule_assignments
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'schedule_assignments';

-- Update RLS policies for schedule_assignments to allow viewing data
DROP POLICY IF EXISTS "Allow all operations on schedule_assignments" ON schedule_assignments;

CREATE POLICY "Public can view schedule_assignments" 
ON schedule_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can insert schedule_assignments" 
ON schedule_assignments 
FOR INSERT 
WITH CHECK (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers can update schedule_assignments" 
ON schedule_assignments 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Admins can delete schedule_assignments" 
ON schedule_assignments 
FOR DELETE 
USING (get_user_role() = 'admin'::text);