// ============= Updated Types to Match Enhanced Data Structure =============

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

// Updated Employee interface to match the enhanced structure
export interface Employee {
  employee_id: string;  // Changed from 'id'
  full_name: string;    // Changed from 'name'
  team: string;
  department: string;   // Changed from 'dept'
  preferred_work_mode: "hybrid" | "remote" | "office";
  needs_accessible: boolean;
  prefer_window: boolean;
  preferred_zone: string;
  onsite_ratio: number; // Changed from optional
  project_count: number;
  preferred_days: string[]; // Changed from DayKey[] to string[]
}

// Updated Seat interface to match the enhanced structure
export interface Seat {
  seat_id: string;      // Changed from 'id'
  floor: number;
  zone: string;         // No longer optional
  is_accessible: boolean;
  is_window: boolean;
  x: number;            // Grid position
  y: number;            // Grid position
}

// Legacy type aliases for backward compatibility
export interface LegacyEmployee {
  id: string;
  name: string;
  team: string;
  dept: string;
  preferredDays: DayKey[];
  onsiteRatio?: number;
  zone?: string;
}

export interface LegacySeat {
  id: string;
  floor: number;
  x: number;
  y: number;
  zone?: string;
}

export type Schedule = Record<DayKey, string[]>; // employee ids per day
export type DayCapacities = Record<DayKey, number>; // percentage 0..100
export type SeatAssignments = Record<DayKey, Record<string, string>>; // employeeId -> seatId

export interface WarningItem {
  day: DayKey;
  rule: string;
  details?: string;
  severity?: "info" | "warn" | "error";
}

export const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Helper functions to convert between old and new formats
export function toLegacyEmployee(emp: Employee): LegacyEmployee {
  return {
    id: emp.employee_id,
    name: emp.full_name,
    team: emp.team,
    dept: emp.department,
    preferredDays: emp.preferred_days as DayKey[],
    onsiteRatio: emp.onsite_ratio,
    zone: emp.preferred_zone,
  };
}

export function toLegacySeat(seat: Seat): LegacySeat {
  return {
    id: seat.seat_id,
    floor: seat.floor,
    x: seat.x,
    y: seat.y,
    zone: seat.zone,
  };
}

export function fromLegacyEmployee(emp: LegacyEmployee): Employee {
  return {
    employee_id: emp.id,
    full_name: emp.name,
    team: emp.team,
    department: emp.dept,
    preferred_work_mode: "hybrid",
    needs_accessible: false,
    prefer_window: false,
    preferred_zone: emp.zone || "ZoneA",
    onsite_ratio: emp.onsiteRatio || 0.5,
    project_count: 1,
    preferred_days: emp.preferredDays,
  };
}