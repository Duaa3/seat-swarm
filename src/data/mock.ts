import { Employee, Seat } from "@/types/planner";
import { DAYS } from "@/types/planner";

// Mock Employees (30 across 6 teams, 3 departments)
const teams = ["Core", "Design", "Sales", "Ops", "Data", "QA"] as const;
const depts = ["Engineering", "GoToMarket", "Operations"] as const;

function pickDays(seed: number) {
  const prefs = [DAYS[seed % 5], DAYS[(seed + 2) % 5]]; // 2 preferred days
  return Array.from(new Set(prefs));
}

export const employees: Employee[] = Array.from({ length: 30 }).map((_, i) => {
  const team = teams[i % teams.length];
  const dept = depts[i % depts.length];
  return {
    id: `emp-${i + 1}`,
    name: `${team} Member ${i + 1}`,
    team,
    dept,
    preferredDays: pickDays(i),
    onsiteRatio: 0.5 + ((i * 7) % 40) / 100, // 0.5 - 0.9
  } satisfies Employee;
});

// Seats: Floor 1 (48), Floor 2 (50)
function gridSeats(floor: number, cols: number, rows: number, count: number): Seat[] {
  const seats: Seat[] = [];
  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (id > count) break;
      const x = ((c + 0.5) / cols) * 100; // center of cell
      const y = ((r + 0.5) / rows) * 100;
      seats.push({ id: `F${floor}-S${id}`, floor, x, y, zone: y < 50 ? "North" : "South" });
      id++;
    }
  }
  return seats;
}

export const floor1Seats: Seat[] = gridSeats(1, 8, 6, 48);
export const floor2Seats: Seat[] = gridSeats(2, 10, 5, 50);
export const allSeats: Seat[] = [...floor1Seats, ...floor2Seats];

export const allTeams = Array.from(new Set(employees.map((e) => e.team)));
export const allDepts = Array.from(new Set(employees.map((e) => e.dept)));
