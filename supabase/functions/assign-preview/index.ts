// Updated assign-preview function to match comprehensive specification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  full_name: string | null;
  department: string | null;
  team: string | null;
  priority_level: number | null;
  preferred_work_mode: "onsite" | "hybrid" | "remote" | null;
  needs_accessible: boolean;
  prefer_window: boolean;
  preferred_zone: string | null;
  preferred_days: string[] | null;
  client_site_ratio: number | null;
  commute_minutes: number | null;
  availability_ratio: number | null;
  onsite_ratio: number | null;
  project_count: number | null;
  extra: Record<string, unknown> | null;
}

interface Seat {
  id: string;
  floor: number;
  zone: string;
  is_accessible: boolean;
  is_window: boolean;
  x: number;
  y: number;
}

interface AssignmentResult {
  employee_id: string;
  seat_id: string;
  score?: number;
  reasons?: Record<string, number>;
}

interface AssignPreviewRequest {
  employees?: Employee[];
  seats?: Seat[];
  capacity?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing assignment preview request...');

    // Parse request body
    const requestBody: AssignPreviewRequest = await req.json();
    let { employees, seats, capacity } = requestBody;

    // If data not provided, load from database
    if (!employees) {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) {
        throw new Error(`Failed to fetch employees: ${error.message}`);
      }
      employees = data || [];
    }

    if (!seats) {
      const { data, error } = await supabase.from('seats').select('*');
      if (error) {
        throw new Error(`Failed to fetch seats: ${error.message}`);
      }
      seats = data || [];
    }

    if (!capacity) {
      capacity = Math.min(employees.length, seats.length);
    }

    console.log(`Preview assignment for ${employees.length} employees, ${seats.length} seats, capacity: ${capacity}`);

    // Call external optimizer for assignment preview
    const optimizerUrl = Deno.env.get('OPTIMIZER_URL');
    let assignments: AssignmentResult[] = [];

    if (optimizerUrl) {
      console.log('Calling external optimizer for preview...');
      
      const optimizeRequest = {
        employees,
        seats,
        capacity,
        preview: true
      };

      const optimizeRes = await fetch(`${optimizerUrl}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizeRequest)
      });

      if (!optimizeRes.ok) {
        throw new Error(`Optimizer request failed: ${optimizeRes.status}`);
      }

      const optimizeResponse = await optimizeRes.json();
      assignments = optimizeResponse.assignments || [];
    } else {
      // Fallback: simple assignment logic
      console.log('Using fallback assignment logic for preview...');
      
      const selectedEmployees = employees.slice(0, capacity);
      assignments = selectedEmployees.map((emp, index) => ({
        employee_id: emp.id,
        seat_id: seats[index % seats.length]?.id || seats[0]?.id,
        score: 0.5,
        reasons: { 
          basic_assignment: 1.0,
          zone_match: emp.preferred_zone && seats[index % seats.length]?.zone === emp.preferred_zone ? 0.3 : 0,
          accessibility: emp.needs_accessible && seats[index % seats.length]?.is_accessible ? 0.2 : 0,
          window_preference: emp.prefer_window && seats[index % seats.length]?.is_window ? 0.1 : 0
        }
      }));
    }

    console.log(`Generated ${assignments.length} preview assignments`);

    return new Response(JSON.stringify({ assignments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating assignment preview:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate assignment preview', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});