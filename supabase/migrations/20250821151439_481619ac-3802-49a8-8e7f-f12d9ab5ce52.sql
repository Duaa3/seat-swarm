-- Make seat_id nullable for initial schedule creation without seat assignments
ALTER TABLE public.schedule_assignments 
ALTER COLUMN seat_id DROP NOT NULL;

-- Update constraint to allow NULL seat_id for manual assignments that haven't been assigned seats yet
-- Remove the foreign key constraint temporarily
ALTER TABLE public.schedule_assignments 
DROP CONSTRAINT IF EXISTS schedule_assignments_seat_id_fkey;

-- Add back the foreign key constraint but allow NULL values
ALTER TABLE public.schedule_assignments 
ADD CONSTRAINT schedule_assignments_seat_id_fkey 
FOREIGN KEY (seat_id) REFERENCES public.seats(seat_id) 
ON DELETE SET NULL;