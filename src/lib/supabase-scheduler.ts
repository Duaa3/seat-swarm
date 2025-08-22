// Supabase Edge Functions Client for Smart Office Seating Planner
// This uses Lovable's native Supabase integration

import { supabase } from '@/integrations/supabase/client';

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

class SupabaseEdgeFunctionsClient {
  async healthCheck(): Promise<any> {
    try {
      // Simple health check by calling a basic Supabase operation
      const { data } = await supabase.from('employees').select('count').limit(1);
      return {
        status: 'healthy',
        supabase_connected: true,
        edge_functions_available: true
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async assignSeats(request: AssignmentRequest): Promise<AssignmentResponse> {
    const { data, error } = await supabase.functions.invoke('assign-seats', {
      body: request
    });

    if (error) {
      throw new Error(`Seat assignment failed: ${error.message}`);
    }

    return data;
  }

  async optimizeSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    const { data, error } = await supabase.functions.invoke('optimize-schedule', {
      body: request
    });

    if (error) {
      throw new Error(`Schedule optimization failed: ${error.message}`);
    }

    return data;
  }

  // Note: ML prediction endpoints would require training models in Supabase
  // For now, return simple heuristic-based predictions
  async predictOnsiteRatio(record: Record<string, any>): Promise<any> {
    // Simple heuristic: base on commute time and preferred days
    const commuteMinutes = record.commute_minutes || 30;
    const preferredDaysCount = record.preferred_days?.length || 2;
    const prediction = Math.max(0.1, Math.min(0.9, 
      0.8 - (commuteMinutes / 120) + (preferredDaysCount / 10)
    ));
    
    return { 
      prediction, 
      note: 'Heuristic-based prediction. ML models can be added to Supabase later.' 
    };
  }

  async predictSeatSatisfaction(record: Record<string, any>): Promise<any> {
    // Simple heuristic: base on preferences match
    let satisfaction = 0.5;
    if (record.prefer_window && record.is_window) satisfaction += 0.2;
    if (record.needs_accessible && record.is_accessible) satisfaction += 0.3;
    if (record.preferred_zone === record.zone) satisfaction += 0.1;
    
    return { 
      probability: Math.min(0.95, satisfaction),
      note: 'Heuristic-based prediction. ML models can be added to Supabase later.' 
    };
  }

  async predictProjectCount(record: Record<string, any>): Promise<any> {
    // Simple heuristic: base on department and seniority
    const baseCounts: Record<string, number> = {
      'Engineering': 2.5,
      'Product': 1.8,
      'Design': 1.5,
      'Sales': 3.0,
      'Marketing': 2.0
    };
    
    const baseCount = baseCounts[record.department] || 2.0;
    const seniorityMultiplier = (record.seniority_level || 1) * 0.3;
    const prediction = baseCount + seniorityMultiplier;
    
    return { 
      prediction,
      note: 'Heuristic-based prediction. ML models can be added to Supabase later.' 
    };
  }
}

// Utility functions to convert between your existing types and FastAPI types
import { Employee, Seat } from '@/types/planner';

export function toSupabaseEmployee(emp: Employee): FastAPIEmployee {
  return {
    employee_id: emp.id,
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

export function toSupabaseSeat(seat: Seat): FastAPISeat {
  return {
    seat_id: seat.id,
    floor: seat.floor,
    zone: seat.zone,
    is_accessible: seat.is_accessible,
    is_window: seat.is_window,
    x: seat.x,
    y: seat.y,
  };
}

// Export singleton instance
export const supabaseClient = new SupabaseEdgeFunctionsClient();

// Export types for use in other files
export type {
  FastAPIEmployee as SupabaseEmployee,
  FastAPISeat as SupabaseSeat,
  AssignmentRequest,
  AssignmentResult,
  AssignmentResponse,
  ScheduleRequest,
  ScheduleResponse,
};