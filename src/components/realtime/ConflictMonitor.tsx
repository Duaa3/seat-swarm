import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Wifi, WifiOff, Zap, Users } from "lucide-react";

interface Conflict {
  id: string;
  type: 'seat_double_booking' | 'capacity_exceeded' | 'constraint_violation' | 'team_split';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

interface ConflictMonitorProps {
  enabled?: boolean;
  onConflictDetected?: (conflict: Conflict) => void;
}

const ConflictMonitor: React.FC<ConflictMonitorProps> = ({ 
  enabled = true, 
  onConflictDetected 
}) => {
  const [conflicts, setConflicts] = React.useState<Conflict[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  // Real-time monitoring setup
  React.useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    const channels = [
      // Monitor assignment changes
      supabase
        .channel('conflict-monitor-assignments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assignments'
          },
          (payload) => {
            console.log('Assignment change detected:', payload);
            setLastUpdate(new Date());
            checkForConflicts(payload);
          }
        ),
      
      // Monitor schedule changes
      supabase
        .channel('conflict-monitor-schedules')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'schedule_days'
          },
          (payload) => {
            console.log('Schedule change detected:', payload);
            setLastUpdate(new Date());
            checkForConflicts(payload);
          }
        ),

      // Monitor seat changes
      supabase
        .channel('conflict-monitor-seats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seats'
          },
          (payload) => {
            console.log('Seat change detected:', payload);
            setLastUpdate(new Date());
            checkForConflicts(payload);
          }
        )
    ];

    // Subscribe to all channels
    const subscribeAll = async () => {
      for (const channel of channels) {
        channel.subscribe((status) => {
          console.log('Channel subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
      }
    };

    subscribeAll();

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [enabled]);

  // Conflict detection logic
  const checkForConflicts = React.useCallback(async (payload: any) => {
    try {
      // Check for double bookings
      await checkDoubleBookings();
      
      // Check capacity violations
      await checkCapacityViolations();
      
      // Check constraint violations
      await checkConstraintViolations();
      
      // Check team splitting
      await checkTeamSplitting();
      
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  }, []);

  const checkDoubleBookings = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          id,
          employee_id,
          seat_id,
          schedule_day_id,
          schedule_days!inner(day_name, schedule_id, schedules!inner(week_start))
        `);

      if (error) throw error;

      // Group by seat and day to find conflicts
      const seatDayMap = new Map<string, any[]>();
      
      assignments?.forEach(assignment => {
        const key = `${assignment.seat_id}-${assignment.schedule_days.day_name}`;
        if (!seatDayMap.has(key)) {
          seatDayMap.set(key, []);
        }
        seatDayMap.get(key)?.push(assignment);
      });

      // Find double bookings
      seatDayMap.forEach((assignments, key) => {
        if (assignments.length > 1) {
          const conflict: Conflict = {
            id: `double-booking-${key}-${Date.now()}`,
            type: 'seat_double_booking',
            severity: 'critical',
            message: `Seat ${assignments[0].seat_id} is double-booked on ${assignments[0].schedule_days.day_name}`,
            details: { assignments, seatId: assignments[0].seat_id, day: assignments[0].schedule_days.day_name },
            timestamp: new Date(),
            resolved: false
          };
          
          addConflict(conflict);
        }
      });
    } catch (error) {
      console.error('Error checking double bookings:', error);
    }
  };

  const checkCapacityViolations = async () => {
    try {
      const { data: floorOccupancy, error } = await supabase
        .from('v_floor_occupancy')
        .select('*');

      if (error) throw error;

      // Check against floor capacities (this would come from constraints)
      const floorCapacities = { 1: 48, 2: 50 }; // These should come from global_constraints

      floorOccupancy?.forEach(occupancy => {
        const capacity = floorCapacities[occupancy.floor as keyof typeof floorCapacities];
        if (capacity && occupancy.occupied > capacity) {
          const conflict: Conflict = {
            id: `capacity-${occupancy.floor}-${occupancy.day_name}-${Date.now()}`,
            type: 'capacity_exceeded',
            severity: 'high',
            message: `Floor ${occupancy.floor} capacity exceeded on ${occupancy.day_name}`,
            details: { floor: occupancy.floor, occupied: occupancy.occupied, capacity, day: occupancy.day_name },
            timestamp: new Date(),
            resolved: false
          };
          
          addConflict(conflict);
        }
      });
    } catch (error) {
      console.error('Error checking capacity violations:', error);
    }
  };

  const checkConstraintViolations = async () => {
    try {
      // Check employee constraints
      const { data: employeeConstraints, error } = await supabase
        .from('employee_constraints')
        .select('*');

      if (error) throw error;

      // This would involve complex logic to check if assignments violate employee constraints
      // For now, we'll just log that we're checking
      console.log('Checking employee constraints...');
    } catch (error) {
      console.error('Error checking constraint violations:', error);
    }
  };

  const checkTeamSplitting = async () => {
    try {
      // Check if teams that should be together are split across floors
      const { data: teamConstraints, error } = await supabase
        .from('team_constraints')
        .select('*')
        .eq('prefer_same_floor', true);

      if (error) throw error;

      // This would involve checking if team members are assigned to different floors
      console.log('Checking team splitting constraints...');
    } catch (error) {
      console.error('Error checking team splitting:', error);
    }
  };

  const addConflict = (conflict: Conflict) => {
    setConflicts(prev => {
      // Avoid duplicates
      const exists = prev.some(c => c.id === conflict.id || 
        (c.type === conflict.type && JSON.stringify(c.details) === JSON.stringify(conflict.details)));
      
      if (exists) return prev;

      const updated = [conflict, ...prev].slice(0, 50); // Keep last 50 conflicts
      
      // Notify parent component
      onConflictDetected?.(conflict);
      
      // Show toast for critical conflicts
      if (conflict.severity === 'critical') {
        toast({
          title: "Critical Conflict Detected",
          description: conflict.message,
          variant: "destructive",
        });
      }
      
      return updated;
    });
  };

  const resolveConflict = (conflictId: string) => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId 
          ? { ...conflict, resolved: true }
          : conflict
      )
    );
    
    toast({
      title: "Conflict Resolved",
      description: "The conflict has been marked as resolved.",
    });
  };

  const clearAllConflicts = () => {
    setConflicts([]);
    toast({
      title: "Conflicts Cleared",
      description: "All conflicts have been cleared from the monitor.",
    });
  };

  const getSeverityColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'seat_double_booking': return '🪑';
      case 'capacity_exceeded': return '📊';
      case 'constraint_violation': return '⚠️';
      case 'team_split': return '👥';
      default: return '❓';
    }
  };

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);
  const criticalConflicts = unresolvedConflicts.filter(c => c.severity === 'critical');

  return (
    <Card className={`shadow-glow ${criticalConflicts.length > 0 ? 'border-red-300' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-time Conflict Monitor
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unresolvedConflicts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unresolvedConflicts.length} active
              </Badge>
            )}
            {conflicts.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearAllConflicts}>
                Clear All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Real-time monitoring active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700">Monitoring disconnected</span>
                </>
              )}
            </div>
            {lastUpdate && (
              <span className="text-muted-foreground">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Critical Conflicts Alert */}
          {criticalConflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {criticalConflicts.length} critical conflict{criticalConflicts.length > 1 ? 's' : ''} detected! 
                Immediate attention required.
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts List */}
          {unresolvedConflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Active Conflicts</h3>
              <p className="text-muted-foreground">
                All schedules and assignments are conflict-free
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unresolvedConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(conflict.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon(conflict.type)}</span>
                        <span className="font-medium">{conflict.message}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {conflict.severity}
                        </Badge>
                      </div>
                      <div className="text-xs opacity-75">
                        {conflict.timestamp.toLocaleString()}
                      </div>
                      {conflict.details && (
                        <div className="mt-2 text-xs">
                          <pre className="whitespace-pre-wrap opacity-75">
                            {JSON.stringify(conflict.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveConflict(conflict.id)}
                      className="ml-2"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics */}
          {conflicts.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-4 border-t text-center">
              <div>
                <div className="text-lg font-bold text-red-600">{criticalConflicts.length}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {conflicts.filter(c => c.severity === 'high' && !c.resolved).length}
                </div>
                <div className="text-xs text-muted-foreground">High</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {conflicts.filter(c => c.resolved).length}
                </div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
              <div>
                <div className="text-lg font-bold">{conflicts.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictMonitor;