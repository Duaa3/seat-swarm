import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  full_name: string;
  team: string;
  department: string;
  preferred_work_mode: 'hybrid' | 'remote' | 'office';
  needs_accessible: boolean;
  prefer_window: boolean;
  preferred_zone: string;
  onsite_ratio: number;
  project_count: number;
  preferred_days: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing employees request...');

    // Parse query parameters
    const url = new URL(req.url);
    const generate = url.searchParams.get('generate') === 'true';
    const count = parseInt(url.searchParams.get('count') || '350');

    if (generate) {
      console.log(`Generating ${count} employees...`);
      
      // Generate fresh employee data
      const generatedEmployees = generateEmployees(count);
      
      // Clear existing data and insert new
      await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: insertedEmployees, error: insertError } = await supabase
        .from('employees')
        .insert(generatedEmployees)
        .select();

      if (insertError) {
        console.error('Error inserting employees:', insertError);
        throw insertError;
      }

      console.log(`Successfully generated and stored ${insertedEmployees?.length || 0} employees`);
      
      return new Response(JSON.stringify({
        employees: insertedEmployees,
        count: insertedEmployees?.length || 0,
        generated: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Return existing employees from database
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log(`Retrieved ${employees?.length || 0} employees from database`);

      return new Response(JSON.stringify({
        employees: employees || [],
        count: employees?.length || 0,
        generated: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in get-employees function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      employees: [],
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateEmployees(count: number): Omit<Employee, 'id'>[] {
  const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA", "Marketing", "Support", "Finance"];
  const departments = ["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR", "Design"];
  const zones = ["ZoneA", "ZoneB", "ZoneC", "ZoneD"];
  const workModes: ('hybrid' | 'remote' | 'office')[] = ["hybrid", "remote", "office"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const employees: Omit<Employee, 'id'>[] = [];

  for (let i = 1; i <= count; i++) {
    const team = teams[Math.floor(Math.random() * teams.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const workMode = workModes[Math.floor(Math.random() * workModes.length)];
    
    // Generate realistic preferred days (2-4 days for hybrid, 5 for office, 0-1 for remote)
    let preferredDays: string[] = [];
    if (workMode === 'office') {
      preferredDays = [...days];
    } else if (workMode === 'hybrid') {
      const numDays = 2 + Math.floor(Math.random() * 3); // 2-4 days
      const shuffled = [...days].sort(() => 0.5 - Math.random());
      preferredDays = shuffled.slice(0, numDays);
    } else {
      // Remote workers might come in occasionally
      if (Math.random() > 0.7) {
        preferredDays = [days[Math.floor(Math.random() * days.length)]];
      }
    }

    employees.push({
      id: `EMP${String(i).padStart(3, '0')}`,
      full_name: generateName(),
      team,
      department,
      preferred_work_mode: workMode,
      needs_accessible: Math.random() < 0.1, // 10% need accessible
      prefer_window: Math.random() < 0.3, // 30% prefer window
      preferred_zone: zones[Math.floor(Math.random() * zones.length)],
      onsite_ratio: workMode === 'office' ? 1.0 : 
                   workMode === 'remote' ? Math.random() * 0.2 : 
                   0.3 + Math.random() * 0.5, // hybrid: 0.3-0.8
      project_count: 1 + Math.floor(Math.random() * 5), // 1-5 projects
      preferred_days: preferredDays
    });
  }

  return employees;
}

function generateName(): string {
  const firstNames = [
    "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah",
    "Ian", "Julia", "Kevin", "Laura", "Michael", "Nancy", "Oliver", "Patricia",
    "Quincy", "Rachel", "Steven", "Teresa", "Ulrich", "Victoria", "William", "Xara",
    "Yolanda", "Zachary", "Amelia", "Benjamin", "Catherine", "Daniel", "Emma", "Felix",
    "Grace", "Henry", "Isabella", "Jack", "Katherine", "Liam", "Mia", "Noah",
    "Olivia", "Peter", "Quinn", "Ruby", "Samuel", "Tiffany", "Uma", "Vincent"
  ];
  
  const lastNames = [
    "Anderson", "Brown", "Clark", "Davis", "Evans", "Fisher", "Garcia", "Harris",
    "Johnson", "King", "Lee", "Miller", "Nelson", "Parker", "Roberts", "Smith",
    "Taylor", "Williams", "Wilson", "Adams", "Baker", "Cooper", "Edwards", "Foster",
    "Green", "Hall", "Jackson", "Lewis", "Martin", "Moore", "Thompson", "Turner",
    "Walker", "White", "Young", "Allen", "Bell", "Carter", "Collins", "Cook"
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}