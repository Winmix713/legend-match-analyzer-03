import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsMetrics } from '@/types/analytics';
import { TrendingUp, Users, Clock, MousePointer, Server, AlertTriangle, Zap, Activity } from 'lucide-react';

interface MetricsGridProps {
  metrics: AnalyticsMetrics | null;
  loading: boolean;
}

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  loading 
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {value.toLocaleString()}{unit}
              </p>
              {trend !== undefined && (
                <span className={`text-xs flex items-center gap-1 ${
                  trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MetricsGrid = ({ metrics, loading }: MetricsGridProps) => {
  const metricsData = [
    {
      title: 'Page Views',
      value: metrics?.page_views || 0,
      unit: '',
      icon: MousePointer,
      trend: 12.5
    },
    {
      title: 'Unique Visitors',
      value: metrics?.unique_visitors || 0,
      unit: '',
      icon: Users,
      trend: 8.2
    },
    {
      title: 'Avg Session Duration',
      value: metrics ? Math.round(metrics.session_duration / 1000) : 0,
      unit: 's',
      icon: Clock,
      trend: -2.1
    },
    {
      title: 'Bounce Rate',
      value: metrics?.bounce_rate || 0,
      unit: '%',
      icon: TrendingUp,
      trend: -5.3
    },
    {
      title: 'API Requests',
      value: metrics?.api_requests || 0,
      unit: '',
      icon: Server,
      trend: 15.7
    },
    {
      title: 'Error Rate',
      value: metrics?.error_rate || 0,
      unit: '%',
      icon: AlertTriangle,
      trend: -1.2
    },
    {
      title: 'Avg Response Time',
      value: metrics ? Math.round(metrics.response_time) : 0,
      unit: 'ms',
      icon: Zap,
      trend: -8.4
    },
    {
      title: 'Concurrent Users',
      value: metrics?.concurrent_users || 0,
      unit: '',
      icon: Activity,
      trend: 3.1
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric) => (
        <MetricCard
          key={metric.title}
          {...metric}
          loading={loading}
        />
      ))}
    </div>
  );
};