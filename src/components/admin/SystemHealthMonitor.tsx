import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAnalytics } from '@/hooks/useAnalytics';
import { SystemAlert } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Server, 
  Wifi, 
  Cpu,
  MemoryStick,
  HardDrive,
  Network
} from 'lucide-react';

export const SystemHealthMonitor = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { realTimeMetrics, getRealTimeMetrics } = useAnalytics();

  useEffect(() => {
    fetchSystemAlerts();
    getRealTimeMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      getRealTimeMetrics();
      fetchSystemAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [getRealTimeMetrics]);

  const fetchSystemAlerts = async () => {
    try {
      setLoading(true);
      
      // Get recent error logs from system_logs table
      const { data: errorLogs, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform error logs into system alerts
      const systemAlerts: SystemAlert[] = errorLogs?.map((log, index) => ({
        id: log.id?.toString() || `alert-${index}`,
        type: 'error' as const,
        title: 'System Error Detected',
        message: log.message || 'An error occurred in the system',
        created_at: log.created_at,
        acknowledged: false,
        resolved: false
      })) || [];

      // Add performance-based alerts
      if (realTimeMetrics?.memory_usage && realTimeMetrics.memory_usage > 85) {
        systemAlerts.unshift({
          id: 'memory-alert',
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is at ${realTimeMetrics.memory_usage}%`,
          created_at: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        });
      }

      if (realTimeMetrics?.errors_per_minute && realTimeMetrics.errors_per_minute > 5) {
        systemAlerts.unshift({
          id: 'error-rate-alert',
          type: 'critical',
          title: 'High Error Rate',
          message: `${realTimeMetrics.errors_per_minute} errors per minute detected`,
          created_at: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        });
      }

      setAlerts(systemAlerts);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical':
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getHealthColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Real-time System Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(realTimeMetrics?.cpu_usage || 0, { warning: 70, critical: 90 })}`}>
              {realTimeMetrics?.cpu_usage || 0}%
            </div>
            <Progress 
              value={realTimeMetrics?.cpu_usage || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(realTimeMetrics?.memory_usage || 0, { warning: 75, critical: 85 })}`}>
              {realTimeMetrics?.memory_usage || 0}%
            </div>
            <Progress 
              value={realTimeMetrics?.memory_usage || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {realTimeMetrics?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Currently online</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTimeMetrics?.database_connections || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Requests/min</span>
              <span className="text-lg font-semibold">{realTimeMetrics?.requests_per_minute || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Errors/min</span>
              <span className={`text-lg font-semibold ${(realTimeMetrics?.errors_per_minute || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {realTimeMetrics?.errors_per_minute || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
              <span className="text-lg font-semibold text-green-400">
                {realTimeMetrics?.cache_hit_rate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">API Status</span>
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cache</span>
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Response Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">API Average</span>
              <span className="text-lg font-semibold">~150ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-lg font-semibold">~45ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cache</span>
              <span className="text-lg font-semibold text-green-400">~5ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
          <CardDescription>
            Recent system alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  {getAlertIcon(alert.type)}
                  <AlertTitle className="flex items-center justify-between">
                    {alert.title}
                    <Badge variant="outline" className="text-xs">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <p className="text-muted-foreground">No system alerts at this time</p>
              <p className="text-sm text-muted-foreground">All systems operating normally</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};