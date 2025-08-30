import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AdminDashboardMetrics } from '@/types/admin';
import { Users, Database, Activity, Clock, AlertTriangle, CheckCircle2, TrendingUp, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AdminMetricsOverview = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { realTimeMetrics, getAnalyticsMetrics } = useAnalytics();

  useEffect(() => {
    fetchDashboardMetrics();
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchDashboardMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      
      // Get user count from auth.users (if accessible) or from our user tracking
      const { data: userActivity } = await supabase
        .from('system_logs')
        .select('user_id')
        .eq('event_type', 'user_activity')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const uniqueUsers = new Set(userActivity?.map(a => a.user_id).filter(Boolean)).size;
      const activeUsers = realTimeMetrics?.active_users || 0;

      // Get API calls from performance metrics
      const { data: apiCalls } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get database size estimation (number of records across main tables)
      const { data: matches } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true });

      // Calculate response time from performance metrics
      const responseTimes = apiCalls?.map(call => call.execution_time).filter(time => typeof time === 'number') || [];
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Determine system health based on metrics
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (avgResponseTime > 2000) systemHealth = 'critical';
      else if (avgResponseTime > 1000) systemHealth = 'warning';

      const dashboardMetrics: AdminDashboardMetrics = {
        total_users: uniqueUsers,
        active_users: activeUsers,
        total_matches: matches?.length || 0,
        api_calls_today: apiCalls?.length || 0,
        system_health: systemHealth,
        database_size: matches?.length || 0, // Simplified: using log count as size indicator
        response_time_avg: avgResponseTime
      };

      setMetrics(dashboardMetrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Healthy
        </Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>;
      case 'critical':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">Unique users tracked</p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{metrics?.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        {/* API Calls Today */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.api_calls_today || 0}</div>
            <p className="text-xs text-muted-foreground">Requests processed</p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthBadge(metrics?.system_health || 'healthy')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Overall system status</p>
          </CardContent>
        </Card>

        {/* Database Size */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.database_size?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total records stored</p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.response_time_avg ? `${Math.round(metrics.response_time_avg)}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">Average API response</p>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics?.requests_per_minute || 0}</div>
            <p className="text-xs text-muted-foreground">Current load</p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="glass hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTimeMetrics?.memory_usage ? `${Math.round(realTimeMetrics.memory_usage)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">System memory</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={fetchDashboardMetrics}
              className="btn-ghost text-left p-4 hover:bg-white/10"
            >
              <TrendingUp className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">Refresh Metrics</div>
              <div className="text-sm text-muted-foreground">Update all dashboard data</div>
            </button>
            
            <button className="btn-ghost text-left p-4 hover:bg-white/10">
              <Users className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">User Management</div>
              <div className="text-sm text-muted-foreground">Manage user accounts and roles</div>
            </button>
            
            <button className="btn-ghost text-left p-4 hover:bg-white/10">
              <Server className="h-5 w-5 mb-2 text-primary" />
              <div className="font-medium">System Health</div>
              <div className="text-sm text-muted-foreground">Monitor system performance</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};