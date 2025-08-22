// FastAPI Backend Client for Smart Office Seating Planner
// This integrates with your separate Python FastAPI backend

const API_BASE_URL = process.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// Types matching the FastAPI backend
interface FastAPIEmployee {
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
  extra?: Record<string, any>;
}

interface FastAPISeat {
  seat_id: string;
  floor?: number;
  zone?: string;
  is_accessible?: boolean;
  is_window?: boolean;
  x?: number;
  y?: number;
}

interface AssignmentRequest {
  employees: FastAPIEmployee[];
  seats: FastAPISeat[];
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

interface AssignmentResponse {
  assignments: AssignmentResult[];
  unassigned_employees: string[];
  unused_seats: string[];
  meta: Record<string, any>;
}

interface ScheduleRequest {
  employees: FastAPIEmployee[];
  seats: FastAPISeat[];
  capacity_by_day: Record<string, number>;
  dept_day_cap_pct?: number;
  together_teams?: string[][];
  team_together_mode?: 'soft' | 'hard';
  weights?: Record<string, number>;
  solver?: 'greedy' | 'hungarian';
  days?: string[];
}

interface ScheduleResponse {
  days: string[];
  attendance: Record<string, string[]>;
  assignments: Record<string, AssignmentResult[]>;
  violations: string[];
  meta: Record<string, any>;
}

class FastAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  async assignSeats(request: AssignmentRequest): Promise<AssignmentResponse> {
    const response = await fetch(`${this.baseUrl}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Seat assignment failed: ${response.statusText}`);
    }

    return response.json();
  }

  async optimizeSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    const response = await fetch(`${this.baseUrl}/optimize/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Schedule optimization failed: ${response.statusText}`);
    }

    return response.json();
  }

  async predictOnsiteRatio(record: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/predict/onsite_ratio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record }),
    });

    if (!response.ok) {
      throw new Error(`Onsite ratio prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  async predictSeatSatisfaction(record: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/predict/seat_satisfaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record }),
    });

    if (!response.ok) {
      throw new Error(`Seat satisfaction prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  async predictProjectCount(record: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/predict/project_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record }),
    });

    if (!response.ok) {
      throw new Error(`Project count prediction failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Utility functions to convert between your existing types and FastAPI types
import { Employee, Seat } from '@/types/planner';

export function toFastAPIEmployee(emp: Employee): FastAPIEmployee {
  return {
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
  };
}

export function toFastAPISeat(seat: Seat): FastAPISeat {
  return {
    seat_id: seat.seat_id,
    floor: seat.floor,
    zone: seat.zone,
    is_accessible: seat.is_accessible,
    is_window: seat.is_window,
    x: seat.x,
    y: seat.y,
  };
}

// Export singleton instance
export const fastAPIClient = new FastAPIClient();

// Export types for use in other files
export type {
  FastAPIEmployee,
  FastAPISeat,
  AssignmentRequest,
  AssignmentResult,
  AssignmentResponse,
  ScheduleRequest,
  ScheduleResponse,
};