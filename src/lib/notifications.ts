import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  type: 'schedule_change' | 'conflict_alert' | 'team_clustering' | 'weekly_summary' | 'optimization_suggestion';
  data?: any;
  userId?: string;
  email?: string;
}

export const sendNotification = async ({ type, data, userId, email }: NotificationData) => {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-notifications', {
      body: { type, data, userId, email }
    });

    if (error) throw error;
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to send notification:', error);
    return { success: false, error: error.message };
  }
};

export const sendScheduleChangeNotification = async (userId: string, scheduleData: any) => {
  return sendNotification({
    type: 'schedule_change',
    userId,
    data: scheduleData
  });
};

export const sendConflictAlert = async (adminEmails: string[], conflictData: any) => {
  const promises = adminEmails.map(email => 
    sendNotification({
      type: 'conflict_alert',
      email,
      data: conflictData
    })
  );
  
  return Promise.allSettled(promises);
};

export const sendTeamClusteringAlert = async (managerEmails: string[], teamData: any) => {
  const promises = managerEmails.map(email => 
    sendNotification({
      type: 'team_clustering',
      email,
      data: teamData
    })
  );
  
  return Promise.allSettled(promises);
};

export const sendWeeklySummary = async (adminEmails: string[], summaryData: any) => {
  const promises = adminEmails.map(email => 
    sendNotification({
      type: 'weekly_summary',
      email,
      data: summaryData
    })
  );
  
  return Promise.allSettled(promises);
};

export const sendOptimizationSuggestions = async (adminEmails: string[], suggestions: any) => {
  const promises = adminEmails.map(email => 
    sendNotification({
      type: 'optimization_suggestion',
      email,
      data: suggestions
    })
  );
  
  return Promise.allSettled(promises);
};