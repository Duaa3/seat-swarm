-- Create system_settings table for application configuration
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'Smart Office Corporation',
  timezone text NOT NULL DEFAULT 'America/New_York',
  working_days text[] NOT NULL DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  email_notifications boolean NOT NULL DEFAULT true,
  office_start_time text NOT NULL DEFAULT '9:00 AM',
  office_end_time text NOT NULL DEFAULT '5:00 PM',
  special_zones text,
  algorithm_type text NOT NULL DEFAULT 'greedy',
  auto_assign_seats boolean NOT NULL DEFAULT false,
  max_optimization_iterations integer NOT NULL DEFAULT 1000,
  constraint_violation_penalty numeric NOT NULL DEFAULT 10.0,
  schedule_conflict_alerts boolean NOT NULL DEFAULT true,
  team_clustering_alerts boolean NOT NULL DEFAULT true,
  weekly_summaries boolean NOT NULL DEFAULT false,
  optimization_suggestions boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system settings
CREATE POLICY "Managers can view system_settings" 
ON public.system_settings 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['viewer'::text, 'manager'::text, 'admin'::text]));

CREATE POLICY "Managers can update system_settings" 
ON public.system_settings 
FOR UPDATE 
USING (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));

CREATE POLICY "Admins can insert system_settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (get_user_role() = 'admin'::text);

-- Insert default settings row
INSERT INTO public.system_settings (id) VALUES (gen_random_uuid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();