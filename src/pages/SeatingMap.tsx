import React from "react";
import SeatingMap from "@/components/planner/SeatingMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  DAYS, 
  DayKey,
  toLegacyEmployee,
  toLegacySeat
} from "@/types/planner";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { MapPin, Users, RefreshCw, Download, Loader2 } from "lucide-react";

const SeatingMapPage = () => {
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [assignLoading, setAssignLoading] = React.useState(false);
  
  // Use real database data
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments: seatAssignments, loading: scheduleLoading, loadScheduleForWeek, saveSeatAssignments } = useScheduleData();
  
  // Convert to legacy format for components
  const legacyEmployees = React.useMemo(() => dbEmployees.map(toLegacyEmployee), [dbEmployees]);
  const legacySeats = React.useMemo(() => dbSeats.map(toLegacySeat), [dbSeats]);
  
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
      const handleFocus = () => refreshSchedule();
      window.addEventListener('focus', handleFocus);
      
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [isDataLoaded, selectedDay, loadScheduleForWeek]);

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
    
    // Get actual seat assignments for the selected day
    const assigned = dayAssignments.length;
    const unassigned = Math.max(0, scheduledCount - assigned);
    
    // Floor distribution for assigned seats
    const floor1Assignments = dayAssignments.filter(assignment => {
      const seat = dbSeats.find(s => s.seat_id === assignment.seat_id);
      return seat?.floor === 1;
    });
    const floor2Assignments = dayAssignments.filter(assignment => {
      const seat = dbSeats.find(s => s.seat_id === assignment.seat_id);
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

  const assignSeatsForDay = async () => {
    const dayEmployees = schedule[selectedDay] || [];
    if (dayEmployees.length === 0) {
      toast({
        title: "No employees scheduled",
        description: `No employees are scheduled for ${selectedDay}. Generate a schedule first.`,
        variant: "destructive"
      });
      return;
    }

    if (!isDataLoaded) {
      toast({
        title: "No data loaded", 
        description: "Please load employee and seat data first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssignLoading(true);
      
      // Simple assignment logic - assign seats in order
      const dayAssign: Record<string, string> = {};
      const availableSeats = legacySeats.map(s => s.id);
      
      for (let i = 0; i < dayEmployees.length && i < availableSeats.length; i++) {
        dayAssign[dayEmployees[i]] = availableSeats[i];
      }

      // Save assignments to database
      const today = new Date();
      const dayIndex = DAYS.indexOf(selectedDay);
      const assignmentDate = new Date(today);
      assignmentDate.setDate(today.getDate() - today.getDay() + 1 + dayIndex);

      await saveSeatAssignments(dayAssign, selectedDay, dbSeats, dbEmployees, assignmentDate.toISOString().split('T')[0]);

      toast({
        title: "Seats assigned and saved",
        description: `Assigned ${Object.keys(dayAssign).length} seats for ${selectedDay}.`,
      });
    } catch (error) {
      toast({
        title: "Error assigning seats",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
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
      const employee = dbEmployees.find(e => e.employee_id === assignment.employee_id);
      const seat = dbSeats.find(s => s.seat_id === assignment.seat_id);
      
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
            {(schedule[selectedDay]?.length || 0) > 0 && dayAssignments.length === 0 && (
              <Button 
                onClick={assignSeatsForDay} 
                disabled={loading}
                className="bg-gradient-primary hover:bg-gradient-primary/80"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                Assign Seats for {selectedDay}
              </Button>
            )}
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
      ) : (schedule[selectedDay]?.length || 0) === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No employees scheduled for {selectedDay}. Generate a schedule from the Schedule page first.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : dayAssignments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No seat assignments for {selectedDay}. Generate a schedule and assign seats from the Schedule page.
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
            const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
            const index = teams.indexOf(team);
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
                
                const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
                const index = teams.indexOf(team);
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