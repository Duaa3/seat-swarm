-- Fix the day_of_week constraint to accept the correct day format
-- First check current constraint
SELECT pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conname LIKE '%day_of_week%';

-- Drop the problematic constraint and recreate with correct values
ALTER TABLE public.schedule_assignments 
DROP CONSTRAINT IF EXISTS schedule_assignments_day_of_week_check;

-- Add constraint that accepts the day format we're using
ALTER TABLE public.schedule_assignments 
ADD CONSTRAINT schedule_assignments_day_of_week_check 
CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'));