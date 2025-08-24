import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'schedule_change' | 'conflict_alert' | 'team_clustering' | 'weekly_summary' | 'optimization_suggestion' | 'test';
  email?: string;
  data?: any;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data, userId }: NotificationRequest = await req.json();

    // Get user settings to check notification preferences
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    // Get user email if not provided
    let targetEmail = email;
    if (!targetEmail && userId) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      targetEmail = userData.user?.email;
    }

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: "No email address provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case 'test':
        subject = "Email Notifications are Working! 🎉";
        htmlContent = `
          <h1>Email Notifications are Working! 🎉</h1>
          <p>This is a test email from your workspace management system.</p>
          <p>Your email notification settings are configured correctly.</p>
        `;
        break;

      case 'schedule_change':
        if (!settings?.email_notifications) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });
        
        subject = "📅 Schedule Update - New Seating Assignment";
        htmlContent = `
          <h1>Your Schedule Has Been Updated</h1>
          <p>Hello! Your seating assignment has been updated for the week of <strong>${data?.weekOf || 'this week'}</strong>.</p>
          
          <h2>📋 Assignment Summary:</h2>
          <ul>
            ${data?.changes?.map((change: any) => `
              <li><strong>${change.day}:</strong> ${change.seatId ? `Seat ${change.seatId} (${change.zone})` : 'Working from home'}</li>
            `).join('') || '<li>Check your dashboard for details</li>'}
          </ul>
          
          <p>You can view your full schedule and make any necessary adjustments in the workspace portal.</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <strong>💡 Tip:</strong> If you have any preferences or constraints, update them in your profile to get better assignments!
          </div>
        `;
        break;

      case 'conflict_alert':
        if (!settings?.schedule_conflict_alerts) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });
        
        subject = "⚠️ Schedule Conflict Alert - Capacity Exceeded";
        htmlContent = `
          <h1>Schedule Conflict Detected</h1>
          <p>We've detected a capacity issue with the current schedule:</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <strong>⚠️ Issue:</strong> ${data?.conflictDescription || 'Office capacity exceeded'}
          </div>
          
          <h2>📊 Details:</h2>
          <ul>
            <li><strong>Date:</strong> ${data?.date || 'Today'}</li>
            <li><strong>Expected capacity:</strong> ${data?.expectedCapacity || 'N/A'}</li>
            <li><strong>Current assignments:</strong> ${data?.currentAssignments || 'N/A'}</li>
          </ul>
          
          <p>Please review the schedule and make adjustments as needed.</p>
        `;
        break;

      case 'team_clustering':
        if (!settings?.team_clustering_alerts) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });
        
        subject = "👥 Team Clustering Alert - Teams Separated";
        htmlContent = `
          <h1>Team Clustering Issue</h1>
          <p>Some teams have been separated in the current seating arrangement:</p>
          
          <h2>🔄 Affected Teams:</h2>
          <ul>
            ${data?.affectedTeams?.map((team: any) => `
              <li><strong>${team.name}:</strong> ${team.issue}</li>
            `).join('') || '<li>Check the schedule for details</li>'}
          </ul>
          
          <p>Consider adjusting constraints or regenerating the schedule to improve team collaboration.</p>
        `;
        break;

      case 'weekly_summary':
        if (!settings?.weekly_summaries) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });
        
        subject = "📈 Weekly Office Utilization Summary";
        htmlContent = `
          <h1>Weekly Office Summary</h1>
          <p>Here's your office utilization report for the week of <strong>${data?.weekOf || 'this week'}</strong>:</p>
          
          <h2>📊 Utilization Statistics:</h2>
          <ul>
            <li><strong>Average daily occupancy:</strong> ${data?.avgOccupancy || 'N/A'}%</li>
            <li><strong>Peak day:</strong> ${data?.peakDay || 'N/A'} (${data?.peakOccupancy || 'N/A'}%)</li>
            <li><strong>Total unique visitors:</strong> ${data?.uniqueVisitors || 'N/A'}</li>
            <li><strong>Most popular zones:</strong> ${data?.popularZones?.join(', ') || 'N/A'}</li>
          </ul>
          
          <h2>🎯 Insights:</h2>
          <ul>
            ${data?.insights?.map((insight: string) => `<li>${insight}</li>`).join('') || '<li>Schedule working efficiently</li>'}
          </ul>
        `;
        break;

      case 'optimization_suggestion':
        if (!settings?.optimization_suggestions) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });
        
        subject = "🚀 AI-Powered Schedule Optimization Suggestions";
        htmlContent = `
          <h1>Schedule Optimization Suggestions</h1>
          <p>Our AI has analyzed your current schedule and found opportunities for improvement:</p>
          
          <h2>💡 Recommendations:</h2>
          <ol>
            ${data?.suggestions?.map((suggestion: any) => `
              <li>
                <strong>${suggestion.title}:</strong> ${suggestion.description}
                <br><small style="color: #666;">Expected impact: ${suggestion.impact}</small>
              </li>
            `).join('') || '<li>No specific suggestions at this time</li>'}
          </ol>
          
          <p>Implementing these suggestions could improve satisfaction by <strong>${data?.estimatedImprovement || 'up to 15'}%</strong>.</p>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "Workspace System <onboarding@resend.dev>",
      to: [targetEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log(`Email sent successfully for ${type}:`, emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        type,
        recipient: targetEmail,
        message: "Notification sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);