// ============= Supabase Database API Functions =============

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Employee, Seat } from "@/types/planner";

// Database types
type DbEmployee = Database['public']['Tables']['employees']['Row'];
type DbSeat = Database['public']['Tables']['seats']['Row'];
type DbScheduleAssignment = Database['public']['Tables']['schedule_assignments']['Row'];
type DbEmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type DbSeatInsert = Database['public']['Tables']['seats']['Insert'];

// ============= Employee Operations =============

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('full_name');
    
  if (error) {
    console.error('Error fetching employees:', error);
    throw new Error(`Failed to fetch employees: ${error.message}`);
  }
  
  return data.map(dbEmployeeToEmployee);
}

export async function createEmployee(employee: Omit<Employee, 'employee_id'>): Promise<Employee> {
  const dbEmployee = employeeToDbEmployee(employee) as DbEmployeeInsert;
  
  const { data, error } = await supabase
    .from('employees')
    .insert(dbEmployee)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating employee:', error);
    throw new Error(`Failed to create employee: ${error.message}`);
  }
  
  return dbEmployeeToEmployee(data);
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(employeeToDbEmployee(updates))
    .eq('employee_id', employeeId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating employee:', error);
    throw new Error(`Failed to update employee: ${error.message}`);
  }
  
  return dbEmployeeToEmployee(data);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('employee_id', employeeId);
    
  if (error) {
    console.error('Error deleting employee:', error);
    throw new Error(`Failed to delete employee: ${error.message}`);
  }
}

export async function bulkCreateEmployees(employees: Omit<Employee, 'employee_id'>[]): Promise<Employee[]> {
  const dbEmployees = employees.map(emp => employeeToDbEmployee(emp) as DbEmployeeInsert);
  
  const { data, error } = await supabase
    .from('employees')
    .insert(dbEmployees)
    .select();
    
  if (error) {
    console.error('Error bulk creating employees:', error);
    throw new Error(`Failed to bulk create employees: ${error.message}`);
  }
  
  return data.map(dbEmployeeToEmployee);
}

// ============= Seat Operations =============

export async function getSeats(): Promise<Seat[]> {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('is_available', true)
    .order('floor', { ascending: true })
    .order('zone')
    .order('x_coordinate')
    .order('y_coordinate');
    
  if (error) {
    console.error('Error fetching seats:', error);
    throw new Error(`Failed to fetch seats: ${error.message}`);
  }
  
  return data.map(dbSeatToSeat);
}

export async function createSeat(seat: Omit<Seat, 'seat_id'>): Promise<Seat> {
  const dbSeat = seatToDbSeat(seat) as DbSeatInsert;
  
  const { data, error } = await supabase
    .from('seats')
    .insert(dbSeat)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating seat:', error);
    throw new Error(`Failed to create seat: ${error.message}`);
  }
  
  return dbSeatToSeat(data);
}

export async function bulkCreateSeats(seats: Omit<Seat, 'seat_id'>[]): Promise<Seat[]> {
  const dbSeats = seats.map(seat => seatToDbSeat(seat) as DbSeatInsert);
  
  const { data, error } = await supabase
    .from('seats')
    .insert(dbSeats)
    .select();
    
  if (error) {
    console.error('Error bulk creating seats:', error);
    throw new Error(`Failed to bulk create seats: ${error.message}`);
  }
  
  return data.map(dbSeatToSeat);
}

// ============= Schedule Assignment Operations =============

export async function getScheduleAssignments(dateFrom?: string, dateTo?: string): Promise<DbScheduleAssignment[]> {
  let query = supabase
    .from('schedule_assignments')
    .select('*')
    .order('assignment_date', { ascending: false })
    .order('day_of_week');
    
  if (dateFrom) {
    query = query.gte('assignment_date', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('assignment_date', dateTo);
  }
    
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching schedule assignments:', error);
    throw new Error(`Failed to fetch schedule assignments: ${error.message}`);
  }
  
  return data || [];
}

export async function saveScheduleAssignment(assignment: {
  employee_id: string;
  seat_id?: string;
  assignment_date: string;
  day_of_week: string;
  assignment_type: 'manual' | 'auto' | 'scheduled' | 'assigned';
  satisfaction_score?: number;
  confidence_score?: number;
  model_version?: string;
  rules_applied?: string[];
  constraints_met?: Record<string, any>;
}): Promise<DbScheduleAssignment> {
  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(assignment)
    .select()
    .single();
    
  if (error) {
    console.error('Error saving schedule assignment:', error);
    throw new Error(`Failed to save schedule assignment: ${error.message}`);
  }
  
  return data;
}

export async function bulkSaveScheduleAssignments(assignments: Array<{
  employee_id: string;
  seat_id?: string;
  assignment_date: string;
  day_of_week: string;
  assignment_type: 'manual' | 'auto' | 'scheduled' | 'assigned';
  satisfaction_score?: number;
  confidence_score?: number;
  model_version?: string;
  rules_applied?: string[];
  constraints_met?: Record<string, any>;
}>): Promise<DbScheduleAssignment[]> {
  const formattedAssignments = assignments.map(assignment => ({
    employee_id: assignment.employee_id,
    seat_id: assignment.seat_id || null,
    assignment_date: assignment.assignment_date,
    day_of_week: assignment.day_of_week,
    assignment_type: assignment.assignment_type,
    satisfaction_score: assignment.satisfaction_score,
    confidence_score: assignment.confidence_score,
    model_version: assignment.model_version,
    rules_applied: assignment.rules_applied,
    constraints_met: assignment.constraints_met as any
  }));

  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(formattedAssignments)
    .select();
    
  if (error) {
    console.error('Error bulk saving schedule assignments:', error);
    throw new Error(`Failed to bulk save schedule assignments: ${error.message}`);
  }
  
  return data || [];
}

