import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ActivityItem {
  id: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  details?: string;
  user_id?: string;
  created_at: string;
}

export const useRealtimeActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load initial activities
  useEffect(() => {
    loadRecentActivities();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const channels = [
      // Listen to assignment changes
      supabase
        .channel('assignment_changes')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'assignment_changes' 
          },
          (payload) => {
            const newActivity: ActivityItem = {
              id: payload.new.id,
              action: `Seat assignment ${payload.new.change_type}: ${payload.new.employee_id}`,
              time: formatTimeAgo(new Date(payload.new.created_at)),
              status: 'info',
              details: `Changed from ${payload.new.old_seat_id || 'unassigned'} to ${payload.new.new_seat_id || 'unassigned'}`,
              created_at: payload.new.created_at
            };
            
            addActivity(newActivity);
            showNotification(newActivity);
          }
        )
        .subscribe(),

      // Listen to schedule changes
      supabase
        .channel('schedules')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'schedules' 
          },
          (payload) => {
            let action = '';
            let status: ActivityItem['status'] = 'info';
            
            // Type guard to ensure payload.new exists
            if (!payload.new) return;
            
            if (payload.eventType === 'INSERT') {
              action = `New schedule created for ${new Date(payload.new.week_start).toLocaleDateString()}`;
              status = 'success';
            } else if (payload.eventType === 'UPDATE' && payload.old) {
              if (payload.new.status === 'published' && payload.old.status !== 'published') {
                action = `Schedule published for ${new Date(payload.new.week_start).toLocaleDateString()}`;
                status = 'success';
              } else {
                action = `Schedule updated for ${new Date(payload.new.week_start).toLocaleDateString()}`;
                status = 'info';
              }
            }
            
            if (action) {
              const newActivity: ActivityItem = {
                id: ((payload.new as any).id || 'unknown') + '_' + Date.now(),
                action,
                time: formatTimeAgo(new Date((payload.new as any).updated_at || new Date())),
                status,
                details: `Status: ${(payload.new as any).status || 'unknown'}`,
                created_at: (payload.new as any).updated_at || new Date().toISOString()
              };
              
              addActivity(newActivity);
              showNotification(newActivity);
            }
          }
        )
        .subscribe(),

      // Listen to employee attendance
      supabase
        .channel('employee_attendance')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'employee_attendance' 
          },
          (payload) => {
            const newActivity: ActivityItem = {
              id: payload.new.id,
              action: `Employee checked in: ${payload.new.employee_id}`,
              time: formatTimeAgo(new Date(payload.new.created_at)),
              status: 'success',
              details: `Location: ${payload.new.location}${payload.new.seat_id ? `, Seat: ${payload.new.seat_id}` : ''}`,
              created_at: payload.new.created_at
            };
            
            addActivity(newActivity);
            showNotification(newActivity);
          }
        )
        .subscribe(),

      // Listen to schedule assignments for capacity warnings
      supabase
        .channel('schedule_assignments')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'schedule_assignments' 
          },
          (payload) => {
            // Check for potential capacity issues
            checkCapacityWarnings(payload.new);
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Get recent assignment changes
      const { data: assignmentChanges } = await supabase
        .from('assignment_changes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent schedules
      const { data: schedules } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent attendance
      const { data: attendance } = await supabase
        .from('employee_attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const recentActivities: ActivityItem[] = [];

      // Process assignment changes
      assignmentChanges?.forEach(change => {
        recentActivities.push({
          id: change.id,
          action: `Seat assignment ${change.change_type}: ${change.employee_id}`,
          time: formatTimeAgo(new Date(change.created_at)),
          status: 'info',
          details: `${change.day_name}: ${change.old_seat_id || 'unassigned'} → ${change.new_seat_id || 'unassigned'}`,
          created_at: change.created_at
        });
      });

      // Process schedules
      schedules?.forEach(schedule => {
        let action = '';
        let status: ActivityItem['status'] = 'info';
        
        if (schedule.status === 'published') {
          action = `Schedule published for ${new Date(schedule.week_start).toLocaleDateString()}`;
          status = 'success';
        } else {
          action = `Schedule created for ${new Date(schedule.week_start).toLocaleDateString()}`;
          status = 'info';
        }
        
        recentActivities.push({
          id: schedule.id + '_schedule',
          action,
          time: formatTimeAgo(new Date(schedule.created_at)),
          status,
          details: `Status: ${schedule.status}`,
          created_at: schedule.created_at
        });
      });

      // Process attendance
      attendance?.forEach(att => {
        recentActivities.push({
          id: att.id,
          action: `Employee checked in: ${att.employee_id}`,
          time: formatTimeAgo(new Date(att.created_at)),
          status: 'success',
          details: `Location: ${att.location}${att.seat_id ? `, Seat: ${att.seat_id}` : ''}`,
          created_at: att.created_at
        });
      });

      // Sort by most recent and limit
      recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(recentActivities.slice(0, 10));
      
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = (activity: ActivityItem) => {
    setActivities(prev => {
      const updated = [activity, ...prev].slice(0, 10); // Keep only latest 10
      return updated;
    });
  };

  const showNotification = (activity: ActivityItem) => {
    // Only show notifications for important events
    if (activity.status === 'success' || activity.status === 'warning' || activity.status === 'error') {
      toast({
        title: "Activity Update",
        description: activity.action,
        variant: activity.status === 'error' ? 'destructive' : 'default',
      });
    }
  };

  const checkCapacityWarnings = async (assignment: any) => {
    try {
      // Check daily capacity for potential warnings
      const { data: dailyCount } = await supabase
        .from('schedule_assignments')
        .select('id')
        .eq('assignment_date', assignment.assignment_date)
        .eq('day_of_week', assignment.day_of_week)
        .eq('assignment_type', 'assigned');

      // Get total seats for capacity calculation
      const { data: seats } = await supabase
        .from('seats')
        .select('id');

      if (dailyCount && seats) {
        const occupancyRate = (dailyCount.length / seats.length) * 100;
        
        if (occupancyRate > 90) {
          const warningActivity: ActivityItem = {
            id: `capacity_warning_${assignment.assignment_date}_${assignment.day_of_week}`,
            action: `High capacity warning for ${assignment.day_of_week}`,
            time: formatTimeAgo(new Date()),
            status: 'warning',
            details: `Occupancy at ${Math.round(occupancyRate)}% capacity`,
            created_at: new Date().toISOString()
          };
          
          addActivity(warningActivity);
          showNotification(warningActivity);
        }
      }
    } catch (error) {
      console.error('Error checking capacity:', error);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return {
    activities,
    loading,
    refreshActivities: loadRecentActivities
  };
};