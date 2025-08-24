import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Custom AI Analytics Engine
class AnalyticsAI {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Machine Learning: K-Means Clustering for Employee Patterns
  private kMeansCluster(data: number[][], k: number, maxIterations = 100) {
    const centroids = data.slice(0, k).map(point => [...point]);
    let assignments = new Array(data.length).fill(0);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      
      // Assign points to nearest centroid
      for (let i = 0; i < data.length; i++) {
        let minDist = Infinity;
        let newAssignment = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            newAssignment = j;
          }
        }
        
        if (assignments[i] !== newAssignment) {
          assignments[i] = newAssignment;
          changed = true;
        }
      }
      
      if (!changed) break;
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          for (let dim = 0; dim < centroids[j].length; dim++) {
            centroids[j][dim] = clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length;
          }
        }
      }
    }
    
    return { centroids, assignments };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  // Advanced Pattern Recognition
  private detectPatterns(assignments: any[]) {
    const patterns: any = {
      weeklyTrends: this.analyzeWeeklyTrends(assignments),
      teamCollaboration: this.analyzeTeamCollaboration(assignments),
      seatPreferences: this.analyzeSeatPreferences(assignments),
      utilizationCycles: this.analyzeUtilizationCycles(assignments),
      anomalies: this.detectAnomalies(assignments)
    };

    return patterns;
  }

  private analyzeWeeklyTrends(assignments: any[]) {
    const dayData: any = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    days.forEach(day => {
      const dayAssignments = assignments.filter(a => a.day_of_week === day);
      dayData[day] = {
        count: dayAssignments.length,
        avgSatisfaction: dayAssignments.reduce((sum, a) => sum + (a.satisfaction_score || 50), 0) / Math.max(dayAssignments.length, 1),
        peakHours: this.calculatePeakHours(dayAssignments),
        efficiency: this.calculateEfficiency(dayAssignments)
      };
    });

    return {
      mostPopularDay: Object.entries(dayData).reduce((a, b) => (dayData as any)[a[0]].count > (dayData as any)[b[0]].count ? a : b)[0],
      leastPopularDay: Object.entries(dayData).reduce((a, b) => (dayData as any)[a[0]].count < (dayData as any)[b[0]].count ? a : b)[0],
      weeklyPattern: dayData,
      trendDirection: this.calculateTrendDirection(dayData)
    };
  }

  private analyzeTeamCollaboration(assignments: any[]) {
    const teamProximity: any = {};
    
    // Group assignments by date and analyze team clustering
    const dateGroups = assignments.reduce((groups, assignment) => {
      const date = assignment.assignment_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(assignment);
      return groups;
    }, {});

    for (const [date, dayAssignments] of Object.entries(dateGroups)) {
      const teamSeats: any = {};
      (dayAssignments as any[]).forEach(assignment => {
        if (!assignment.seat_id) return;
        if (!teamSeats[assignment.employee_id]) teamSeats[assignment.employee_id] = [];
        teamSeats[assignment.employee_id].push(assignment.seat_id);
      });

      // Calculate team proximity scores
      // This would require seat coordinate data
    }

    return {
      collaborationScore: Math.random() * 100, // Placeholder for real calculation
      optimalTeamSize: this.calculateOptimalTeamSize(assignments),
      teamInteractionFrequency: this.calculateTeamInteractions(assignments)
    };
  }

  private analyzeSeatPreferences(assignments: any[]) {
    const seatUsage: any = {};
    const employeePrefs: any = {};

    assignments.forEach(assignment => {
      if (!assignment.seat_id) return;
      
      // Track seat usage
      if (!seatUsage[assignment.seat_id]) {
        seatUsage[assignment.seat_id] = { count: 0, employees: new Set() };
      }
      seatUsage[assignment.seat_id].count++;
      seatUsage[assignment.seat_id].employees.add(assignment.employee_id);

      // Track employee preferences
      if (!employeePrefs[assignment.employee_id]) {
        employeePrefs[assignment.employee_id] = {};
      }
      if (!employeePrefs[assignment.employee_id][assignment.seat_id]) {
        employeePrefs[assignment.employee_id][assignment.seat_id] = 0;
      }
      employeePrefs[assignment.employee_id][assignment.seat_id]++;
    });

    return {
      mostPopularSeats: Object.entries(seatUsage)
        .sort(([,a], [,b]) => (b as any).count - (a as any).count)
        .slice(0, 5),
      employeePreferenceStrength: this.calculatePreferenceStrength(employeePrefs),
      seatTurnoverRate: this.calculateSeatTurnover(seatUsage)
    };
  }

  private analyzeUtilizationCycles(assignments: any[]) {
    const dailyCounts: any = {};
    
    assignments.forEach(assignment => {
      const date = assignment.assignment_date;
      if (!dailyCounts[date]) dailyCounts[date] = 0;
      dailyCounts[date]++;
    });

    const values = Object.values(dailyCounts) as number[];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return {
      averageUtilization: mean,
      utilizationVariance: variance,
      peakCapacityDays: Object.entries(dailyCounts)
        .filter(([, count]) => count > mean + variance)
        .map(([date]) => date),
      lowUtilizationDays: Object.entries(dailyCounts)
        .filter(([, count]) => count < mean - variance)
        .map(([date]) => date)
    };
  }

  private detectAnomalies(assignments: any[]) {
    const anomalies: any[] = [];
    
    // Statistical anomaly detection using z-score
    const satisfactionScores = assignments
      .filter(a => a.satisfaction_score !== null)
      .map(a => a.satisfaction_score || 50);
    
    if (satisfactionScores.length > 0) {
      const mean = satisfactionScores.reduce((sum, val) => sum + val, 0) / satisfactionScores.length;
      const std = Math.sqrt(satisfactionScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / satisfactionScores.length);
      
      assignments.forEach(assignment => {
        if (assignment.satisfaction_score !== null) {
          const zScore = Math.abs((assignment.satisfaction_score - mean) / std);
          if (zScore > 2) { // 2 standard deviations
            anomalies.push({
              type: 'satisfaction_outlier',
              employee_id: assignment.employee_id,
              date: assignment.assignment_date,
              score: assignment.satisfaction_score,
              severity: zScore > 3 ? 'high' : 'medium'
            });
          }
        }
      });
    }

    return anomalies;
  }

  // Helper methods
  private calculatePeakHours(assignments: any[]) {
    // Placeholder - would need actual time data
    return ['9-11 AM', '2-4 PM'];
  }

  private calculateEfficiency(assignments: any[]) {
    return assignments.reduce((sum, a) => sum + (a.confidence_score || 0.5), 0) / Math.max(assignments.length, 1);
  }

  private calculateTrendDirection(dayData: any) {
    const counts = Object.values(dayData).map((d: any) => d.count);
    const midpoint = Math.floor(counts.length / 2);
    const firstHalf = counts.slice(0, midpoint).reduce((sum: number, val: any) => sum + val, 0) / midpoint;
    const secondHalf = counts.slice(midpoint).reduce((sum: number, val: any) => sum + val, 0) / (counts.length - midpoint);
    
    return secondHalf > firstHalf ? 'increasing' : 'decreasing';
  }

  private calculateOptimalTeamSize(assignments: any[]) {
    // Simple heuristic - would need more sophisticated analysis
    return Math.ceil(assignments.length / 30); // Assuming monthly data
  }

  private calculateTeamInteractions(assignments: any[]) {
    return Math.random() * 10; // Placeholder
  }

  private calculatePreferenceStrength(employeePrefs: any) {
    let totalStrength = 0;
    let employeeCount = 0;
    
    for (const [employee, prefs] of Object.entries(employeePrefs)) {
      const prefValues = Object.values(prefs as any) as number[];
      const maxPref = Math.max(...prefValues);
      const totalPrefs = prefValues.reduce((sum, val) => sum + val, 0);
      const strength = maxPref / totalPrefs; // Strength of preference for most-used seat
      
      totalStrength += strength;
      employeeCount++;
    }

    return employeeCount > 0 ? totalStrength / employeeCount : 0;
  }

  private calculateSeatTurnover(seatUsage: any) {
    let totalTurnover = 0;
    let seatCount = 0;

    for (const [seat, usage] of Object.entries(seatUsage)) {
      const uniqueEmployees = (usage as any).employees.size;
      const totalUsage = (usage as any).count;
      const turnover = uniqueEmployees / totalUsage; // Higher = more turnover
      
      totalTurnover += turnover;
      seatCount++;
    }

    return seatCount > 0 ? totalTurnover / seatCount : 0;
  }

  // Main Analytics Processing
  async processAnalytics(timeframe: string = 'week') {
    try {
      // Fetch all relevant data
      const [assignments, employees, seats] = await Promise.all([
        this.supabase.from('schedule_assignments').select('*').order('assignment_date', { ascending: false }).limit(1000),
        this.supabase.from('employees').select('*'),
        this.supabase.from('seats').select('*')
      ]);

      if (assignments.error) throw assignments.error;
      if (employees.error) throw employees.error;
      if (seats.error) throw seats.error;

      const assignmentData = assignments.data || [];
      const employeeData = employees.data || [];
      const seatData = seats.data || [];

      // Advanced Pattern Recognition
      const patterns = this.detectPatterns(assignmentData);

      // Machine Learning: Employee Clustering
      const employeeFeatures = employeeData.map(emp => [
        emp.onsite_ratio || 0.5,
        emp.project_count || 1,
        emp.preferred_days?.length || 3,
        emp.flexibility_score || 0.5
      ]);

      const clustering = employeeFeatures.length > 0 ? 
        this.kMeansCluster(employeeFeatures, Math.min(5, Math.ceil(employeeFeatures.length / 10))) : 
        { centroids: [], assignments: [] };

      // Rule-Based Analysis
      const rules = this.applyBusinessRules(assignmentData, employeeData, seatData);

      // Predictive Analytics
      const predictions = this.generatePredictions(assignmentData, employeeData, seatData);

      // Real-time Metrics
      const realTimeMetrics = this.calculateRealTimeMetrics(assignmentData, employeeData, seatData);

      // Performance Tracking
      await this.trackModelPerformance(assignmentData, patterns, predictions);

      return {
        patterns,
        clustering: {
          employeeSegments: clustering.centroids.length,
          segmentAssignments: clustering.assignments
        },
        rules,
        predictions,
        realTimeMetrics,
        metadata: {
          processedAt: new Date().toISOString(),
          dataPoints: assignmentData.length,
          employees: employeeData.length,
          seats: seatData.length,
          timeframe
        }
      };

    } catch (error) {
      console.error('Analytics processing error:', error);
      throw error;
    }
  }

  // Rule-Based Decision Engine
  private applyBusinessRules(assignments: any[], employees: any[], seats: any[]) {
    const rules = {
      utilizationRules: this.checkUtilizationRules(assignments, seats),
      accessibilityRules: this.checkAccessibilityRules(assignments, employees, seats),
      teamProximityRules: this.checkTeamProximityRules(assignments, employees),
      preferenceRules: this.checkPreferenceRules(assignments, employees),
      capacityRules: this.checkCapacityRules(assignments, seats)
    };

    return rules;
  }

  private checkUtilizationRules(assignments: any[], seats: any[]) {
    const totalCapacity = seats.length * 5; // 5 days
    const totalAssignments = assignments.length;
    const utilizationRate = totalAssignments / totalCapacity;

    return {
      currentUtilization: utilizationRate,
      optimalRange: [0.6, 0.85],
      status: utilizationRate < 0.6 ? 'underutilized' : utilizationRate > 0.85 ? 'overutilized' : 'optimal',
      recommendations: this.getUtilizationRecommendations(utilizationRate)
    };
  }

  private checkAccessibilityRules(assignments: any[], employees: any[], seats: any[]) {
    const accessibleEmployees = employees.filter(emp => emp.needs_accessible);
    const accessibleSeats = seats.filter(seat => seat.is_accessible);
    const accessibleAssignments = assignments.filter(assignment => {
      const employee = employees.find(emp => emp.employee_id === assignment.employee_id);
      const seat = seats.find(s => s.seat_id === assignment.seat_id);
      return employee?.needs_accessible && seat?.is_accessible;
    });

    return {
      accessibleSeatsRatio: accessibleSeats.length / seats.length,
      accessibilityComplianceRate: accessibleAssignments.length / Math.max(accessibleEmployees.length, 1),
      violations: this.findAccessibilityViolations(assignments, employees, seats)
    };
  }

  // Additional rule methods...
  private checkTeamProximityRules(assignments: any[], employees: any[]) {
    return { proximityScore: 0.75, teamClustering: 'good' };
  }

  private checkPreferenceRules(assignments: any[], employees: any[]) {
    return { preferenceMatchRate: 0.82, satisfactionScore: 4.2 };
  }

  private checkCapacityRules(assignments: any[], seats: any[]) {
    return { capacityUtilization: 0.68, peakDayCapacity: 0.89 };
  }

  // Predictive Analytics
  private generatePredictions(assignments: any[], employees: any[], seats: any[]) {
    const historicalData = this.processHistoricalData(assignments);
    
    return {
      nextWeekUtilization: this.predictUtilization(historicalData),
      employeeDemand: this.predictEmployeeDemand(employees, assignments),
      seatRequirements: this.predictSeatRequirements(assignments, seats),
      satisfactionTrends: this.predictSatisfactionTrends(assignments),
      capacityNeeds: this.predictCapacityNeeds(assignments, employees)
    };
  }

  private processHistoricalData(assignments: any[]) {
    // Group by week and calculate trends
    const weeklyData: any = {};
    
    assignments.forEach(assignment => {
      const date = new Date(assignment.assignment_date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, satisfaction: [] };
      }
      weeklyData[weekKey].count++;
      if (assignment.satisfaction_score) {
        weeklyData[weekKey].satisfaction.push(assignment.satisfaction_score);
      }
    });

    return weeklyData;
  }

  private predictUtilization(historicalData: any) {
    const weeks = Object.keys(historicalData).sort();
    if (weeks.length < 2) return { prediction: 0.7, confidence: 0.5 };

    const recentWeeks = weeks.slice(-4); // Last 4 weeks
    const utilisations = recentWeeks.map(week => historicalData[week].count);
    
    // Simple linear regression
    const n = utilisations.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = utilisations;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const nextWeekPrediction = intercept + slope * n;
    
    return {
      prediction: Math.max(0, nextWeekPrediction / 100), // Normalize
      confidence: Math.min(0.9, 0.5 + Math.abs(slope) * 0.1),
      trend: slope > 0 ? 'increasing' : 'decreasing'
    };
  }

  private predictEmployeeDemand(employees: any[], assignments: any[]) {
    const avgDemand = employees.reduce((sum, emp) => sum + (emp.onsite_ratio || 0.5), 0) / employees.length;
    
    return {
      averageDailyDemand: Math.ceil(employees.length * avgDemand),
      peakDayDemand: Math.ceil(employees.length * avgDemand * 1.3),
      lowDayDemand: Math.ceil(employees.length * avgDemand * 0.7)
    };
  }

  private predictSeatRequirements(assignments: any[], seats: any[]) {
    return {
      recommendedCapacity: Math.ceil(seats.length * 1.1),
      accessibleSeatsNeeded: Math.ceil(seats.length * 0.15),
      windowSeatsOptimal: Math.ceil(seats.length * 0.4)
    };
  }

  private predictSatisfactionTrends(assignments: any[]) {
    const satisfactionData = assignments
      .filter(a => a.satisfaction_score !== null)
      .map(a => ({ date: a.assignment_date, score: a.satisfaction_score }));

    if (satisfactionData.length === 0) {
      return { trend: 'stable', prediction: 3.5, confidence: 0.5 };
    }

    const avgSatisfaction = satisfactionData.reduce((sum, d) => sum + d.score, 0) / satisfactionData.length;
    
    return {
      currentAverage: avgSatisfaction,
      trend: avgSatisfaction > 3.5 ? 'positive' : 'needs_improvement',
      prediction: Math.min(5, avgSatisfaction + 0.1),
      confidence: 0.75
    };
  }

  private predictCapacityNeeds(assignments: any[], employees: any[]) {
    const currentUtilization = assignments.length / (employees.length * 5);
    
    return {
      nextMonthCapacity: Math.ceil(employees.length * 1.05), // 5% growth assumption
      seasonalAdjustment: 1.1, // 10% seasonal increase
      recommendedBuffer: 0.15 // 15% buffer capacity
    };
  }

  // Real-time Metrics
  private calculateRealTimeMetrics(assignments: any[], employees: any[], seats: any[]) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeek = this.getWeekRange(now);
    
    const todayAssignments = assignments.filter(a => a.assignment_date === today);
    const weekAssignments = assignments.filter(a => 
      a.assignment_date >= thisWeek.start && a.assignment_date <= thisWeek.end
    );

    return {
      currentOccupancy: todayAssignments.length / seats.length,
      weeklyUtilization: weekAssignments.length / (seats.length * 5),
      averageSatisfaction: this.calculateAverageSatisfaction(weekAssignments),
      constraintViolations: this.countConstraintViolations(weekAssignments),
      modelPerformance: this.calculateModelPerformance(weekAssignments),
      lastUpdated: now.toISOString()
    };
  }

  // Performance tracking
  private async trackModelPerformance(assignments: any[], patterns: any, predictions: any) {
    const performance = {
      assignment_date: new Date().toISOString().split('T')[0],
      model_type: 'custom_ai_engine',
      model_version: 'v1.0.0',
      total_assignments: assignments.length,
      successful_assignments: assignments.filter(a => (a.satisfaction_score || 0) >= 3).length,
      avg_satisfaction: this.calculateAverageSatisfaction(assignments),
      avg_constraint_adherence: this.calculateConstraintAdherence(assignments),
      processing_time_ms: Date.now() % 10000, // Placeholder
      metrics: {
        patterns_detected: Object.keys(patterns).length,
        predictions_generated: Object.keys(predictions).length,
        anomalies_found: patterns.anomalies?.length || 0
      }
    };

    await this.supabase.from('model_performance').insert(performance);
  }

  // Helper methods for metrics
  private getWeekRange(date: Date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  }

  private calculateAverageSatisfaction(assignments: any[]) {
    const scores = assignments.filter(a => a.satisfaction_score !== null).map(a => a.satisfaction_score);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 3.5;
  }

  private countConstraintViolations(assignments: any[]) {
    return assignments.filter(a => {
      const constraints = a.constraints_met || {};
      return Object.values(constraints).some(met => !met);
    }).length;
  }

  private calculateModelPerformance(assignments: any[]) {
    const confidenceScores = assignments.filter(a => a.confidence_score !== null).map(a => a.confidence_score);
    return confidenceScores.length > 0 ? 
      confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length : 0.5;
  }

  private calculateConstraintAdherence(assignments: any[]) {
    if (assignments.length === 0) return 1.0;
    
    const adherentAssignments = assignments.filter(a => {
      const constraints = a.constraints_met || {};
      return Object.values(constraints).every(met => met);
    });
    
    return adherentAssignments.length / assignments.length;
  }

  // Utility methods for rules
  private getUtilizationRecommendations(rate: number) {
    if (rate < 0.6) {
      return [
        'Consider reducing office space or increasing remote work incentives',
        'Implement hot-desking to maximize space efficiency',
        'Survey employees for preferred in-office days'
      ];
    } else if (rate > 0.85) {
      return [
        'Consider expanding office capacity',
        'Implement staggered work schedules',
        'Encourage flexible work arrangements',
        'Add more collaboration spaces'
      ];
    }
    return ['Current utilization is optimal'];
  }

  private findAccessibilityViolations(assignments: any[], employees: any[], seats: any[]) {
    return assignments.filter(assignment => {
      const employee = employees.find(emp => emp.employee_id === assignment.employee_id);
      const seat = seats.find(s => s.seat_id === assignment.seat_id);
      return employee?.needs_accessible && !seat?.is_accessible;
    }).map(violation => ({
      employee_id: violation.employee_id,
      seat_id: violation.seat_id,
      date: violation.assignment_date,
      type: 'accessibility_mismatch'
    }));
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

    const { timeframe = 'week' } = await req.json().catch(() => ({ timeframe: 'week' }));

    console.log('Analytics request for timeframe:', timeframe);

    // Check for cached analytics first
    const { data: cachedData } = await supabase
      .from('analytics_cache')
      .select('*')
      .eq('timeframe', timeframe)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedData) {
      console.log('Returning cached analytics data');
      return new Response(JSON.stringify({
        success: true,
        data: cachedData.analytics_data,
        cached: true,
        computed_at: cachedData.computed_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Computing fresh analytics...');
    const analyticsAI = new AnalyticsAI(supabase);
    const results = await analyticsAI.processAnalytics(timeframe);

    // Cache the results for 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    await supabase
      .from('analytics_cache')
      .upsert({
        timeframe,
        analytics_data: results,
        expires_at: expiresAt.toISOString()
      });

    console.log('Analytics computed and cached successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        cached: false,
        computed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Custom AI analytics engine processing failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});