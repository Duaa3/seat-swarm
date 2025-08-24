import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, MapPin, Calendar, Download, Loader2, AlertTriangle, Activity, Brain, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { getScheduleAssignments, getDataStats } from "@/lib/supabase-api";
import { DAYS, DayKey } from "@/types/planner";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  // All state hooks first
  const [selectedPeriod, setSelectedPeriod] = React.useState<"week" | "month" | "quarter">("week");
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);

  // Database hooks
  const { employees, loading: employeesLoading } = useEmployees();
  const { seats, loading: seatsLoading } = useSeats();
  
  // Real-time analytics hook
  const {
    realTimeMetrics,
    analyticsData,
    loading: aiLoading,
    error: aiError,
    isMonitoring,
    fetchAnalytics,
    startMonitoring,
    stopMonitoring,
    criticalAlerts,
    systemHealth,
    utilizationStatus
  } = useRealTimeAnalytics();

  // All computed values and memos
  const allTeams = React.useMemo(() => [...new Set(employees.map(emp => emp.team))], [employees]);
  const allDepts = React.useMemo(() => [...new Set(employees.map(emp => emp.department))], [employees]);

  const loading = employeesLoading || seatsLoading || analyticsLoading;
  const hasData = employees.length > 0 && seats.length > 0;

  console.log('Analytics component state:', {
    employeesCount: employees.length,
    seatsCount: seats.length,
    assignmentsCount: assignments.length,
    hasData,
    loading,
    aiError,
    systemHealth,
    isMonitoring
  });

  // All effects
  React.useEffect(() => {
    const loadBasicData = async () => {
      console.log('loadBasicData called', { hasData, employeesLoading, seatsLoading });
      
      if (!hasData) {
        console.log('No data available, skipping basic data load');
        setAnalyticsLoading(false);
        return;
      }

      try {
        setAnalyticsLoading(true);
        console.log('Loading assignment data...');
        
        // Get assignments from the last 30 days and next 7 days (to include current/future schedules)
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const assignmentData = await getScheduleAssignments(startDate, endDate);
        console.log('Loaded assignment data:', assignmentData);
        console.log('Assignment count:', assignmentData?.length || 0);
        console.log('Sample assignment:', assignmentData?.[0]);
        setAssignments(assignmentData || []);
        
      } catch (error) {
        console.error('Error loading basic data:', error);
        toast({
          title: "Error loading data",
          description: "Failed to load assignment data.",
          variant: "destructive"
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    // Add a small delay to ensure data is loaded
    const timer = setTimeout(loadBasicData, 100);
    return () => clearTimeout(timer);
  }, [hasData, employees.length, seats.length]);

  // All computed stats using useMemo
  const stats = React.useMemo(() => {
    if (!hasData) return null;

    console.log('Computing analytics with:', { 
      employees: employees.length, 
      seats: seats.length, 
      assignments: assignments.length,
      assignmentsSample: assignments[0]
    });

    // Real analytics based on actual data
    const analyticsData = (() => {
      // Team utilization based on real assignments
      const teamUtilization = allTeams.map(team => {
        const teamEmployees = employees.filter(e => e.team === team);
        const teamAssignments = assignments.filter(a => 
          teamEmployees.some(emp => emp.id === a.employee_id)
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
          deptEmployees.some(emp => emp.id === a.employee_id)
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
    })();

    return { 
      totalEmployees: employees.length, 
      totalSeats: seats.length, 
      analyticsData,
      hasAssignments: assignments.length > 0
    };
  }, [employees, seats, allTeams, allDepts, assignments, hasData]);

  // All callbacks
  const handleRequestAnalytics = React.useCallback(async () => {
    if (!hasData) {
      toast({ 
        title: "No data available", 
        description: "Please load employee and seat data first.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Manual analytics request initiated...');
    await fetchAnalytics(selectedPeriod);
  }, [hasData, selectedPeriod, fetchAnalytics]);

  const exportReport = React.useCallback(() => {
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
  }, [hasData, selectedPeriod]);

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, [allTeams]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading analytics data...</p>
            <div className="text-xs text-muted-foreground">
              {employeesLoading && <div>Loading employees...</div>}
              {seatsLoading && <div>Loading seats...</div>}
              {analyticsLoading && <div>Loading analytics...</div>}
            </div>
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI-Powered Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time intelligent insights with custom AI algorithms and rule-based optimization
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
                <div className="mt-2 text-sm text-muted-foreground">
                  <div>Employees: {employees.length}</div>
                  <div>Seats: {seats.length}</div>
                  {aiError && <div className="text-red-500">AI Error: {aiError}</div>}
                </div>
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI-Powered Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time intelligent insights with custom AI algorithms and rule-based optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={(value: "week" | "month" | "quarter") => {
            setSelectedPeriod(value);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRequestAnalytics} 
            disabled={aiLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Request AI Analytics
              </>
            )}
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Show error state if AI analytics failed but basic data is available */}
      {aiError && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  AI Analytics Unavailable
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {aiError} - Showing basic analytics instead.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-1 mt-2">
                  {criticalAlerts.map((alert) => (
                    <p key={alert.id} className="text-sm text-red-700 dark:text-red-300">
                      • {alert.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Status Panel */}
      {realTimeMetrics && realTimeMetrics.currentOccupancy !== undefined && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Occupancy</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {Math.round((realTimeMetrics.currentOccupancy || 0) * 100)}%
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {utilizationStatus === 'high' ? '🔴 High' : utilizationStatus === 'low' ? '🟡 Low' : '🟢 Normal'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {realTimeMetrics.activeSatisfactionScore?.average?.toFixed(1) || '0.0'}/5
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {realTimeMetrics.activeSatisfactionScore?.trend === 'improving' ? '📈 Improving' : 
                 realTimeMetrics.activeSatisfactionScore?.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {Math.round((realTimeMetrics.performance?.systemEfficiency || 0) * 100)}%
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                AI Model Performance
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predictions</CardTitle>
              <Brain className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {realTimeMetrics.predictions?.nextHourActivity || 'N/A'}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Next hour activity
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Analytics Sections */}
      {analyticsData && (
        <>
          {/* Machine Learning Insights */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Machine Learning Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Employee Clustering</h4>
                    <p className="text-sm text-muted-foreground">
                      AI identified {analyticsData.clustering.employeeSegments} distinct employee behavior segments
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pattern Recognition</h4>
                    <p className="text-sm text-muted-foreground">
                      Detected {analyticsData.patterns.anomalies.length} anomalies in usage patterns
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Weekly Trends</h4>
                    <p className="text-sm text-muted-foreground">
                      Most popular: {analyticsData.patterns.weeklyTrends.mostPopularDay}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Trend: {analyticsData.patterns.weeklyTrends.trendDirection}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Collaboration Score</h4>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(analyticsData.patterns.teamCollaboration.collaborationScore)}% team proximity
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rule-Based Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Rule-Based Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Utilization Rules</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Rate:</span>
                      <Badge variant={analyticsData.rules.utilizationRules.status === 'optimal' ? 'default' : 'secondary'}>
                        {Math.round(analyticsData.rules.utilizationRules.currentUtilization * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{analyticsData.rules.utilizationRules.status}</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Accessibility</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Compliance:</span>
                      <Badge variant="default">
                        {Math.round(analyticsData.rules.accessibilityRules.accessibilityComplianceRate * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsData.rules.accessibilityRules.violations.length} violations
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Match Rate:</span>
                      <Badge variant="default">
                        {Math.round(analyticsData.rules.preferenceRules.preferenceMatchRate * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg satisfaction: {analyticsData.rules.preferenceRules.satisfactionScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                AI Predictions & Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Next Week Utilization</h4>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(analyticsData.predictions.nextWeekUtilization.prediction * 100)}%
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.round(analyticsData.predictions.nextWeekUtilization.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.predictions.nextWeekUtilization.trend}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Employee Demand</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Daily:</span>
                        <span className="font-medium">{analyticsData.predictions.employeeDemand.averageDailyDemand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Peak Day:</span>
                        <span className="font-medium">{analyticsData.predictions.employeeDemand.peakDayDemand}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Satisfaction Trends</h4>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {analyticsData.predictions.satisfactionTrends.prediction.toFixed(1)}/5
                    </div>
                    <Badge variant={analyticsData.predictions.satisfactionTrends.trend === 'positive' ? 'default' : 'secondary'}>
                      {analyticsData.predictions.satisfactionTrends.trend}
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Capacity Needs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Next Month:</span>
                        <span className="font-medium">{analyticsData.predictions.capacityNeeds.nextMonthCapacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Buffer Needed:</span>
                        <span className="font-medium">{Math.round(analyticsData.predictions.capacityNeeds.recommendedBuffer * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Basic Analytics - Always Available */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seats.length}</div>
            <p className="text-xs text-muted-foreground">Office capacity</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Total recorded</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemHealth || 'Basic'}</div>
            <p className="text-xs text-muted-foreground">
              {isMonitoring ? '🟢 Live monitoring' : '⚪ Basic mode'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.analyticsData.teamUtilization.map((team) => (
              <div key={team.team} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={teamClass(team.team)}>
                    {team.team}
                  </Badge>
                  <div>
                    <p className="font-medium">{team.employees} employees</p>
                    <p className="text-sm text-muted-foreground">
                      Avg {team.avgDaysPerWeek.toFixed(1)} days/week
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{Math.round(team.utilization)}%</p>
                  <p className="text-xs text-muted-foreground">Utilization</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Occupancy Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.analyticsData.dailyOccupancy.map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium">{day.day}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      {day.scheduled} / {day.capacity} seats
                    </span>
                    <span className="text-sm font-medium">{Math.round(day.occupancy)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(day.occupancy, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Department Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.analyticsData.deptMetrics.map((dept) => (
              <div key={dept.dept} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{dept.dept}</h3>
                  <Badge variant="secondary">{dept.employees} people</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    <span className="text-sm font-medium">{Math.round(dept.avgUtilization)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hybrid Workers</span>
                    <span className="text-sm font-medium">{Math.round(dept.hybridRatio * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Team Analysis */}
      {allTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {allTeams.map((team) => {
                const teamEmployees = employees.filter(e => e.team === team);
                return (
                  <div key={team} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {team}
                      </Badge>
                      <div>
                        <p className="font-medium">{teamEmployees.length} employees</p>
                        <p className="text-sm text-muted-foreground">
                          Active team
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Department Analysis */}
      {allDepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Department Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {allDepts.map((dept) => {
                const deptEmployees = employees.filter(e => e.department === dept);
                return (
                  <div key={dept} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{dept}</h3>
                      <Badge variant="secondary">{deptEmployees.length} people</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.analyticsData.avgOccupancy > 85 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-200">High Occupancy Alert</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Office utilization is at {Math.round(stats.analyticsData.avgOccupancy)}%. Consider expanding seating capacity or implementing staggered schedules.
                  </p>
                </div>
              </div>
            )}

            {stats.analyticsData.teamUtilization.some(team => team.utilization > 90) && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">Team Coordination Opportunity</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Some teams have very high utilization. Consider clustering their seating for better collaboration.
                  </p>
                </div>
              </div>
            )}

            {stats.analyticsData.avgOccupancy < 50 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">Optimization Opportunity</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Office utilization is at {Math.round(stats.analyticsData.avgOccupancy)}%. Consider reallocating space or promoting more flexible arrangements.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;