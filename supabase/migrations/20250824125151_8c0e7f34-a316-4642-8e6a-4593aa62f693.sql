-- Create analytics_cache table to store computed analytics in the backend
CREATE TABLE public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeframe TEXT NOT NULL,
  analytics_data JSONB NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(timeframe)
);

-- Enable RLS on analytics_cache
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_cache
CREATE POLICY "Public can view analytics_cache" 
ON analytics_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can manage analytics_cache" 
ON analytics_cache 
FOR ALL 
USING (get_user_role() = ANY (ARRAY['manager'::text, 'admin'::text]));