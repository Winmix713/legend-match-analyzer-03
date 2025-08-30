import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { RealTimeMetricsChart } from './RealTimeMetricsChart';
import { UserActivityChart } from './UserActivityChart';
import { PerformanceOverview } from './PerformanceOverview';
import { MetricsGrid } from './MetricsGrid';
import { ActivityFeed } from './ActivityFeed';
import { PredictionAccuracyChart } from './PredictionAccuracyChart';
import { AnalyticsFilter } from '@/types/analytics';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, TrendingUp, Users, Activity, Zap, Target } from 'lucide-react';
import { DateRange } from 'react-day-picker';

export const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [aggregation, setAggregation] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    metrics,
    realTimeMetrics,
    chartData,
    loading,
    error,
    getAnalyticsMetrics,
    getRealTimeMetrics,
    generateChartData
  } = useAnalytics();

  const [filter, setFilter] = useState<AnalyticsFilter>({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
    aggregation: 'day'
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        getAnalyticsMetrics(filter);
        getRealTimeMetrics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter, getAnalyticsMetrics, getRealTimeMetrics]);

  // Initial data load
  useEffect(() => {
    getAnalyticsMetrics(filter);
  }, [filter, getAnalyticsMetrics]);

  // Update filter when date range or aggregation changes
  useEffect(() => {
    const newFilter: AnalyticsFilter = {
      start_date: dateRange?.from?.toISOString() || filter.start_date,
      end_date: dateRange?.to?.toISOString() || filter.end_date,
      aggregation
    };
    setFilter(newFilter);
  }, [dateRange, aggregation]);

  const handleRefresh = () => {
    getAnalyticsMetrics(filter);
    getRealTimeMetrics();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your application performance and user activity in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="w-[280px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Aggregation</label>
                <Select value={aggregation} onValueChange={(value: any) => setAggregation(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hourly</SelectItem>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive">Error loading analytics data: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MetricsGrid metrics={metrics} loading={loading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserActivityChart filter={filter} />
              <PerformanceOverview metrics={metrics} />
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <PredictionAccuracyChart />
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <RealTimeMetricsChart 
              realTimeMetrics={realTimeMetrics}
              autoRefresh={autoRefresh}
            />
            <ActivityFeed />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserActivityChart filter={filter} detailed />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Sessions</CardTitle>
                  <CardDescription>Session duration and bounce rate trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Session analytics chart will go here */}
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Session analytics chart coming soon
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>User locations and regional activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Geographic distribution chart coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceOverview metrics={metrics} detailed />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Times</CardTitle>
                  <CardDescription>API response time distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Response time chart
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Error Rates</CardTitle>
                  <CardDescription>Application error tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Error rate chart
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Throughput</CardTitle>
                  <CardDescription>Requests per minute over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Throughput chart
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};