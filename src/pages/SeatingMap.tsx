import React from "react";
import SeatingMap from "@/components/planner/SeatingMap";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { allTeams } from "@/data/mock";
import WarningsBanner from "@/components/planner/WarningsBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  DAYS, 
  DayKey,
  DayCapacities,
  WarningItem,
  toLegacyEmployee,
  toLegacySeat
} from "@/types/planner";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { MapPin, Users, RefreshCw, Download, Loader2, Sliders, RotateCcw } from "lucide-react";

const SeatingMapPage = () => {
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [warnings, setWarnings] = React.useState<WarningItem[]>([]);
  
  // Seating controls state
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  
  // Use real database data
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments: seatAssignments, loading: scheduleLoading, loadScheduleForWeek, saveSeatAssignments, setAssignments } = useScheduleData();
  
  // Convert to legacy format for components
  const legacyEmployees = React.useMemo(() => dbEmployees.map(toLegacyEmployee), [dbEmployees]);
  const legacySeats = React.useMemo(() => dbSeats.map(toLegacySeat), [dbSeats]);
  
  const allDepts = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.department))], [dbEmployees]);
  
  const allTeams = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.team))], [dbEmployees]);

  const floor1Seats = React.useMemo(() => 
    dbSeats.filter(s => s.floor === 1).map(toLegacySeat), [dbSeats]);
  
  const floor2Seats = React.useMemo(() => 
    dbSeats.filter(s => s.floor === 2).map(toLegacySeat), [dbSeats]);

  const totalSeats = React.useMemo(() => legacySeats.length, [legacySeats]);
  
  const loading = employeesLoading || seatsLoading || scheduleLoading || assignLoading;
  const isDataLoaded = dbEmployees.length > 0 && dbSeats.length > 0;
  
  // Refresh schedule data when the page is focused or when user changes days
  React.useEffect(() => {
    if (isDataLoaded) {
      const refreshSchedule = () => {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        loadScheduleForWeek(weekStart.toISOString().split('T')[0]);
      };
      
      refreshSchedule();
      
      // Refresh when window regains focus (when user switches back from Schedule page)
      const handleFocus = () => {
        console.log('Window focused, refreshing schedule data');
        refreshSchedule();
      };
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('Page became visible, refreshing schedule data');
          refreshSchedule();
        }
      };
      
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Auto-refresh every 10 seconds to catch schedule updates
      const interval = setInterval(refreshSchedule, 10000);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(interval);
      };
    }
  }, [isDataLoaded, loadScheduleForWeek]);

  // Convert seat assignments to assignments format for the current day
  const dayAssignments = React.useMemo(() => {
    const assignments = seatAssignments[selectedDay] || {};
    return Object.entries(assignments).map(([employeeId, seatId]) => ({
      employee_id: employeeId,
      seat_id: seatId,
    }));
  }, [seatAssignments, selectedDay]);

  const dayStats = React.useMemo(() => {
    // Get scheduled employees for the selected day from the loaded schedule
    const scheduledEmployees = schedule[selectedDay] || [];
    const scheduledCount = scheduledEmployees.length;
    
    console.log(`Debug SeatingMap - ${selectedDay}:`);
    console.log('  - scheduledEmployees:', scheduledEmployees);
    console.log('  - seatAssignments[selectedDay]:', seatAssignments[selectedDay]);
    console.log('  - dayAssignments:', dayAssignments);
    
    // Get actual seat assignments for the selected day
    const assigned = dayAssignments.length;
    const unassigned = Math.max(0, scheduledCount - assigned);
    
    // Floor distribution for assigned seats
    const floor1Assignments = dayAssignments.filter(assignment => {
      const seat = dbSeats.find(s => s.id === assignment.seat_id);
      return seat?.floor === 1;
    });
    const floor2Assignments = dayAssignments.filter(assignment => {
      const seat = dbSeats.find(s => s.id === assignment.seat_id);
      return seat?.floor === 2;
    });
    
    const floor1Seats = legacySeats.filter(s => s.floor === 1);
    const floor2Seats = legacySeats.filter(s => s.floor === 2);
    
    return {
      scheduled: scheduledCount,
      assigned,
      unassigned,
      floor1: { assigned: floor1Assignments.length, total: floor1Seats.length },
      floor2: { assigned: floor2Assignments.length, total: floor2Seats.length },
    };
  }, [selectedDay, schedule, dayAssignments, legacySeats, dbSeats]);

  async function assignSeatsForDay(day: DayKey) {
    const ids = schedule[day];
    if (!ids?.length) {
      toast({ title: "No schedule", description: `No employees scheduled for ${day}.` });
      return;
    }

    if (legacySeats.length === 0) {
      toast({ 
        title: "No seats", 
        description: "Please load seat data first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssignLoading(true);

      // Greedy seat assignment (group clustered teams together by floor when possible)
      const dayAssign: Record<string, string> = {};

      // Try place clustered teams on same floor
      const clusteredIds = ids.filter((id) => clusterTeams.includes(legacyEmployees.find((e) => e.id === id)?.team || ""));
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
        const members = ids.filter((id) => legacyEmployees.find((e) => e.id === id)?.team === t);
        if (members.length > 1) {
          const floors = new Set(members.map((id) => (dayAssign[id] || "").slice(0, 2)));
          if (floors.size > 1) {
            warns.push({ day, rule: "Cluster split across floors", details: `${t} team not seated together`, severity: "warn" });
          }
        }
      }

      setWarnings(warns);

      // Refresh data to show updated assignments
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      await loadScheduleForWeek(weekStart.toISOString().split('T')[0]);

      toast({ title: "Seats assigned", description: `Assigned ${Object.keys(dayAssign).length} seats for ${day}.` });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to assign seats.",
        variant: "destructive"
      });
    } finally {
      setAssignLoading(false);
    }
  }

  const handleClearAssignments = async () => {
    try {
      setAssignLoading(true);
      
      // Delete all seat assignments for the selected day
      const today = new Date();
      const dayIndex = DAYS.indexOf(selectedDay);
      const assignmentDate = new Date(today);
      assignmentDate.setDate(today.getDate() - today.getDay() + 1 + dayIndex);
      
      console.log(`Clearing assignments for ${selectedDay} (${assignmentDate.toISOString().split('T')[0]})`);

      // Delete assignments from database
      const { error } = await supabase
        .from('schedule_assignments')
        .delete()
        .eq('assignment_date', assignmentDate.toISOString().split('T')[0])
        .eq('day_of_week', selectedDay)
        .eq('assignment_type', 'assigned');

      if (error) {
        throw new Error(`Failed to clear assignments: ${error.message}`);
      }

      // Update local state immediately
      setAssignments(prev => ({
        ...prev,
        [selectedDay]: {}
      }));
      
      // Refresh data to ensure consistency
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      await loadScheduleForWeek(weekStart.toISOString().split('T')[0]);

      toast({ 
        title: "Assignments cleared", 
        description: `Cleared all seat assignments for ${selectedDay}.` 
      });
    } catch (error) {
      console.error('Clear assignments error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to clear assignments.",
        variant: "destructive"
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRefreshData = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    loadScheduleForWeek(weekStart.toISOString().split('T')[0]);
    toast({ title: "Refreshed", description: "Schedule data updated from database" });
  };

  const exportLayout = () => {
    if (dayAssignments.length === 0) {
      toast({ 
        title: "No assignments to export", 
        description: `No seat assignments found for ${selectedDay}.`,
        variant: "destructive" 
      });
      return;
    }

    const csvRows = ['Employee ID,Full Name,Team,Department,Seat ID'];
    
    dayAssignments.forEach(assignment => {
      const employee = dbEmployees.find(e => e.id === assignment.employee_id);
      const seat = dbSeats.find(s => s.id === assignment.seat_id);
      
      csvRows.push([
        assignment.employee_id,
        employee?.full_name || 'Unknown',
        employee?.team || 'Unknown',
        employee?.department || 'Unknown',
        assignment.seat_id
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating_layout_${selectedDay}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ 
      title: "Layout exported", 
      description: `Exported ${dayAssignments.length} assignments for ${selectedDay}.` 
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seating Map</h1>
          <p className="text-muted-foreground mt-2">
            Visualize seat assignments from the Schedule page
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDay} onValueChange={(value: DayKey) => setSelectedDay(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {/* Always show assign button if we have scheduled employees */}
            {(schedule[selectedDay]?.length || 0) > 0 && (
              <Button 
                onClick={() => assignSeatsForDay(selectedDay)} 
                disabled={loading}
                className="bg-gradient-primary hover:bg-gradient-primary/80"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                Assign Seats for {selectedDay}
              </Button>
            )}
            
            {/* Clear button - only show if there are assignments */}
            {dayAssignments.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearAssignments}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Assignments
              </Button>
            )}
            
            {/* Debug info */}
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Scheduled: {schedule[selectedDay]?.length || 0}</span>
              <span>•</span>
              <span>Assigned: {dayAssignments.length}</span>
            </div>
            <Button variant="outline" onClick={exportLayout} disabled={dayAssignments.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>
           </div>
        </div>
      </div>

      {/* Seating Controls */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Seating Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Solver</Label>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${solver === "greedy" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Greedy</span>
                <Switch checked={solver === "hungarian"} onCheckedChange={(c) => setSolver(c ? "hungarian" : "greedy")} />
                <span className={`text-xs ${solver === "hungarian" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Hungarian</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Team clusters</Label>
              <div className="grid grid-cols-2 gap-2">
                {allTeams.slice(0, 6).map((t) => (
                  <label key={t} className="flex items-center gap-2 rounded-md border p-2">
                    <Checkbox
                      checked={clusterTeams.includes(t)}
                      onCheckedChange={(c) => {
                        const next = new Set(clusterTeams);
                        if (c) next.add(t);
                        else next.delete(t);
                        setClusterTeams(Array.from(next));
                      }}
                    />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      <WarningsBanner warnings={warnings} />

      {/* Day Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.scheduled}</div>
            <p className="text-xs text-muted-foreground">employees for {selectedDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Assigned Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dayStats.assigned}</div>
            <p className="text-xs text-muted-foreground">seats allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dayStats.unassigned}</div>
            <p className="text-xs text-muted-foreground">need seats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{legacyEmployees.length}</div>
            <p className="text-xs text-muted-foreground">total employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Seating Map */}
      {!isDataLoaded ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {loading ? "Loading office data..." : "No data available. Please load employee and seat data from the Dashboard."}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SeatingMap 
          day={selectedDay}
          assignments={seatAssignments[selectedDay] || {}}
          seats={legacySeats}
          employees={legacyEmployees}
          teamColor={(team: string) => {
            const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA", "Support"];
            const index = teams.indexOf(team);
            if (index === -1) return `team-bg-8`; // Default for unknown teams
            return `team-bg-${(index % 8) + 1}`;
          }}
        />
      )}

      {/* Team Legend for assigned seats */}
      {dayAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team Distribution for {selectedDay}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from(new Set(legacyEmployees.map(e => e.team))).map((team) => {
                const teamAssignedToday = dayAssignments.filter(assignment => {
                  const emp = legacyEmployees.find(e => e.id === assignment.employee_id);
                  return emp?.team === team;
                }).length;
                
                if (teamAssignedToday === 0) return null;
                
                const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA", "Support"];
                const index = teams.indexOf(team);
                if (index === -1) return `team-bg-8`; // Default for unknown teams
                const teamBgClass = `team-bg-${(index % 8) + 1}`;
                
                return (
                  <div key={team} className="relative group">
                    <div className={`${teamBgClass} text-white p-3 rounded-lg shadow-sm border border-white/20`}>
                      <div className="font-semibold text-sm">{team}</div>
                      <div className="text-xs opacity-90">
                        {teamAssignedToday} assigned
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Data Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Employees: {legacyEmployees.length}</div>
              <div className="text-muted-foreground">
                Teams: {Array.from(new Set(legacyEmployees.map(e => e.team))).length}
              </div>
            </div>
            <div>
              <div className="font-medium">Seats: {legacySeats.length}</div>
              <div className="text-muted-foreground">
                Floors: {Array.from(new Set(legacySeats.map(s => s.floor))).length}
              </div>
            </div>
            <div>
              <div className="font-medium">Schedule: {Object.values(schedule).flat().length}</div>
              <div className="text-muted-foreground">
                Total weekly assignments
              </div>
            </div>
            <div>
              <div className="font-medium">Assignments: {dayAssignments.length}</div>
              <div className="text-muted-foreground">
                Seats for {selectedDay}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatingMapPage;