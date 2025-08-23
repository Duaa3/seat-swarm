import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useEmployees } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { supabase } from "@/integrations/supabase/client";
import { 
  DAYS, 
  DayKey, 
  toLegacyEmployee,
  toLegacySeat
} from "@/types/planner";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  User,
  Building,
  Wifi,
  Car,
  Coffee
} from "lucide-react";

const EmployeePortal = () => {
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("");
  const [realTimeEnabled, setRealTimeEnabled] = React.useState(false);
  
  // Database hooks
  const { employees: dbEmployees, loading: employeesLoading } = useEmployees();
  const { seats: dbSeats, loading: seatsLoading } = useSeats();
  const { schedule, assignments, loading: scheduleLoading } = useScheduleData();

  // Convert to legacy format
  const legacyEmployees = React.useMemo(() => dbEmployees.map(toLegacyEmployee), [dbEmployees]);
  const legacySeats = React.useMemo(() => dbSeats.map(toLegacySeat), [dbSeats]);

  const loading = employeesLoading || seatsLoading || scheduleLoading;

  // Real-time conflict detection
  React.useEffect(() => {
    if (!realTimeEnabled || !selectedEmployee) return;

    const channel = supabase
      .channel('schedule-conflicts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          console.log('Real-time assignment change:', payload);
          // Check if this affects the selected employee
          if ((payload.new as any)?.employee_id === selectedEmployee || (payload.old as any)?.employee_id === selectedEmployee) {
            toast({
              title: "Schedule Updated",
              description: "Your schedule has been updated in real-time",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realTimeEnabled, selectedEmployee]);

  // Get employee's weekly schedule
  const getEmployeeSchedule = React.useCallback((employeeId: string) => {
    const weekSchedule: Record<DayKey, { scheduled: boolean; seatId?: string; seatInfo?: any }> = {
      Mon: { scheduled: false },
      Tue: { scheduled: false },
      Wed: { scheduled: false },
      Thu: { scheduled: false },
      Fri: { scheduled: false },
    };

    DAYS.forEach(day => {
      const isScheduled = schedule[day]?.includes(employeeId) || false;
      const seatId = assignments[day]?.[employeeId];
      const seatInfo = seatId ? dbSeats.find(s => s.id === seatId) : undefined;

      weekSchedule[day] = {
        scheduled: isScheduled,
        seatId,
        seatInfo
      };
    });

    return weekSchedule;
  }, [schedule, assignments, dbSeats]);

  const selectedEmployeeData = React.useMemo(() => {
    return dbEmployees.find(emp => emp.id === selectedEmployee);
  }, [dbEmployees, selectedEmployee]);

  const employeeSchedule = React.useMemo(() => {
    return selectedEmployee ? getEmployeeSchedule(selectedEmployee) : null;
  }, [selectedEmployee, getEmployeeSchedule]);

  // Calculate stats for selected employee
  const employeeStats = React.useMemo(() => {
    if (!employeeSchedule) return null;

    const scheduledDays = Object.values(employeeSchedule).filter(day => day.scheduled).length;
    const assignedSeats = Object.values(employeeSchedule).filter(day => day.seatId).length;
    const windowSeats = Object.values(employeeSchedule).filter(day => day.seatInfo?.is_window).length;
    const accessibleSeats = Object.values(employeeSchedule).filter(day => day.seatInfo?.is_accessible).length;

    return {
      scheduledDays,
      assignedSeats,
      windowSeats,
      accessibleSeats,
      utilizationRate: scheduledDays > 0 ? Math.round((assignedSeats / scheduledDays) * 100) : 0
    };
  }, [employeeSchedule]);

  // Check for conflicts
  const checkConflicts = React.useCallback(() => {
    if (!selectedEmployee || !employeeSchedule) return [];

    const conflicts: Array<{ day: DayKey; type: string; message: string; severity: 'warning' | 'error' }> = [];

    DAYS.forEach(day => {
      const dayData = employeeSchedule[day];
      
      // Conflict: Scheduled but no seat assigned
      if (dayData.scheduled && !dayData.seatId) {
        conflicts.push({
          day,
          type: 'missing_seat',
          message: 'Scheduled but no seat assigned',
          severity: 'error'
        });
      }

      // Conflict: Accessibility needs not met
      if (dayData.scheduled && dayData.seatInfo && selectedEmployeeData?.needs_accessible && !dayData.seatInfo.is_accessible) {
        conflicts.push({
          day,
          type: 'accessibility',
          message: 'Assigned seat is not accessible',
          severity: 'error'
        });
      }

      // Warning: Preference not met
      if (dayData.scheduled && dayData.seatInfo && selectedEmployeeData?.prefer_window && !dayData.seatInfo.is_window) {
        conflicts.push({
          day,
          type: 'preference',
          message: 'Preferred window seat not available',
          severity: 'warning'
        });
      }
    });

    return conflicts;
  }, [selectedEmployee, employeeSchedule, selectedEmployeeData]);

  const conflicts = React.useMemo(() => checkConflicts(), [checkConflicts]);

  const getSeatFeatures = (seatInfo: any) => {
    const features = [];
    if (seatInfo?.is_window) features.push({ icon: "🪟", label: "Window" });
    if (seatInfo?.is_accessible) features.push({ icon: "♿", label: "Accessible" });
    if (seatInfo?.zone) features.push({ icon: "📍", label: seatInfo.zone });
    return features;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">👤 Employee Portal</h1>
          <p className="text-muted-foreground mt-2">
            View individual schedules, seat assignments, and real-time updates
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className="gap-2"
          >
            <Wifi className="h-4 w-4" />
            Real-time {realTimeEnabled ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Employee Selection */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an employee to view their schedule..." />
            </SelectTrigger>
            <SelectContent>
              {dbEmployees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  <div className="flex items-center gap-2">
                    <span>{emp.full_name}</span>
                    <Badge variant="outline" className="text-xs">{emp.team}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployee && selectedEmployeeData && (
        <>
          {/* Employee Profile */}
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedEmployeeData.full_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedEmployeeData.team}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedEmployeeData.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedEmployeeData.preferred_work_mode || 'Hybrid'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedEmployeeData.commute_minutes || 'N/A'} min commute</span>
                </div>
              </div>
              
              {/* Preferences */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEmployeeData.prefer_window && (
                  <Badge variant="outline" className="text-xs">🪟 Prefers window seats</Badge>
                )}
                {selectedEmployeeData.needs_accessible && (
                  <Badge variant="outline" className="text-xs">♿ Needs accessible seat</Badge>
                )}
                {selectedEmployeeData.preferred_zone && (
                  <Badge variant="outline" className="text-xs">📍 Prefers {selectedEmployeeData.preferred_zone}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          {employeeStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Scheduled Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeStats.scheduledDays}</div>
                  <p className="text-xs text-muted-foreground">out of 5 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Assigned Seats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{employeeStats.assignedSeats}</div>
                  <p className="text-xs text-muted-foreground">seats allocated</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeStats.utilizationRate}%</div>
                  <p className="text-xs text-muted-foreground">assignment rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Window Seats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{employeeStats.windowSeats}</div>
                  <p className="text-xs text-muted-foreground">preferred seats</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conflicts Alert */}
          {conflicts.length > 0 && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Schedule Conflicts ({conflicts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conflicts.map((conflict, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-2 rounded ${
                        conflict.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conflict.day}:</span>
                        <span className="text-sm">{conflict.message}</span>
                      </div>
                      <Badge variant={conflict.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                        {conflict.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Schedule */}
          {employeeSchedule && (
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {DAYS.map(day => {
                    const dayData = employeeSchedule[day];
                    const features = dayData.seatInfo ? getSeatFeatures(dayData.seatInfo) : [];
                    
                    return (
                      <div 
                        key={day} 
                        className={`p-4 rounded-lg border-2 ${
                          dayData.scheduled 
                            ? dayData.seatId 
                              ? "border-green-200 bg-green-50/30" 
                              : "border-yellow-200 bg-yellow-50/30"
                            : "border-gray-200 bg-gray-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{day}</span>
                              {dayData.scheduled ? (
                                dayData.seatId ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            
                            {dayData.scheduled && (
                              <Badge variant={dayData.seatId ? "default" : "secondary"}>
                                {dayData.seatId ? "Seat Assigned" : "Pending Assignment"}
                              </Badge>
                            )}
                          </div>
                          
                          {dayData.seatId && (
                            <div className="text-right">
                              <div className="font-medium text-sm">Seat {dayData.seatId}</div>
                              <div className="text-xs text-muted-foreground">
                                Floor {dayData.seatInfo?.floor || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {dayData.scheduled && (
                          <div className="mt-3">
                            {dayData.seatId ? (
                              <div className="flex flex-wrap gap-2">
                                {features.map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature.icon} {feature.label}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-yellow-700">
                                Scheduled for office but seat assignment pending
                              </p>
                            )}
                          </div>
                        )}
                        
                        {!dayData.scheduled && (
                          <p className="text-sm text-gray-600 mt-2">
                            Working remotely
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedEmployee && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select an Employee</h3>
              <p className="text-muted-foreground">
                Choose an employee from the dropdown above to view their schedule, seat assignments, and preferences.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeePortal;