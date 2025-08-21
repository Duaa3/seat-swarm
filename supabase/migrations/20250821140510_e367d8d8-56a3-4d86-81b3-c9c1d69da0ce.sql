-- Create employees table with comprehensive attributes for AI training
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  department TEXT NOT NULL,
  team TEXT NOT NULL,
  role TEXT,
  manager_id TEXT,
  
  -- Work preferences (for rule-based and AI training)
  preferred_work_mode TEXT CHECK (preferred_work_mode IN ('hybrid', 'remote', 'office')) DEFAULT 'hybrid',
  onsite_ratio DECIMAL(3,2) DEFAULT 0.5 CHECK (onsite_ratio >= 0 AND onsite_ratio <= 1),
  preferred_days TEXT[] DEFAULT '{}',
  preferred_zone TEXT,
  prefer_window BOOLEAN DEFAULT FALSE,
  needs_accessible BOOLEAN DEFAULT FALSE,
  
  -- AI training features
  project_count INTEGER DEFAULT 1,
  collaboration_score DECIMAL(3,2) DEFAULT 0.5,
  focus_preference TEXT CHECK (focus_preference IN ('quiet', 'collaborative', 'mixed')) DEFAULT 'mixed',
  arrival_time TIME DEFAULT '09:00:00',
  departure_time TIME DEFAULT '17:00:00',
  flexibility_score DECIMAL(3,2) DEFAULT 0.5,
  
  -- Metadata
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seats table with detailed attributes
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  zone TEXT NOT NULL,
  x_coordinate INTEGER NOT NULL,
  y_coordinate INTEGER NOT NULL,
  
  -- Physical attributes (for rules and AI)
  is_accessible BOOLEAN DEFAULT FALSE,
  is_window BOOLEAN DEFAULT FALSE,
  is_corner BOOLEAN DEFAULT FALSE,
  has_monitor BOOLEAN DEFAULT TRUE,
  monitor_count INTEGER DEFAULT 1,
  desk_type TEXT CHECK (desk_type IN ('standard', 'standing', 'adjustable')) DEFAULT 'standard',
  
  -- Environmental factors (for AI training)
  noise_level TEXT CHECK (noise_level IN ('quiet', 'moderate', 'noisy')) DEFAULT 'moderate',
  natural_light_level TEXT CHECK (natural_light_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  proximity_to_facilities INTEGER DEFAULT 5, -- Distance to kitchen, bathroom, etc (1-10 scale)
  
  -- Capacity and status
  is_available BOOLEAN DEFAULT TRUE,
  maintenance_status TEXT CHECK (maintenance_status IN ('good', 'needs_repair', 'out_of_service')) DEFAULT 'good',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schedule assignments table (historical data for AI training)
CREATE TABLE public.schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES public.employees(employee_id),
  seat_id TEXT NOT NULL REFERENCES public.seats(seat_id),
  assignment_date DATE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  
  -- Assignment context (for AI learning)
  assignment_type TEXT CHECK (assignment_type IN ('ai_generated', 'rule_based', 'manual', 'employee_request')) NOT NULL,
  model_version TEXT, -- Track which AI model version made this assignment
  confidence_score DECIMAL(3,2), -- AI confidence in this assignment
  
  -- Performance tracking
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  productivity_score DECIMAL(3,2),
  collaboration_events INTEGER DEFAULT 0,
  
  -- Constraints and rules applied
  constraints_met JSONB DEFAULT '{}', -- Store which constraints were satisfied
  rules_applied TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(employee_id, assignment_date)
);

-- Create optimization rules table
CREATE TABLE public.optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('hard', 'soft', 'preference')) NOT NULL,
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  
  -- Rule configuration
  rule_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Performance tracking
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  avg_satisfaction_impact DECIMAL(3,2) DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI model training data table
CREATE TABLE public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input features (what the AI sees)
  employee_features JSONB NOT NULL, -- Employee preferences, history, etc.
  seat_features JSONB NOT NULL, -- Seat attributes, availability, etc.
  context_features JSONB NOT NULL, -- Day of week, capacity, team assignments, etc.
  
  -- Target output (what we want AI to learn)
  target_assignment JSONB NOT NULL, -- Optimal seat assignment
  
  -- Quality metrics
  assignment_success BOOLEAN,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  constraint_violations INTEGER DEFAULT 0,
  
  -- Metadata for model versioning
  data_source TEXT CHECK (data_source IN ('historical', 'simulation', 'expert_labeled')) NOT NULL,
  model_version TEXT,
  training_batch TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create model performance tracking table
CREATE TABLE public.model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT CHECK (model_type IN ('ai', 'rule_based', 'hybrid')) NOT NULL,
  model_version TEXT NOT NULL,
  
  -- Performance metrics
  assignment_date DATE NOT NULL,
  total_assignments INTEGER NOT NULL,
  successful_assignments INTEGER DEFAULT 0,
  avg_satisfaction DECIMAL(3,2),
  avg_constraint_adherence DECIMAL(3,2),
  processing_time_ms INTEGER,
  
  -- Detailed metrics
  metrics JSONB DEFAULT '{}', -- Store detailed performance data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(model_type, model_version, assignment_date)
);

-- Create team collaboration tracking
CREATE TABLE public.team_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  team_name TEXT NOT NULL,
  
  -- Collaboration metrics
  members_present INTEGER NOT NULL,
  avg_proximity DECIMAL(5,2), -- Average distance between team members
  collaboration_score DECIMAL(3,2),
  
  -- Seating arrangement
  seating_arrangement JSONB NOT NULL, -- Map of employee -> seat assignments
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (we'll add policies later when auth is implemented)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_collaborations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX idx_employees_department_team ON public.employees(department, team);
CREATE INDEX idx_employees_work_mode ON public.employees(preferred_work_mode);

CREATE INDEX idx_seats_seat_id ON public.seats(seat_id);
CREATE INDEX idx_seats_floor_zone ON public.seats(floor, zone);
CREATE INDEX idx_seats_availability ON public.seats(is_available);

CREATE INDEX idx_assignments_date ON public.schedule_assignments(assignment_date);
CREATE INDEX idx_assignments_employee ON public.schedule_assignments(employee_id);
CREATE INDEX idx_assignments_seat ON public.schedule_assignments(seat_id);
CREATE INDEX idx_assignments_type ON public.schedule_assignments(assignment_type);

CREATE INDEX idx_training_data_created ON public.ai_training_data(created_at);
CREATE INDEX idx_model_performance_date ON public.model_performance(assignment_date);
CREATE INDEX idx_collaborations_date_team ON public.team_collaborations(date, team_name);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON public.seats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.schedule_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON public.optimization_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();