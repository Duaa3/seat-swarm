import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  full_name: string;
  department: string;
  team: string;
  preferred_work_mode: string;
  preferred_zone: string;
  preferred_days: string[];
  priority_level: number;
  needs_accessible: boolean;
  prefer_window: boolean;
  client_site_ratio: number;
  commute_minutes: number;
  availability_ratio: number;
  onsite_ratio: number;
}

interface Seat {
  id: string;
  floor: number;
  x: number;
  y: number;
  zone: string;
  is_window: boolean;
  is_accessible: boolean;
}

interface GlobalConstraints {
  min_client_site_ratio: number;
  max_client_site_ratio: number;
  max_consecutive_office_days: number;
  allow_team_splitting: boolean;
  floor_1_capacity: number;
  floor_2_capacity: number;
}

interface TeamConstraints {
  team_name: string;
  prefer_same_floor: boolean;
  prefer_adjacent_seats: boolean;
  preferred_days: string[];
  min_copresence_ratio: number;
  max_members_per_day: number;
}

interface EmployeeConstraints {
  employee_id: string;
  preferred_days: string[];
  avoid_days: string[];
  max_weekly_office_days: number;
  needs_accessible_seat: boolean;
  preferred_floor: number;
  preferred_zone: string;
}

interface SeatLock {
  seat_id: string;
  employee_id: string;
  lock_type: string;
  start_date: string;
  end_date: string;
}

interface ScheduleRequest {
  week_start: string;
  enforce_constraints: boolean;
  override_ratios?: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { week_start, enforce_constraints = true, override_ratios = false }: ScheduleRequest = await req.json();

    console.log(`Generating schedule for week starting: ${week_start}`);

