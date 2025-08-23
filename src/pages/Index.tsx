import React from "react";
import CalendarView from "@/components/planner/CalendarView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DAYS, DayKey, DayCapacities, Schedule, toLegacyEmployee } from "@/types/planner";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useScheduleData } from "@/hooks/useScheduleData";
import { Calendar, Users, MapPin, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  // Data hooks
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, saveSchedule } = useScheduleData();

  // Controls for schedule generation
  const [dayCaps, setDayCaps] = React.useState<DayCapacities>(() => ({ Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90 }));
  const [deptCap, setDeptCap] = React.useState<number>(60);
  const [selectedDay, setSelectedDay] = React.useState<DayKey>("Wed");

  // Convert database data to legacy format for compatibility
  const employees = React.useMemo(() => 
    dbEmployees.map(toLegacyEmployee), [dbEmployees]);

  const allDepts = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.department))], [dbEmployees]);
  
  const allTeams = React.useMemo(() => 
    [...new Set(dbEmployees.map(emp => emp.team))], [dbEmployees]);

  const totalSeats = React.useMemo(() => dbSeats.length, [dbSeats]);

  const stats = React.useMemo(() => ({
    totalEmployees: employees.length,
    totalSeats: dbSeats.length,
    scheduledThisWeek: Object.values(schedule).flat().length,
    activeTeams: allTeams.length,
  }), [employees, dbSeats, schedule, allTeams]);

  async function generateSchedule() {
    if (employees.length === 0) {
      toast({ 
        title: "No employees", 
        description: "Please load employee data first.",
        variant: "destructive"
      });
      return;
    }

    const perDeptCounts = Object.fromEntries(allDepts.map((d) => [d, employees.filter((e) => e.dept === d).length])) as Record<string, number>;
    const perDeptDailyCap = Object.fromEntries(Object.entries(perDeptCounts).map(([d, n]) => [d, Math.floor((deptCap / 100) * n)])) as Record<string, number>;

    const next: Schedule = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };

    DAYS.forEach((day) => {
      const capSeats = Math.floor((dayCaps[day] / 100) * totalSeats);
      const deptCount: Record<string, number> = Object.fromEntries(allDepts.map((d) => [d, 0]));

      // Prefer employees who like this day, then fill others
      const preferred = employees.filter((e) => e.preferredDays.includes(day));
      const others = employees.filter((e) => !e.preferredDays.includes(day));
      const order = [...preferred, ...others];

      for (const e of order) {
        if (next[day].length >= capSeats) break;
        if (deptCount[e.dept] >= perDeptDailyCap[e.dept]) continue;
        next[day].push(e.id);
        deptCount[e.dept]++;
      }
    });

    // Save schedule to database
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    
    try {
      await saveSchedule(next, dbEmployees, weekStart.toISOString().split('T')[0]);
      toast({ title: "Schedule generated", description: "A draft plan was created and saved to database." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save schedule to database.",
        variant: "destructive"
      });
    }
  }

  const isDataLoaded = dbEmployees.length > 0 && dbSeats.length > 0;
  const isLoading = employeesLoading || seatsLoading;

  const quickActions = [
    { title: "Generate Schedule", action: generateSchedule, icon: Calendar, color: "bg-primary" },
    { title: "View Seating Map", path: "/seating", icon: MapPin, color: "bg-accent" },
    { title: "Analytics", path: "/analytics", icon: TrendingUp, color: "bg-secondary" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Office Planner</h1>
        <p className="text-muted-foreground mt-2">
          Manage hybrid attendance and optimize office seating arrangements
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSeats}</div>
            <p className="text-xs text-muted-foreground">Across 2 floors</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledThisWeek}</div>
            <p className="text-xs text-muted-foreground">Total assignments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTeams}</div>
            <p className="text-xs text-muted-foreground">Different departments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <div key={action.title}>
                {action.path ? (
                  <Link to={action.path}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className={`p-2 rounded-md ${action.color}`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>
                  </Link>
                ) : (
                  <Button 
                    onClick={action.action} 
                    disabled={isLoading || !isDataLoaded}
                    variant="outline" 
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className={`p-2 rounded-md ${action.color} mr-3`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{action.title}</span>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {allTeams.map((team, index) => {
                const teamSize = employees.filter(e => e.team === team).length;
                const teamClass = `team-bg-${(index % 8) + 1}`;
                return (
                  <Badge key={team} variant="secondary" className={`${teamClass} text-white border-0`}>
                    {team} ({teamSize})
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              {isLoading ? "Loading team data..." : 
               allTeams.length > 0 ? "Teams are distributed across departments with varying hybrid schedules." :
               "No team data available. Load employee data to see team distribution."
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule View */}
      {isDataLoaded && (
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Current Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarView schedule={schedule} employees={employees} selectedDay={selectedDay} />
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading office data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isDataLoaded && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">
              Welcome to Smart Office Planner! This system uses database-stored employee and seat data for hybrid office management.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;