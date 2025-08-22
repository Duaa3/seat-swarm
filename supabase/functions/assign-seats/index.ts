import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Employee {
  employee_id: string;
  full_name?: string;
  department?: string;
  team?: string;
  priority_level?: number;
  preferred_work_mode?: string;
  needs_accessible?: boolean;
  prefer_window?: boolean;
  preferred_zone?: string;
  preferred_days?: string[];
  client_site_ratio?: number;
  commute_minutes?: number;
  availability_ratio?: number;
  onsite_ratio?: number;
  project_count?: number;
}

interface Seat {
  seat_id: string;
  floor?: number;
  zone?: string;
  is_accessible?: boolean;
  is_window?: boolean;
  x?: number;
  y?: number;
}

interface AssignmentRequest {
  employees: Employee[];
  seats: Seat[];
  weights?: Record<string, number>;
  max_assignments?: number;
  solver?: 'greedy' | 'hungarian';
}

interface AssignmentResult {
  employee_id: string;
  seat_id: string;
  score: number;
  reasons: Record<string, number>;
}

const DEFAULT_WEIGHTS = {
  w_seat_satisfaction: 3.0,
  w_onsite_ratio: 2.0,
  w_project_penalty: -0.05,
  w_window: 1.0,
  w_accessible: 1.5,
  w_zone: 0.5,
  w_zone_cohesion: 0.75
};

function getWeights(customWeights: Record<string, number> = {}): Record<string, number> {
  return { ...DEFAULT_WEIGHTS, ...customWeights };
}

function calculateScore(employee: Employee, seat: Seat, weights: Record<string, number>, teamZoneBonus = 0): { score: number, reasons: Record<string, number> } {
  const reasons: Record<string, number> = {};
  let totalScore = 0;

  // Project count penalty
  const projectPenalty = (employee.project_count || 1.0) * weights.w_project_penalty;
  totalScore += projectPenalty;
  reasons.project_penalty = projectPenalty;

  // Heuristic scoring
  // Window preference
  if (employee.prefer_window && seat.is_window) {
    const windowBonus = weights.w_window;
    totalScore += windowBonus;
    reasons.window_match = windowBonus;
  }

  // Accessibility preference
  if (employee.needs_accessible && seat.is_accessible) {
    const accessibleBonus = weights.w_accessible;
    totalScore += accessibleBonus;
    reasons.accessibility_match = accessibleBonus;
  }

  // Zone preference
  if (employee.preferred_zone && employee.preferred_zone === seat.zone) {
    const zoneBonus = weights.w_zone;
    totalScore += zoneBonus;
    reasons.zone_match = zoneBonus;
  }

  // Team zone cohesion bonus
  if (teamZoneBonus > 0) {
    totalScore += teamZoneBonus;
    reasons.team_cohesion = teamZoneBonus;
  }

  // Onsite ratio bonus
  const onsiteBonus = (employee.onsite_ratio || 0.5) * weights.w_onsite_ratio;
  totalScore += onsiteBonus;
  reasons.onsite_ratio = onsiteBonus;

  return { score: totalScore, reasons };
}

function checkHardConstraints(employee: Employee, seat: Seat): boolean {
  // Accessibility constraint
  if (employee.needs_accessible && !seat.is_accessible) {
    return false;
  }
  return true;
}

function assignSeatsGreedy(employees: Employee[], seats: Seat[], weights: Record<string, number>, togetherTeams: string[][] = []): {
  assignments: AssignmentResult[],
  unassigned: string[],
  unused: string[]
} {
  const assignments: AssignmentResult[] = [];
  const unassigned: string[] = [];
  const availableSeats = [...seats];

  // Calculate team zone bonuses
  const teamZones: Record<string, Record<string, number>> = {};
  for (const teamGroup of togetherTeams) {
    for (const team of teamGroup) {
      teamZones[team] = {};
    }
  }

  // Assign seats greedily
  for (const employee of employees) {
    let bestSeat: Seat | null = null;
    let bestScore = -Infinity;
    let bestReasons: Record<string, number> = {};

    for (const seat of availableSeats) {
      if (!checkHardConstraints(employee, seat)) {
        continue;
      }

      // Calculate team cohesion bonus
      let teamBonus = 0;
      if (employee.team && teamZones[employee.team]) {
        const zoneCount = teamZones[employee.team][seat.zone || ''] || 0;
        teamBonus = zoneCount * weights.w_zone_cohesion;
      }

      const { score, reasons } = calculateScore(employee, seat, weights, teamBonus);

      if (score > bestScore) {
        bestScore = score;
        bestSeat = seat;
        bestReasons = reasons;
      }
    }

    if (bestSeat) {
      assignments.push({
        employee_id: employee.employee_id,
        seat_id: bestSeat.seat_id,
        score: bestScore,
        reasons: bestReasons
      });

      // Remove assigned seat
      const seatIndex = availableSeats.indexOf(bestSeat);
      availableSeats.splice(seatIndex, 1);

      // Update team zone tracking
      if (employee.team && teamZones[employee.team]) {
        const zone = bestSeat.zone || '';
        teamZones[employee.team][zone] = (teamZones[employee.team][zone] || 0) + 1;
      }
    } else {
      unassigned.push(employee.employee_id);
    }
  }

  const unused = availableSeats.map(seat => seat.seat_id);
  return { assignments, unassigned, unused };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody: AssignmentRequest = await req.json();
    const weights = getWeights(requestBody.weights);

    // Limit assignments if specified
    let { employees } = requestBody;
    if (requestBody.max_assignments && employees.length > requestBody.max_assignments) {
      employees = employees.slice(0, requestBody.max_assignments);
    }

    // Use greedy algorithm (Hungarian would require additional complexity in Deno)
    const { assignments, unassigned, unused } = assignSeatsGreedy(
      employees, 
      requestBody.seats, 
      weights
    );

    const response = {
      assignments,
      unassigned_employees: unassigned,
      unused_seats: unused,
      meta: {
        solver: 'greedy',
        total_employees: requestBody.employees.length,
        total_seats: requestBody.seats.length,
        assignment_rate: requestBody.employees.length > 0 ? assignments.length / requestBody.employees.length : 0
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in assign-seats function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})