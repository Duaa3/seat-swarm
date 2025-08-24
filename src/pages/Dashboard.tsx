import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, MapPin, Calendar, TrendingUp, AlertTriangle, CheckCircle2, User, Edit, Save, Clock, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeConstraints } from "@/hooks/useConstraints";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const ZONES = ['A', 'B', 'C', 'D'] as const;

// Employee Dashboard Component
const EmployeeDashboard = () => {
  const { user, profile } = useAuth();
  const { employees, updateEmployee } = useEmployees();
  const { constraints, updateConstraints, createConstraints } = useEmployeeConstraints();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Find current employee data
  const currentEmployee = employees.find(emp => emp.id === user?.id);
  const currentConstraints = constraints.find(c => c.employee_id === user?.id);

  // Form state
  const [formData, setFormData] = useState({
    full_name: currentEmployee?.full_name || profile?.full_name || '',
    department: currentEmployee?.department || profile?.department || '',
    team: currentEmployee?.team || profile?.team || '',
    preferred_work_mode: currentEmployee?.preferred_work_mode || 'hybrid',
    prefer_window: currentEmployee?.prefer_window || false,
    needs_accessible: currentEmployee?.needs_accessible || false,
    preferred_zone: currentEmployee?.preferred_zone || '',
    preferred_days: currentEmployee?.preferred_days || [],
    max_weekly_office_days: currentConstraints?.max_weekly_office_days || 3,
    preferred_floor: currentConstraints?.preferred_floor || null,
    avoid_days: currentConstraints?.avoid_days || [],
  });

  React.useEffect(() => {
    if (currentEmployee || profile) {
      setFormData({
        full_name: currentEmployee?.full_name || profile?.full_name || '',
        department: currentEmployee?.department || profile?.department || '',
        team: currentEmployee?.team || profile?.team || '',
        preferred_work_mode: currentEmployee?.preferred_work_mode || 'hybrid',
        prefer_window: currentEmployee?.prefer_window || false,
        needs_accessible: currentEmployee?.needs_accessible || false,
        preferred_zone: currentEmployee?.preferred_zone || '',
        preferred_days: currentEmployee?.preferred_days || [],
        max_weekly_office_days: currentConstraints?.max_weekly_office_days || 3,
        preferred_floor: currentConstraints?.preferred_floor || null,
        avoid_days: currentConstraints?.avoid_days || [],
      });
    }
  }, [currentEmployee, profile, currentConstraints]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string, isPreferred: boolean) => {
    const field = isPreferred ? 'preferred_days' : 'avoid_days';
    const currentDays = formData[field] as string[];
    
    setFormData(prev => ({
      ...prev,
      [field]: currentDays.includes(day) 
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Update employee data
      if (currentEmployee) {
        await updateEmployee(currentEmployee.id, {
          full_name: formData.full_name,
          department: formData.department,
          team: formData.team,
          preferred_work_mode: formData.preferred_work_mode,
          prefer_window: formData.prefer_window,
          needs_accessible: formData.needs_accessible,
          preferred_zone: formData.preferred_zone,
          preferred_days: formData.preferred_days,
        });
      }

      // Update or create constraints
      const constraintsData = {
        employee_id: user.id,
        max_weekly_office_days: formData.max_weekly_office_days,
        preferred_floor: formData.preferred_floor,
        avoid_days: formData.avoid_days,
        preferred_days: formData.preferred_days,
        preferred_zone: formData.preferred_zone,
        needs_accessible_seat: formData.needs_accessible,
      };

      if (currentConstraints) {
        await updateConstraints(currentConstraints.id, constraintsData);
      } else {
        await createConstraints(constraintsData);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department,
          team: formData.team,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            Employee Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {formData.full_name || 'Employee'}! Manage your profile and workspace preferences.
          </p>
        </div>
        <Button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={saving}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.full_name || 'Not set'}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Enter your department"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.department || 'Not set'}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              {isEditing ? (
                <Input
                  id="team"
                  value={formData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  placeholder="Enter your team"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.team || 'Not set'}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_mode">Work Mode</Label>
              {isEditing ? (
                <Select value={formData.preferred_work_mode} onValueChange={(value) => handleInputChange('preferred_work_mode', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-muted rounded-md capitalize">{formData.preferred_work_mode}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Workspace Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="prefer_window">Window Seat Preference</Label>
                  <p className="text-sm text-muted-foreground">I prefer seats near windows</p>
                </div>
                {isEditing ? (
                  <Switch
                    id="prefer_window"
                    checked={formData.prefer_window}
                    onCheckedChange={(checked) => handleInputChange('prefer_window', checked)}
                  />
                ) : (
                  <Badge variant={formData.prefer_window ? "default" : "secondary"}>
                    {formData.prefer_window ? "Yes" : "No"}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="needs_accessible">Accessibility Requirements</Label>
                  <p className="text-sm text-muted-foreground">I need accessible seating</p>
                </div>
                {isEditing ? (
                  <Switch
                    id="needs_accessible"
                    checked={formData.needs_accessible}
                    onCheckedChange={(checked) => handleInputChange('needs_accessible', checked)}
                  />
                ) : (
                  <Badge variant={formData.needs_accessible ? "default" : "secondary"}>
                    {formData.needs_accessible ? "Required" : "Not needed"}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Zone</Label>
                {isEditing ? (
                  <Select value={formData.preferred_zone || "no-preference"} onValueChange={(value) => handleInputChange('preferred_zone', value === "no-preference" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">No preference</SelectItem>
                      {ZONES.map(zone => (
                        <SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted rounded-md">{formData.preferred_zone ? `Zone ${formData.preferred_zone}` : 'No preference'}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Floor</Label>
                {isEditing ? (
                  <Select 
                    value={formData.preferred_floor?.toString() || "no-preference"} 
                    onValueChange={(value) => handleInputChange('preferred_floor', value === "no-preference" ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">No preference</SelectItem>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted rounded-md">{formData.preferred_floor ? `Floor ${formData.preferred_floor}` : 'No preference'}</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Maximum Office Days Per Week</Label>
            {isEditing ? (
              <Select 
                value={formData.max_weekly_office_days.toString()} 
                onValueChange={(value) => handleInputChange('max_weekly_office_days', parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'day' : 'days'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 bg-muted rounded-md">{formData.max_weekly_office_days} {formData.max_weekly_office_days === 1 ? 'day' : 'days'}</div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preferred Days</Label>
              <p className="text-sm text-muted-foreground mb-3">Days when you prefer to work in the office</p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`preferred-${day}`}
                        checked={formData.preferred_days.includes(day)}
                        onCheckedChange={() => handleDayToggle(day, true)}
                      />
                      <Label htmlFor={`preferred-${day}`} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.preferred_days.length > 0 ? formData.preferred_days.map(day => (
                    <Badge key={day} variant="outline">{day}</Badge>
                  )) : <span className="text-muted-foreground">No preference</span>}
                </div>
              )}
            </div>

            <div>
              <Label className="text-base font-medium">Days to Avoid</Label>
              <p className="text-sm text-muted-foreground mb-3">Days when you prefer to work remotely</p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`avoid-${day}`}
                        checked={formData.avoid_days.includes(day)}
                        onCheckedChange={() => handleDayToggle(day, false)}
                      />
                      <Label htmlFor={`avoid-${day}`} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.avoid_days.length > 0 ? formData.avoid_days.map(day => (
                    <Badge key={day} variant="secondary">{day}</Badge>
                  )) : <span className="text-muted-foreground">No specific days to avoid</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferences Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.prefer_window && (
              <Badge variant="outline">🪟 Window seats</Badge>
            )}
            {formData.needs_accessible && (
              <Badge variant="outline">♿ Accessible</Badge>
            )}
            {formData.preferred_zone && (
              <Badge variant="outline">📍 Zone {formData.preferred_zone}</Badge>
            )}
            {formData.preferred_floor && (
              <Badge variant="outline">🏢 Floor {formData.preferred_floor}</Badge>
            )}
            <Badge variant="outline">
              📅 Max {formData.max_weekly_office_days} office days/week
            </Badge>
            {formData.preferred_days.length > 0 && (
              <Badge variant="outline">
                ✅ Prefers: {formData.preferred_days.join(', ')}
              </Badge>
            )}
            {formData.avoid_days.length > 0 && (
              <Badge variant="outline">
                ❌ Avoids: {formData.avoid_days.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Manager/Admin Dashboard Component
const ManagerDashboard = () => {
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

// Main Dashboard Component with Role-based Rendering
const Dashboard = () => {
  const { userRole } = useAuth();

  if (userRole?.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return <ManagerDashboard />;
};

export default Dashboard;