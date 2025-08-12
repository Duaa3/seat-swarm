export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface Employee {
  id: string;
  name: string;
  team: string;
  dept: string;
  preferredDays: DayKey[];
  onsiteRatio?: number;
  zone?: string;
}

export interface Seat {
  id: string;
  floor: number;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
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