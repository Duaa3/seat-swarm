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
import { MapPin, Users, RefreshCw, Download, Loader2, Sliders, RotateCcw, Building, Building2 } from "lucide-react";

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
      
      console.log(`🎯 Starting seat assignment for ${day}`);
      console.log(`📊 Total employees to assign: ${ids.length}`);
      console.log(`🏢 Available seats: Floor 1: ${floor1Seats.length}, Floor 2: ${floor2Seats.length}`);
      console.log(`👥 Teams to cluster: ${clusterTeams}`);

      // Enhanced seat assignment with better team clustering
      const dayAssign: Record<string, string> = {};

      // Analyze team clustering opportunities
      const clusteredIds = ids.filter((id) => {
        const emp = legacyEmployees.find((e) => e.id === id);
        return emp && clusterTeams.includes(emp.team);
      });
      
      const nonClusteredIds = ids.filter((id) => !clusteredIds.includes(id));
      
      console.log(`🔗 Clustered employees: ${clusteredIds.length}`, clusteredIds);
      console.log(`🔸 Non-clustered employees: ${nonClusteredIds.length}`, nonClusteredIds);

      // Group clustered employees by team
      const teamGroups: Record<string, string[]> = {};
      clusteredIds.forEach(id => {
        const emp = legacyEmployees.find(e => e.id === id);
        if (emp && clusterTeams.includes(emp.team)) {
          if (!teamGroups[emp.team]) teamGroups[emp.team] = [];
          teamGroups[emp.team].push(id);
        }
      });

      console.log(`👥 Team groups:`, teamGroups);

      // Enhanced seat assignment strategy
      let f1Seats = [...floor1Seats.map(s => s.id)];
      let f2Seats = [...floor2Seats.map(s => s.id)];

      // Sort seats by proximity (adjacent seats first for each floor)
      const sortSeatsByProximity = (seats: string[]) => {
        return seats.sort((a, b) => {
          const aNum = parseInt(a.replace(/[^0-9]/g, ''));
          const bNum = parseInt(b.replace(/[^0-9]/g, ''));
          return aNum - bNum;
        });
      };

      f1Seats = sortSeatsByProximity(f1Seats);
      f2Seats = sortSeatsByProximity(f2Seats);

      // Assign teams to floors trying to keep them together
      let assignedCount = 0;
      
      // First pass: Assign each team to the floor with more available seats
      for (const [teamName, teamMembers] of Object.entries(teamGroups)) {
        if (teamMembers.length === 0) continue;
        
        console.log(`🏢 Assigning team ${teamName} (${teamMembers.length} members)`);
        
        // Choose floor with more available seats
        const useFloor1 = f1Seats.length >= f2Seats.length;
        const targetSeats = useFloor1 ? f1Seats : f2Seats;
        
        // Assign team members to adjacent seats on chosen floor
        const seatsToAssign = Math.min(teamMembers.length, targetSeats.length);
        for (let i = 0; i < seatsToAssign; i++) {
          dayAssign[teamMembers[i]] = targetSeats[i];
          assignedCount++;
        }
        
        // Remove used seats
        if (useFloor1) {
          f1Seats = f1Seats.slice(seatsToAssign);
        } else {
          f2Seats = f2Seats.slice(seatsToAssign);
        }
        
        console.log(`✅ Assigned ${seatsToAssign}/${teamMembers.length} members of ${teamName} to ${useFloor1 ? 'Floor 1' : 'Floor 2'}`);
      }

      // Second pass: Assign remaining clustered employees
      const remainingClusteredIds = clusteredIds.filter(id => !dayAssign[id]);
      const allRemainingSeats = [...f1Seats, ...f2Seats];
      
      for (let i = 0; i < remainingClusteredIds.length && i < allRemainingSeats.length; i++) {
        dayAssign[remainingClusteredIds[i]] = allRemainingSeats[i];
        assignedCount++;
      }

      // Remove assigned seats
      remainingClusteredIds.forEach(id => {
        const seatId = dayAssign[id];
        if (seatId) {
          const seatIndex = allRemainingSeats.indexOf(seatId);
          if (seatIndex > -1) allRemainingSeats.splice(seatIndex, 1);
        }
      });

      // Third pass: Assign non-clustered employees to remaining seats
      for (let i = 0; i < nonClusteredIds.length && i < allRemainingSeats.length; i++) {
        dayAssign[nonClusteredIds[i]] = allRemainingSeats[i];
        assignedCount++;
      }

      console.log(`📋 Assignment complete: ${assignedCount}/${ids.length} employees assigned`);

      // Save assignments to database
      const today = new Date();
      const dayIndex = DAYS.indexOf(day);
      const assignmentDate = new Date(today);
      assignmentDate.setDate(today.getDate() - today.getDay() + 1 + dayIndex);

      await saveSeatAssignments(dayAssign, day, dbSeats, dbEmployees, assignmentDate.toISOString().split('T')[0]);

      // Enhanced warnings with clustering analysis
      const warns: WarningItem[] = [];
      
      // Capacity warnings
      const f1Assigned = Object.values(dayAssign).filter((sid) => sid.startsWith("F1")).length;
      const f2Assigned = Object.values(dayAssign).filter((sid) => sid.startsWith("F2")).length;
      
      if (f1Assigned > floor1Seats.length) {
        warns.push({ day, rule: "Floor 1 capacity exceeded", severity: "error" });
      }
      if (f2Assigned > floor2Seats.length) {
        warns.push({ day, rule: "Floor 2 capacity exceeded", severity: "error" });
      }

      // Team clustering analysis
      let clusteredTeamsSuccessful = 0;
      let clusteredTeamsTotal = 0;
      
      for (const teamName of clusterTeams) {
        const teamMembers = ids.filter((id) => legacyEmployees.find((e) => e.id === id)?.team === teamName);
        if (teamMembers.length > 1) {
          clusteredTeamsTotal++;
          const assignedSeats = teamMembers.map(id => dayAssign[id]).filter(Boolean);
          const floors = new Set(assignedSeats.map(seatId => seatId.slice(0, 2)));
          
          if (floors.size === 1) {
            clusteredTeamsSuccessful++;
            console.log(`✅ Team ${teamName} successfully clustered on ${Array.from(floors)[0]}`);
          } else {
            warns.push({ 
              day, 
              rule: "Cluster split across floors", 
              details: `${teamName} team split across ${floors.size} floors`, 
              severity: "warn" 
            });
            console.log(`⚠️ Team ${teamName} split across floors:`, Array.from(floors));
          }
        }
      }

      console.log(`🎯 Clustering success rate: ${clusteredTeamsSuccessful}/${clusteredTeamsTotal} teams`);

      setWarnings(warns);

      // Refresh data to show updated assignments
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      await loadScheduleForWeek(weekStart.toISOString().split('T')[0]);

      const successMessage = `Assigned ${Object.keys(dayAssign).length} seats for ${day}`;
      const clusterMessage = clusteredTeamsTotal > 0 ? ` (${clusteredTeamsSuccessful}/${clusteredTeamsTotal} teams clustered successfully)` : '';
      
      toast({ 
        title: "Seats assigned", 
        description: successMessage + clusterMessage
      });
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
      
      // Calculate the assignment date for the selected day
      const today = new Date();
      const dayIndex = DAYS.indexOf(selectedDay);
      const assignmentDate = new Date(today);
      assignmentDate.setDate(today.getDate() - today.getDay() + 1 + dayIndex);
      
      console.log(`Clearing SEAT assignments for ${selectedDay} (${assignmentDate.toISOString().split('T')[0]})`);

      // Instead of deleting records, update them to remove seat assignments
      // Keep the scheduled employees but clear their seat assignments
      const { error } = await supabase
        .from('schedule_assignments')
        .update({
          seat_id: null,
          assignment_type: 'scheduled' // Change back to scheduled (not assigned to a seat)
        })
        .eq('assignment_date', assignmentDate.toISOString().split('T')[0])
        .eq('day_of_week', selectedDay)
        .eq('assignment_type', 'assigned')
        .not('seat_id', 'is', null); // Only update records that currently have seat assignments

      if (error) {
        throw new Error(`Failed to clear seat assignments: ${error.message}`);
      }

      // Update local state to clear seat assignments but keep schedule
      setAssignments(prev => ({
        ...prev,
        [selectedDay]: {} // Clear seat assignments for this day
      }));
      
      // The schedule should remain unchanged - don't modify it
      
      // Refresh data to ensure consistency
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      await loadScheduleForWeek(weekStart.toISOString().split('T')[0]);

      toast({ 
        title: "Seat assignments cleared", 
        description: `Cleared seat assignments for ${selectedDay}. Scheduled employees remain.` 
      });
    } catch (error) {
      console.error('Clear seat assignments error:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to clear seat assignments.",
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
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                <MapPin className="inline h-8 w-8 mr-2 text-primary" />
                Seating Map
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize and manage seat assignments for scheduled employees
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedDay} onValueChange={(value: DayKey) => setSelectedDay(value)}>
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day} className="hover:bg-accent">
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-900">{dayStats.scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Assigned</p>
                  <p className="text-2xl font-bold text-green-900">{dayStats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Unassigned</p>
                  <p className="text-2xl font-bold text-orange-900">{dayStats.unassigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Floor 1</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {dayStats.floor1.assigned}/{dayStats.floor1.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-teal-700 font-medium">Floor 2</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {dayStats.floor2.assigned}/{dayStats.floor2.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls & Actions Bar */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Seating Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium whitespace-nowrap">Solver:</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${solver === "greedy" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      Greedy
                    </span>
                    <Switch 
                      checked={solver === "hungarian"} 
                      onCheckedChange={(c) => setSolver(c ? "hungarian" : "greedy")} 
                    />
                    <span className={`text-xs ${solver === "hungarian" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      Hungarian
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium whitespace-nowrap">Team Clusters:</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTeams.slice(0, 4).map(team => (
                      <div key={team} className="flex items-center gap-1">
                        <Checkbox
                          id={`cluster-${team}`}
                          checked={clusterTeams.includes(team)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setClusterTeams(prev => [...prev, team]);
                            } else {
                              setClusterTeams(prev => prev.filter(t => t !== team));
                            }
                          }}
                        />
                        <Label htmlFor={`cluster-${team}`} className="text-xs cursor-pointer">
                          {team}
                        </Label>
                      </div>
                    ))}
                    {allTeams.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{allTeams.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Assign Seats Button */}
                {(schedule[selectedDay]?.length || 0) > 0 && (
                  <Button 
                    onClick={() => assignSeatsForDay(selectedDay)} 
                    disabled={loading}
                    className="bg-gradient-primary hover:bg-gradient-primary/80"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    Assign Seats
                  </Button>
                )}
                
                {/* Clear Assignments Button */}
                {dayAssignments.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleClearAssignments}
                    disabled={loading}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
                
                {/* Export Button */}
                <Button 
                  variant="outline" 
                  onClick={exportLayout} 
                  disabled={dayAssignments.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <WarningsBanner warnings={warnings} />
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading seat assignments...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!loading && (schedule[selectedDay]?.length || 0) === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <div className="space-y-4 py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Schedule for {selectedDay}</h3>
                  <p className="text-muted-foreground mt-1">
                    Go to the Schedule page to generate a schedule first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seating Map Component */}
        {(schedule[selectedDay]?.length || 0) > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Office Layout - {selectedDay}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        )}

        {/* Team Distribution Legend */}
        {dayAssignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Distribution for {selectedDay}</CardTitle>
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
                  const teamBgClass = index === -1 ? `team-bg-8` : `team-bg-${(index % 8) + 1}`;
                  
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
      </div>
    </div>
  );
};

export default SeatingMapPage;
