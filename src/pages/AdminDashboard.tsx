import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AdminMetricsOverview } from '@/components/admin/AdminMetricsOverview';
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SystemConfigManager } from '@/components/admin/SystemConfigManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Activity, Settings, FileText, BarChart3 } from 'lucide-react';

const AdminDashboard = () => {
  const { trackUserActivity } = useAnalytics();

  useEffect(() => {
    trackUserActivity({
      action: 'page_view',
      page: 'admin_dashboard'
    });
  }, [trackUserActivity]);

  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">System monitoring and management</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 glass">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminMetricsOverview />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <SystemHealthMonitor />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <SystemConfigManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Detailed analytics and reporting functionality coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Advanced analytics dashboard will be available in a future update
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;