import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  full_name: string;
  department: string;
  team: string;
  preferred_days: string[];
  onsite_ratio: number;
}

interface Seat {
  id: string;
  floor: number;
  zone: string;
  is_window: boolean;
  is_accessible: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting historical data generation...');

    // Get all employees and seats
    const [employeesResult, seatsResult] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('seats').select('*')
    ]);

    if (employeesResult.error || seatsResult.error) {
      throw new Error('Failed to fetch employees or seats');
    }

    const employees: Employee[] = employeesResult.data || [];
    const seats: Seat[] = seatsResult.data || [];

    console.log(`Found ${employees.length} employees and ${seats.length} seats`);

    // Generate data for the past 60 days
    const assignments = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 60);

    console.log(`Generating data from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

    // Days of the week
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Generate assignments for each day in the past 60 days
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dayName = dayNames[dayOfWeek - 1];
      const dayCode = daysOfWeek[dayOfWeek - 1];
      const dateStr = d.toISOString().split('T')[0];

      // Calculate capacity for the day (varies by day of week)
      let dailyCapacity = 48; // Base capacity
      if (dayOfWeek === 2 || dayOfWeek === 4) dailyCapacity = 55; // Tuesday/Thursday higher
      if (dayOfWeek === 1 || dayOfWeek === 5) dailyCapacity = 35; // Monday/Friday lower

      // Create a pool of available employees for this day
      const availableEmployees = employees.filter(emp => {
        const hasPreferredDay = emp.preferred_days?.includes(dayName) || emp.preferred_days?.includes(dayCode);
        const randomChance = Math.random();
        const onsiteRatio = emp.onsite_ratio || 0.6;
        
        // Higher chance if it's a preferred day
        const baseChance = hasPreferredDay ? onsiteRatio * 1.3 : onsiteRatio;
        return randomChance < Math.min(baseChance, 0.9);
      });

      // Randomly select employees up to daily capacity
      const selectedEmployees = availableEmployees
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(dailyCapacity, availableEmployees.length));

      // Assign seats to selected employees
      const availableSeats = [...seats].sort(() => Math.random() - 0.5);
      
      selectedEmployees.forEach((employee, index) => {
        if (index < availableSeats.length) {
          const seat = availableSeats[index];
          
          // Calculate satisfaction score (1-5)
          let satisfactionScore = 3; // Base satisfaction
          
          // Boost satisfaction for preferred conditions
          if (employee.preferred_days?.includes(dayName) || employee.preferred_days?.includes(dayCode)) {
            satisfactionScore += 1;
          }
          
          // Random variance
          satisfactionScore += (Math.random() - 0.5) * 2;
          satisfactionScore = Math.max(1, Math.min(5, Math.round(satisfactionScore)));

          // Generate confidence score
          const confidenceScore = 0.7 + Math.random() * 0.3;

          // Generate constraints met
          const constraintsMet = [];
          if (employee.preferred_days?.includes(dayName) || employee.preferred_days?.includes(dayCode)) {
            constraintsMet.push('preferred_day');
          }
          if (employee.team && Math.random() > 0.7) {
            constraintsMet.push('team_proximity');
          }
          if (seat.is_window && Math.random() > 0.8) {
            constraintsMet.push('window_preference');
          }

          assignments.push({
            employee_id: employee.id,
            seat_id: seat.id,
            assignment_date: dateStr,
            day_of_week: dayCode,
            assignment_type: 'assigned',
            satisfaction_score: satisfactionScore,
            confidence_score: confidenceScore,
            constraints_met: constraintsMet,
            collaboration_events: Math.floor(Math.random() * 3),
            model_version: 'historical-mock-v1',
            productivity_score: 0.6 + Math.random() * 0.4,
            rules_applied: ['basic_assignment', 'capacity_limit']
          });
        }
      });

      console.log(`Generated ${selectedEmployees.length} assignments for ${dateStr} (${dayName})`);
    }

    console.log(`Total assignments generated: ${assignments.length}`);

    // Start background task to save data
    EdgeRuntime.waitUntil(saveAssignmentsInBackground(supabase, assignments));

    return new Response(JSON.stringify({
      success: true,
      message: `Started background task to save ${assignments.length} historical assignments`,
      assignments_count: assignments.length,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in generate-historical-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function saveAssignmentsInBackground(supabase: any, assignments: any[]) {
  try {
    console.log('Background task: Starting to save assignments...');
    
    // Clear existing historical data first (keep only future assignments)
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('schedule_assignments')
      .delete()
      .lt('assignment_date', today);

    console.log('Background task: Cleared old historical data');

    // Insert in batches of 100 to avoid timeouts
    const batchSize = 100;
    let savedCount = 0;

    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('schedule_assignments')
        .insert(batch);

      if (error) {
        console.error(`Background task: Error saving batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      savedCount += batch.length;
      console.log(`Background task: Saved batch ${Math.floor(i / batchSize) + 1}, total saved: ${savedCount}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Background task: Successfully saved all ${savedCount} assignments`);
    
  } catch (error) {
    console.error('Background task error:', error);
    throw error;
  }
}
