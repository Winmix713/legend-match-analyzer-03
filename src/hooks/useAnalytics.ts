import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsMetrics, RealTimeMetrics, ChartData, AnalyticsFilter } from '@/types/analytics';

export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track user activity using system_logs table
  const trackUserActivity = useCallback(async (activity: {
    action: string;
    page: string;
    duration?: number;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('system_logs').insert({
          event_type: 'user_activity',
          message: `${activity.action} on ${activity.page}`,
          user_id: user.id,
          session_id: localStorage.getItem('session_id') || 'anonymous',
          details: {
            action: activity.action,
            page: activity.page,
            duration: activity.duration,
            metadata: activity.metadata
          }
        });
      }
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }, []);

  // Get analytics metrics for a specific time period
  const getAnalyticsMetrics = useCallback(async (filter?: AnalyticsFilter) => {
    setLoading(true);
    setError(null);

    try {
      const startDate = filter?.start_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = filter?.end_date || new Date().toISOString();

      // Fetch page views and unique visitors from system_logs
      const { data: activityData, error: activityError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'user_activity')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (activityError) throw activityError;

      // Fetch API requests and performance metrics
      const { data: performanceData, error: performanceError } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (performanceError) throw performanceError;

      // Calculate metrics from system_logs
      const pageViews = activityData?.filter(a => 
        a.details && (a.details as any).action === 'page_view'
      ).length || 0;
      
      const uniqueVisitors = new Set(
        activityData?.map(a => a.user_id).filter(Boolean)
      ).size;
      
      const apiRequests = performanceData?.length || 0;
      
      const sessionDurations = activityData
        ?.map(a => a.details && (a.details as any).duration)
        .filter(duration => typeof duration === 'number') || [];
      
      const avgSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;

      // Use execution_time from performance_metrics as response time
      const responseTimes = performanceData?.map(p => 
        typeof p.execution_time === 'number' ? p.execution_time : 0
      ) || [];
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Count error logs as errors
      const { data: errorLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'error')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const errors = errorLogs?.length || 0;
      const errorRate = apiRequests > 0 ? (errors / apiRequests) * 100 : 0;

      // Calculate bounce rate (sessions with only one page view)
      const sessions = new Map();
      activityData?.forEach(activity => {
        const details = activity.details as any;
        const sessionId = activity.session_id;
        const action = details?.action;
        
        if (sessionId) {
          if (!sessions.has(sessionId)) {
            sessions.set(sessionId, 0);
          }
          if (action === 'page_view') {
            sessions.set(sessionId, sessions.get(sessionId) + 1);
          }
        }
      });

      const singlePageSessions = Array.from(sessions.values()).filter(count => count === 1).length;
      const bounceRate = sessions.size > 0 ? (singlePageSessions / sessions.size) * 100 : 0;

      const calculatedMetrics: AnalyticsMetrics = {
        page_views: pageViews,
        unique_visitors: uniqueVisitors,
        session_duration: avgSessionDuration,
        bounce_rate: bounceRate,
        api_requests: apiRequests,
        error_rate: errorRate,
        response_time: avgResponseTime,
        concurrent_users: 0 // This would need real-time calculation
      };

      setMetrics(calculatedMetrics);

    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get real-time metrics
  const getRealTimeMetrics = useCallback(async () => {
    try {
      // Get current active users (users with activity in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('system_logs')
        .select('user_id')
        .eq('event_type', 'user_activity')
        .gte('created_at', fiveMinutesAgo);

      if (activeUsersError) throw activeUsersError;

      // Get current performance metrics
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      
      const { data: recentMetrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', oneMinuteAgo);

      if (metricsError) throw metricsError;

      const requestsPerMinute = recentMetrics?.length || 0;
      
      // Get error count from system_logs
      const { data: recentErrors } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'error')
        .gte('created_at', oneMinuteAgo);

      const errorsPerMinute = recentErrors?.length || 0;

      const realTime: RealTimeMetrics = {
        active_users: new Set(
          activeUsers?.map(u => u.user_id).filter(Boolean)
        ).size,
        requests_per_minute: requestsPerMinute,
        errors_per_minute: errorsPerMinute,
        database_connections: 0, // Would need system-level monitoring
        memory_usage: recentMetrics?.[0]?.memory_usage || 0,
        cpu_usage: recentMetrics?.[0]?.cpu_usage || 0,
        cache_hit_rate: 0 // Would need cache-specific monitoring
      };

      setRealTimeMetrics(realTime);

    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  }, []);

  // Generate chart data for visualization
  const generateChartData = useCallback(async (metricName: string, filter?: AnalyticsFilter) => {
    try {
      const startDate = filter?.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = filter?.end_date || new Date().toISOString();
      const aggregation = filter?.aggregation || 'day';

      // Use different data sources based on metric name
      let data: any[] = [];
      
      if (metricName === 'memory_usage' || metricName === 'cpu_usage') {
        const { data: perfData, error } = await supabase
          .from('performance_metrics')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at');

        if (error) throw error;
        data = perfData || [];
      } else {
        // For other metrics, use system_logs
        const { data: logData, error } = await supabase
          .from('system_logs')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at');

        if (error) throw error;
        data = logData || [];
      }

      // Group data by aggregation period
      const groupedData = data.reduce((acc, item) => {
        const date = new Date(item.created_at);
        let key: string;

        switch (aggregation) {
          case 'hour':
            key = date.toISOString().slice(0, 13) + ':00:00.000Z';
            break;
          case 'day':
            key = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().slice(0, 10) + 'T00:00:00.000Z';
            break;
          case 'month':
            key = date.toISOString().slice(0, 7) + '-01T00:00:00.000Z';
            break;
          default:
            key = date.toISOString();
        }

        if (!acc[key]) {
          acc[key] = { total: 0, count: 0 };
        }
        
        // Extract value based on metric type
        let value = 0;
        if (metricName === 'memory_usage') {
          value = item.memory_usage || 0;
        } else if (metricName === 'cpu_usage') {
          value = item.cpu_usage || 0;
        } else {
          value = 1; // Count events for other metrics
        }
        
        acc[key].total += value;
        acc[key].count += 1;

        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const chartData: ChartData[] = Object.entries(groupedData).map(([timestamp, data]) => ({
        timestamp,
        value: metricName === 'memory_usage' || metricName === 'cpu_usage' 
          ? (data as any).total / (data as any).count // Average for performance metrics
          : (data as any).total, // Total count for event metrics
        label: new Date(timestamp).toLocaleDateString()
      }));

      setChartData(chartData);

    } catch (error) {
      console.error('Error generating chart data:', error);
    }
  }, []);

  // Record performance metric using system_logs
  const recordMetric = useCallback(async (metricName: string, value: number, tags?: Record<string, string>) => {
    try {
      await supabase.from('system_logs').insert({
        event_type: 'performance_metric',
        message: `${metricName}: ${value}`,
        details: {
          metric_name: metricName,
          value,
          tags,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }, []);

  // Auto-refresh real-time metrics
  useEffect(() => {
    getRealTimeMetrics();
    const interval = setInterval(getRealTimeMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getRealTimeMetrics]);

  return {
    metrics,
    realTimeMetrics,
    chartData,
    loading,
    error,
    trackUserActivity,
    getAnalyticsMetrics,
    getRealTimeMetrics,
    generateChartData,
    recordMetric
  };
};