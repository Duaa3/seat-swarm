import React from "react";
import CsvUploader from "@/components/planner/CsvUploader";
import { DataManager } from "@/components/DataManager";
import PlannerControls, { Weights } from "@/components/planner/PlannerControls";
import CalendarView from "@/components/planner/CalendarView";
import SeatingMap from "@/components/planner/SeatingMap";
import WarningsBanner from "@/components/planner/WarningsBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { DAYS, DayKey, DayCapacities, Schedule, SeatAssignments, WarningItem, toLegacyEmployee, toLegacySeat } from "@/types/planner";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useScheduleData } from "@/hooks/useScheduleData";

const Index = () => {
  // Data hooks
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments, saveSchedule, saveSeatAssignments, clearSchedule } = useScheduleData();

  // Controls
  const [dayCaps, setDayCaps] = React.useState<DayCapacities>(() => ({ Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90 }));
  const [deptCap, setDeptCap] = React.useState<number>(60);
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [weights, setWeights] = React.useState<Weights>({ seatSatisfaction: 0.7, onsite: 0.6, projectPenalty: 0.4, zone: 0.5 });
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [warnings, setWarnings] = React.useState<WarningItem[]>([]);

  // Convert database data to legacy format for compatibility with existing components
  const employees = React.useMemo(() => 
    dbEmployees.map(toLegacyEmployee), [dbEmployees]);

  const allSeats = React.useMemo(() => 
    dbSeats.map(toLegacySeat), [dbSeats]);

  const allDepts = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.department))], [dbEmployees]);
  
  const allTeams = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.team))], [dbEmployees]);

  const floor1Seats = React.useMemo(() => 
    dbSeats.filter(s => s.floor === 1).map(toLegacySeat), [dbSeats]);
  
  const floor2Seats = React.useMemo(() => 
    dbSeats.filter(s => s.floor === 2).map(toLegacySeat), [dbSeats]);

  const totalSeats = React.useMemo(() => allSeats.length, [allSeats]);

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, [allTeams]);

  async function generateSchedule() {
    if (employees.length === 0) {
      toast({ 
        title: "No employees", 
        description: "Please load employee data first.",
        variant: "destructive"
      });
      return;
    }

    const perDeptCounts = Object.fromEntries(allDepts.map((d) => [d, employees.filter((e) => e.dept === d).length])) as Record<string, number>;
    const perDeptDailyCap = Object.fromEntries(Object.entries(perDeptCounts).map(([d, n]) => [d, Math.floor((deptCap / 100) * n)])) as Record<string, number>;

    const next: Schedule = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };

    DAYS.forEach((day) => {
      const capSeats = Math.floor((dayCaps[day] / 100) * totalSeats);
      const deptCount: Record<string, number> = Object.fromEntries(allDepts.map((d) => [d, 0]));

      // Prefer employees who like this day, then fill others
      const preferred = employees.filter((e) => e.preferredDays.includes(day));
      const others = employees.filter((e) => !e.preferredDays.includes(day));
      const order = [...preferred, ...others];

      for (const e of order) {
        if (next[day].length >= capSeats) break;
        if (deptCount[e.dept] >= perDeptDailyCap[e.dept]) continue;
        next[day].push(e.id);
        deptCount[e.dept]++;
      }
    });

    // Save schedule to database
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Start of current week (Monday)
    
    try {
      await saveSchedule(next, dbEmployees, weekStart.toISOString().split('T')[0]);
      setWarnings([]);
      toast({ title: "Schedule generated", description: "A draft plan was created and saved to database." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save schedule to database.",
        variant: "destructive"
      });
    }
  }

  async function assignSeatsForDay(day: DayKey) {
    const ids = schedule[day];
    if (!ids?.length) {
      toast({ title: "No schedule", description: `No employees scheduled for ${day}.` });
      return;
    }

    if (allSeats.length === 0) {
      toast({ 
        title: "No seats", 
        description: "Please load seat data first.",
        variant: "destructive"
      });
      return;
    }

    // Greedy seat assignment (group clustered teams together by floor when possible)
    const dayAssign: Record<string, string> = {};

    // Try place clustered teams on same floor
    const clusteredIds = ids.filter((id) => clusterTeams.includes(employees.find((e) => e.id === id)?.team || ""));
    const nonClusteredIds = ids.filter((id) => !clusteredIds.includes(id));

    // Heuristic: choose floor with more free seats for clusters
    const dayTotal = ids.length;
    const floor1Cap = floor1Seats.length;
    const floor2Cap = floor2Seats.length;

    let f1Slots = Math.min(floor1Cap, Math.ceil(dayTotal / 2));
    let f2Slots = Math.min(floor2Cap, dayTotal - f1Slots);

    const placeList = (list: string[], seatsPool: string[]) => {
      for (let i = 0; i < list.length && i < seatsPool.length; i++) {
        dayAssign[list[i]] = seatsPool[i];
      }
      // remove used
      return seatsPool.slice(list.length);
    };

    let f1Seats = floor1Seats.map((s) => s.id);
    let f2Seats = floor2Seats.map((s) => s.id);

    // Place clusters first on the larger slot floor
    const f1First = f1Slots >= f2Slots;
    if (f1First) {
      f1Seats = placeList(clusteredIds, f1Seats);
      f2Seats = placeList(nonClusteredIds, f2Seats);
    } else {
      f2Seats = placeList(clusteredIds, f2Seats);
      f1Seats = placeList(nonClusteredIds, f1Seats);
    }

    // Fill remaining employees
    const remaining = ids.filter((id) => !dayAssign[id]);
    const allRemainingSeats = [...f1Seats, ...f2Seats];
    for (let i = 0; i < remaining.length && i < allRemainingSeats.length; i++) {
      dayAssign[remaining[i]] = allRemainingSeats[i];
    }

    // Save assignments to database
    const today = new Date();
    const dayIndex = DAYS.indexOf(day);
    const assignmentDate = new Date(today);
    assignmentDate.setDate(today.getDate() - today.getDay() + 1 + dayIndex);

    try {
      await saveSeatAssignments(dayAssign, day, dbSeats, dbEmployees, assignmentDate.toISOString().split('T')[0]);

      // Generate warnings
      const warns: WarningItem[] = [];
      // Capacity per floor
      const f1Assigned = Object.values(dayAssign).filter((sid) => sid.startsWith("F1")).length;
      const f2Assigned = Object.values(dayAssign).filter((sid) => sid.startsWith("F2")).length;
      if (f1Assigned > floor1Cap) warns.push({ day, rule: "Floor 1 capacity exceeded", severity: "error" });
      if (f2Assigned > floor2Cap) warns.push({ day, rule: "Floor 2 capacity exceeded", severity: "error" });

      // Cluster rule
      for (const t of clusterTeams) {
        const members = ids.filter((id) => employees.find((e) => e.id === id)?.team === t);
        if (members.length > 1) {
          const floors = new Set(members.map((id) => (dayAssign[id] || "").slice(0, 2)));
          if (floors.size > 1) {
            warns.push({ day, rule: "Cluster split across floors", details: `${t} team not seated together`, severity: "warn" });
          }
        }
      }

      setWarnings(warns);
      toast({ title: "Seats assigned", description: `Assigned ${Object.keys(dayAssign).length} seats for ${day}.` });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save seat assignments to database.",
        variant: "destructive"
      });
    }
  }

  const isDataLoaded = dbEmployees.length > 0 && dbSeats.length > 0;
  const isLoading = employeesLoading || seatsLoading;

  return (
    <div>
      <header className="py-10">
        <div className="container">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Smart Office Seating Planner</h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">Plan hybrid attendance, respect capacity and team rules, and visualize seat layouts across floors.</p>
            </div>
            <Button 
              variant="hero" 
              onClick={generateSchedule}
              disabled={isLoading || !isDataLoaded}
            >
              Generate Schedule
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-8 pb-12">
        {!isDataLoaded && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <DataManager />
            </CardContent>
          </Card>
        )}

        <CsvUploader 
          onEmployeesLoaded={async (employees) => {
            // This will be handled by the CSV uploader component 
            // which should use the hooks to save to database
          }}
          onSeatsLoaded={async (seats) => {
            // This will be handled by the CSV uploader component
            // which should use the hooks to save to database
          }}
        />

        <WarningsBanner warnings={warnings} />

        {isDataLoaded && (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <PlannerControls
              dayCaps={dayCaps}
              onDayCapChange={(day, v) => setDayCaps((s) => ({ ...s, [day]: v }))}
              deptCap={deptCap}
              onDeptCapChange={setDeptCap}
              clusterTeams={clusterTeams}
              onClusterTeamsChange={setClusterTeams}
              solver={solver}
              onSolverChange={setSolver}
              weights={weights}
              onWeightsChange={setWeights}
              onGenerate={generateSchedule}
              onAssignDay={() => assignSeatsForDay(selectedDay)}
              selectedDay={selectedDay}
              onSelectedDayChange={setSelectedDay}
            />

            <CalendarView schedule={schedule} employees={employees} selectedDay={selectedDay} />
          </div>
        )}

        {isDataLoaded && (
          <SeatingMap day={selectedDay} assignments={assignments[selectedDay]} seats={allSeats} employees={employees} teamColor={teamClass} />
        )}

        <Card>
          <CardContent className="text-xs text-muted-foreground pt-6">
            This system now uses Supabase for data persistence. Employee and seat data is stored in the database, and schedules/assignments are saved with AI training data for continuous improvement.
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;