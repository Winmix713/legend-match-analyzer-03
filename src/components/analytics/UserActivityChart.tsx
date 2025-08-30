import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsFilter } from '@/types/analytics';
import { Users, MousePointer, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserActivityChartProps {
  filter: AnalyticsFilter;
  detailed?: boolean;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export const UserActivityChart = ({ filter, detailed = false }: UserActivityChartProps) => {
  const { generateChartData, loading } = useAnalytics();
  const [pageViewsData, setPageViewsData] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [activityByHour, setActivityByHour] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Generate page views data
        await generateChartData('page_views', filter);
        
        // Mock data for demonstration - in real app, this would come from your analytics
        const mockPageViews = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          pageViews: Math.floor(Math.random() * 1000) + 200,
          uniqueVisitors: Math.floor(Math.random() * 500) + 100,
          newUsers: Math.floor(Math.random() * 200) + 50
        }));
        setPageViewsData(mockPageViews);

        // Mock session duration data
        const mockSessionData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          sessions: Math.floor(Math.random() * 100) + 10,
          avgDuration: Math.floor(Math.random() * 300) + 60
        }));
        setSessionData(mockSessionData);

        // Mock activity by hour
        const mockActivityByHour = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          hourLabel: `${i}:00`,
          users: Math.floor(Math.random() * 50) + 5,
          actions: Math.floor(Math.random() * 200) + 20
        }));
        setActivityByHour(mockActivityByHour);

        // Mock top pages
        const mockTopPages = [
          { page: '/', visits: 1250, percentage: 35 },
          { page: '/dashboard', visits: 890, percentage: 25 },
          { page: '/analytics', visits: 650, percentage: 18 },
          { page: '/settings', visits: 420, percentage: 12 },
          { page: '/profile', visits: 290, percentage: 8 }
        ];
        setTopPages(mockTopPages);

      } catch (error) {
        console.error('Error loading user activity data:', error);
      }
    };

    loadData();
  }, [filter, generateChartData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: detailed ? 4 : 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Page Views & Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pageViewsData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar 
                  dataKey="pageViews" 
                  fill="hsl(var(--primary))" 
                  name="Page Views" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="uniqueVisitors" 
                  fill="hsl(var(--chart-2))" 
                  name="Unique Visitors" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityByHour}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => `Hour: ${label}:00`}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="actions"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="User Actions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {detailed && (
        <>
          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topPages}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="visits"
                      nameKey="page"
                      label={(entry) => `${entry.page} (${entry.percentage}%)`}
                    >
                      {topPages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString(), 'Visits']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Duration by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      interval={'preserveStartEnd'}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}s`, 'Avg Duration']}
                    />
                    <Bar 
                      dataKey="avgDuration" 
                      fill="hsl(var(--chart-3))" 
                      name="Avg Duration (seconds)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Engagement Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Engagement Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">2.4</p>
                  <p className="text-sm text-muted-foreground">Avg Pages/Session</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">3:42</p>
                  <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">68%</p>
                  <p className="text-sm text-muted-foreground">Returning Visitors</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">89%</p>
                  <p className="text-sm text-muted-foreground">User Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};