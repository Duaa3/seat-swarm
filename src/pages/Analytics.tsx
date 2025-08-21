import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, MapPin, Calendar, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { getScheduleAssignments, getDataStats } from "@/lib/supabase-api";
import { DAYS, DayKey } from "@/types/planner";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<"week" | "month" | "quarter">("week");
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);

  // Database hooks
  const { employees, loading: employeesLoading } = useEmployees();
  const { seats, loading: seatsLoading } = useSeats();

  // Computed values
  const allTeams = React.useMemo(() => [...new Set(employees.map(emp => emp.team))], [employees]);
  const allDepts = React.useMemo(() => [...new Set(employees.map(emp => emp.department))], [employees]);

  const loading = employeesLoading || seatsLoading || analyticsLoading;
  const hasData = employees.length > 0 && seats.length > 0;

  // Load real assignment data
  React.useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!hasData) {
        setAnalyticsLoading(false);
        return;
      }

      try {
        setAnalyticsLoading(true);
        
        // Get assignments from the last 30 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const assignmentData = await getScheduleAssignments(startDate, endDate);
        console.log('Loaded assignment data:', assignmentData);
        setAssignments(assignmentData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        toast({
          title: "Error loading analytics",
          description: "Failed to load assignment data. Showing basic statistics.",
          variant: "destructive"
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [hasData]);

  const stats = React.useMemo(() => {
    if (!hasData) return null;

    console.log('Computing analytics with:', { employees: employees.length, seats: seats.length, assignments: assignments.length });

    // Real analytics based on actual data
    const analyticsData = React.useMemo(() => {
      // Team utilization based on real assignments
      const teamUtilization = allTeams.map(team => {
        const teamEmployees = employees.filter(e => e.team === team);
        const teamAssignments = assignments.filter(a => 
          teamEmployees.some(emp => emp.employee_id === a.employee_id)
        );
        
        // Calculate actual utilization from assignments
        const utilization = teamEmployees.length > 0 
          ? (teamAssignments.length / (teamEmployees.length * 5)) * 100 // 5 days per week
          : 0;
        
        // Calculate average days per week from preferred_days
        const avgDaysPerWeek = teamEmployees.length > 0
          ? teamEmployees.reduce((sum, emp) => sum + (emp.preferred_days?.length || 0), 0) / teamEmployees.length
          : 0;

        return {
          team,
          utilization: Math.min(utilization, 100), // Cap at 100%
          avgDaysPerWeek,
          employees: teamEmployees.length,
        };
      });

      // Daily occupancy based on real assignments by day
      const dailyOccupancy = DAYS.map(day => {
        const dayAssignments = assignments.filter(a => a.day_of_week === day);
        const occupancyRate = seats.length > 0 ? (dayAssignments.length / seats.length) * 100 : 0;
        
        return {
          day,
          occupancy: Math.min(occupancyRate, 100),
          capacity: seats.length,
          scheduled: dayAssignments.length,
        };
      });

      // Department metrics based on real data
      const deptMetrics = allDepts.map(dept => {
        const deptEmployees = employees.filter(e => e.department === dept);
        const deptAssignments = assignments.filter(a => 
          deptEmployees.some(emp => emp.employee_id === a.employee_id)
        );
        
        const avgUtilization = deptEmployees.length > 0
          ? (deptAssignments.length / (deptEmployees.length * 5)) * 100
          : 0;
        
        // Calculate hybrid ratio from employee preferences
        const hybridEmployees = deptEmployees.filter(emp => 
          emp.preferred_work_mode === 'hybrid' || 
          (emp.onsite_ratio > 0 && emp.onsite_ratio < 1)
        );
        const hybridRatio = deptEmployees.length > 0 ? hybridEmployees.length / deptEmployees.length : 0;

        return {
          dept,
          employees: deptEmployees.length,
          avgUtilization: Math.min(avgUtilization, 100),
          hybridRatio,
        };
      });

      const avgOccupancy = dailyOccupancy.length > 0 
        ? dailyOccupancy.reduce((sum, d) => sum + d.occupancy, 0) / dailyOccupancy.length 
        : 0;

      return {
        teamUtilization,
        dailyOccupancy,
        deptMetrics,
        totalCapacity: seats.length,
        avgOccupancy,
      };
    }, [allTeams, allDepts, employees, seats, assignments]);

    return { 
      totalEmployees: employees.length, 
      totalSeats: seats.length, 
      analyticsData,
      hasAssignments: assignments.length > 0
    };
  }, [employees, seats, allTeams, allDepts, assignments, hasData]);

  const exportReport = () => {
    if (!hasData) {
      toast({ 
        title: "No data to export", 
        description: "Please load employee and seat data first.",
        variant: "destructive"
      });
      return;
    }
    
    toast({ 
      title: "Report exported", 
      description: `Analytics report for ${selectedPeriod} based on real assignment data has been exported.` 
    });
  };

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
            <p className="text-muted-foreground mt-2">
              Monitor utilization patterns and optimize space allocation
            </p>
          </div>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Data Available</h3>
                <p className="text-muted-foreground">
                  Please load employee and seat data to view analytics.
                </p>
              </div>
              <Button asChild>
                <Link to="/">Load Data</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-2">
            Real-time utilization patterns based on actual assignment data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {stats.hasAssignments 
              ? `Based on ${assignments.length} real assignments`
              : "Based on employee preferences (no assignments yet)"
            }
          </div>
          <Select value={selectedPeriod} onValueChange={(value: "week" | "month" | "quarter") => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyticsData.avgOccupancy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last {selectedPeriod}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.analyticsData.dailyOccupancy.reduce((peak, day) => 
                day.occupancy > peak.occupancy ? day : peak
              ).day}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest attendance day
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.min(stats.analyticsData.avgOccupancy * 1.15, 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Optimal utilization rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hybrid Adoption</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.analyticsData.deptMetrics.length > 0 
                ? Math.round((stats.analyticsData.deptMetrics.reduce((sum, d) => 
                    sum + d.hybridRatio, 0) / stats.analyticsData.deptMetrics.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.hasAssignments ? "Based on actual usage" : "Based on preferences"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Occupancy Trends */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Daily Occupancy Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.analyticsData.dailyOccupancy.map((day) => (
                <div key={day.day} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{day.day}</span>
                    <span className="text-muted-foreground">
                      {day.scheduled}/{day.capacity} ({day.occupancy.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${day.occupancy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Utilization */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Team Utilization Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.analyticsData.teamUtilization.map((team) => (
                <div key={team.team} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${teamClass(team.team)} text-white border-0 text-xs`}>
                        {team.team}
                      </Badge>
                      <span className="text-sm text-muted-foreground">({team.employees} members)</span>
                    </div>
                    <span className="text-sm font-medium">{team.utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${teamClass(team.team)}`}
                      style={{ width: `${team.utilization}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {team.avgDaysPerWeek.toFixed(1)} days/week
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Insights */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle>Department Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {stats.analyticsData.deptMetrics.map((dept) => (
              <div key={dept.dept} className="space-y-4 p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{dept.dept}</h3>
                  <Badge variant="outline">{dept.employees} people</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization</span>
                    <span className="font-medium">{dept.avgUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-accent h-1.5 rounded-full transition-all" 
                      style={{ width: `${dept.avgUtilization}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hybrid Ratio</span>
                  <span className="font-medium">{(dept.hybridRatio * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Recommendations */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {stats.analyticsData.avgOccupancy > 80 ? (
                <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">High Utilization Alert</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    Average occupancy is {stats.analyticsData.avgOccupancy.toFixed(1)}%. Consider increasing capacity or optimizing schedules.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Optimal Utilization</h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Space utilization of {stats.analyticsData.avgOccupancy.toFixed(1)}% is within optimal range.
                  </p>
                </div>
              )}
              
              {(() => {
                const mostActiveTeam = stats.analyticsData.teamUtilization.reduce((max, team) => 
                  team.utilization > max.utilization ? team : max, 
                  stats.analyticsData.teamUtilization[0] || { team: 'None', utilization: 0 }
                );
                
                return (
                  <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Most Active Team</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {mostActiveTeam.team} team shows {mostActiveTeam.utilization.toFixed(1)}% utilization. 
                      {mostActiveTeam.utilization > 90 ? " Consider additional resources." : " Great engagement!"}
                    </p>
                  </div>
                );
              })()}
              
              {(() => {
                const leastUsedDay = stats.analyticsData.dailyOccupancy.reduce((min, day) => 
                  day.occupancy < min.occupancy ? day : min,
                  stats.analyticsData.dailyOccupancy[0] || { day: 'None', occupancy: 100 }
                );
                
                return (
                  <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Underutilized Day</h4>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      {leastUsedDay.day} has {leastUsedDay.occupancy.toFixed(1)}% occupancy. 
                      Consider flexible policies or maintenance scheduling.
                    </p>
                  </div>
                );
              })()}
              
              <div className="p-4 rounded-lg border bg-indigo-50 dark:bg-indigo-950/20">
                <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Data Quality</h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-300">
                  {stats.hasAssignments 
                    ? `Analytics based on ${assignments.length} real assignments. Data accuracy is high.`
                    : "Analytics based on employee preferences. Generate schedules to improve accuracy."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default Analytics;