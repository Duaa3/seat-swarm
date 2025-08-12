import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, MapPin, Calendar, Download } from "lucide-react";
import { MOCK_EMPLOYEES, MOCK_SEATS, allTeams, allDepartments } from "@/data/mock";
import { DAYS, DayKey } from "@/types/planner";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<"week" | "month" | "quarter">("week");

  // Use new data structure
  const employees = MOCK_EMPLOYEES;
  const allSeats = MOCK_SEATS;
  const allDepts = allDepartments;

  const stats = React.useMemo(() => {
    const totalEmployees = employees.length;
    const totalSeats = allSeats.length;

    const analyticsData = React.useMemo(() => {
      // Mock analytics data
      const teamUtilization = allTeams.map(team => ({
        team,
        utilization: 70 + Math.random() * 25, // 70-95%
        avgDaysPerWeek: 2.5 + Math.random() * 1.5, // 2.5-4 days
        employees: employees.filter(e => e.team === team).length,
      }));

      const dailyOccupancy = DAYS.map(day => ({
        day,
        occupancy: 60 + Math.random() * 30, // 60-90%
        capacity: allSeats.length,
        scheduled: Math.floor((60 + Math.random() * 30) * allSeats.length / 100),
      }));

      const deptMetrics = allDepts.map(dept => ({
        dept,
        employees: employees.filter(e => e.department === dept).length,
        avgUtilization: 65 + Math.random() * 25,
        hybridRatio: 0.6 + Math.random() * 0.3,
      }));

      return {
        teamUtilization,
        dailyOccupancy,
        deptMetrics,
        totalCapacity: allSeats.length,
        avgOccupancy: dailyOccupancy.reduce((sum, d) => sum + d.occupancy, 0) / DAYS.length,
      };
    }, []);

    return { totalEmployees, totalSeats, analyticsData };
  }, [employees, allSeats, allDepts]);

  const exportReport = () => {
    toast({ title: "Report exported", description: `Analytics report for ${selectedPeriod} has been exported.` });
  };

  const teamClass = React.useCallback((team: string) => {
    const idx = (allTeams.indexOf(team) % 8) + 1;
    return `team-bg-${idx}`;
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-2">
            Monitor utilization patterns and optimize space allocation
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            <div className="text-2xl font-bold">Wednesday</div>
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
            <div className="text-2xl font-bold">87%</div>
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
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              Employees using hybrid model
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
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Space Optimization</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Consider increasing Wednesday capacity by 10% to accommodate peak demand.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Team Clustering</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Core and Design teams show high collaboration. Consider grouping them on the same floor.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Underutilized Days</h4>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Monday and Friday show lower attendance. Consider flexible desk policies for these days.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Hybrid Success</h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                72% hybrid adoption rate indicates successful policy implementation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;