// ============= Analytics and Training Data =============

export async function saveTrainingData(trainingData: {
  employee_features: Record<string, any>;
  seat_features: Record<string, any>;
  context_features: Record<string, any>;
  target_assignment: Record<string, any>;
  data_source: string;
  satisfaction_score?: number;
  assignment_success?: boolean;
  constraint_violations?: number;
  model_version?: string;
  training_batch?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('ai_training_data')
    .insert(trainingData);
    
  if (error) {
    console.error('Error saving training data:', error);
    throw new Error(`Failed to save training data: ${error.message}`);
  }
}

export async function saveModelPerformance(performance: {
  model_type: string;
  model_version: string;
  assignment_date: string;
  total_assignments: number;
  successful_assignments?: number;
  avg_satisfaction?: number;
  avg_constraint_adherence?: number;
  processing_time_ms?: number;
  metrics?: Record<string, any>;
}): Promise<void> {
  const { error } = await supabase
    .from('model_performance')
    .insert(performance);
    
  if (error) {
    console.error('Error saving model performance:', error);
    throw new Error(`Failed to save model performance: ${error.message}`);
  }
}

// ============= Data Transformation Functions =============

function dbEmployeeToEmployee(dbEmployee: DbEmployee): Employee {
  return {
    employee_id: dbEmployee.employee_id,
    full_name: dbEmployee.full_name,
    team: dbEmployee.team,
    department: dbEmployee.department,
    preferred_work_mode: (dbEmployee.preferred_work_mode as "hybrid" | "remote" | "office") || "hybrid",
    needs_accessible: dbEmployee.needs_accessible || false,
    prefer_window: dbEmployee.prefer_window || false,
    preferred_zone: dbEmployee.preferred_zone || "ZoneA",
    onsite_ratio: Number(dbEmployee.onsite_ratio) || 0.5,
    project_count: dbEmployee.project_count || 1,
    preferred_days: dbEmployee.preferred_days || []
  };
}

function employeeToDbEmployee(employee: Partial<Employee>): Partial<DbEmployeeInsert> {
  const dbEmployee: any = {};
  
  if (employee.employee_id) dbEmployee.employee_id = employee.employee_id;
  if (employee.full_name) dbEmployee.full_name = employee.full_name;
  if (employee.team) dbEmployee.team = employee.team;
  if (employee.department) dbEmployee.department = employee.department;
  if (employee.preferred_work_mode) dbEmployee.preferred_work_mode = employee.preferred_work_mode;
  if (employee.needs_accessible !== undefined) dbEmployee.needs_accessible = employee.needs_accessible;
  if (employee.prefer_window !== undefined) dbEmployee.prefer_window = employee.prefer_window;
  if (employee.preferred_zone) dbEmployee.preferred_zone = employee.preferred_zone;
  if (employee.onsite_ratio !== undefined) dbEmployee.onsite_ratio = employee.onsite_ratio;
  if (employee.project_count) dbEmployee.project_count = employee.project_count;
  if (employee.preferred_days) dbEmployee.preferred_days = employee.preferred_days;
  
  return dbEmployee;
}

function dbSeatToSeat(dbSeat: DbSeat): Seat {
  return {
    seat_id: dbSeat.seat_id,
    floor: dbSeat.floor,
    zone: dbSeat.zone,
    is_accessible: dbSeat.is_accessible || false,
    is_window: dbSeat.is_window || false,
    x: dbSeat.x_coordinate,
    y: dbSeat.y_coordinate
  };
}

function seatToDbSeat(seat: Partial<Seat>): Partial<DbSeatInsert> {
  const dbSeat: any = {};
  
  if (seat.seat_id) dbSeat.seat_id = seat.seat_id;
  if (seat.floor !== undefined) dbSeat.floor = seat.floor;
  if (seat.zone) dbSeat.zone = seat.zone;
  if (seat.is_accessible !== undefined) dbSeat.is_accessible = seat.is_accessible;
  if (seat.is_window !== undefined) dbSeat.is_window = seat.is_window;
  if (seat.x !== undefined) dbSeat.x_coordinate = seat.x;
  if (seat.y !== undefined) dbSeat.y_coordinate = seat.y;
  
  return dbSeat;
}

// ============= Utility Functions =============

export async function clearAllData(): Promise<void> {
  // Clear in reverse order of dependencies
  await supabase.from('schedule_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ai_training_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('model_performance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('team_collaborations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function getDataStats(): Promise<{
  employees: number;
  seats: number;
  scheduleAssignments: number;
  trainingRecords: number;
}> {
  const [employeesResult, seatsResult, assignmentsResult, trainingResult] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }),
    supabase.from('seats').select('id', { count: 'exact', head: true }),
    supabase.from('schedule_assignments').select('id', { count: 'exact', head: true }),
    supabase.from('ai_training_data').select('id', { count: 'exact', head: true })
  ]);
  
  return {
    employees: employeesResult.count || 0,
    seats: seatsResult.count || 0,
    scheduleAssignments: assignmentsResult.count || 0,
    trainingRecords: trainingResult.count || 0
  };
}