import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScheduleGenerationRequest {
  week_start: string;
  enforce_constraints?: boolean;
  override_ratios?: boolean;
  daily_capacities?: Record<string, number>;
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedule_id?: string;
  week_start?: string;
  summary?: {
    total_employees: number;
    total_assignments: number;
    daily_counts: Record<string, number>;
    violations: Array<{
      day: string;
      employee_id?: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    client_site_ratio: number;
    floor_utilization: Record<number, number>;
  };
  error?: string;
}

export function useAdvancedScheduler() {
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const generateSchedule = async (request: ScheduleGenerationRequest): Promise<ScheduleGenerationResult> => {
    setGenerating(true);
    
    try {
      console.log('Invoking advanced-scheduler with request:', request);
      
      const { data, error } = await supabase.functions.invoke('advanced-scheduler', {
        body: request
      });

      console.log('Advanced-scheduler response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from function');
      }

      if (data.success) {
        toast({
          title: 'Schedule Generated',
          description: `Successfully generated schedule for week starting ${request.week_start}`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate schedule');
      }

      return data;
    } catch (error) {
      console.error('Schedule generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setGenerating(false);
    }
  };

  const publishSchedule = async (scheduleId: string): Promise<boolean> => {
    setPublishing(true);
    
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Schedule Published',
        description: 'The schedule is now live and visible to employees',
      });

      return true;
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish Failed',
        description: 'Failed to publish the schedule',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const archiveSchedule = async (scheduleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'archived'
        })
        .eq('id', scheduleId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Schedule Archived',
        description: 'The schedule has been archived',
      });

      return true;
    } catch (error) {
      console.error('Archive error:', error);
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive the schedule',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  return {
    generating,
    publishing,
    generateSchedule,
    publishSchedule,
    archiveSchedule
  };
}