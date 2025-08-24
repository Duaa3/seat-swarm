// ============= Enhanced Mock Data with Single Source of Truth =============

export interface Employee {
  id: string;
  full_name: string;
  team: string;
  department: string;
  preferred_work_mode: "hybrid" | "remote" | "onsite" | null;
  needs_accessible: boolean;
  prefer_window: boolean;
  preferred_zone: string | null;
  onsite_ratio: number | null;
  project_count: number | null;
  preferred_days: string[] | null;
  priority_level?: number | null;
  client_site_ratio?: number | null;
  commute_minutes?: number | null;
  availability_ratio?: number | null;
  extra?: any;
}

export interface Seat {
  id: string;
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

// Generate 350 Mock Employees
function generateEmployees(): Employee[] {
  const firstNames = ["Aisha", "Hilal", "Maya", "David", "Sofia", "James", "Elena", "Ahmad", "Lisa", "Roberto", "Sarah", "Michael", "Priya", "Carlos", "Emma", "Hassan", "Fatima", "Alex", "Nina", "Omar", "Lucia", "Mark", "Zara", "Sam", "Leila", "Kevin", "Amara", "Ben", "Yasmin", "Ryan"];
  const lastNames = ["Rahman", "Ahmed", "Chen", "Kim", "Garcia", "Wilson", "Petrov", "Hassan", "Thompson", "Silva", "Johnson", "Brown", "Patel", "Martinez", "Davis", "Ali", "Khan", "Lee", "Miller", "Jones", "Smith", "Lopez", "Clark", "Nguyen", "Taylor", "White", "Anderson", "Williams", "Jackson", "Martin"];
  const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA", "Support"];
  const departments = ["Core", "GoToMarket", "Operations"];
  const workModes: ("hybrid" | "remote" | "onsite")[] = ["hybrid", "remote", "onsite"];
  const zones = ["ZoneA", "ZoneB", "ZoneC"];
  const daysCombos = [["Mon","Wed"], ["Tue","Thu"], ["Mon","Fri"], ["Mon","Tue","Wed"], ["Wed","Thu"], ["Fri"], ["Mon","Wed","Fri"], ["Tue","Thu"], ["Mon","Tue","Wed","Thu"], ["Wed","Thu","Fri"]];

  return Array.from({ length: 350 }, (_, i) => {
    const empId = String(i + 1).padStart(3, '0');
    return {
      id: `E${empId}`,
      full_name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
      team: teams[i % teams.length],
      department: departments[i % departments.length],
      preferred_work_mode: workModes[i % workModes.length],
      needs_accessible: Math.random() < 0.15, // ~15% need accessibility
      prefer_window: Math.random() < 0.6, // ~60% prefer windows
      preferred_zone: zones[i % zones.length],
      onsite_ratio: Math.round((0.3 + Math.random() * 0.6) * 100) / 100, // 0.3-0.9
      project_count: Math.floor(Math.random() * 6) + 1, // 1-6 projects
      preferred_days: daysCombos[i % daysCombos.length],
      priority_level: Math.floor(Math.random() * 5) + 1,
      client_site_ratio: Math.random() * 0.5,
      commute_minutes: Math.floor(Math.random() * 60) + 10,
      availability_ratio: 0.8 + Math.random() * 0.2,
      extra: null
    };
  });
}

export const MOCK_EMPLOYEES: Employee[] = generateEmployees();

// Generate 98 Mock Seats (48 on Floor 1, 50 on Floor 2)
function generateSeats(): Seat[] {
  const zones = ["ZoneA", "ZoneB", "ZoneC"];
  const seats: Seat[] = [];
  
  // Floor 1: 48 seats (8x6 grid)
  for (let i = 0; i < 48; i++) {
    const seatNum = String(i + 1).padStart(2, '0');
    const x = (i % 8) + 1;
    const y = Math.floor(i / 8) + 1;
    const zone = zones[i % zones.length];
    
    seats.push({
      id: `F1-S${seatNum}`,
      floor: 1,
      zone,
      is_accessible: i < 12, // First 12 seats are accessible
      is_window: x === 1 || x === 8 || y === 1 || y === 6, // Perimeter seats have windows
      x,
      y,
    });
  }
  
  // Floor 2: 50 seats (10x5 grid)
  for (let i = 0; i < 50; i++) {
    const seatNum = String(i + 1).padStart(2, '0');
    const x = (i % 10) + 1;
    const y = Math.floor(i / 10) + 1;
    const zone = zones[i % zones.length];
    
    seats.push({
      id: `F2-S${seatNum}`,
      floor: 2,
      zone,
      is_accessible: i < 10, // First 10 seats are accessible
      is_window: x === 1 || x === 10 || y === 1 || y === 5, // Perimeter seats have windows
      x,
      y,
    });
  }
  
  return seats;
}

export const MOCK_SEATS: Seat[] = generateSeats();

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