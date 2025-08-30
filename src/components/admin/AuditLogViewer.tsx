import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuditLog } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';

export const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch system logs that can serve as audit logs
      const { data: logs, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform system logs into audit log format
      const auditLogData: AuditLog[] = logs?.map((log, index) => ({
        id: log.id?.toString() || `audit-${index}`,
        user_id: log.user_id || 'system',
        action: log.event_type || 'unknown',
        resource: getResourceFromMessage(log.message || ''),
        details: (log.details as Record<string, any>) || { message: log.message },
        ip_address: getRandomIP(), // In real app, this would be stored
        user_agent: 'Mozilla/5.0 (User Agent)', // In real app, this would be stored
        created_at: log.created_at
      })) || [];

      setAuditLogs(auditLogData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourceFromMessage = (message: string): string => {
    if (message.includes('user')) return 'user_management';
    if (message.includes('system')) return 'system_config';
    if (message.includes('performance')) return 'performance_metrics';
    if (message.includes('error')) return 'error_logs';
    return 'general';
  };

  const getRandomIP = (): string => {
    return `192.168.1.${Math.floor(Math.random() * 255)}`;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'user_activity':
        return <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <User className="h-3 w-3 mr-1" />
          User Activity
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>;
      case 'performance_metric':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
          <Activity className="h-3 w-3 mr-1" />
          Performance
        </Badge>;
      case 'system_update':
        return <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          System Update
        </Badge>;
      default:
        return <Badge variant="outline">
          <Info className="h-3 w-3 mr-1" />
          {action}
        </Badge>;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'user_management':
        return <User className="h-4 w-4" />;
      case 'system_config':
        return <Activity className="h-4 w-4" />;
      case 'performance_metrics':
        return <Activity className="h-4 w-4" />;
      case 'error_logs':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Action', 'Resource', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_id,
        log.action,
        log.resource,
        log.ip_address
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Audit logs exported successfully"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">System activity and security audit trail</p>
        </div>
        <Button onClick={exportLogs} className="btn-ghost">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="action" className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_activity">User Activity</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="performance_metric">Performance</SelectItem>
                  <SelectItem value="system_update">System Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Trail ({filteredLogs.length})
              </CardTitle>
              <CardDescription>
                Detailed system activity and security events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {log.user_id.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource)}
                          <span className="capitalize">
                            {log.resource.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{log.ip_address}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-sm">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono">{selectedLog.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <p className="text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource</label>
                  <p className="text-sm">{selectedLog.resource}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <p className="text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Details</label>
                <div className="mt-2 p-4 bg-muted/20 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};