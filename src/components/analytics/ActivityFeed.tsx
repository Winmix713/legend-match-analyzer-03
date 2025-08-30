import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  User, 
  MousePointer, 
  LogIn, 
  LogOut, 
  Search, 
  Download, 
  Settings, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    id: string;
  };
  action: string;
  page: string;
  timestamp: string;
  type: 'page_view' | 'login' | 'logout' | 'search' | 'download' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'page_view' | 'login' | 'error'>('all');
  const { trackUserActivity } = useAnalytics();

  // Mock real-time activity data
  useEffect(() => {
    const generateMockActivity = (): ActivityItem => {
      const users = [
        { name: 'John Doe', id: '1' },
        { name: 'Jane Smith', id: '2' },
        { name: 'Mike Johnson', id: '3' },
        { name: 'Sarah Wilson', id: '4' },
        { name: 'Tom Brown', id: '5' }
      ];

      const actions = [
        { action: 'viewed', page: '/dashboard', type: 'page_view' as const },
        { action: 'logged in', page: '/login', type: 'login' as const },
        { action: 'searched for', page: '/search', type: 'search' as const, metadata: { query: 'analytics' } },
        { action: 'downloaded', page: '/reports', type: 'download' as const, metadata: { file: 'monthly-report.pdf' } },
        { action: 'updated settings', page: '/settings', type: 'success' as const },
        { action: 'encountered error', page: '/api/data', type: 'error' as const },
        { action: 'logged out', page: '/logout', type: 'logout' as const }
      ];

      const user = users[Math.floor(Math.random() * users.length)];
      const actionData = actions[Math.floor(Math.random() * actions.length)];

      return {
        id: Math.random().toString(36).substr(2, 9),
        user: {
          ...user,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
        },
        action: actionData.action,
        page: actionData.page,
        type: actionData.type,
        timestamp: new Date().toISOString(),
        metadata: actionData.metadata
      };
    };

    // Initial activities
    const initialActivities = Array.from({ length: 20 }, generateMockActivity)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(initialActivities);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newActivity = generateMockActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
    }, 5000); // Add new activity every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'page_view': return MousePointer;
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'search': return Search;
      case 'download': return Download;
      case 'error': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return FileText;
    }
  };

  const getActionColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login': return 'text-green-600 bg-green-50 border-green-200';
      case 'logout': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'search': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'download': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Real-time Activity Feed
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(['all', 'page_view', 'login', 'error'] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="text-xs h-7"
                >
                  {filterType === 'all' ? 'All' : 
                   filterType === 'page_view' ? 'Views' :
                   filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const Icon = getActionIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback>
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.page}</span>
                      </p>
                    </div>
                    
                    {activity.metadata && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {activity.metadata.query && `Search: "${activity.metadata.query}"`}
                        {activity.metadata.file && `File: ${activity.metadata.file}`}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getActionColor(activity.type)}`}
                      >
                        {activity.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Live indicator for recent activities */}
                  {new Date().getTime() - new Date(activity.timestamp).getTime() < 10000 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};