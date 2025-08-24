-- Create satisfaction feedback table
CREATE TABLE public.satisfaction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  assignment_date DATE NOT NULL,
  seat_id TEXT NOT NULL,
  satisfaction_score INTEGER NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  amenities_rating INTEGER CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.satisfaction_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for satisfaction feedback
CREATE POLICY "Employees can view their own feedback" 
ON public.satisfaction_feedback 
FOR SELECT 
USING (employee_id = auth.uid()::text);

CREATE POLICY "Employees can create their own feedback" 
ON public.satisfaction_feedback 
FOR INSERT 
WITH CHECK (employee_id = auth.uid()::text);

CREATE POLICY "Employees can update their own feedback" 
ON public.satisfaction_feedback 
FOR UPDATE 
USING (employee_id = auth.uid()::text);

CREATE POLICY "Managers can view all feedback" 
ON public.satisfaction_feedback 
FOR SELECT 
USING (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Add trigger for timestamp updates
CREATE TRIGGER update_satisfaction_feedback_updated_at
BEFORE UPDATE ON public.satisfaction_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_satisfaction_feedback_employee_date ON public.satisfaction_feedback(employee_id, assignment_date);
CREATE INDEX idx_satisfaction_feedback_seat_date ON public.satisfaction_feedback(seat_id, assignment_date);