// ============= API Client with Mock Fallback =============

import { Assignment, Employee, Seat, Weights } from "@/data/mock";

const API_BASE = import.meta.env.VITE_API_BASE ?? ""; // leave blank for mock

export interface AssignSeatsPayload {
  employees: Employee[];
  seats: Seat[];
  weights: Weights;
  solver?: "greedy" | "hungarian";
  max_assignments?: number;
  constraints?: {
    team_clusters?: string[];
    dept_capacity?: number;
  };
}

export interface AssignSeatsResponse {
  assignments: Assignment[];
  unassigned_employees: string[];
  unused_seats: string[];
  meta: {
    solver: string;
    assigned_count: number;
    total_employees: number;
    total_seats: number;
    weights_used: Weights;
    execution_time_ms?: number;
  };
}

export interface SchedulePayload {
  employees: Employee[];
  constraints: {
    day_capacities: Record<string, number>;
    dept_capacity: number;
    team_clusters: string[];
  };
  weights: Weights;
}

export interface ScheduleResponse {
  schedule: Record<string, string[]>;
  violations: Array<{
    day: string;
    rule: string;
    details: string;
    severity: "info" | "warn" | "error";
  }>;
  meta: {
    total_scheduled: number;
    utilization_by_day: Record<string, number>;
  };
}

// Mock implementation for seat assignment
function mockAssignSeats(payload: AssignSeatsPayload): AssignSeatsResponse {
  const { employees, seats, weights, solver = "greedy" } = payload;
  
  // Simple mock assignment logic
  const assignments: Assignment[] = [];
  const unassigned: string[] = [];
  const usedSeats = new Set<string>();
  
  for (let i = 0; i < Math.min(employees.length, seats.length); i++) {
    const employee = employees[i];
    const seat = seats[i];
    
    if (usedSeats.has(seat.seat_id)) continue;
    
    // Calculate mock score based on preferences
    let score = 2.0; // base score
    const reasons = {
      p_satisfaction: 0.7 + Math.random() * 0.3,
      p_onsite_ratio: employee.onsite_ratio,
      project_load: employee.project_count,
      window_match: employee.prefer_window === seat.is_window ? 1 : 0,
      accessible_match: employee.needs_accessible === seat.is_accessible ? 1 : 0,
      zone_match: employee.preferred_zone === seat.zone ? 1 : 0,
    };
    
    // Apply weights to calculate final score
    score = (
      weights.w_seat_satisfaction * reasons.p_satisfaction +
      weights.w_onsite_ratio * reasons.p_onsite_ratio +
      weights.w_project_penalty * reasons.project_load +
      weights.w_window * reasons.window_match +
      weights.w_accessible * reasons.accessible_match +
      weights.w_zone * reasons.zone_match
    );
    
    assignments.push({
      employee_id: employee.employee_id,
      seat_id: seat.seat_id,
      score: Number(score.toFixed(2)),
      reasons,
    });
    
    usedSeats.add(seat.seat_id);
  }
  
  // Add unassigned employees
  for (let i = assignments.length; i < employees.length; i++) {
    unassigned.push(employees[i].employee_id);
  }
  
  const unusedSeats = seats
    .filter(s => !usedSeats.has(s.seat_id))
    .map(s => s.seat_id);
  
  return {
    assignments,
    unassigned_employees: unassigned,
    unused_seats: unusedSeats,
    meta: {
      solver,
      assigned_count: assignments.length,
      total_employees: employees.length,
      total_seats: seats.length,
      weights_used: weights,
      execution_time_ms: 50 + Math.random() * 100,
    },
  };
}

// Mock implementation for schedule generation
function mockGenerateSchedule(payload: SchedulePayload): ScheduleResponse {
  const { employees, constraints } = payload;
  const schedule: Record<string, string[]> = {};
  const violations: any[] = [];
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  
  // Simple mock scheduling - distribute employees across days
  days.forEach((day, dayIndex) => {
    const dayCapPct = constraints.day_capacities[day] || 70;
    const maxSeats = Math.floor((dayCapPct / 100) * 20); // 20 total seats in mock
    
    schedule[day] = employees
      .filter(emp => emp.preferred_days.includes(day))
      .slice(0, maxSeats)
      .map(emp => emp.employee_id);
    
    // Check for violations
    const deptCounts: Record<string, number> = {};
    schedule[day].forEach(empId => {
      const emp = employees.find(e => e.employee_id === empId);
      if (emp) {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
      }
    });
    
    Object.entries(deptCounts).forEach(([dept, count]) => {
      const deptTotal = employees.filter(e => e.department === dept).length;
      const pct = (count / deptTotal) * 100;
      if (pct > constraints.dept_capacity) {
        violations.push({
          day,
          rule: "Department Capacity",
          details: `${dept} has ${pct.toFixed(1)}% attendance (limit: ${constraints.dept_capacity}%)`,
          severity: "warn",
        });
      }
    });
  });
  
  return {
    schedule,
    violations,
    meta: {
      total_scheduled: Object.values(schedule).flat().length,
      utilization_by_day: Object.fromEntries(
        days.map(day => [day, (schedule[day]?.length || 0) / 20 * 100])
      ),
    },
  };
}

export async function assignSeats(payload: AssignSeatsPayload): Promise<AssignSeatsResponse> {
  if (!API_BASE) {
    // Mock fallback with artificial delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return mockAssignSeats(payload);
  }

  const res = await fetch(`${API_BASE}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} - ${await res.text()}`);
  }
  
  return res.json();
}

export async function generateSchedule(payload: SchedulePayload): Promise<ScheduleResponse> {
  if (!API_BASE) {
    // Mock fallback with artificial delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    return mockGenerateSchedule(payload);
  }

  const res = await fetch(`${API_BASE}/optimize/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} - ${await res.text()}`);
  }
  
  return res.json();
}

// Health check endpoint
export async function healthCheck(): Promise<{ status: string; version?: string }> {
  if (!API_BASE) {
    return { status: "mock", version: "1.0.0-mock" };
  }

  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok ? res.json() : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}