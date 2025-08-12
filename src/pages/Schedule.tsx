import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import CalendarView from "@/components/planner/CalendarView";
import WarningsBanner from "@/components/planner/WarningsBanner";
import AssignmentControls from "@/components/planner/AssignmentControls";
import { 
  DAYS, 
  DayKey, 
  toLegacyEmployee,
  toLegacySeat
} from "@/types/planner";
import {
  MOCK_EMPLOYEES, 
  MOCK_SEATS, 
  DEFAULT_WEIGHTS, 
  DEFAULT_CONSTRAINTS,
  Weights,
  Employee,
  Seat
} from "@/data/mock";
import { generateSchedule, assignSeats } from "@/lib/api";
import { Calendar, Users, MapPin, AlertTriangle, Download, Save, RotateCcw } from "lucide-react";

const SchedulePage = () => {
  const [schedule, setSchedule] = React.useState<Record<DayKey, string[]>>({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [dayCaps, setDayCaps] = React.useState(DEFAULT_CONSTRAINTS.dayCapacities);
  const [deptCap, setDeptCap] = React.useState(DEFAULT_CONSTRAINTS.deptCapacity);
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [weights, setWeights] = React.useState<Weights>(DEFAULT_WEIGHTS);
  const [warnings, setWarnings] = React.useState<any[]>([]);
  const [seatAssignments, setSeatAssignments] = React.useState<Record<string, string>>({});
  const [employees, setEmployees] = React.useState<Employee[]>(MOCK_EMPLOYEES);
  const [seats, setSeats] = React.useState<Seat[]>(MOCK_SEATS);
  const [loading, setLoading] = React.useState(false);

  // Convert to legacy format for components
  const legacyEmployees = React.useMemo(() => employees.map(toLegacyEmployee), [employees]);
  const legacySeats = React.useMemo(() => seats.map(toLegacySeat), [seats]);

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const payload = {
        employees,
        constraints: {
          day_capacities: dayCaps,
          dept_capacity: deptCap,
          team_clusters: clusterTeams,
        },
        weights,
      };

      const result = await generateSchedule(payload);
      setSchedule(result.schedule as Record<DayKey, string[]>);
      setWarnings(result.violations);
      
      toast({
        title: "Schedule generated",
        description: `Generated schedule for ${result.meta.total_scheduled} employee-days.`,
      });
    } catch (error) {
      toast({
        title: "Error generating schedule",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignSeatsForDay = async () => {
    const dayEmployees = schedule[selectedDay] || [];
    if (dayEmployees.length === 0) {
      toast({
        title: "No employees scheduled",
        description: `No employees are scheduled for ${selectedDay}.`,
      });
      return;
    }

    setLoading(true);
    try {
      const employeesForDay = employees.filter(emp => dayEmployees.includes(emp.employee_id));
      
      const payload = {
        employees: employeesForDay,
        seats,
        weights,
        solver,
        constraints: {
          team_clusters: clusterTeams,
          dept_capacity: deptCap,
        },
      };

      const result = await assignSeats(payload);
      
      // Convert assignments to the format expected by the calendar
      const assignments: Record<string, string> = {};
      result.assignments.forEach(assignment => {
        assignments[assignment.employee_id] = assignment.seat_id;
      });

      setSeatAssignments(assignments);
      
      toast({
        title: "Seats assigned",
        description: `Assigned ${result.assignments.length} seats for ${selectedDay}. Average score: ${(result.assignments.reduce((sum, a) => sum + a.score, 0) / result.assignments.length || 0).toFixed(2)}`,
      });
    } catch (error) {
      toast({
        title: "Error assigning seats",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSchedule({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
    setSeatAssignments({});
    setWarnings([]);
    toast({ title: "Schedule reset", description: "All data has been cleared." });
  };

  const handleSave = () => {
    // Save to localStorage for demo purposes
    const saveData = {
      schedule,
      seatAssignments,
      weights,
      constraints: { dayCaps, deptCap, clusterTeams },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('schedule_data', JSON.stringify(saveData));
    toast({ title: "Schedule saved", description: "Schedule saved to browser storage." });
  };

  const handleExport = () => {
    // Export schedule as CSV
    const csvRows = ['Day,Employee ID,Full Name,Team,Department,Seat ID'];
    
    DAYS.forEach(day => {
      schedule[day].forEach(empId => {
        const employee = employees.find(e => e.employee_id === empId);
        const seatId = seatAssignments[empId] || 'Unassigned';
        
        csvRows.push([
          day,
          empId,
          employee?.full_name || 'Unknown',
          employee?.team || 'Unknown',
          employee?.department || 'Unknown',
          seatId
        ].join(','));
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = React.useMemo(() => {
    const totalScheduled = DAYS.reduce((sum, day) => sum + schedule[day].length, 0);
    const avgUtilization = DAYS.reduce((sum, day) => {
      const capacity = Math.floor((dayCaps[day] / 100) * seats.length);
      return sum + (schedule[day].length / (capacity || 1)) * 100;
    }, 0) / DAYS.length;

    return {
      totalScheduled,
      avgUtilization: avgUtilization || 0,
      violations: warnings.length,
      assigned: Object.keys(seatAssignments).length,
    };
  }, [schedule, dayCaps, warnings.length, seatAssignments, seats.length]);

  const teamClass = React.useCallback((team: string) => {
    const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
    const index = teams.indexOf(team);
    return `team-bg-${(index % 8) + 1}`;
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground mt-2">
            Generate and optimize weekly schedules for hybrid work
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScheduled}</div>
            <p className="text-xs text-muted-foreground">employee-days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">office capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Seats Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">for {selectedDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.violations}</div>
            <p className="text-xs text-muted-foreground">constraint issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      <WarningsBanner warnings={warnings} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Day Capacities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Capacity Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS.map(day => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day}</span>
                      <Badge variant="outline">{dayCaps[day]}%</Badge>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={dayCaps[day]}
                      onChange={(e) => setDayCaps(prev => ({ ...prev, [day]: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assignment Controls */}
            <AssignmentControls
              weights={weights}
              onWeightsChange={setWeights}
              solver={solver}
              onSolverChange={setSolver}
              teamClusters={clusterTeams}
              onTeamClustersChange={setClusterTeams}
              deptCapacity={deptCap}
              onDeptCapacityChange={setDeptCap}
              maxAssignments={undefined}
              onMaxAssignmentsChange={() => {}}
              onAssign={assignSeatsForDay}
              onReset={handleReset}
              onSave={handleSave}
              onLoadCsv={() => {}} // TODO: Implement CSV upload
              loading={loading}
            />

            {/* Generate Schedule Button */}
            <Button 
              onClick={handleGenerateSchedule} 
              disabled={loading}
              variant="hero"
              className="w-full"
              size="lg"
            >
              {loading ? "Generating..." : "Generate Weekly Schedule"}
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2">
          <CalendarView
            schedule={schedule}
            employees={legacyEmployees}
            selectedDay={selectedDay}
            teamColor={teamClass}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;