// ============= Schedule and Assignment Data Hook =============

import { useState, useEffect, useCallback } from 'react';
import { Schedule, SeatAssignments, DayKey, Employee, Seat } from '@/types/planner';
import { 
  getScheduleAssignments, 
  bulkSaveScheduleAssignments 
} from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

export interface ScheduleMetadata {
  scheduleId?: string;
  weekOf: string;
  totalScheduled: number;
  utilizationByDay: Record<DayKey, number>;
  violationCount: number;
  modelVersion?: string;
  generatedAt: Date;
}

export function useScheduleData() {
  const [schedule, setSchedule] = useState<Schedule>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: []
  });
  const [assignments, setAssignments] = useState<SeatAssignments>({
    Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}
  });
  const [metadata, setMetadata] = useState<ScheduleMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get current week start date (Monday)
  const getCurrentWeekStart = useCallback(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    return weekStart.toISOString().split('T')[0];
  }, []);

  const saveSchedule = async (
    newSchedule: Schedule, 
    employees: Employee[], 
    weekStartDate: string,
    modelVersion: string = 'heuristic-v1'
  ) => {
    try {
      setLoading(true);
      console.log('saveSchedule called with:', { newSchedule, weekStartDate });
      
      // Convert schedule to assignment records
      const assignmentRecords = [];
      const days: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      
      for (const day of days) {
        const dayIndex = days.indexOf(day);
        const assignmentDate = new Date(weekStartDate);
        assignmentDate.setDate(assignmentDate.getDate() + dayIndex);
        
        for (const employeeId of newSchedule[day]) {
          assignmentRecords.push({
            employee_id: employeeId,
            assignment_date: assignmentDate.toISOString().split('T')[0],
            day_of_week: day,
            assignment_type: 'scheduled' as const,
            model_version: modelVersion,
            constraints_met: { scheduled: true }
            // seat_id will be NULL until seats are assigned later
          });
        }
      }
      
      console.log('Assignment records to save:', assignmentRecords);
      
      if (assignmentRecords.length > 0) {
        await bulkSaveScheduleAssignments(assignmentRecords);
        console.log('Bulk save completed');
      } else {
        console.log('No assignment records to save');
      }
      
      setSchedule(newSchedule);
      
      // Update metadata
      const totalScheduled = Object.values(newSchedule).flat().length;
      const utilizationByDay = Object.fromEntries(
        days.map(day => [day, newSchedule[day].length])
      ) as Record<DayKey, number>;
      
      setMetadata({
        weekOf: weekStartDate,
        totalScheduled,
        utilizationByDay,
        violationCount: 0,
        modelVersion,
        generatedAt: new Date()
      });
      
      toast({
        title: "Schedule Saved",
        description: `Saved schedule with ${totalScheduled} assignments for week of ${weekStartDate}`
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedule';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveSeatAssignments = async (
    dayAssignments: Record<string, string>,
    day: DayKey,
    seats: Seat[],
    employees: Employee[],
    assignmentDate: string,
    modelVersion: string = 'heuristic-v1'
  ) => {
    try {
      setLoading(true);
      
      // Convert seat assignments to assignment records
      const assignmentRecords = Object.entries(dayAssignments).map(([employeeId, seatId]) => ({
        employee_id: employeeId,
        seat_id: seatId,
        assignment_date: assignmentDate,
        day_of_week: day,
        assignment_type: 'assigned' as const,
        model_version: modelVersion,
        confidence_score: 0.8, // Default confidence for heuristic assignments
        constraints_met: { 
          seat_assigned: true, 
          preferences_considered: true 
        }
      }));
      
      if (assignmentRecords.length > 0) {
        await bulkSaveScheduleAssignments(assignmentRecords);
      }
      
      setAssignments(prev => ({
        ...prev,
        [day]: dayAssignments
      }));
      
      toast({
        title: "Assignments Saved",
        description: `Saved ${Object.keys(dayAssignments).length} seat assignments for ${day}`
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save seat assignments';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleForWeek = useCallback(async (weekStartDate: string) => {
    try {
      setLoading(true);
      
      // Calculate week end date
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const assignments = await getScheduleAssignments(
        weekStartDate,
        weekEnd.toISOString().split('T')[0]
      );
      
      // Group assignments by day
      const newSchedule: Schedule = {
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: []
      };
      const newSeatAssignments: SeatAssignments = {
        Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}
      };
      
      for (const assignment of assignments) {
        const day = assignment.day_of_week as DayKey;
        if (day in newSchedule) {
          // Add to schedule if it's a scheduled assignment
          if (assignment.assignment_type === 'scheduled' || assignment.assignment_type === 'assigned') {
            if (!newSchedule[day].includes(assignment.employee_id)) {
              newSchedule[day].push(assignment.employee_id);
            }
          }
          // Add seat assignment if seat is present
          if (assignment.seat_id) {
            newSeatAssignments[day][assignment.employee_id] = assignment.seat_id;
          }
        }
      }
      
      setSchedule(newSchedule);
      setAssignments(newSeatAssignments);
      
      const totalScheduled = Object.values(newSchedule).flat().length;
      const utilizationByDay = Object.fromEntries(
        Object.entries(newSchedule).map(([day, empIds]) => [day, empIds.length])
      ) as Record<DayKey, number>;
      
      setMetadata({
        weekOf: weekStartDate,
        totalScheduled,
        utilizationByDay,
        violationCount: 0,
        generatedAt: new Date()
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedule';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearSchedule = () => {
    setSchedule({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
    setAssignments({ Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {} });
    setMetadata(null);
  };

  // Auto-load schedule for current week on mount
  useEffect(() => {
    const loadCurrentWeekSchedule = async () => {
      const currentWeekStart = getCurrentWeekStart();
      console.log('Loading schedule for current week:', currentWeekStart);
      await loadScheduleForWeek(currentWeekStart);
    };

    loadCurrentWeekSchedule();
  }, [loadScheduleForWeek, getCurrentWeekStart]);

  return {
    schedule,
    assignments,
    metadata,
    loading,
    setSchedule,
    setAssignments,
    setMetadata,
    saveSchedule,
    saveSeatAssignments,
    loadScheduleForWeek,
    clearSchedule
  };
}