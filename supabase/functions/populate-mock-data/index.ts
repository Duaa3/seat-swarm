import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mock employees data
    const mockEmployees = Array.from({ length: 350 }, (_, i) => {
      const firstNames = ["Aisha", "Hilal", "Maya", "David", "Sofia", "James", "Elena", "Ahmad", "Lisa", "Roberto", "Sarah", "Michael", "Priya", "Carlos", "Emma", "Hassan", "Fatima", "Alex", "Nina", "Omar", "Lucia", "Mark", "Zara", "Sam", "Leila", "Kevin", "Amara", "Ben", "Yasmin", "Ryan"];
      const lastNames = ["Rahman", "Ahmed", "Chen", "Kim", "Garcia", "Wilson", "Petrov", "Hassan", "Thompson", "Silva", "Johnson", "Brown", "Patel", "Martinez", "Davis", "Ali", "Khan", "Lee", "Miller", "Jones", "Smith", "Lopez", "Clark", "Nguyen", "Taylor", "White", "Anderson", "Williams", "Jackson", "Martin"];
      const teams = ["Network", "CoreOps", "Design", "Sales", "Data", "QA", "Security", "DevOps", "Product", "Support"];
      const departments = ["Core", "GoToMarket", "Operations"];
      const workModes = ["hybrid", "remote", "onsite"];
      const zones = ["ZoneA", "ZoneB", "ZoneC"];
      const daysCombos = [["Mon","Wed"], ["Tue","Thu"], ["Mon","Fri"], ["Mon","Tue","Wed"], ["Wed","Thu"], ["Fri"], ["Mon","Wed","Fri"], ["Tue","Thu"], ["Mon","Tue","Wed","Thu"], ["Wed","Thu","Fri"]];
      
      const empId = String(i + 1).padStart(3, '0');
      return {
        id: `E${empId}`,
        full_name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
        team: teams[i % teams.length],
        department: departments[i % departments.length],
        preferred_work_mode: workModes[i % workModes.length],
        needs_accessible: Math.random() < 0.15,
        prefer_window: Math.random() < 0.6,
        preferred_zone: zones[i % zones.length],
        onsite_ratio: Math.round((0.3 + Math.random() * 0.6) * 100) / 100,
        project_count: Math.floor(Math.random() * 6) + 1,
        preferred_days: daysCombos[i % daysCombos.length],
        priority_level: Math.floor(Math.random() * 5) + 1,
        client_site_ratio: Math.random() * 0.5,
        commute_minutes: Math.floor(Math.random() * 60) + 10,
        availability_ratio: 0.8 + Math.random() * 0.2,
        extra: null
      };
    });

    // Mock seats data
    const mockSeats = [];
    const zones = ["ZoneA", "ZoneB", "ZoneC"];
    
    // Floor 1: 48 seats (8x6 grid)
    for (let i = 0; i < 48; i++) {
      const seatNum = String(i + 1).padStart(2, '0');
      const x = (i % 8) + 1;
      const y = Math.floor(i / 8) + 1;
      const zone = zones[i % zones.length];
      
      mockSeats.push({
        id: `F1-S${seatNum}`,
        floor: 1,
        zone,
        is_accessible: i < 12,
        is_window: x === 1 || x === 8 || y === 1 || y === 6,
        x,
        y,
      });
    }
    
    // Floor 2: 50 seats (10x5 grid)
    for (let i = 0; i < 50; i++) {
      const seatNum = String(i + 1).padStart(2, '0');
      const x = (i % 10) + 1;
      const y = Math.floor(i / 10) + 1;
      const zone = zones[i % zones.length];
      
      mockSeats.push({
        id: `F2-S${seatNum}`,
        floor: 2,
        zone,
        is_accessible: i < 10,
        is_window: x === 1 || x === 10 || y === 1 || y === 5,
        x,
        y,
      });
    }

    // Clear existing data first
    console.log('Clearing existing data...');
    await supabaseClient.from('schedule_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('schedule_days').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('employees').delete().neq('id', 'dummy');
    await supabaseClient.from('seats').delete().neq('id', 'dummy');

    // Insert employees
    console.log('Inserting employees...');
    const { error: employeesError } = await supabaseClient
      .from('employees')
      .insert(mockEmployees);

    if (employeesError) {
      console.error('Error inserting employees:', employeesError);
      throw employeesError;
    }

    // Insert seats
    console.log('Inserting seats...');
    const { error: seatsError } = await supabaseClient
      .from('seats')
      .insert(mockSeats);

    if (seatsError) {
      console.error('Error inserting seats:', seatsError);
      throw seatsError;
    }

    // Insert global constraints if not exist
    console.log('Inserting global constraints...');
    const { data: existingConstraints } = await supabaseClient
      .from('global_constraints')
      .select('id')
      .limit(1);

    if (!existingConstraints || existingConstraints.length === 0) {
      const { error: constraintsError } = await supabaseClient
        .from('global_constraints')
        .insert({
          floor_1_capacity: 48,
          floor_2_capacity: 50,
          allow_team_splitting: false,
          max_consecutive_office_days: 3,
          min_client_site_ratio: 0.50,
          max_client_site_ratio: 0.60
        });

      if (constraintsError) {
        console.error('Error inserting global constraints:', constraintsError);
        throw constraintsError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mock data populated successfully',
        data: {
          employees: mockEmployees.length,
          seats: mockSeats.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})