import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AnalyticsMetrics } from '@/types/analytics';
import { Zap, AlertTriangle, Server, Clock, TrendingUp, Activity } from 'lucide-react';

interface PerformanceOverviewProps {
  metrics: AnalyticsMetrics | null;
  detailed?: boolean;
}

export const PerformanceOverview = ({ metrics, detailed = false }: PerformanceOverviewProps) => {
  // Mock performance data for charts
  const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    responseTime: Math.floor(Math.random() * 200) + 50,
    throughput: Math.floor(Math.random() * 100) + 20
  }));

  const errorData = Array.from({ length: 7 }, (_, i) => ({
    day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    errors: Math.floor(Math.random() * 10) + 1,
    requests: Math.floor(Math.random() * 1000) + 200
  }));

  const getPerformanceRating = (responseTime: number) => {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 200) return 'good';
    if (responseTime < 500) return 'fair';
    return 'poor';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const performanceScore = metrics ? Math.round((1 / (metrics.response_time / 100)) * 100) : 0;
  const rating = getPerformanceRating(metrics?.response_time || 0);

  return (
    <div className="space-y-6">
      {/* Performance Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Performance Score */}
            <div className="text-center space-y-2">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20" viewBox="0 0 42 42">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${performanceScore} ${100 - performanceScore}`}
                    strokeDashoffset="25"
                    className="transition-all duration-500"
                  />
                  <text
                    x="21"
                    y="21"
                    textAnchor="middle"
                    dy="0.3em"
                    className="text-sm font-bold fill-foreground"
                  >
                    {performanceScore}
                  </text>
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Performance Score</p>
                <Badge className={getRatingColor(rating)} variant="outline">
                  {rating.charAt(0).toUpperCase() + rating.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm font-medium">{metrics?.response_time.toFixed(0) || 0}ms</span>
                </div>
                <Progress value={Math.min((metrics?.response_time || 0) / 5, 100)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="text-sm font-medium">{metrics?.error_rate.toFixed(1) || 0}%</span>
                </div>
                <Progress value={metrics?.error_rate || 0} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{metrics?.api_requests.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{metrics?.concurrent_users || 0}</p>
                  <p className="text-xs text-muted-foreground">Concurrent Users</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{Math.round((metrics?.error_rate || 0) * (metrics?.api_requests || 0) / 100)}</p>
                  <p className="text-xs text-muted-foreground">Total Errors</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">99.{Math.floor(Math.random() * 9) + 1}%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Response Time (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  interval={detailed ? 2 : 4}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}ms`, 'Response Time']}
                />
                <Area
                  type="monotone"
                  dataKey="responseTime"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Error Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Rate (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(), 
                    name === 'errors' ? 'Errors' : 'Requests'
                  ]}
                />
                <Bar 
                  dataKey="errors" 
                  fill="hsl(var(--destructive))" 
                  name="errors"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {detailed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Additional Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">LCP (Largest Contentful Paint)</span>
                  <span className="text-sm font-medium">1.2s</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Good (&lt; 2.5s)</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">FID (First Input Delay)</span>
                  <span className="text-sm font-medium">45ms</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Good (&lt; 100ms)</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">CLS (Cumulative Layout Shift)</span>
                  <span className="text-sm font-medium">0.08</span>
                </div>
                <Progress value={90} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Good (&lt; 0.1)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Server Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">23%</span>
              </div>
              <Progress value={23} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <Progress value={67} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Disk I/O</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <Progress value={15} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">342ms</p>
                <p className="text-xs text-muted-foreground">Avg Network Latency</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">1.2MB</p>
                <p className="text-xs text-muted-foreground">Avg Page Size</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">94%</p>
                <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};