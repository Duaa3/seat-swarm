import React from "react";
import SeatMap from "@/components/planner/SeatMap";
import AssignmentControls from "@/components/planner/AssignmentControls";
import AssignmentResults from "@/components/planner/AssignmentResults";
import CsvUploader from "@/components/planner/CsvUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  DAYS, 
  DayKey, 
  MOCK_EMPLOYEES, 
  MOCK_SEATS, 
  DEFAULT_WEIGHTS,
  Employee,
  Seat,
  Assignment,
  Weights
} from "@/data/mock";
import { assignSeats } from "@/lib/api";
import { MapPin, Users, RefreshCw, Download, Settings, Eye } from "lucide-react";

const SeatingMapPage = () => {
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [employees, setEmployees] = React.useState<Employee[]>(MOCK_EMPLOYEES);
  const [seats, setSeats] = React.useState<Seat[]>(MOCK_SEATS);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [unassigned, setUnassigned] = React.useState<string[]>([]);
  const [unusedSeats, setUnusedSeats] = React.useState<string[]>([]);
  const [weights, setWeights] = React.useState<Weights>(DEFAULT_WEIGHTS);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [teamClusters, setTeamClusters] = React.useState<string[]>([]);
  const [deptCapacity, setDeptCapacity] = React.useState(60);
  const [loading, setLoading] = React.useState(false);
  const [meta, setMeta] = React.useState<any>(null);
  
  // Mock schedule for demonstration
  const [schedule] = React.useState<Record<DayKey, string[]>>(() => ({
    Mon: employees.slice(0, 8).map(e => e.employee_id),
    Tue: employees.slice(2, 10).map(e => e.employee_id),
    Wed: employees.slice(0, 6).map(e => e.employee_id),
    Thu: employees.slice(1, 9).map(e => e.employee_id),
    Fri: employees.slice(0, 5).map(e => e.employee_id),
  }));

  const dayStats = React.useMemo(() => {
    const scheduled = schedule[selectedDay]?.length || 0;
    const assigned = assignments.length;
    const floor1Seats = seats.filter(s => s.floor === 1);
    const floor2Seats = seats.filter(s => s.floor === 2);
    const floor1Assigned = assignments.filter(a => {
      const seat = seats.find(s => s.seat_id === a.seat_id);
      return seat?.floor === 1;
    }).length;
    const floor2Assigned = assignments.filter(a => {
      const seat = seats.find(s => s.seat_id === a.seat_id);
      return seat?.floor === 2;
    }).length;
    
    return {
      scheduled,
      assigned,
      unassigned: unassigned.length,
      floor1: { assigned: floor1Assigned, total: floor1Seats.length },
      floor2: { assigned: floor2Assigned, total: floor2Seats.length },
    };
  }, [selectedDay, schedule, assignments, unassigned, seats]);

  const assignSeatsForDay = async () => {
    const employeeIds = schedule[selectedDay] || [];
    if (!employeeIds.length) {
      toast({ title: "No schedule", description: `No employees scheduled for ${selectedDay}.` });
      return;
    }

    const employeesForDay = employees.filter(emp => employeeIds.includes(emp.employee_id));
    
    setLoading(true);
    try {
      const payload = {
        employees: employeesForDay,
        seats,
        weights,
        solver,
        constraints: {
          team_clusters: teamClusters,
          dept_capacity: deptCapacity,
        },
      };

      const result = await assignSeats(payload);
      
      setAssignments(result.assignments);
      setUnassigned(result.unassigned_employees);
      setUnusedSeats(result.unused_seats);
      setMeta(result.meta);
      
      toast({ 
        title: "Seats assigned", 
        description: `Assigned ${result.assignments.length} seats for ${selectedDay}. Average score: ${(result.assignments.reduce((sum, a) => sum + a.score, 0) / result.assignments.length || 0).toFixed(2)}` 
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

  const clearAssignments = () => {
    setAssignments([]);
    setUnassigned([]);
    setUnusedSeats([]);
    setMeta(null);
    toast({ title: "Assignments cleared", description: `Cleared all seat assignments for ${selectedDay}.` });
  };

  const exportLayout = () => {
    const csvRows = ['Employee ID,Full Name,Team,Department,Seat ID,Floor,Zone,Score'];
    
    assignments.forEach(assignment => {
      const employee = employees.find(e => e.employee_id === assignment.employee_id);
      const seat = seats.find(s => s.seat_id === assignment.seat_id);
      
      csvRows.push([
        assignment.employee_id,
        employee?.full_name || 'Unknown',
        employee?.team || 'Unknown',
        employee?.department || 'Unknown',
        assignment.seat_id,
        seat?.floor || '',
        seat?.zone || '',
        assignment.score.toFixed(2)
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
  };

  const handleReset = () => {
    setAssignments([]);
    setUnassigned([]);
    setUnusedSeats([]);
    setMeta(null);
    setWeights(DEFAULT_WEIGHTS);
    setSolver("greedy");
    setTeamClusters([]);
    setDeptCapacity(60);
    toast({ title: "Settings reset", description: "All settings and assignments have been reset." });
  };

  const handleSave = () => {
    const saveData = {
      assignments,
      weights,
      solver,
      teamClusters,
      deptCapacity,
      selectedDay,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('seating_data', JSON.stringify(saveData));
    toast({ title: "Settings saved", description: "Settings saved to browser storage." });
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
            <Button variant="hero" onClick={assignSeatsForDay} disabled={loading}>
              <MapPin className="h-4 w-4 mr-2" />
              {loading ? "Assigning..." : "Assign Seats"}
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Enhanced Team Legend */}
          <Card className="border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
                Team Colors & Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from(new Set(employees.map(e => e.team))).map((team) => {
                  const teamEmployees = employees.filter(e => e.team === team);
                  const teamSize = teamEmployees.length;
                  const assignedToday = assignments.filter(a => {
                    const emp = employees.find(e => e.employee_id === a.employee_id);
                    return emp?.team === team;
                  }).length;
                  
                  const teamMapping: Record<string, string> = {
                    "Network": "team-bg-1",
                    "CoreOps": "team-bg-2", 
                    "Design": "team-bg-3",
                    "Sales": "team-bg-4",
                    "Ops": "team-bg-5",
                    "Data": "team-bg-6",
                    "QA": "team-bg-7",
                  };
                  const teamBgClass = teamMapping[team] || "team-bg-8";
                  
                  return (
                    <div key={team} className="relative group">
                      <div className={`${teamBgClass} text-white p-3 rounded-lg shadow-sm border border-white/20 transition-all hover:shadow-md hover:scale-105`}>
                        <div className="font-semibold text-sm">{team}</div>
                        <div className="text-xs opacity-90">
                          {teamSize} total
                        </div>
                        {assignedToday > 0 && (
                          <div className="text-xs font-medium mt-1">
                            {assignedToday} today
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Seating Map */}
          <SeatMap 
            seats={seats}
            assignments={assignments}
            employees={employees}
            onSeatClick={(seat) => {
              toast({ 
                title: "Seat Info", 
                description: `${seat.seat_id} - Floor ${seat.floor}, ${seat.zone}${seat.is_window ? ', Window' : ''}${seat.is_accessible ? ', Accessible' : ''}` 
              });
            }}
          />
        </TabsContent>

        <TabsContent value="controls" className="space-y-6">
          <AssignmentControls
            weights={weights}
            onWeightsChange={setWeights}
            solver={solver}
            onSolverChange={setSolver}
            teamClusters={teamClusters}
            onTeamClustersChange={setTeamClusters}
            deptCapacity={deptCapacity}
            onDeptCapacityChange={setDeptCapacity}
            maxAssignments={undefined}
            onMaxAssignmentsChange={() => {}}
            onAssign={assignSeatsForDay}
            onReset={handleReset}
            onSave={handleSave}
            onLoadCsv={() => {}} // Handled in Data tab
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <AssignmentResults
            assignments={assignments}
            unassigned={unassigned}
            unusedSeats={unusedSeats}
            employees={employees}
            seats={seats}
            meta={meta}
          />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <CsvUploader
            onEmployeesLoaded={setEmployees}
            onSeatsLoaded={setSeats}
          />
          
          {/* Current Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Employees: {employees.length}</div>
                  <div className="text-muted-foreground">
                    Teams: {Array.from(new Set(employees.map(e => e.team))).length}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Seats: {seats.length}</div>
                  <div className="text-muted-foreground">
                    Floors: {Array.from(new Set(seats.map(s => s.floor))).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeatingMapPage;