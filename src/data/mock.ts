// ============= Enhanced Mock Data with Single Source of Truth =============

export interface Employee {
  employee_id: string;
  full_name: string;
  team: string;
  department: string;
  preferred_work_mode: "hybrid" | "remote" | "office";
  needs_accessible: boolean;
  prefer_window: boolean;
  preferred_zone: string;
  onsite_ratio: number;
  project_count: number;
  preferred_days: string[];
}

export interface Seat {
  seat_id: string;
  floor: number;
  zone: string;
  is_accessible: boolean;
  is_window: boolean;
  x: number; // Grid position
  y: number; // Grid position
}

export interface Assignment {
  employee_id: string;
  seat_id: string;
  score: number;
  reasons: {
    p_satisfaction: number;
    p_onsite_ratio: number;
    project_load: number;
    window_match: number;
    accessible_match: number;
    zone_match: number;
  };
}

export interface Weights {
  w_seat_satisfaction: number;
  w_onsite_ratio: number;
  w_project_penalty: number;
  w_window: number;
  w_accessible: number;
  w_zone: number;
}

export const DEFAULT_WEIGHTS: Weights = {
  w_seat_satisfaction: 3.0,
  w_onsite_ratio: 2.0,
  w_project_penalty: -0.05,
  w_window: 1.0,
  w_accessible: 1.5,
  w_zone: 0.5,
};

// Mock Employees (30 across 6 teams, 3 departments)
export const MOCK_EMPLOYEES: Employee[] = [
  { employee_id: "E001", full_name: "Aisha Rahman", team: "Network", department: "Core", preferred_work_mode: "hybrid", needs_accessible: false, prefer_window: true, preferred_zone: "ZoneB", onsite_ratio: 0.62, project_count: 3, preferred_days: ["Mon","Wed"] },
  { employee_id: "E002", full_name: "Hilal Ahmed", team: "CoreOps", department: "Core", preferred_work_mode: "hybrid", needs_accessible: true, prefer_window: false, preferred_zone: "ZoneA", onsite_ratio: 0.71, project_count: 4, preferred_days: ["Tue","Thu"] },
  { employee_id: "E003", full_name: "Maya Chen", team: "Design", department: "GoToMarket", preferred_work_mode: "hybrid", needs_accessible: false, prefer_window: true, preferred_zone: "ZoneB", onsite_ratio: 0.55, project_count: 2, preferred_days: ["Mon","Fri"] },
  { employee_id: "E004", full_name: "David Kim", team: "Sales", department: "GoToMarket", preferred_work_mode: "office", needs_accessible: false, prefer_window: false, preferred_zone: "ZoneA", onsite_ratio: 0.85, project_count: 5, preferred_days: ["Mon","Tue","Wed"] },
  { employee_id: "E005", full_name: "Sofia Garcia", team: "Ops", department: "Operations", preferred_work_mode: "hybrid", needs_accessible: true, prefer_window: true, preferred_zone: "ZoneC", onsite_ratio: 0.60, project_count: 3, preferred_days: ["Wed","Thu"] },
  { employee_id: "E006", full_name: "James Wilson", team: "Data", department: "Core", preferred_work_mode: "remote", needs_accessible: false, prefer_window: false, preferred_zone: "ZoneA", onsite_ratio: 0.40, project_count: 1, preferred_days: ["Fri"] },
  { employee_id: "E007", full_name: "Elena Petrov", team: "QA", department: "Core", preferred_work_mode: "hybrid", needs_accessible: false, prefer_window: true, preferred_zone: "ZoneB", onsite_ratio: 0.65, project_count: 4, preferred_days: ["Mon","Wed","Fri"] },
  { employee_id: "E008", full_name: "Ahmad Hassan", team: "Network", department: "Core", preferred_work_mode: "hybrid", needs_accessible: false, prefer_window: false, preferred_zone: "ZoneA", onsite_ratio: 0.70, project_count: 3, preferred_days: ["Tue","Thu"] },
  { employee_id: "E009", full_name: "Lisa Thompson", team: "Design", department: "GoToMarket", preferred_work_mode: "hybrid", needs_accessible: true, prefer_window: true, preferred_zone: "ZoneC", onsite_ratio: 0.58, project_count: 2, preferred_days: ["Mon","Wed"] },
  { employee_id: "E010", full_name: "Roberto Silva", team: "Sales", department: "GoToMarket", preferred_work_mode: "office", needs_accessible: false, prefer_window: true, preferred_zone: "ZoneB", onsite_ratio: 0.80, project_count: 6, preferred_days: ["Mon","Tue","Wed","Thu"] },
];

// Mock Seats (20 seats across 2 floors, 3 zones)
export const MOCK_SEATS: Seat[] = [
  // Floor 1 - ZoneA (Accessible area)
  { seat_id: "F1-S01", floor: 1, zone: "ZoneA", is_accessible: true, is_window: false, x: 1, y: 1 },
  { seat_id: "F1-S02", floor: 1, zone: "ZoneA", is_accessible: true, is_window: false, x: 2, y: 1 },
  { seat_id: "F1-S03", floor: 1, zone: "ZoneA", is_accessible: true, is_window: true, x: 3, y: 1 },
  { seat_id: "F1-S04", floor: 1, zone: "ZoneA", is_accessible: false, is_window: true, x: 4, y: 1 },
  { seat_id: "F1-S05", floor: 1, zone: "ZoneB", is_accessible: false, is_window: true, x: 5, y: 1 },
  { seat_id: "F1-S06", floor: 1, zone: "ZoneB", is_accessible: false, is_window: true, x: 6, y: 1 },
  { seat_id: "F1-S07", floor: 1, zone: "ZoneB", is_accessible: false, is_window: false, x: 7, y: 1 },
  { seat_id: "F1-S08", floor: 1, zone: "ZoneB", is_accessible: false, is_window: false, x: 8, y: 1 },
  { seat_id: "F1-S09", floor: 1, zone: "ZoneC", is_accessible: true, is_window: false, x: 1, y: 2 },
  { seat_id: "F1-S10", floor: 1, zone: "ZoneC", is_accessible: false, is_window: false, x: 2, y: 2 },
  
  // Floor 2 - Mixed zones
  { seat_id: "F2-S01", floor: 2, zone: "ZoneA", is_accessible: true, is_window: true, x: 1, y: 1 },
  { seat_id: "F2-S02", floor: 2, zone: "ZoneA", is_accessible: true, is_window: true, x: 2, y: 1 },
  { seat_id: "F2-S03", floor: 2, zone: "ZoneA", is_accessible: false, is_window: true, x: 3, y: 1 },
  { seat_id: "F2-S04", floor: 2, zone: "ZoneB", is_accessible: false, is_window: true, x: 4, y: 1 },
  { seat_id: "F2-S05", floor: 2, zone: "ZoneB", is_accessible: false, is_window: false, x: 5, y: 1 },
  { seat_id: "F2-S06", floor: 2, zone: "ZoneB", is_accessible: false, is_window: false, x: 6, y: 1 },
  { seat_id: "F2-S07", floor: 2, zone: "ZoneC", is_accessible: true, is_window: true, x: 7, y: 1 },
  { seat_id: "F2-S08", floor: 2, zone: "ZoneC", is_accessible: false, is_window: true, x: 8, y: 1 },
  { seat_id: "F2-S09", floor: 2, zone: "ZoneC", is_accessible: false, is_window: false, x: 1, y: 2 },
  { seat_id: "F2-S10", floor: 2, zone: "ZoneC", is_accessible: false, is_window: false, x: 2, y: 2 },
];

// Derived data
export const allTeams = Array.from(new Set(MOCK_EMPLOYEES.map(e => e.team)));
export const allDepartments = Array.from(new Set(MOCK_EMPLOYEES.map(e => e.department)));
export const allZones = Array.from(new Set(MOCK_SEATS.map(s => s.zone)));

// Backward compatibility exports
export const employees = MOCK_EMPLOYEES;
export const allSeats = MOCK_SEATS;
export const allDepts = allDepartments;
export const floor1Seats = MOCK_SEATS.filter(s => s.floor === 1);
export const floor2Seats = MOCK_SEATS.filter(s => s.floor === 2);

// Day definitions
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type DayKey = typeof DAYS[number];

// Weight presets for demo
export const WEIGHT_PRESETS = {
  "Employee-Centric": {
    w_seat_satisfaction: 4.0,
    w_onsite_ratio: 3.0,
    w_project_penalty: -0.1,
    w_window: 2.0,
    w_accessible: 3.0,
    w_zone: 1.5,
  },
  "Capacity-Centric": {
    w_seat_satisfaction: 1.0,
    w_onsite_ratio: 1.0,
    w_project_penalty: -0.02,
    w_window: 0.5,
    w_accessible: 2.0,
    w_zone: 0.2,
  },
  "Balanced": DEFAULT_WEIGHTS,
};

// Schedule type
export type Schedule = Record<DayKey, string[]>; // employee ids per day

// Capacity constraints
export interface Constraints {
  dayCapacities: Record<DayKey, number>; // percentage 0-100
  deptCapacity: number; // max % of department per day
  teamClusters: string[]; // teams that must sit together
  maxAssignments?: number;
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  dayCapacities: { Mon: 70, Tue: 75, Wed: 80, Thu: 75, Fri: 60 },
  deptCapacity: 60,
  teamClusters: [],
};