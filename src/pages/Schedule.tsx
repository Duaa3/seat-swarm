import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import CalendarView from "@/components/planner/CalendarView";
import WarningsBanner from "@/components/planner/WarningsBanner";
import { DataManager } from "@/components/DataManager";

import { 
  DAYS, 
  DayKey, 
  toLegacyEmployee,
  toLegacySeat
} from "@/types/planner";
import {
  DEFAULT_WEIGHTS, 
  DEFAULT_CONSTRAINTS,
  Weights
} from "@/data/mock";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useScheduleData } from "@/hooks/useScheduleData";
import { generateScheduleAPI } from "@/lib/api-client";
import { Calendar, Users, MapPin, AlertTriangle, Download, Save, RotateCcw, Loader2 } from "lucide-react";

const SchedulePage = () => {
  // Component handles schedule generation and management
  // Database hooks
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments, setSchedule, setAssignments, saveSchedule, saveSeatAssignments, clearSchedule, loading: scheduleLoading } = useScheduleData();

  // UI State
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [dayCaps, setDayCaps] = React.useState(DEFAULT_CONSTRAINTS.dayCapacities);
  const [deptCap, setDeptCap] = React.useState(DEFAULT_CONSTRAINTS.deptCapacity);
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [weights, setWeights] = React.useState<Weights>(DEFAULT_WEIGHTS);
  const [warnings, setWarnings] = React.useState<any[]>([]);

  // Convert to legacy format for components
  const legacyEmployees = React.useMemo(() => dbEmployees.map(toLegacyEmployee), [dbEmployees]);
  const legacySeats = React.useMemo(() => dbSeats.map(toLegacySeat), [dbSeats]);
  
  // Computed values
  const allDepts = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.department))], [dbEmployees]);
  
  const allTeams = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.team))], [dbEmployees]);

  const loading = employeesLoading || seatsLoading || scheduleLoading;
  const isDataLoaded = dbEmployees.length > 0 && dbSeats.length > 0;

  const handleGenerateSchedule = async () => {
    if (!isDataLoaded) {
      toast({
        title: "No data loaded",
        description: "Please load employee and seat data first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Generating schedule with:', { employees: dbEmployees.length, seats: dbSeats.length });
      
      // Use the API to generate schedule
      const result = await generateScheduleAPI({
        dayCapacities: {
          Mon: dayCaps.Mon,
          Tue: dayCaps.Tue,
          Wed: dayCaps.Wed,
          Thu: dayCaps.Thu,
          Fri: dayCaps.Fri
        },
        deptCapacity: deptCap,
        teamClusters: clusterTeams
      });

      if (result.success && result.data) {
        console.log('Generated schedule:', result.data.schedule);

        // Convert API response to our schedule format - extract employee IDs only
        const newSchedule: Record<DayKey, string[]> = {
          Mon: (result.data.schedule.Mon || []).map((item: any) => item.employeeId || item),
          Tue: (result.data.schedule.Tue || []).map((item: any) => item.employeeId || item),
          Wed: (result.data.schedule.Wed || []).map((item: any) => item.employeeId || item),
          Thu: (result.data.schedule.Thu || []).map((item: any) => item.employeeId || item),
          Fri: (result.data.schedule.Fri || []).map((item: any) => item.employeeId || item)
        };

        // Convert API response to assignments format
        const newAssignments: Record<DayKey, Record<string, string>> = {
          Mon: {},
          Tue: {},
          Wed: {},
          Thu: {},
          Fri: {}
        };

        // Extract seat assignments from the API response
        DAYS.forEach(day => {
          const dayData = result.data.schedule[day] || [];
          dayData.forEach((item: any) => {
            if (item.employeeId && item.seatId) {
              newAssignments[day][item.employeeId] = item.seatId;
            }
          });
        });

        // Update both schedule and assignments state
        setSchedule(newSchedule);
        
        // Save the schedule to database
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        await saveSchedule(newSchedule, dbEmployees, weekStart.toISOString().split('T')[0]);
        
        setWarnings([]);
        
        toast({
          title: "Schedule generated successfully",
          description: `Generated ${result.data.assignments} assignments for week starting ${result.data.weekStartDate}`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate schedule');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: "Error generating schedule",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Seat assignment moved to SeatingMap page

  const handleReset = () => {
    clearSchedule();
    setWarnings([]);
    toast({ title: "Schedule reset", description: "All data has been cleared." });
  };

  const handleSave = () => {
    // Data is automatically saved to database when generated/assigned
    toast({ 
      title: "Data already saved", 
      description: "All schedule and assignment data is automatically saved to the database." 
    });
  };

  const handleExport = () => {
    // Export schedule as CSV
    const csvRows = ['Day,Employee ID,Full Name,Team,Department,Seat ID'];
    
    DAYS.forEach(day => {
      schedule[day].forEach(empId => {
        const employee = dbEmployees.find(e => e.employee_id === empId);
        const seatId = assignments[day]?.[empId] || 'Unassigned';
        
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
      const capacity = Math.floor((dayCaps[day] / 100) * legacySeats.length);
      return sum + (schedule[day].length / (capacity || 1)) * 100;
    }, 0) / DAYS.length;

    return {
      totalScheduled,
      avgUtilization: avgUtilization || 0,
      violations: warnings.length,
      assigned: Object.keys(assignments[selectedDay] || {}).length,
    };
  }, [schedule, dayCaps, warnings.length, assignments, selectedDay, legacySeats.length]);

  const teamClass = React.useCallback((team: string) => {
    const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
    const index = teams.indexOf(team);
    return `team-bg-${(index % 8) + 1}`;
  }, []);

  return (
      <div className="p-6 space-y-6 animate-fade-in bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">🔄 NEW Schedule Management</h1>
          <p className="text-muted-foreground mt-2">
            Generate and optimize weekly schedules for hybrid work using persistent database storage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Reset
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!isDataLoaded}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      {!isDataLoaded && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <DataManager />
          </CardContent>
        </Card>
      )}

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


            {/* Generate Schedule Button */}
            <Button 
              onClick={handleGenerateSchedule} 
              disabled={loading || !isDataLoaded}
              variant="hero"
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : !isDataLoaded ? (
                "Load Data First"
              ) : (
                "Generate Weekly Schedule"
              )}
            </Button>

            {/* Note about seat assignment */}
            {Object.values(schedule).some((day: string[]) => day.length > 0) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="text-sm text-blue-700">
                    ✅ Schedule generated! Go to the <strong>Seating Map</strong> page to assign seats to employees.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2">
          <CalendarView
            schedule={schedule}
            employees={legacyEmployees}
            selectedDay={selectedDay}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;