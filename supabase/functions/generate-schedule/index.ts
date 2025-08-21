import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
type DayKey = typeof DAYS[number];

interface GenerateScheduleRequest {
  weekStartDate?: string; // ISO date string
  dayCapacities?: Record<DayKey, number>; // percentage 0-100
  deptCapacity?: number; // percentage 0-100
  weights?: {
    seatSatisfaction?: number;
    onsite?: number;
    projectPenalty?: number;
    zone?: number;
  };
  teamClusters?: string[]; // teams to cluster together
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing schedule generation request...');

    // Parse request body
    const requestData: GenerateScheduleRequest = await req.json();
    
    // Set defaults
    const weekStartDate = requestData.weekStartDate || getCurrentMondayISO();
    const dayCapacities = requestData.dayCapacities || {
      Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90
    };
    const deptCapacity = requestData.deptCapacity || 60;
    const teamClusters = requestData.teamClusters || [];

    console.log('Schedule parameters:', { weekStartDate, dayCapacities, deptCapacity, teamClusters });

    // Get employees and seats
    const [employeesResult, seatsResult] = await Promise.all([
      supabase.from('employees').select('*').eq('is_active', true),
      supabase.from('seats').select('*').eq('is_available', true)
    ]);

    if (employeesResult.error) {
      console.error('Error fetching employees:', employeesResult.error);
      throw new Error(`Failed to fetch employees: ${employeesResult.error.message}`);
    }

    if (seatsResult.error) {
      console.error('Error fetching seats:', seatsResult.error);
      throw new Error(`Failed to fetch seats: ${seatsResult.error.message}`);
    }

    const employees = employeesResult.data || [];
    const seats = seatsResult.data || [];

    if (employees.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No employees found. Please create employee data first.',
        schedule: {},
        assignments: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (seats.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No seats found. Please create seat data first.',
        schedule: {},
        assignments: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating schedule for ${employees.length} employees and ${seats.length} seats`);

    // Generate schedule using capacity-based algorithm
    const schedule = generateScheduleLogic(employees, seats, dayCapacities, deptCapacity);
    
    // Save schedule to database
    const assignmentRecords = [];
    for (const day of DAYS) {
      const dayIndex = DAYS.indexOf(day);
      const assignmentDate = new Date(weekStartDate);
      assignmentDate.setDate(assignmentDate.getDate() + dayIndex);
      
      for (const employeeId of schedule[day]) {
        assignmentRecords.push({
          employee_id: employeeId,
          assignment_date: assignmentDate.toISOString().split('T')[0],
          day_of_week: day,
          assignment_type: 'scheduled',
          model_version: 'api-v1',
          constraints_met: { 
            generated_by: 'api',
            day_capacity: dayCapacities[day],
            dept_capacity: deptCapacity
          }
        });
      }
    }

    if (assignmentRecords.length > 0) {
      // Clear existing assignments for this week
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      
      await supabase
        .from('schedule_assignments')
        .delete()
        .gte('assignment_date', weekStartDate)
        .lte('assignment_date', weekEndDate.toISOString().split('T')[0]);

      // Insert new assignments
      const { error: insertError } = await supabase
        .from('schedule_assignments')
        .insert(assignmentRecords);

      if (insertError) {
        console.error('Error saving assignments:', insertError);
        // Continue anyway, return the schedule even if saving failed
      } else {
        console.log(`Saved ${assignmentRecords.length} schedule assignments to database`);
      }
    }

    const totalAssignments = Object.values(schedule).flat().length;
    const utilizationByDay = Object.fromEntries(
      DAYS.map(day => [
        day,
        seats.length > 0 ? Math.round((schedule[day].length / seats.length) * 100) : 0
      ])
    );

    console.log(`Generated schedule with ${totalAssignments} total assignments`);

    return new Response(JSON.stringify({
      schedule,
      assignments: totalAssignments,
      weekStartDate,
      utilizationByDay,
      parameters: {
        dayCapacities,
        deptCapacity,
        teamClusters
      },
      meta: {
        employeeCount: employees.length,
        seatCount: seats.length,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-schedule function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      schedule: {},
      assignments: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateScheduleLogic(
  employees: any[],
  seats: any[],
  dayCapacities: Record<DayKey, number>,
  deptCapacity: number
): Record<DayKey, string[]> {
  
  const schedule: Record<DayKey, string[]> = {
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: []
  };

  // Group employees by department
  const departments = [...new Set(employees.map(emp => emp.department))];
  const perDeptCounts = Object.fromEntries(
    departments.map(dept => [
      dept,
      employees.filter(emp => emp.department === dept).length
    ])
  );
  const perDeptDailyCap = Object.fromEntries(
    Object.entries(perDeptCounts).map(([dept, count]) => [
      dept,
      Math.floor((deptCapacity / 100) * count)
    ])
  );

  DAYS.forEach((day) => {
    const capSeats = Math.floor((dayCapacities[day] / 100) * seats.length);
    const deptCount: Record<string, number> = Object.fromEntries(departments.map(d => [d, 0]));

    // Get employees who prefer this day, then others
    const preferred = employees.filter(emp => 
      emp.preferred_days && emp.preferred_days.includes(day)
    );
    const others = employees.filter(emp => 
      !emp.preferred_days || !emp.preferred_days.includes(day)
    );
    
    // Shuffle for fairness
    const shuffledPreferred = preferred.sort(() => Math.random() - 0.5);
    const shuffledOthers = others.sort(() => Math.random() - 0.5);
    
    const order = [...shuffledPreferred, ...shuffledOthers];

    for (const emp of order) {
      if (schedule[day].length >= capSeats) break;
      if (deptCount[emp.department] >= perDeptDailyCap[emp.department]) continue;
      
      schedule[day].push(emp.employee_id);
      deptCount[emp.department]++;
    }
  });

  return schedule;
}

function getCurrentMondayISO(): string {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}