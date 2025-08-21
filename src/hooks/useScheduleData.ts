// ============= Schedule and Assignment Data Hook =============

import { useState, useEffect } from 'react';
import { Schedule, SeatAssignments, DayKey, Employee, Seat } from '@/types/planner';
import { 
  getScheduleAssignments, 
  bulkSaveScheduleAssignments, 
  saveTrainingData,
  saveModelPerformance 
} from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

export interface ScheduleMetadata {
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

  const saveSchedule = async (
    newSchedule: Schedule, 
    employees: Employee[], 
    weekStartDate: string,
    modelVersion: string = 'heuristic-v1'
  ) => {
    try {
      setLoading(true);
      
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
            assignment_type: 'manual' as const,
            model_version: modelVersion,
            constraints_met: { scheduled: true },
            seat_id: 'TBD' // Placeholder seat ID - will be assigned later
          });
        }
      }
      
      if (assignmentRecords.length > 0) {
        await bulkSaveScheduleAssignments(assignmentRecords);
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
        assignment_type: 'auto' as const,
        model_version: modelVersion,
        confidence_score: 0.8, // Default confidence for heuristic assignments
        constraints_met: { 
          seat_assigned: true, 
          preferences_considered: true 
        }
      }));
      
      if (assignmentRecords.length > 0) {
        await bulkSaveScheduleAssignments(assignmentRecords);
        
        // Save training data for each assignment
        for (const record of assignmentRecords) {
          const employee = employees.find(e => e.employee_id === record.employee_id);
          const seat = seats.find(s => s.seat_id === record.seat_id);
          
          if (employee && seat) {
          await saveTrainingData({
            employee_features: {
              preferred_work_mode: employee.preferred_work_mode,
              needs_accessible: employee.needs_accessible,
              prefer_window: employee.prefer_window,
              preferred_zone: employee.preferred_zone,
              onsite_ratio: employee.onsite_ratio,
              project_count: employee.project_count,
              preferred_days: employee.preferred_days,
              team: employee.team,
              department: employee.department
            },
            seat_features: {
              floor: seat.floor,
              zone: seat.zone,
              is_accessible: seat.is_accessible,
              is_window: seat.is_window,
              x_coordinate: seat.x,
              y_coordinate: seat.y
            },
            context_features: {
              assignment_day: day,
              assignment_date: assignmentDate,
              total_assignments: assignmentRecords.length
            },
            target_assignment: {
              employee_id: record.employee_id,
              seat_id: record.seat_id,
              success: true
            },
            data_source: 'user_assignment',
            assignment_success: true,
            satisfaction_score: 8, // Default satisfaction for manual assignments
            model_version: modelVersion
          });
          }
        }
        
        // Save model performance metrics
        await saveModelPerformance({
          model_type: 'heuristic',
          model_version: modelVersion,
          assignment_date: assignmentDate,
          total_assignments: assignmentRecords.length,
          successful_assignments: assignmentRecords.length,
          avg_satisfaction: 0.8,
          avg_constraint_adherence: 0.9,
          processing_time_ms: 100,
          metrics: {
            assignment_method: 'manual',
            day_of_week: day,
            floor_distribution: {}
          }
        });
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

  const loadScheduleForWeek = async (weekStartDate: string) => {
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
          if (assignment.assignment_type === 'manual') {
            newSchedule[day].push(assignment.employee_id);
          }
          if (assignment.assignment_type === 'auto' && assignment.seat_id) {
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
  };

  const clearSchedule = () => {
    setSchedule({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] });
    setAssignments({ Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {} });
    setMetadata(null);
  };

  return {
    schedule,
    assignments,
    metadata,
    loading,
    setSchedule,
    setAssignments,
    saveSchedule,
    saveSeatAssignments,
    loadScheduleForWeek,
    clearSchedule
  };
}