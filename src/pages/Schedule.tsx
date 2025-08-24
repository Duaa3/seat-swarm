import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import CalendarView from "@/components/planner/CalendarView";
import DragDropCalendar from "@/components/planner/DragDropCalendar";
import WarningsBanner from "@/components/planner/WarningsBanner";
import ConflictMonitor from "@/components/realtime/ConflictMonitor";
import { useAdvancedScheduler } from "@/hooks/useAdvancedScheduler";

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
import { Calendar, Users, MapPin, AlertTriangle, Download, Save, RotateCcw, Loader2, Play, Archive, Clock } from "lucide-react";

const SchedulePage = () => {
  // Component handles schedule generation and management
  // Database hooks
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments, setSchedule, setAssignments, saveSchedule, saveSeatAssignments, clearSchedule, loading: scheduleLoading, metadata, setMetadata, loadScheduleForWeek } = useScheduleData();
  const { generating, publishing, generateSchedule, publishSchedule, archiveSchedule } = useAdvancedScheduler();

  // UI State
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");
  const [dayCaps, setDayCaps] = React.useState(DEFAULT_CONSTRAINTS.dayCapacities);
  const [deptCap, setDeptCap] = React.useState(DEFAULT_CONSTRAINTS.deptCapacity);
  const [clusterTeams, setClusterTeams] = React.useState<string[]>([]);
  const [solver, setSolver] = React.useState<"greedy" | "hungarian">("greedy");
  const [weights, setWeights] = React.useState<Weights>(DEFAULT_WEIGHTS);
  const [warnings, setWarnings] = React.useState<any[]>([]);
  const [scheduleStatus, setScheduleStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');
  const [enableDragDrop, setEnableDragDrop] = React.useState(false);
  const [conflictMonitorEnabled, setConflictMonitorEnabled] = React.useState(true);

  // Convert to legacy format for components
  const legacyEmployees = React.useMemo(() => dbEmployees.map(toLegacyEmployee), [dbEmployees]);
  const legacySeats = React.useMemo(() => dbSeats.map(toLegacySeat), [dbSeats]);
  
  // Computed values
  const allDepts = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.department))], [dbEmployees]);
  
  const allTeams = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.team))], [dbEmployees]);

  const loading = employeesLoading || seatsLoading || scheduleLoading || generating || publishing;
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
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      
      const result = await generateSchedule({
        week_start: weekStart.toISOString().split('T')[0],
        enforce_constraints: true,
        override_ratios: false
      });

      if (result.success && result.summary) {
        setScheduleStatus('draft');
        setWarnings(result.summary.violations || []);
        
        // Refresh the schedule data from the database
        await loadScheduleForWeek(weekStart.toISOString().split('T')[0]);
        
        // Update metadata with schedule ID if available
        if (result.schedule_id) {
          setMetadata(prev => prev ? { ...prev, scheduleId: result.schedule_id } : null);
        }
        
        toast({
          title: "Advanced Schedule Generated",
          description: `Generated ${result.summary.total_assignments} assignments with ${result.summary.violations.length} constraint issues`,
        });
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

  const handlePublishSchedule = async () => {
    if (!metadata?.scheduleId) {
      toast({
        title: "No schedule to publish",
        description: "Generate a schedule first before publishing.",
        variant: "destructive"
      });
      return;
    }

    const success = await publishSchedule(metadata.scheduleId);
    if (success) {
      setScheduleStatus('published');
    }
  };

  const handleArchiveSchedule = async () => {
    if (!metadata?.scheduleId) {
      toast({
        title: "No schedule to archive",
        description: "Generate a schedule first before archiving.",
        variant: "destructive"
      });
      return;
    }

    const success = await archiveSchedule(metadata.scheduleId);
    if (success) {
      setScheduleStatus('archived');
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
        const employee = dbEmployees.find(e => e.id === empId);
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
          {/* Schedule Status Badge */}
          {metadata?.scheduleId && (
            <Badge 
              variant={scheduleStatus === 'published' ? 'default' : scheduleStatus === 'archived' ? 'secondary' : 'outline'}
              className="capitalize"
            >
              <Clock className="h-3 w-3 mr-1" />
              {scheduleStatus}
            </Badge>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Reset
            </Button>
            
            {/* Publish/Archive Actions */}
            {metadata?.scheduleId && scheduleStatus === 'draft' && (
              <Button 
                onClick={handlePublishSchedule} 
                disabled={publishing}
                className="bg-green-600 hover:bg-green-700"
              >
                {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Publish
              </Button>
            )}
            
            {metadata?.scheduleId && scheduleStatus === 'published' && (
              <Button 
                variant="outline" 
                onClick={handleArchiveSchedule}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            )}
            
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

      {/* Loading Section */}
      {loading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading data automatically...</span>
            </div>
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
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Advanced Schedule...
                </>
              ) : !isDataLoaded ? (
                "Load Data First"
              ) : (
                "🚀 Generate Advanced Schedule"
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
        <div className="lg:col-span-2 space-y-6">
          {enableDragDrop ? (
            <DragDropCalendar
              schedule={schedule}
              employees={legacyEmployees}
              selectedDay={selectedDay}
              onScheduleChange={setSchedule}
              readOnly={scheduleStatus === 'published'}
            />
          ) : (
            <CalendarView
              schedule={schedule}
              employees={legacyEmployees}
              selectedDay={selectedDay}
            />
          )}
          
          {/* Drag & Drop Toggle */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={() => setEnableDragDrop(!enableDragDrop)}
              className="gap-2"
            >
              {enableDragDrop ? "📊 Switch to View Mode" : "🎯 Enable Drag & Drop"}
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Conflict Monitor */}
      <div className="mt-6">
        <ConflictMonitor 
          enabled={conflictMonitorEnabled}
          onConflictDetected={(conflict) => {
            console.log('Conflict detected:', conflict);
            // Add to warnings if not already present
            setWarnings(prev => {
              const exists = prev.some(w => w.message === conflict.message);
              if (!exists) {
                return [...prev, {
                  day: 'Multiple' as DayKey,
                  rule: conflict.type,
                  details: conflict.message,
                  severity: conflict.severity === 'critical' ? 'error' : 'warn'
                }];
              }
              return prev;
            });
          }}
        />
      </div>
    </div>
  );
};

export default SchedulePage;