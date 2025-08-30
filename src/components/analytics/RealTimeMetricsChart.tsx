import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RealTimeMetrics } from '@/types/analytics';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, AlertTriangle, Server, Cpu, HardDrive } from 'lucide-react';

interface RealTimeMetricsChartProps {
  realTimeMetrics: RealTimeMetrics | null;
  autoRefresh: boolean;
}

interface TimeSeriesData {
  timestamp: string;
  active_users: number;
  requests_per_minute: number;
  errors_per_minute: number;
  memory_usage: number;
  cpu_usage: number;
}

export const RealTimeMetricsChart = ({ realTimeMetrics, autoRefresh }: RealTimeMetricsChartProps) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    if (realTimeMetrics && autoRefresh) {
      const newDataPoint: TimeSeriesData = {
        timestamp: new Date().toLocaleTimeString(),
        active_users: realTimeMetrics.active_users,
        requests_per_minute: realTimeMetrics.requests_per_minute,
        errors_per_minute: realTimeMetrics.errors_per_minute,
        memory_usage: realTimeMetrics.memory_usage,
        cpu_usage: realTimeMetrics.cpu_usage
      };

      setTimeSeriesData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points for real-time view
        return updated.slice(-20);
      });
    }
  }, [realTimeMetrics, autoRefresh]);

  const RealTimeCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    status 
  }: {
    title: string;
    value: number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'good' | 'warning' | 'critical';
  }) => {
    const statusColors = {
      good: 'bg-green-500/10 text-green-600 border-green-200',
      warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      critical: 'bg-red-500/10 text-red-600 border-red-200'
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
              </div>
              <p className="text-2xl font-bold">{value.toLocaleString()}{unit}</p>
            </div>
            <Badge className={statusColors[status]} variant="outline">
              {status}
            </Badge>
          </div>
          {/* Pulse animation for real-time effect */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </CardContent>
      </Card>
    );
  };

  const getStatus = (value: number, thresholds: { warning: number; critical: number }): 'good' | 'warning' | 'critical' => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  return (
    <div className="space-y-6">
      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RealTimeCard
          title="Active Users"
          value={realTimeMetrics?.active_users || 0}
          unit=""
          icon={Users}
          status="good"
        />
        <RealTimeCard
          title="Requests/Min"
          value={realTimeMetrics?.requests_per_minute || 0}
          unit=""
          icon={Activity}
          status={getStatus(realTimeMetrics?.requests_per_minute || 0, { warning: 100, critical: 200 })}
        />
        <RealTimeCard
          title="Errors/Min"
          value={realTimeMetrics?.errors_per_minute || 0}
          unit=""
          icon={AlertTriangle}
          status={getStatus(realTimeMetrics?.errors_per_minute || 0, { warning: 5, critical: 10 })}
        />
        <RealTimeCard
          title="Memory Usage"
          value={realTimeMetrics?.memory_usage || 0}
          unit="%"
          icon={HardDrive}
          status={getStatus(realTimeMetrics?.memory_usage || 0, { warning: 70, critical: 90 })}
        />
        <RealTimeCard
          title="CPU Usage"
          value={realTimeMetrics?.cpu_usage || 0}
          unit="%"
          icon={Cpu}
          status={getStatus(realTimeMetrics?.cpu_usage || 0, { warning: 70, critical: 90 })}
        />
        <RealTimeCard
          title="DB Connections"
          value={realTimeMetrics?.database_connections || 0}
          unit=""
          icon={Server}
          status="good"
        />
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Active Users (Real-time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: number) => [value, 'Active Users']}
                />
                <Area
                  type="monotone"
                  dataKey="active_users"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Requests & Errors Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Requests & Errors/Min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="requests_per_minute"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Requests/Min"
                />
                <Line
                  type="monotone"
                  dataKey="errors_per_minute"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name="Errors/Min"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Resources Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              System Resources (Real-time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
                />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Line
                  type="monotone"
                  dataKey="memory_usage"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Memory Usage"
                />
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="CPU Usage"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
