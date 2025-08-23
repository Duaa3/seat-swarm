-- Drop the duplicate function first
DROP FUNCTION IF EXISTS public.get_user_role();

-- Recreate the function with proper signature
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role, 'employee') 
  FROM public.profiles 
  WHERE id = auth.uid();
$function$;

-- Create global constraints table
CREATE TABLE public.global_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_client_site_ratio DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  max_client_site_ratio DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  max_consecutive_office_days INTEGER NOT NULL DEFAULT 3,
  allow_team_splitting BOOLEAN NOT NULL DEFAULT false,
  floor_1_capacity INTEGER NOT NULL DEFAULT 48,
  floor_2_capacity INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team constraints table
CREATE TABLE public.team_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  prefer_same_floor BOOLEAN NOT NULL DEFAULT true,
  prefer_adjacent_seats BOOLEAN NOT NULL DEFAULT true,
  preferred_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  min_copresence_ratio DECIMAL(3,2) DEFAULT 0.80,
  max_members_per_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_name)
);

-- Create employee constraints table
CREATE TABLE public.employee_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  preferred_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  avoid_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_weekly_office_days INTEGER DEFAULT 5,
  needs_accessible_seat BOOLEAN DEFAULT false,
  preferred_floor INTEGER,
  preferred_zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id)
);

-- Create seat locks table for fixed desk assignments
CREATE TABLE public.seat_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('permanent', 'temporary')),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE CASCADE
);

-- Create assignment changes audit table
CREATE TABLE public.assignment_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL,
  day_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  old_seat_id TEXT,
  new_seat_id TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('manual_override', 'auto_generated', 'bulk_update')),
  changed_by TEXT,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update schedules table to support draft/publish workflow
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS published_by TEXT;

-- Create employee attendance tracking
CREATE TABLE public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('office', 'client_site', 'remote', 'off')),
  seat_id TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Insert default global constraints
INSERT INTO public.global_constraints (
  min_client_site_ratio,
  max_client_site_ratio,
  max_consecutive_office_days,
  allow_team_splitting,
  floor_1_capacity,
  floor_2_capacity
) VALUES (0.50, 0.60, 3, false, 48, 50);