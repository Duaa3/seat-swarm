import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  Star, 
  TrendingUp,
  Clock,
  Building,
  Users,
  Coffee,
  Car,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useEmployeeConstraints } from "@/hooks/useConstraints";
import { useSatisfactionFeedback } from "@/hooks/useSatisfactionFeedback";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DayKey, DAYS } from "@/types/planner";
import WeeklyScheduleView from "@/components/employee/WeeklyScheduleView";

const ZONES = ['A', 'B', 'C', 'D'] as const;

const EmployeePortal = () => {
  const { user, profile } = useAuth();
  const { employees, updateEmployee } = useEmployees();
  const { seats: dbSeats } = useSeats();
  const { schedule, assignments } = useScheduleData();
  const { constraints, updateConstraints, createConstraints } = useEmployeeConstraints();
  const { feedback, loading: feedbackLoading } = useSatisfactionFeedback(user?.id);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [liveUpdates, setLiveUpdates] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Find current employee data - match by profile info since user might not have employee record yet
  const currentEmployee = employees.find(emp => 
    emp.full_name?.toLowerCase() === profile?.full_name?.toLowerCase() &&
    emp.department === profile?.department &&
    emp.team === profile?.team
  );
  const currentConstraints = constraints.find(c => c.employee_id === currentEmployee?.id);

  // Form state for profile editing
  const [formData, setFormData] = React.useState({
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

  // Real-time updates for schedule changes
  React.useEffect(() => {
    if (!user?.id || !liveUpdates) return;

    const channel = supabase
      .channel('schedule-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_assignments',
          filter: `employee_id=eq.${currentEmployee?.id || user.id}`
        },
        (payload) => {
          console.log('Schedule update received:', payload);
          setLastUpdate(new Date());
          toast({
            title: "Schedule Updated",
            description: "Your schedule has been updated in real-time!",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'satisfaction_feedback',
          filter: `employee_id=eq.${currentEmployee?.id || user.id}`
        },
        (payload) => {
          console.log('Feedback update received:', payload);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, liveUpdates, toast]);

  // Get employee's weekly schedule
  const getEmployeeSchedule = React.useCallback((): Record<DayKey, { scheduled: boolean; seatId?: string; seatInfo?: any }> => {
    if (!user?.id) {
      return {
        Mon: { scheduled: false },
        Tue: { scheduled: false },
        Wed: { scheduled: false },
        Thu: { scheduled: false },
        Fri: { scheduled: false },
      };
    }
    
    const weekSchedule: Record<DayKey, { scheduled: boolean; seatId?: string; seatInfo?: any }> = {
      Mon: { scheduled: false },
      Tue: { scheduled: false },
      Wed: { scheduled: false },
      Thu: { scheduled: false },
      Fri: { scheduled: false },
    };

    DAYS.forEach(day => {
      // Use employee business ID for schedule lookups, not user ID
      const employeeId = currentEmployee?.id || user.id;
      const isScheduled = schedule[day]?.includes(employeeId) || false;
      const seatId = assignments[day]?.[employeeId];
      const seatInfo = seatId ? dbSeats.find(s => s.id === seatId) : undefined;

      // Debug log for janna
      if (user.id === 'fed5761e-311b-4c75-a2a4-a62a80c5dbc7') {
        console.log(`Debug janna ${day}:`, {
          userIdUsed: employeeId,
          userInSchedule: schedule[day]?.includes(employeeId),
          currentEmployee: currentEmployee?.id,
          seatId,
          scheduleForDay: schedule[day],
          assignmentsForDay: assignments[day]
        });
      }

      weekSchedule[day] = {
        scheduled: isScheduled,
        seatId,
        seatInfo
      };
    });

    return weekSchedule;
  }, [user?.id, currentEmployee?.id, schedule, assignments, dbSeats]);

  const employeeSchedule = React.useMemo(() => getEmployeeSchedule(), [getEmployeeSchedule]);

  // Calculate employee stats
  const employeeStats = React.useMemo(() => {
    const scheduleValues = Object.values(employeeSchedule) as Array<{ scheduled: boolean; seatId?: string; seatInfo?: any }>;
    const scheduledDays = scheduleValues.filter(day => day.scheduled).length;
    const assignedSeats = scheduleValues.filter(day => day.seatId).length;
    const windowSeats = scheduleValues.filter(day => day.seatInfo?.is_window).length;
    
    // Calculate average satisfaction from feedback
    const avgSatisfaction = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.satisfaction_score, 0) / feedback.length 
      : 0;

    return {
      scheduledDays,
      assignedSeats,
      windowSeats,
      utilizationRate: scheduledDays > 0 ? Math.round((assignedSeats / scheduledDays) * 100) : 0,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      totalFeedback: feedback.length
    };
  }, [employeeSchedule, feedback]);

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
        // Ensure onsite_ratio is set based on work mode if it's null
        let onsiteRatio = currentEmployee.onsite_ratio;
        if (onsiteRatio === null) {
          switch (formData.preferred_work_mode) {
            case 'onsite':
              onsiteRatio = 0.8;
              break;
            case 'hybrid':
              onsiteRatio = 0.5;
              break;
            case 'remote':
              onsiteRatio = 0.2;
              break;
            default:
              onsiteRatio = 0.5;
          }
        }

        await updateEmployee(currentEmployee.id, {
          full_name: formData.full_name,
          department: formData.department,
          team: formData.team,
          preferred_work_mode: formData.preferred_work_mode,
          prefer_window: formData.prefer_window,
          needs_accessible: formData.needs_accessible,
          preferred_zone: formData.preferred_zone,
          preferred_days: formData.preferred_days,
          onsite_ratio: onsiteRatio,
        });
      }

      // Update or create constraints - handle case where employee record doesn't exist yet
      let employeeBusinessId = currentEmployee?.id;
      
      if (!employeeBusinessId && profile) {
        // Create employee record if it doesn't exist
        const newEmployeeId = `E${Date.now().toString().slice(-3)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
        
        // Set onsite_ratio based on work mode
        let newOnsiteRatio = 0.5; // default
        switch (formData.preferred_work_mode) {
          case 'onsite':
            newOnsiteRatio = 0.8;
            break;
          case 'hybrid':
            newOnsiteRatio = 0.5;
            break;
          case 'remote':
            newOnsiteRatio = 0.2;
            break;
        }
        
        const { data: newEmployee, error: employeeError } = await supabase
          .from('employees')
          .insert({
            id: newEmployeeId,
            full_name: profile.full_name,
            department: profile.department,
            team: profile.team,
            preferred_work_mode: formData.preferred_work_mode,
            prefer_window: formData.prefer_window,
            needs_accessible: formData.needs_accessible,
            preferred_zone: formData.preferred_zone,
            preferred_days: formData.preferred_days,
            onsite_ratio: newOnsiteRatio,
          })
          .select()
          .single();
          
        if (employeeError) throw employeeError;
        employeeBusinessId = newEmployee.id;
      }
      
      if (!employeeBusinessId) {
        throw new Error("Unable to determine or create employee business ID");
      }
      
      const constraintsData = {
        employee_id: employeeBusinessId,
        max_weekly_office_days: formData.max_weekly_office_days,
        preferred_floor: formData.preferred_floor,
        avoid_days: formData.avoid_days,
        preferred_days: formData.preferred_days,
        preferred_zone: formData.preferred_zone,
        needs_accessible_seat: formData.needs_accessible,
      };
      
      console.log('About to save constraints:', constraintsData);
      console.log('Current user ID:', user.id);
      console.log('Employee business ID:', employeeBusinessId);

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

  // Check for schedule conflicts
  const conflicts = React.useMemo(() => {
    const issues: Array<{ day: DayKey; message: string; severity: 'warning' | 'error' }> = [];

    DAYS.forEach(day => {
      const dayData = employeeSchedule[day] as { scheduled: boolean; seatId?: string; seatInfo?: any };
      
      if (dayData.scheduled && !dayData.seatId) {
        issues.push({
          day,
          message: 'Scheduled but no seat assigned',
          severity: 'error'
        });
      }

      if (dayData.scheduled && dayData.seatInfo && formData.needs_accessible && !dayData.seatInfo.is_accessible) {
        issues.push({
          day,
          message: 'Assigned seat is not accessible',
          severity: 'error'
        });
      }

      if (dayData.scheduled && dayData.seatInfo && formData.prefer_window && !dayData.seatInfo.is_window) {
        issues.push({
          day,
          message: 'Preferred window seat not available',
          severity: 'warning'
        });
      }
    });

    return issues;
  }, [employeeSchedule, formData]);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Please log in to access your employee portal</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            Employee Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {formData.full_name || 'Employee'}! Manage your workspace preferences and view your schedule.
          </p>
          {liveUpdates && (
            <p className="text-sm text-green-600 mt-1">
              🟢 Live updates enabled • Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
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
        
        {/* Real-time toggle */}
        <div className="flex items-center gap-2">
          <Switch
            checked={liveUpdates}
            onCheckedChange={setLiveUpdates}
            id="live-updates"
          />
          <Label htmlFor="live-updates" className="text-sm text-muted-foreground">
            Live Updates
          </Label>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Office Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.scheduledDays}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Seat Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{employeeStats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">assignment rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {employeeStats.avgSatisfaction > 0 ? `${employeeStats.avgSatisfaction}/5` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">average rating</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{employeeStats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">ratings given</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Schedule Issues Detected:</strong> {conflicts.map(c => `${c.day}: ${c.message}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Weekly Schedule View */}
      <WeeklyScheduleView
        employeeId={currentEmployee?.id || user.id}
        employeeSchedule={employeeSchedule}
        employeeName={formData.full_name}
      />

      {/* Profile Information */}
      <Card className="shadow-glow">
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
      <Card className="shadow-glow">
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
      <Card className="shadow-glow">
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
    </div>
  );
};

export default EmployeePortal;