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

      console.log('Fetching analytics for timeframe:', timeframe);
      
      // First try to get cached data from database
      const { data: cachedData, error: cacheError } = await supabase
        .from('analytics_cache')
        .select('*')
        .eq('timeframe', timeframe)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedData && !cacheError) {
        console.log('Using cached analytics data from database');
        const analyticsData = cachedData.analytics_data as unknown as AnalyticsData;
        setAnalyticsData(analyticsData);
        if (analyticsData?.realTimeMetrics) {
          setRealTimeMetrics(analyticsData.realTimeMetrics);
        }
        return;
      }

      // If no cached data, call the analytics engine
      console.log('No cached data found, calling analytics engine...');
      const { data, error: analyticsError } = await supabase.functions.invoke('analytics-engine', {
        body: { timeframe }
      });

      if (analyticsError) {
        console.error('Analytics engine error:', analyticsError);
        throw analyticsError;
      }

      console.log('Analytics response:', data);

      if (data?.success) {
        setAnalyticsData(data.data);
        if (data.data?.realTimeMetrics) {
          setRealTimeMetrics(data.data.realTimeMetrics);
        }
        console.log('Analytics data updated');
      } else {
        console.error('Analytics processing failed:', data);
        throw new Error(data?.error || 'Analytics processing failed');
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
      console.log('Fetching real-time metrics...');
      const { data, error: metricsError } = await supabase.functions.invoke('realtime-monitor');

      if (metricsError) {
        console.error('Supabase function error:', metricsError);
        throw metricsError;
      }

      console.log('Real-time metrics response:', data);

      if (data?.success) {
        setRealTimeMetrics(data.data);
        console.log('Real-time metrics updated:', data.data);
      } else {
        console.error('Real-time monitoring failed:', data);
        throw new Error(data?.error || 'Real-time monitoring failed');
      }

    } catch (err) {
      console.error('Real-time metrics error:', err);
      // Don't set error state for real-time failures to avoid disrupting UI
      // But set a fallback empty state to prevent undefined errors
      setRealTimeMetrics(null);
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
    if (!realTimeMetrics?.alerts || !Array.isArray(realTimeMetrics.alerts)) return [];
    return realTimeMetrics.alerts.filter(alert => alert.severity === 'critical');
  }, [realTimeMetrics]);

  // Get system health status
  const getSystemHealth = useCallback(() => {
    if (!realTimeMetrics?.performance?.systemEfficiency || !realTimeMetrics?.systemLoad?.utilization) {
      return 'unknown';
    }
    
    const efficiency = realTimeMetrics.performance.systemEfficiency;
    const utilization = realTimeMetrics.systemLoad.utilization;
    
    if (efficiency > 0.8 && utilization < 0.9) return 'excellent';
    if (efficiency > 0.6 && utilization < 0.95) return 'good';
    if (efficiency > 0.4) return 'fair';
    return 'poor';
  }, [realTimeMetrics]);

  // Get utilization status
  const getUtilizationStatus = useCallback(() => {
    if (!realTimeMetrics?.systemLoad?.status) return 'normal';
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