    // 1. Fetch all required data
    const [
      { data: employees },
      { data: seats },
      { data: globalConstraints },
      { data: teamConstraints },
      { data: employeeConstraints },
      { data: seatLocks },
      { data: attendanceHistory }
    ] = await Promise.all([
      supabaseClient.from('employees').select('*'),
      supabaseClient.from('seats').select('*'),
      supabaseClient.from('global_constraints').select('*').limit(1),
      supabaseClient.from('team_constraints').select('*'),
      supabaseClient.from('employee_constraints').select('*'),
      supabaseClient.from('seat_locks').select('*').gte('end_date', week_start).lte('start_date', week_start),
      supabaseClient.from('employee_attendance').select('*')
        .gte('date', new Date(new Date(week_start).getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('date', week_start)
    ]);

    if (!employees || !seats) {
      throw new Error('Missing required data: employees or seats not found');
    }

    // Use default constraints if none exist in database
    const constraints: GlobalConstraints = globalConstraints?.[0] || {
      min_client_site_ratio: 0.4,
      max_client_site_ratio: 0.6,
      max_consecutive_office_days: 3,
      allow_team_splitting: false,
      floor_1_capacity: 48,
      floor_2_capacity: 50
    };
    
    console.log('Loaded constraints:', constraints);
    console.log(`Found ${employees.length} employees and ${seats.length} seats`);

    // 2. Generate schedule using advanced algorithm
    const schedule = await generateAdvancedSchedule({
      employees: employees as Employee[],
      seats: seats as Seat[],
      constraints,
      teamConstraints: teamConstraints as TeamConstraints[],
      employeeConstraints: employeeConstraints as EmployeeConstraints[],
      seatLocks: seatLocks as SeatLock[],
      attendanceHistory: attendanceHistory || [],
      weekStart: week_start,
      enforceConstraints: enforce_constraints,
      overrideRatios: override_ratios
    });

    // 3. Check for existing schedule and handle appropriately
    const { data: existingSchedule } = await supabaseClient
      .from('schedules')
      .select('id')
      .eq('week_start', week_start)
      .single();

    let savedSchedule;
    
    if (existingSchedule) {
      // Delete existing schedule and related data
      console.log(`Deleting existing schedule for week ${week_start}`);
      
      // Delete assignments first (foreign key dependency)
      await supabaseClient
        .from('assignments')
        .delete()
        .in('schedule_day_id', 
          await supabaseClient
            .from('schedule_days')
            .select('id')
            .eq('schedule_id', existingSchedule.id)
            .then(res => res.data?.map(d => d.id) || [])
        );
      
      // Delete schedule days
      await supabaseClient
        .from('schedule_days')
        .delete()
        .eq('schedule_id', existingSchedule.id);
      
      // Delete the schedule
      await supabaseClient
        .from('schedules')
        .delete()
        .eq('id', existingSchedule.id);
    }

    // Create new schedule
    const { data: newSchedule, error: scheduleError } = await supabaseClient
      .from('schedules')
      .insert({
        week_start,
        status: 'draft',
        meta: {
          generated_by: 'advanced_scheduler',
          generation_time: new Date().toISOString(),
          constraints_applied: enforce_constraints,
          total_assignments: Object.values(schedule.daily_schedules).flat().length
        }
      })
      .select('id')
      .single();

    if (scheduleError || !newSchedule) {
      throw new Error(`Failed to save schedule: ${scheduleError?.message}`);
    }

    savedSchedule = newSchedule;

    // 4. Save schedule days and assignments
    for (const day of DAYS) {
      const { data: scheduleDay, error: dayError } = await supabaseClient
        .from('schedule_days')
        .insert({
          schedule_id: savedSchedule.id,
          day_name: day,
          capacity: schedule.daily_schedules[day].length,
          violations: schedule.violations.filter(v => v.day === day).map(v => v.message)
        })
        .select('id')
        .single();

      if (dayError || !scheduleDay) {
        console.error(`Failed to save day ${day}:`, dayError);
        continue;
      }

      // Save assignments for this day
      const assignments = schedule.seat_assignments[day] || {};
      const assignmentRows = Object.entries(assignments).map(([employeeId, seatId]) => ({
        schedule_day_id: scheduleDay.id,
        employee_id: employeeId,
        seat_id: seatId,
        score: schedule.assignment_scores[day]?.[employeeId] || 0,
        reasons: schedule.assignment_reasons[day]?.[employeeId] || {}
      }));

      if (assignmentRows.length > 0) {
        const { error: assignmentError } = await supabaseClient
          .from('assignments')
          .insert(assignmentRows);

        if (assignmentError) {
          console.error(`Failed to save assignments for ${day}:`, assignmentError);
        }
      }
    }

    console.log(`Schedule generated successfully. ID: ${savedSchedule.id}`);

    return new Response(JSON.stringify({
      success: true,
      schedule_id: savedSchedule.id,
      week_start,
      summary: {
        total_employees: employees.length,
        total_assignments: Object.values(schedule.daily_schedules).flat().length,
        daily_counts: Object.fromEntries(
          DAYS.map(day => [day, schedule.daily_schedules[day].length])
        ),
        violations: schedule.violations,
        client_site_ratio: schedule.metrics.client_site_ratio,
        floor_utilization: schedule.metrics.floor_utilization
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateAdvancedSchedule({
  employees,
  seats,
  constraints,
  teamConstraints,
  employeeConstraints,
  seatLocks,
  attendanceHistory,
  weekStart,
  enforceConstraints,
  overrideRatios
}: {
  employees: Employee[];
  seats: Seat[];
  constraints: GlobalConstraints;
  teamConstraints: TeamConstraints[];
  employeeConstraints: EmployeeConstraints[];
  seatLocks: SeatLock[];
  attendanceHistory: any[];
  weekStart: string;
  enforceConstraints: boolean;
  overrideRatios: boolean;
}) {
  const schedule = {
    daily_schedules: {} as Record<string, string[]>,
    seat_assignments: {} as Record<string, Record<string, string>>,
    assignment_scores: {} as Record<string, Record<string, number>>,
    assignment_reasons: {} as Record<string, Record<string, any>>,
    violations: [] as Array<{ day: string; employee_id?: string; message: string; severity: 'error' | 'warning' }>,
    metrics: {
      client_site_ratio: 0,
      floor_utilization: {} as Record<number, number>,
      consecutive_days: {} as Record<string, number>
    }
  };

  // Create constraint maps for quick lookup
  const teamConstraintMap = new Map(teamConstraints.map(tc => [tc.team_name, tc]));
  const employeeConstraintMap = new Map(employeeConstraints.map(ec => [ec.employee_id, ec]));
  const seatLockMap = new Map(seatLocks.map(sl => [`${sl.seat_id}_${sl.employee_id}`, sl]));

  // Track consecutive office days from history
  const consecutiveDays = new Map<string, number>();
  for (const emp of employees) {
    consecutiveDays.set(emp.id, calculateConsecutiveDays(emp.id, attendanceHistory, weekStart));
  }

  // Calculate target client site assignments
  const totalEmployees = employees.length;
  const targetClientSiteCount = Math.floor(totalEmployees * constraints.max_client_site_ratio);
  let remainingClientSiteSlots = targetClientSiteCount * 5; // 5 days

  // Sort employees by priority for client site assignment
  const employeesByClientPriority = [...employees].sort((a, b) => {
    const aRatio = a.client_site_ratio || 0;
    const bRatio = b.client_site_ratio || 0;
    const aPriority = a.priority_level || 0;
    const bPriority = b.priority_level || 0;
    
    // Higher client site ratio and priority get preference
    return (bRatio + bPriority * 0.1) - (aRatio + aPriority * 0.1);
  });

  // Pre-assign client site work
  const clientSiteAssignments = new Set<string>();
  for (const day of DAYS) {
    const dayClientCount = Math.floor(targetClientSiteCount);
    let assigned = 0;
    
    for (const emp of employeesByClientPriority) {
      if (assigned >= dayClientCount) break;
      
      const empConstraints = employeeConstraintMap.get(emp.id);
      const shouldAvoidDay = empConstraints?.avoid_days?.includes(day);
      const prefersDay = empConstraints?.preferred_days?.includes(day) || emp.preferred_days?.includes(day);
      
      if (!shouldAvoidDay && (prefersDay || Math.random() < (emp.client_site_ratio || 0.3))) {
        clientSiteAssignments.add(`${emp.id}_${day}`);
        assigned++;
        remainingClientSiteSlots--;
      }
    }
  }

  // Generate office schedules for each day
  for (const day of DAYS) {
    const dayEmployees: string[] = [];
    const dayAssignments: Record<string, string> = {};
    const dayScores: Record<string, number> = {};
    const dayReasons: Record<string, any> = {};

    // Get employees not assigned to client sites
    const availableEmployees = employees.filter(emp => 
      !clientSiteAssignments.has(`${emp.id}_${day}`)
    );

    // Calculate capacity for this day
    const maxCapacity = Math.min(
      constraints.floor_1_capacity + constraints.floor_2_capacity,
      availableEmployees.length
    );

    // Score each employee for office attendance on this day
    const employeeScores = availableEmployees.map(emp => {
      let score = 0;
      const reasons = [];

      const empConstraints = employeeConstraintMap.get(emp.id);
      const teamConstraint = teamConstraintMap.get(emp.team);

      // Preference scoring
      if (empConstraints?.preferred_days?.includes(day) || emp.preferred_days?.includes(day)) {
        score += 50;
        reasons.push('preferred_day');
      }

      if (empConstraints?.avoid_days?.includes(day)) {
        score -= 100;
        reasons.push('avoid_day');
      }

      if (teamConstraint?.preferred_days?.includes(day)) {
        score += 20;
        reasons.push('team_preferred_day');
      }

      // Priority level
      score += (emp.priority_level || 0) * 10;

      // Availability ratio
      score += (emp.availability_ratio || 0.5) * 30;

      // Onsite ratio preference
      score += (emp.onsite_ratio || 0.3) * 40;

      // Consecutive days constraint
      const currentConsecutive = consecutiveDays.get(emp.id) || 0;
      if (currentConsecutive >= constraints.max_consecutive_office_days) {
        score -= 200;
        reasons.push('max_consecutive_exceeded');
      }

      // Weekly office days limit
      const weeklyDays = DAYS.filter(d => 
        schedule.daily_schedules[d]?.includes(emp.id)
      ).length;
      
      if (empConstraints?.max_weekly_office_days && weeklyDays >= empConstraints.max_weekly_office_days) {
        score -= 150;
        reasons.push('weekly_limit_reached');
      }

      return { employee: emp, score, reasons };
    });

    // Sort by score and select top employees
    employeeScores.sort((a, b) => b.score - a.score);
    const selectedEmployees = employeeScores.slice(0, maxCapacity);

    // Assign seats to selected employees
    const availableSeats = [...seats];
    
    // Handle seat locks first
    for (const { employee, score, reasons } of selectedEmployees) {
      dayEmployees.push(employee.id);
      dayScores[employee.id] = score;
      dayReasons[employee.id] = reasons;

      // Check for seat locks
      const lockedSeat = seatLocks.find(lock => 
        lock.employee_id === employee.id && 
        isDateInRange(getDateForDay(weekStart, day), lock.start_date, lock.end_date)
      );

      if (lockedSeat) {
        dayAssignments[employee.id] = lockedSeat.seat_id;
        // Remove this seat from available seats
        const seatIndex = availableSeats.findIndex(s => s.id === lockedSeat.seat_id);
        if (seatIndex >= 0) {
          availableSeats.splice(seatIndex, 1);
        }
        continue;
      }

      // Regular seat assignment
      const assignedSeat = assignOptimalSeat(employee, availableSeats, teamConstraintMap, employeeConstraintMap);
      if (assignedSeat) {
        dayAssignments[employee.id] = assignedSeat.id;
        const seatIndex = availableSeats.findIndex(s => s.id === assignedSeat.id);
        if (seatIndex >= 0) {
          availableSeats.splice(seatIndex, 1);
        }
      } else {
        schedule.violations.push({
          day,
          employee_id: employee.id,
          message: `No suitable seat available for ${employee.full_name}`,
          severity: 'error'
        });
      }
    }

    schedule.daily_schedules[day] = dayEmployees;
    schedule.seat_assignments[day] = dayAssignments;
    schedule.assignment_scores[day] = dayScores;
    schedule.assignment_reasons[day] = dayReasons;

    // Update consecutive days tracking
    for (const empId of dayEmployees) {
      consecutiveDays.set(empId, (consecutiveDays.get(empId) || 0) + 1);
    }
  }

  // Calculate metrics
  const totalOfficeAssignments = Object.values(schedule.daily_schedules).flat().length;
  const totalPossibleAssignments = employees.length * 5;
  schedule.metrics.client_site_ratio = (totalPossibleAssignments - totalOfficeAssignments) / totalPossibleAssignments;

  // Floor utilization
  for (const floor of [1, 2]) {
    const floorSeats = seats.filter(s => s.floor === floor).length;
    const floorAssignments = Object.values(schedule.seat_assignments)
      .flatMap(dayAssignments => Object.values(dayAssignments))
      .filter(seatId => seats.find(s => s.id === seatId)?.floor === floor)
      .length;
    
    schedule.metrics.floor_utilization[floor] = floorAssignments / (floorSeats * 5);
  }

  return schedule;
}

function assignOptimalSeat(
  employee: Employee, 
  availableSeats: Seat[], 
  teamConstraintMap: Map<string, TeamConstraints>,
  employeeConstraintMap: Map<string, EmployeeConstraints>
): Seat | null {
  if (availableSeats.length === 0) return null;

  const empConstraints = employeeConstraintMap.get(employee.id);
  const teamConstraint = teamConstraintMap.get(employee.team);

  // Score each available seat
  const seatScores = availableSeats.map(seat => {
    let score = 0;

    // Accessibility requirement
    if (empConstraints?.needs_accessible_seat || employee.needs_accessible) {
      if (seat.is_accessible) {
        score += 100;
      } else {
        score -= 1000; // Hard constraint
      }
    }

    // Window preference
    if (employee.prefer_window && seat.is_window) {
      score += 30;
    }

    // Zone preference
    if (empConstraints?.preferred_zone === seat.zone || employee.preferred_zone === seat.zone) {
      score += 20;
    }

    // Floor preference
    if (empConstraints?.preferred_floor === seat.floor) {
      score += 15;
    }

    // Team proximity (prefer same floor as team)
    if (teamConstraint?.prefer_same_floor) {
      score += 10;
    }

    return { seat, score };
  });

  // Sort by score and return best seat
  seatScores.sort((a, b) => b.score - a.score);
  return seatScores[0]?.seat || null;
}

function calculateConsecutiveDays(employeeId: string, attendanceHistory: any[], weekStart: string): number {
  // Calculate consecutive office days leading up to this week
  const sortedHistory = attendanceHistory
    .filter(h => h.employee_id === employeeId && h.location === 'office')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let consecutive = 0;
  const weekStartDate = new Date(weekStart);
  
  for (let i = 1; i <= 14; i++) {
    const checkDate = new Date(weekStartDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (sortedHistory.some(h => h.date === dateStr)) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

function getDateForDay(weekStart: string, day: string): string {
  const dayIndex = DAYS.indexOf(day);
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return date.toISOString().split('T')[0];
}