import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeMetrics {
  timestamp: string;
  currentOccupancy: number;
  recentActivity: number;
  activeSatisfactionScore: {
    average: number;
    count: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  systemLoad: {
    utilization: number;
    violationRate: number;
    status: 'high' | 'low' | 'normal';
    capacity: number;
  };
  alerts: Alert[];
  predictions: {
    nextHourActivity: number;
    dayEndOccupancy: number;
    peakTimeETA: {
      hour: number;
      estimated: string;
      confidence: string;
    };
    confidenceLevel: number;
  };
  performance: {
    constraintAdherence: number;
    averageConfidence: number;
    systemEfficiency: number;
    dataQuality: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: any;
  timestamp: string;
}

export interface AnalyticsData {
  patterns: {
    weeklyTrends: any;
    teamCollaboration: any;
    seatPreferences: any;
    utilizationCycles: any;
    anomalies: any[];
  };
  clustering: {
    employeeSegments: number;
    segmentAssignments: number[];
  };
  rules: {
    utilizationRules: any;
    accessibilityRules: any;
    teamProximityRules: any;
    preferenceRules: any;
    capacityRules: any;
  };
  predictions: {
    nextWeekUtilization: any;
    employeeDemand: any;
    seatRequirements: any;
    satisfactionTrends: any;
    capacityNeeds: any;
  };
  realTimeMetrics: RealTimeMetrics;
  metadata: {
    processedAt: string;
    dataPoints: number;
    employees: number;
    seats: number;
    timeframe: string;
  };
}

export function useRealTimeAnalytics() {
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Fetch comprehensive analytics data
  const fetchAnalytics = useCallback(async (timeframe: string = 'week') => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: analyticsError } = await supabase.functions.invoke('analytics-engine', {
        body: { timeframe }
      });

      if (analyticsError) throw analyticsError;

      if (data.success) {
        setAnalyticsData(data.data);
        setRealTimeMetrics(data.data.realTimeMetrics);
      } else {
        throw new Error(data.error || 'Analytics processing failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real-time metrics only
  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const { data, error: metricsError } = await supabase.functions.invoke('realtime-monitor');

      if (metricsError) throw metricsError;

      if (data.success) {
        setRealTimeMetrics(data.data);
      } else {
        throw new Error(data.error || 'Real-time monitoring failed');
      }

    } catch (err) {
      console.error('Real-time metrics error:', err);
      // Don't set error state for real-time failures to avoid disrupting UI
    }
  }, []);

  // Start/stop real-time monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial fetch
    fetchRealTimeMetrics();
    
    // Set up periodic updates every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [isMonitoring, fetchRealTimeMetrics]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Get critical alerts
  const getCriticalAlerts = useCallback(() => {
    if (!realTimeMetrics?.alerts) return [];
    return realTimeMetrics.alerts.filter(alert => alert.severity === 'critical');
  }, [realTimeMetrics]);

  // Get system health status
  const getSystemHealth = useCallback(() => {
    if (!realTimeMetrics) return 'unknown';
    
    const { performance, systemLoad } = realTimeMetrics;
    const efficiency = performance.systemEfficiency;
    const utilization = systemLoad.utilization;
    
    if (efficiency > 0.8 && utilization < 0.9) return 'excellent';
    if (efficiency > 0.6 && utilization < 0.95) return 'good';
    if (efficiency > 0.4) return 'fair';
    return 'poor';
  }, [realTimeMetrics]);

  // Get utilization status
  const getUtilizationStatus = useCallback(() => {
    if (!realTimeMetrics) return 'normal';
    return realTimeMetrics.systemLoad.status;
  }, [realTimeMetrics]);

  // Clean up monitoring on unmount
  useEffect(() => {
    return () => {
      setIsMonitoring(false);
    };
  }, []);

  return {
    // Data
    realTimeMetrics,
    analyticsData,
    loading,
    error,
    isMonitoring,
    
    // Actions
    fetchAnalytics,
    fetchRealTimeMetrics,
    startMonitoring,
    stopMonitoring,
    
    // Computed values
    criticalAlerts: getCriticalAlerts(),
    systemHealth: getSystemHealth(),
    utilizationStatus: getUtilizationStatus(),
    
    // Helper methods
    getCriticalAlerts,
    getSystemHealth,
    getUtilizationStatus
  };
}