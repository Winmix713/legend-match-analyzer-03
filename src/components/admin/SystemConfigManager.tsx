import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SystemConfig } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Search,
  FileText,
  Hash,
  ToggleLeft,
  Braces
} from 'lucide-react';

export const SystemConfigManager = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      
      // Create mock system configuration data
      // In a real application, this would come from a dedicated config table
      const mockConfigs: SystemConfig[] = [
        {
          id: '1',
          key: 'app.name',
          value: 'Football Analytics Dashboard',
          description: 'Application display name',
          type: 'string',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        },
        {
          id: '2',
          key: 'app.version',
          value: '1.0.0',
          description: 'Current application version',
          type: 'string',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        },
        {
          id: '3',
          key: 'cache.ttl',
          value: '3600',
          description: 'Cache time-to-live in seconds',
          type: 'number',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        },
        {
          id: '4',
          key: 'features.analytics_enabled',
          value: 'true',
          description: 'Enable advanced analytics features',
          type: 'boolean',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        },
        {
          id: '5',
          key: 'api.rate_limit',
          value: '{"requests_per_minute": 100, "burst_limit": 200}',
          description: 'API rate limiting configuration',
          type: 'json',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        },
        {
          id: '6',
          key: 'maintenance.enabled',
          value: 'false',
          description: 'System maintenance mode',
          type: 'boolean',
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        }
      ];

      setConfigs(mockConfigs);
    } catch (error) {
      console.error('Error fetching system configs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConfigs = configs.filter(config =>
    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddConfig = async (newConfig: Omit<SystemConfig, 'id' | 'updated_at' | 'updated_by'>) => {
    try {
      const config: SystemConfig = {
        ...newConfig,
        id: Date.now().toString(),
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      setConfigs([...configs, config]);
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Configuration added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add configuration",
        variant: "destructive"
      });
    }
  };

  const handleUpdateConfig = async (updatedConfig: SystemConfig) => {
    try {
      const updated = {
        ...updatedConfig,
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      setConfigs(configs.map(config => 
        config.id === updated.id ? updated : config
      ));
      
      setIsEditDialogOpen(false);
      setEditingConfig(null);
      
      toast({
        title: "Success",
        description: "Configuration updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      setConfigs(configs.filter(config => config.id !== configId));
      
      toast({
        title: "Success",
        description: "Configuration deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <FileText className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'boolean':
        return <ToggleLeft className="h-4 w-4" />;
      case 'json':
        return <Braces className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      string: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      number: 'bg-green-500/20 text-green-400 border-green-500/30',
      boolean: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      json: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };

    return (
      <Badge variant="default" className={colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
        {getTypeIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  const ConfigForm = ({ 
    config, 
    onSubmit, 
    onCancel 
  }: { 
    config?: SystemConfig; 
    onSubmit: (config: any) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState({
      key: config?.key || '',
      value: config?.value || '',
      description: config?.description || '',
      type: config?.type || 'string'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(config ? { ...config, ...formData } : formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="key">Configuration Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="app.feature.enabled"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Value Type</Label>
          <Select value={formData.type} onValueChange={(value: 'string' | 'number' | 'boolean' | 'json') => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          {formData.type === 'json' ? (
            <Textarea
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder='{"key": "value"}'
              rows={4}
              required
            />
          ) : (
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === 'boolean' ? 'true/false' : 'Configuration value'}
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this configuration controls"
            rows={2}
            required
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {config ? 'Update' : 'Add'} Config
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Manage application settings and configuration</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="btn-hero">
          <Plus className="h-4 w-4 mr-2" />
          Add Config
        </Button>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search configurations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurations Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Settings ({filteredConfigs.length})
          </CardTitle>
          <CardDescription>
            System-wide configuration parameters and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
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
                    <TableHead>Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{config.key}</span>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(config.type)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm max-w-xs truncate block">
                          {config.value}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {config.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(config.updated_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">by {config.updated_by}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingConfig(config);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Config Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Add Configuration</DialogTitle>
            <DialogDescription>
              Add a new system configuration parameter
            </DialogDescription>
          </DialogHeader>
          
          <ConfigForm
            onSubmit={handleAddConfig}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Config Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update system configuration parameter
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <ConfigForm
              config={editingConfig}
              onSubmit={handleUpdateConfig}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingConfig(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};