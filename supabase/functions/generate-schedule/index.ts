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

    // Use the advanced optimize-schedule logic
    const optimizeRequest = {
      employees: employees.map(emp => ({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        department: emp.department,
        team: emp.team,
        preferred_work_mode: emp.preferred_work_mode,
        needs_accessible: emp.needs_accessible,
        prefer_window: emp.prefer_window,
        preferred_zone: emp.preferred_zone,
        preferred_days: emp.preferred_days,
        onsite_ratio: emp.onsite_ratio,
        project_count: emp.project_count,
        client_site_ratio: 0.1, // default
        availability_ratio: 1.0, // default
        commute_minutes: 30.0 // default
      })),
      seats: seats.map(seat => ({
        seat_id: seat.seat_id,
        floor: seat.floor,
        zone: seat.zone,
        is_accessible: seat.is_accessible,
        is_window: seat.is_window,
        x: seat.x_coordinate,
        y: seat.y_coordinate
      })),
      capacity_by_day: {
        Mon: Math.floor((dayCapacities.Mon / 100) * seats.length),
        Tue: Math.floor((dayCapacities.Tue / 100) * seats.length),
        Wed: Math.floor((dayCapacities.Wed / 100) * seats.length),
        Thu: Math.floor((dayCapacities.Thu / 100) * seats.length),
        Fri: Math.floor((dayCapacities.Fri / 100) * seats.length)
      },
      dept_day_cap_pct: deptCapacity / 100,
      together_teams: teamClusters.length > 0 ? [teamClusters] : [],
      team_together_mode: 'soft' as const,
      weights: requestData.weights || {},
      solver: 'greedy' as const,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    };

    // Call the optimize-schedule function
    const optimizeResponse = await supabase.functions.invoke('optimize-schedule', {
      body: optimizeRequest
    });

    if (optimizeResponse.error) {
      throw new Error(`Schedule optimization failed: ${optimizeResponse.error.message}`);
    }

    const optimizeResult = optimizeResponse.data;
    
    // Convert the optimize-schedule response to the expected format
    const schedule: Record<DayKey, Assignment[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: []
    };

    for (const day of DAYS) {
      if (optimizeResult.assignments[day]) {
        schedule[day] = optimizeResult.assignments[day].map((assignment: any) => ({
          employeeId: assignment.employee_id,
          seatId: assignment.seat_id
        }));
      }
    }
    
    // Save schedule to database
    const assignmentRecords = [];
    for (const day of DAYS) {
      const dayIndex = DAYS.indexOf(day);
      const assignmentDate = new Date(weekStartDate);
      assignmentDate.setDate(assignmentDate.getDate() + dayIndex);
      
      for (const assignment of schedule[day]) {
        assignmentRecords.push({
          employee_id: assignment.employeeId,
          seat_id: assignment.seatId,
          assignment_date: assignmentDate.toISOString().split('T')[0],
          day_of_week: day,
          assignment_type: 'manual',
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

interface Assignment {
  employeeId: string;
  seatId: string;
}

function generateScheduleLogic(
  employees: any[],
  seats: any[],
  dayCapacities: Record<DayKey, number>,
  deptCapacity: number
): Record<DayKey, Assignment[]> {
  
  const schedule: Record<DayKey, Assignment[]> = {
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
    const availableSeats = [...seats]; // Copy seats for this day

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
      if (availableSeats.length === 0) break;
      
      // Find best seat for employee
      let assignedSeat = null;
      
      // Prioritize accessible seats for employees who need them
      if (emp.needs_accessible) {
        assignedSeat = availableSeats.find(seat => seat.is_accessible);
      }
      
      // Prioritize window seats for employees who prefer them
      if (!assignedSeat && emp.prefer_window) {
        assignedSeat = availableSeats.find(seat => seat.is_window);
      }
      
      // Prioritize preferred zone
      if (!assignedSeat && emp.preferred_zone) {
        assignedSeat = availableSeats.find(seat => seat.zone === emp.preferred_zone);
      }
      
      // Otherwise, take any available seat
      if (!assignedSeat) {
        assignedSeat = availableSeats[0];
      }
      
      if (assignedSeat) {
        schedule[day].push({
          employeeId: emp.employee_id,
          seatId: assignedSeat.id
        });
        deptCount[emp.department]++;
        
        // Remove assigned seat from available seats
        const seatIndex = availableSeats.findIndex(s => s.id === assignedSeat.id);
        availableSeats.splice(seatIndex, 1);
      }
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