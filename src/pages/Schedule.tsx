import React from "react";
import PlannerControls, { Weights } from "@/components/planner/PlannerControls";
import CalendarView from "@/components/planner/CalendarView";
import WarningsBanner from "@/components/planner/WarningsBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DAYS, DayKey, DayCapacities, type Schedule, WarningItem } from "@/types/planner";
import { employees, allSeats, allDepts, allTeams } from "@/data/mock";
import { Download, RefreshCw, Save } from "lucide-react";

const SchedulePage = () => {
  // Controls
  const [dayCaps, setDayCaps] = React.useState<DayCapacities>(() => ({ Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90 }));
  const [deptCap, setDeptCap] = React.useState<number>(60);
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [weights, setWeights] = React.useState<Weights>({ seatSatisfaction: 0.7, onsite: 0.6, projectPenalty: 0.4, zone: 0.5 });
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");

  // Data
  const [schedule, setSchedule] = React.useState<Schedule>(() => ({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }));
  const [warnings, setWarnings] = React.useState<WarningItem[]>([]);

  const totalSeats = React.useMemo(() => allSeats.length, []);

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, []);

  const scheduleStats = React.useMemo(() => {
    const totalScheduled = Object.values(schedule).flat().length;
    const averagePerDay = totalScheduled / DAYS.length;
    const maxDay = Math.max(...Object.values(schedule).map(day => day.length));
    const utilizationRate = (averagePerDay / totalSeats) * 100;

    return {
      totalScheduled: totalScheduled / DAYS.length, // unique employees
      averagePerDay: averagePerDay.toFixed(1),
      maxDay,
      utilizationRate: utilizationRate.toFixed(1),
    };
  }, [schedule, totalSeats]);

  function generateSchedule() {
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

    setSchedule(next);
    setWarnings([]);
    toast({ title: "Schedule generated", description: "A draft plan was created with your constraints." });
  }

  const handleSaveSchedule = () => {
    toast({ title: "Schedule saved", description: "Your schedule has been saved successfully." });
  };

  const handleExportSchedule = () => {
    toast({ title: "Schedule exported", description: "Schedule data exported to CSV." });
  };

  const handleResetSchedule = () => {
    setSchedule({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
    setWarnings([]);
    toast({ title: "Schedule reset", description: "All schedule data has been cleared." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure constraints and generate optimal weekly schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSchedule}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="soft" onClick={handleSaveSchedule}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={handleExportSchedule}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <WarningsBanner warnings={warnings} />

      {/* Schedule Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleStats.averagePerDay}</div>
            <p className="text-xs text-muted-foreground">employees scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleStats.maxDay}</div>
            <p className="text-xs text-muted-foreground">maximum attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleStats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">of available seats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusterTeams.length}</div>
            <p className="text-xs text-muted-foreground">clustered teams</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
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
          onAssignDay={() => toast({ title: "Navigate to Seating", description: "Go to Seating Map to assign seats." })}
          selectedDay={selectedDay}
          onSelectedDayChange={setSelectedDay}
        />

        <CalendarView 
          schedule={schedule} 
          employees={employees} 
          teamColor={teamClass} 
          selectedDay={selectedDay} 
        />
      </div>

      <Card>
        <CardContent className="text-xs text-muted-foreground pt-6">
          This schedule uses a greedy algorithm respecting capacity and department constraints. 
          Connect to optimization APIs for more sophisticated algorithms.
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;