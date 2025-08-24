import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SatisfactionFeedback {
  id: string;
  employee_id: string;
  assignment_date: string;
  seat_id: string;
  satisfaction_score: number;
  comfort_rating?: number;
  location_rating?: number;
  amenities_rating?: number;
  feedback_text?: string;
  would_recommend: boolean;
  created_at: string;
  updated_at: string;
}

export function useSatisfactionFeedback(employeeId?: string) {
  const [feedback, setFeedback] = useState<SatisfactionFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFeedback = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('satisfaction_feedback')
        .select('*')
        .eq('employee_id', employeeId)
        .order('assignment_date', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      console.error('Error fetching satisfaction feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedbackData: Omit<SatisfactionFeedback, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      // Check if feedback already exists for this assignment
      const { data: existing } = await supabase
        .from('satisfaction_feedback')
        .select('id')
        .eq('employee_id', feedbackData.employee_id)
        .eq('assignment_date', feedbackData.assignment_date)
        .eq('seat_id', feedbackData.seat_id)
        .single();

      if (existing) {
        // Update existing feedback
        const { error } = await supabase
          .from('satisfaction_feedback')
          .update(feedbackData)
          .eq('id', existing.id);

        if (error) throw error;
        
        toast({
          title: "Feedback Updated",
          description: "Your seat feedback has been updated successfully.",
        });
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('satisfaction_feedback')
          .insert(feedbackData);

        if (error) throw error;
        
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback! It helps us improve seating assignments.",
        });
      }

      await fetchFeedback();
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackForAssignment = (assignmentDate: string, seatId: string) => {
    return feedback.find(f => f.assignment_date === assignmentDate && f.seat_id === seatId);
  };

  useEffect(() => {
    fetchFeedback();
  }, [employeeId]);

  return {
    feedback,
    loading,
    submitFeedback,
    getFeedbackForAssignment,
    refetch: fetchFeedback
  };
}