import React from "react";
import SeatingMap from "@/components/planner/SeatingMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DAYS, DayKey, SeatAssignments, type Schedule } from "@/types/planner";
import { employees, allSeats, allTeams, floor1Seats, floor2Seats } from "@/data/mock";
import { MapPin, Users, RefreshCw, Download } from "lucide-react";

const SeatingMapPage = () => {
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [assignments, setAssignments] = React.useState<SeatAssignments>({ Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {} });
  
  // Mock schedule for demonstration
  const [schedule] = React.useState<Schedule>(() => ({
    Mon: employees.slice(0, 20).map(e => e.id),
    Tue: employees.slice(5, 25).map(e => e.id),
    Wed: employees.slice(0, 18).map(e => e.id),
    Thu: employees.slice(3, 22).map(e => e.id),
    Fri: employees.slice(1, 16).map(e => e.id),
  }));

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, []);

  const dayStats = React.useMemo(() => {
    const scheduled = schedule[selectedDay]?.length || 0;
    const assigned = Object.keys(assignments[selectedDay] || {}).length;
    const floor1Assigned = Object.values(assignments[selectedDay] || {}).filter(seatId => seatId.startsWith("F1")).length;
    const floor2Assigned = Object.values(assignments[selectedDay] || {}).filter(seatId => seatId.startsWith("F2")).length;
    
    return {
      scheduled,
      assigned,
      unassigned: scheduled - assigned,
      floor1: { assigned: floor1Assigned, total: floor1Seats.length },
      floor2: { assigned: floor2Assigned, total: floor2Seats.length },
    };
  }, [selectedDay, schedule, assignments]);

  const assignSeatsForDay = () => {
    const ids = schedule[selectedDay] || [];
    if (!ids.length) {
      toast({ title: "No schedule", description: `No employees scheduled for ${selectedDay}.` });
      return;
    }

    const dayAssign: Record<string, string> = {};
    const availableSeats = [...allSeats.map(s => s.id)];

    // Simple assignment: first come, first served
    for (let i = 0; i < ids.length && i < availableSeats.length; i++) {
      dayAssign[ids[i]] = availableSeats[i];
    }

    setAssignments(prev => ({ ...prev, [selectedDay]: dayAssign }));
    toast({ 
      title: "Seats assigned", 
      description: `Assigned ${Object.keys(dayAssign).length} seats for ${selectedDay}.` 
    });
  };

  const clearAssignments = () => {
    setAssignments(prev => ({ ...prev, [selectedDay]: {} }));
    toast({ title: "Assignments cleared", description: `Cleared all seat assignments for ${selectedDay}.` });
  };

  const exportLayout = () => {
    toast({ title: "Layout exported", description: "Seating layout exported successfully." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seating Map</h1>
          <p className="text-muted-foreground mt-2">
            Visualize and manage seat assignments across office floors
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
            <Button variant="outline" onClick={clearAssignments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={exportLayout}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="hero" onClick={assignSeatsForDay}>
              <MapPin className="h-4 w-4 mr-2" />
              Assign Seats
            </Button>
          </div>
        </div>
      </div>

      {/* Day Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.scheduled}</div>
            <p className="text-xs text-muted-foreground">employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Assigned
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
            <CardTitle className="text-sm font-medium">Floor 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.floor1.assigned}/{dayStats.floor1.total}</div>
            <p className="text-xs text-muted-foreground">seats occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Floor 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dayStats.floor2.assigned}/{dayStats.floor2.total}</div>
            <p className="text-xs text-muted-foreground">seats occupied</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allTeams.map((team, index) => {
              const teamSize = employees.filter(e => e.team === team).length;
              const teamBgClass = teamClass(team);
              return (
                <Badge key={team} variant="secondary" className={`${teamBgClass} text-white border-0`}>
                  {team} ({teamSize})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Seating Map */}
      <SeatingMap 
        day={selectedDay} 
        assignments={assignments[selectedDay]} 
        seats={allSeats} 
        employees={employees} 
        teamColor={teamClass} 
      />

      {/* Instructions */}
      <Card>
        <CardContent className="text-sm text-muted-foreground pt-6">
          <p>
            <strong>Instructions:</strong> Select a day to view scheduled employees. Click "Assign Seats" to automatically 
            assign available seats. Colored dots represent employees by team. Empty dots are available seats.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatingMapPage;