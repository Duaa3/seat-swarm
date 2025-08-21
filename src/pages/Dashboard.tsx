import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const { employees, loading: employeesLoading } = useEmployees();
  const { seats, loading: seatsLoading } = useSeats();

  const stats = React.useMemo(() => ({
    totalEmployees: employees.length,
    totalSeats: seats.length,
    occupancyRate: employees.length > 0 ? Math.round((employees.length / Math.max(seats.length, 1)) * 100) : 0,
    activeTeams: [...new Set(employees.map(emp => emp.team))].length,
  }), [employees, seats]);

  const quickActions = [
    { title: "Generate Schedule", path: "/schedule", icon: Calendar, color: "bg-primary" },
    { title: "View Seating Map", path: "/seating", icon: MapPin, color: "bg-accent" },
    { title: "Analytics", path: "/analytics", icon: TrendingUp, color: "bg-secondary" },
  ];

  const recentActivity = [
    { action: "Schedule generated for next week", time: "2 hours ago", status: "success" },
    { action: "Seat assignment updated for Floor 2", time: "4 hours ago", status: "info" },
    { action: "Capacity warning for Thursday", time: "6 hours ago", status: "warning" },
  ];

  const handleQuickGenerate = () => {
    toast({
      title: "Schedule Generated",
      description: "A new weekly schedule has been created successfully.",
    });
  };

  const allTeams = [...new Set(employees.map(emp => emp.team))];
  const isLoading = employeesLoading || seatsLoading;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your office seating management system
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
            <p className="text-xs text-muted-foreground">
              Active workforce
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSeats}</div>
            <p className="text-xs text-muted-foreground">
              Across 2 floors
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              Current week average
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTeams}</div>
            <p className="text-xs text-muted-foreground">
              Different departments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.path}>
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className={`p-2 rounded-md ${action.color}`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{action.title}</span>
                </div>
              </Link>
            ))}
            <Button onClick={handleQuickGenerate} className="w-full" variant="hero">
              Quick Generate Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {activity.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {activity.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {activity.status === "info" && <Calendar className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
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
    </div>
  );
};

export default Dashboard;