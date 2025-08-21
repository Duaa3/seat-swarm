-- Create basic RLS policies for public access (will be updated when auth is implemented)
-- For now, allowing all operations since no authentication is implemented yet

-- Employees table policies
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- Seats table policies  
CREATE POLICY "Allow all operations on seats" ON public.seats FOR ALL USING (true) WITH CHECK (true);

-- Schedule assignments table policies
CREATE POLICY "Allow all operations on schedule_assignments" ON public.schedule_assignments FOR ALL USING (true) WITH CHECK (true);

-- Optimization rules table policies
CREATE POLICY "Allow all operations on optimization_rules" ON public.optimization_rules FOR ALL USING (true) WITH CHECK (true);

-- AI training data table policies
CREATE POLICY "Allow all operations on ai_training_data" ON public.ai_training_data FOR ALL USING (true) WITH CHECK (true);

-- Model performance table policies
CREATE POLICY "Allow all operations on model_performance" ON public.model_performance FOR ALL USING (true) WITH CHECK (true);

-- Team collaborations table policies
CREATE POLICY "Allow all operations on team_collaborations" ON public.team_collaborations FOR ALL USING (true) WITH CHECK (true);

-- Fix function security by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;