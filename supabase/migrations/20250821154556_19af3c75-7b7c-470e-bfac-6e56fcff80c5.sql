-- Fix the assignment_type constraint to allow 'manual' and 'auto' values
ALTER TABLE schedule_assignments DROP CONSTRAINT IF EXISTS schedule_assignments_assignment_type_check;

-- Add the correct constraint for assignment_type
ALTER TABLE schedule_assignments ADD CONSTRAINT schedule_assignments_assignment_type_check 
CHECK (assignment_type IN ('manual', 'auto', 'scheduled', 'assigned'));