-- Allow public read access to employees and seats tables
-- This enables the app to work without authentication

-- Drop existing restrictive policies for employees
DROP POLICY IF EXISTS "Viewers can select employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

-- Drop existing restrictive policies for seats
DROP POLICY IF EXISTS "Viewers can select seats" ON public.seats;
DROP POLICY IF EXISTS "Managers can insert seats" ON public.seats;
DROP POLICY IF EXISTS "Managers can update seats" ON public.seats;
DROP POLICY IF EXISTS "Admins can delete seats" ON public.seats;

-- Create new public access policies for employees
CREATE POLICY "Public can view employees" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update employees" 
ON public.employees 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete employees" 
ON public.employees 
FOR DELETE 
USING (true);

-- Create new public access policies for seats
CREATE POLICY "Public can view seats" 
ON public.seats 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert seats" 
ON public.seats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update seats" 
ON public.seats 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete seats" 
ON public.seats 
FOR DELETE 
USING (true);