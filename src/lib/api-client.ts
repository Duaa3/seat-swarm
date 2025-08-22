// ============= API Client for Supabase Edge Functions =============

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://vnbygqpkgtrdzidkyapa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuYnlncXBrZ3RyZHppZGt5YXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjkxMjksImV4cCI6MjA3MTM0NTEyOX0.qyxZj6QaAN3dzrhnWZOlhmaZa1LgLUTlIz-KH0DwUZ0";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============= Employee API =============

export interface EmployeesResponse {
  employees: any[];
  count: number;
  generated: boolean;
}

export async function fetchEmployees(generate = false, count = 350): Promise<ApiResponse<EmployeesResponse>> {
  try {
    let url = `${SUPABASE_URL}/functions/v1/get-employees`;
    const params = new URLSearchParams();
    if (generate) params.set('generate', 'true');
    if (count !== 350) params.set('count', count.toString());
    
    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error('Network error fetching employees:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to fetch employees' 
    };
  }
}

export async function generateEmployees(count = 350): Promise<ApiResponse<EmployeesResponse>> {
  return fetchEmployees(true, count);
}

// ============= Seats API =============

export interface SeatsResponse {
  seats: any[];
  count: number;
  generated: boolean;
  floors?: number;
  seatsPerFloor?: number;
  floorSummary?: Record<number, number>;
}

export async function fetchSeats(generate = false, floors = 2, seatsPerFloor = 50): Promise<ApiResponse<SeatsResponse>> {
  try {
    let url = `${SUPABASE_URL}/functions/v1/get-seats`;
    const params = new URLSearchParams();
    if (generate) {
      params.set('generate', 'true');
      params.set('floors', floors.toString());
      params.set('seatsPerFloor', seatsPerFloor.toString());
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error('Network error fetching seats:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to fetch seats' 
    };
  }
}

export async function generateSeats(floors = 2, seatsPerFloor = 50): Promise<ApiResponse<SeatsResponse>> {
  return fetchSeats(true, floors, seatsPerFloor);
}

// ============= Schedule Generation API =============

export interface ScheduleRequest {
  weekStartDate?: string;
  dayCapacities?: {
    Mon: number;
    Tue: number;
    Wed: number;
    Thu: number;
    Fri: number;
  };
  deptCapacity?: number;
  teamClusters?: string[];
  weights?: {
    seatSatisfaction?: number;
    onsite?: number;
    projectPenalty?: number;
    zone?: number;
  };
}

export interface ScheduleResponse {
  schedule: Record<string, string[]>;
  assignments: number;
  weekStartDate: string;
  utilizationByDay: Record<string, number>;
  parameters: {
    dayCapacities: Record<string, number>;
    deptCapacity: number;
    teamClusters: string[];
  };
  meta: {
    employeeCount: number;
    seatCount: number;
    generatedAt: string;
  };
}

// Import new Supabase scheduler functions
export async function optimizeScheduleAdvanced(request: any): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase.functions.invoke('optimize-schedule', {
      body: request,
    });

    if (error) {
      console.error('API Error optimizing schedule:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error calling optimize-schedule function:', error);
    return { success: false, error: error.message };
  }
}

export async function assignSeatsAdvanced(request: any): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase.functions.invoke('assign-seats', {
      body: request,
    });

    if (error) {
      console.error('API Error assigning seats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error calling assign-seats function:', error);
    return { success: false, error: error.message };
  }
}

export async function generateScheduleAPI(request: ScheduleRequest = {}): Promise<ApiResponse<ScheduleResponse>> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-schedule', {
      body: request,
    });

    if (error) {
      console.error('API Error generating schedule:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Network error generating schedule:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to generate schedule' 
    };
  }
}

// ============= Health Check =============

export async function checkApiHealth(): Promise<{ employees: boolean; seats: boolean; schedule: boolean }> {
  const results = await Promise.allSettled([
    fetchEmployees(),
    fetchSeats(),
    supabase.functions.invoke('generate-schedule', { body: {} })
  ]);

  return {
    employees: results[0].status === 'fulfilled' && results[0].value.success,
    seats: results[1].status === 'fulfilled' && results[1].value.success,
    schedule: results[2].status === 'fulfilled'
  };
}