import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real-time Monitoring System
class RealTimeMonitor {
  private supabase: any;
  private alertThresholds: any;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.alertThresholds = {
      highUtilization: 0.9,
      lowUtilization: 0.3,
      lowSatisfaction: 2.5,
      highConstraintViolations: 0.15,
      anomalyDetectionZ: 2.5
    };
  }

  async monitorRealTimeMetrics() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    try {
      // Get recent data
      const [assignments, employees, seats, recentAssignments] = await Promise.all([
        this.supabase.from('schedule_assignments').select('*').eq('assignment_date', today),
        this.supabase.from('employees').select('*').eq('is_active', true),
        this.supabase.from('seats').select('*').eq('is_available', true),
        this.supabase.from('schedule_assignments').select('*').gte('created_at', lastHour)
      ]);

      const todayAssignments = assignments.data || [];
      const employeeData = employees.data || [];
      const seatData = seats.data || [];
      const recentData = recentAssignments.data || [];

      // Calculate real-time metrics
      const metrics = {
        timestamp: now.toISOString(),
        currentOccupancy: todayAssignments.length / Math.max(seatData.length, 1),
        recentActivity: recentData.length,
        activeSatisfactionScore: this.calculateActiveSatisfaction(todayAssignments),
        systemLoad: this.calculateSystemLoad(todayAssignments, seatData),
        alerts: await this.generateAlerts(todayAssignments, employeeData, seatData),
        predictions: this.generateShortTermPredictions(todayAssignments, recentData),
        performance: this.calculateSystemPerformance(todayAssignments)
      };

      // Store metrics for historical tracking
      await this.storeMetrics(metrics);

      // Check for critical alerts
      const criticalAlerts = metrics.alerts.filter((alert: any) => alert.severity === 'critical');
      if (criticalAlerts.length > 0) {
        await this.sendCriticalAlerts(criticalAlerts);
      }

      return metrics;

    } catch (error) {
      console.error('Real-time monitoring error:', error);
      throw error;
    }
  }

  private calculateActiveSatisfaction(assignments: any[]) {
    const scores = assignments
      .filter(a => a.satisfaction_score !== null && a.satisfaction_score !== undefined)
      .map(a => a.satisfaction_score);
    
    if (scores.length === 0) return { average: 3.5, count: 0, trend: 'stable' };

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const recent = scores.slice(-10); // Last 10 scores
    const older = scores.slice(0, -10);
    
    let trend = 'stable';
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
      trend = recentAvg > olderAvg + 0.2 ? 'improving' : 
              recentAvg < olderAvg - 0.2 ? 'declining' : 'stable';
    }

    return { average, count: scores.length, trend };
  }

  private calculateSystemLoad(assignments: any[], seats: any[]) {
    const utilizationRate = assignments.length / Math.max(seats.length, 1);
    const constraintViolations = assignments.filter(a => {
      const constraints = a.constraints_met || {};
      return Object.values(constraints).some(met => !met);
    }).length;

    const violationRate = constraintViolations / Math.max(assignments.length, 1);

    return {
      utilization: utilizationRate,
      violationRate,
      status: utilizationRate > 0.9 ? 'high' : utilizationRate < 0.3 ? 'low' : 'normal',
      capacity: Math.max(0, 1 - utilizationRate)
    };
  }

  private async generateAlerts(assignments: any[], employees: any[], seats: any[]) {
    const alerts: any[] = [];
    const utilizationRate = assignments.length / Math.max(seats.length, 1);

    // High utilization alert
    if (utilizationRate > this.alertThresholds.highUtilization) {
      alerts.push({
        id: `high_util_${Date.now()}`,
        type: 'capacity_warning',
        severity: 'warning',
        title: 'High Office Utilization',
        message: `Office utilization is at ${(utilizationRate * 100).toFixed(1)}%. Consider capacity management.`,
        data: { utilizationRate, threshold: this.alertThresholds.highUtilization },
        timestamp: new Date().toISOString()
      });
    }

    // Low utilization alert
    if (utilizationRate < this.alertThresholds.lowUtilization) {
      alerts.push({
        id: `low_util_${Date.now()}`,
        type: 'efficiency_warning',
        severity: 'info',
        title: 'Low Office Utilization',
        message: `Office utilization is only ${(utilizationRate * 100).toFixed(1)}%. Space optimization opportunity.`,
        data: { utilizationRate, threshold: this.alertThresholds.lowUtilization },
        timestamp: new Date().toISOString()
      });
    }

    // Satisfaction alerts
    const satisfactionData = this.calculateActiveSatisfaction(assignments);
    if (satisfactionData.average < this.alertThresholds.lowSatisfaction) {
      alerts.push({
        id: `low_sat_${Date.now()}`,
        type: 'satisfaction_warning',
        severity: satisfactionData.average < 2 ? 'critical' : 'warning',
        title: 'Low Satisfaction Scores',
        message: `Average satisfaction is ${satisfactionData.average.toFixed(1)}/5. Immediate attention needed.`,
        data: { satisfaction: satisfactionData },
        timestamp: new Date().toISOString()
      });
    }

    // Accessibility compliance
    const accessibilityViolations = this.checkAccessibilityCompliance(assignments, employees, seats);
    if (accessibilityViolations.length > 0) {
      alerts.push({
        id: `access_${Date.now()}`,
        type: 'compliance_violation',
        severity: 'critical',
        title: 'Accessibility Compliance Issue',
        message: `${accessibilityViolations.length} accessibility violations detected.`,
        data: { violations: accessibilityViolations },
        timestamp: new Date().toISOString()
      });
    }

    // Anomaly detection
    const anomalies = await this.detectRealTimeAnomalies(assignments);
    anomalies.forEach(anomaly => {
      alerts.push({
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'anomaly_detected',
        severity: anomaly.severity,
        title: 'System Anomaly Detected',
        message: anomaly.description,
        data: anomaly,
        timestamp: new Date().toISOString()
      });
    });

    return alerts;
  }

  private checkAccessibilityCompliance(assignments: any[], employees: any[], seats: any[]) {
    return assignments.filter(assignment => {
      const employee = employees.find(emp => emp.employee_id === assignment.employee_id);
      const seat = seats.find(s => s.seat_id === assignment.seat_id);
      return employee?.needs_accessible && !seat?.is_accessible;
    });
  }

  private async detectRealTimeAnomalies(assignments: any[]) {
    const anomalies: any[] = [];

    // Statistical anomaly detection
    const satisfactionScores = assignments
      .filter(a => a.satisfaction_score !== null)
      .map(a => a.satisfaction_score);

    if (satisfactionScores.length > 5) {
      const mean = satisfactionScores.reduce((sum, val) => sum + val, 0) / satisfactionScores.length;
      const variance = satisfactionScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / satisfactionScores.length;
      const std = Math.sqrt(variance);

      assignments.forEach(assignment => {
        if (assignment.satisfaction_score !== null && std > 0) {
          const zScore = Math.abs((assignment.satisfaction_score - mean) / std);
          if (zScore > this.alertThresholds.anomalyDetectionZ) {
            anomalies.push({
              type: 'satisfaction_outlier',
              employee_id: assignment.employee_id,
              expected: mean,
              actual: assignment.satisfaction_score,
              deviation: zScore,
              severity: zScore > 3 ? 'critical' : 'warning',
              description: `Employee satisfaction score (${assignment.satisfaction_score}) is ${zScore.toFixed(1)} standard deviations from normal`
            });
          }
        }
      });
    }

    // Pattern-based anomalies
    const todayByHour = this.groupAssignmentsByHour(assignments);
    const expectedPattern = this.getExpectedHourlyPattern();
    
    Object.entries(todayByHour).forEach(([hour, count]) => {
      const expected = expectedPattern[hour] || 0;
      const deviation = Math.abs((count as number) - expected) / Math.max(expected, 1);
      
      if (deviation > 0.5 && expected > 0) {
        anomalies.push({
          type: 'temporal_anomaly',
          hour: parseInt(hour),
          expected,
          actual: count,
          deviation,
          severity: deviation > 1 ? 'warning' : 'info',
          description: `Unusual activity pattern at ${hour}:00. Expected ${expected}, got ${count}`
        });
      }
    });

    return anomalies;
  }

  private groupAssignmentsByHour(assignments: any[]) {
    const hourly: any = {};
    const now = new Date();
    
    assignments.forEach(assignment => {
      const createdAt = new Date(assignment.created_at || assignment.assignment_date);
      const hour = createdAt.getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    return hourly;
  }

  private getExpectedHourlyPattern() {
    // Expected pattern based on typical office hours
    return {
      8: 5, 9: 15, 10: 10, 11: 8, 12: 3,
      13: 5, 14: 8, 15: 10, 16: 7, 17: 3
    };
  }

  private generateShortTermPredictions(assignments: any[], recentData: any[]) {
    const currentTrend = recentData.length;
    const timeOfDay = new Date().getHours();
    
    // Simple trend-based prediction for next few hours
    let nextHourPrediction = 0;
    if (timeOfDay >= 8 && timeOfDay <= 17) {
      const businessHourFactor = timeOfDay <= 12 ? 1.2 : 0.8;
      nextHourPrediction = Math.max(0, currentTrend * businessHourFactor);
    }

    return {
      nextHourActivity: Math.round(nextHourPrediction),
      dayEndOccupancy: this.predictDayEndOccupancy(assignments),
      peakTimeETA: this.estimatePeakTime(assignments),
      confidenceLevel: this.calculatePredictionConfidence(recentData)
    };
  }

  private predictDayEndOccupancy(assignments: any[]) {
    const currentHour = new Date().getHours();
    const remainingBusinessHours = Math.max(0, 17 - currentHour);
    const currentOccupancy = assignments.length;
    
    // Simple linear projection
    const hourlyRate = currentOccupancy / Math.max(currentHour - 8, 1);
    return Math.round(currentOccupancy + (hourlyRate * remainingBusinessHours * 0.6));
  }

  private estimatePeakTime(assignments: any[]) {
    const hourlyDistribution = this.groupAssignmentsByHour(assignments);
    const peakHour = Object.entries(hourlyDistribution)
      .reduce((max, [hour, count]) => 
        (count as number) > (max.count as number) ? { hour: parseInt(hour), count } : max, 
        { hour: 10, count: 0 }
      );
    
    return {
      hour: peakHour.hour,
      estimated: `${peakHour.hour}:00`,
      confidence: peakHour.count > 5 ? 'high' : 'medium'
    };
  }

  private calculatePredictionConfidence(recentData: any[]) {
    const dataPoints = recentData.length;
    const recency = recentData.length > 0 ? 
      (Date.now() - new Date(recentData[0].created_at).getTime()) / (1000 * 60 * 60) : 24;
    
    let confidence = 0.5;
    if (dataPoints > 10) confidence += 0.2;
    if (dataPoints > 20) confidence += 0.1;
    if (recency < 1) confidence += 0.2; // Very recent data
    
    return Math.min(0.95, confidence);
  }

  private calculateSystemPerformance(assignments: any[]) {
    const constraintsMet = assignments.filter(a => {
      const constraints = a.constraints_met || {};
      return Object.values(constraints).every(met => met);
    }).length;

    const confidenceScores = assignments
      .filter(a => a.confidence_score !== null)
      .map(a => a.confidence_score);

    const avgConfidence = confidenceScores.length > 0 ?
      confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length : 0.5;

    return {
      constraintAdherence: constraintsMet / Math.max(assignments.length, 1),
      averageConfidence: avgConfidence,
      systemEfficiency: (constraintsMet / Math.max(assignments.length, 1)) * avgConfidence,
      dataQuality: this.assessDataQuality(assignments)
    };
  }

  private assessDataQuality(assignments: any[]) {
    let qualityScore = 1.0;
    
    // Check for missing data
    const missingSeats = assignments.filter(a => !a.seat_id).length;
    const missingSatisfaction = assignments.filter(a => a.satisfaction_score === null).length;
    const missingConstraints = assignments.filter(a => !a.constraints_met).length;

    qualityScore -= (missingSeats / assignments.length) * 0.3;
    qualityScore -= (missingSatisfaction / assignments.length) * 0.2;
    qualityScore -= (missingConstraints / assignments.length) * 0.1;

    return Math.max(0, qualityScore);
  }

  private async storeMetrics(metrics: any) {
    try {
      await this.supabase.from('ai_training_data').insert({
        data_source: 'realtime_monitor',
        training_batch: `monitor_${Date.now()}`,
        model_version: 'realtime_v1.0',
        context_features: {
          timestamp: metrics.timestamp,
          occupancy: metrics.currentOccupancy,
          system_load: metrics.systemLoad
        },
        employee_features: {},
        seat_features: {},
        target_assignment: metrics.predictions,
        assignment_success: metrics.performance.systemEfficiency > 0.7,
        satisfaction_score: Math.round(metrics.activeSatisfactionScore.average)
      });
    } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }

  private async sendCriticalAlerts(alerts: any[]) {
    console.log('CRITICAL ALERTS:', alerts);
    // In a real system, this would send notifications
    // For now, just log them
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const monitor = new RealTimeMonitor(supabase);
    const metrics = await monitor.monitorRealTimeMetrics();

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Real-time monitor error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Real-time monitoring system failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});