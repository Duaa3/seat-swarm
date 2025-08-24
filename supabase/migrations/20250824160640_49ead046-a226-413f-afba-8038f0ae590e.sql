-- Fix the RLS policies to properly match employee business IDs with user UUIDs
-- We need to join with the employees table to match the business ID with the auth user

-- Drop the incorrect employee policies
DROP POLICY IF EXISTS "Employees can insert their own constraints" ON employee_constraints;
DROP POLICY IF EXISTS "Employees can update their own constraints" ON employee_constraints;

-- Create new policies that properly link employee business ID to auth user
CREATE POLICY "Employees can insert their own constraints" ON employee_constraints
  FOR INSERT 
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE id = (
        SELECT id FROM employees 
        WHERE full_name = (
          SELECT full_name FROM profiles WHERE user_id = auth.uid()
        ) LIMIT 1
      )
    )
  );

CREATE POLICY "Employees can update their own constraints" ON employee_constraints
  FOR UPDATE 
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = (
        SELECT id FROM employees 
        WHERE full_name = (
          SELECT full_name FROM profiles WHERE user_id = auth.uid()
        ) LIMIT 1
      )
    )
  );