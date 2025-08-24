-- First, let's clean up duplicate employee records for janna
DELETE FROM employees WHERE id = 'E537TJ' AND full_name = 'janna';

-- Drop ALL existing policies on employee_constraints
DROP POLICY IF EXISTS "Authenticated users can insert employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Authenticated users can update employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Admins can delete employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Managers can insert any employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Managers can update any employee_constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Viewers can select employee_constraints" ON employee_constraints;

-- Create completely open policies for employee_constraints (temporary fix)
CREATE POLICY "Allow all on employee_constraints" ON employee_constraints
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);