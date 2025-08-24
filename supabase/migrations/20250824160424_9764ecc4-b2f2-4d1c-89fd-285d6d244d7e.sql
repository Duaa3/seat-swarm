-- Drop existing restrictive policies for employee_constraints
DROP POLICY IF EXISTS "Managers can insert employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Managers can update employee_constraints" ON employee_constraints;

-- Create new policies that allow employees to manage their own constraints
CREATE POLICY "Employees can insert their own constraints" ON employee_constraints
  FOR INSERT 
  WITH CHECK (employee_id = (auth.uid())::text);

CREATE POLICY "Employees can update their own constraints" ON employee_constraints
  FOR UPDATE 
  USING (employee_id = (auth.uid())::text);

-- Keep manager/admin policies for managing all constraints
CREATE POLICY "Managers can insert any employee_constraints" ON employee_constraints
  FOR INSERT 
  WITH CHECK (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Managers can update any employee_constraints" ON employee_constraints
  FOR UPDATE 
  USING (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));