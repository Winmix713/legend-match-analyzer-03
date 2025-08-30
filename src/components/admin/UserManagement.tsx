import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User, UserRole } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical,
  Shield,
  ShieldCheck,
  UserCheck,
  Eye
} from 'lucide-react';

const defaultRoles: UserRole[] = [
  {
    id: 'admin',
    name: 'admin',
    description: 'Full system access',
    permissions: []
  },
  {
    id: 'manager',
    name: 'manager',
    description: 'Management access with limited admin features',
    permissions: []
  },
  {
    id: 'analyst',
    name: 'analyst',
    description: 'Read-only access to analytics and reports',
    permissions: []
  },
  {
    id: 'viewer',
    name: 'viewer',
    description: 'Basic read-only access',
    permissions: []
  }
];

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get unique users from system logs with their activity
      const { data: userActivity, error } = await supabase
        .from('system_logs')
        .select('user_id, created_at')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create mock user data based on activity (in real app, this would come from auth.users)
      const userMap = new Map();
      userActivity?.forEach(log => {
        if (log.user_id && !userMap.has(log.user_id)) {
          userMap.set(log.user_id, {
            id: log.user_id,
            email: `user-${log.user_id.slice(0, 8)}@example.com`,
            full_name: `User ${log.user_id.slice(0, 8)}`,
            role: defaultRoles[Math.floor(Math.random() * defaultRoles.length)],
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            created_at: log.created_at,
            updated_at: log.created_at,
            last_login: log.created_at,
            mfa_enabled: Math.random() > 0.5
          });
        }
      });

      const mockUsers: User[] = Array.from(userMap.values());
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role.name === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // In a real application, this would update the user in Supabase
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'analyst':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button className="btn-hero">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {defaultRoles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.role.name)}
                          {user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {user.mfa_enabled ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={selectedUser.full_name}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      full_name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={selectedUser.role.name} 
                    onValueChange={(value) => {
                      const newRole = defaultRoles.find(r => r.name === value);
                      if (newRole) {
                        setSelectedUser({
                          ...selectedUser,
                          role: newRole
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultRoles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={selectedUser.status} 
                    onValueChange={(value) => setSelectedUser({
                      ...selectedUser,
                      status: value as 'active' | 'inactive' | 'suspended'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="mfa"
                  checked={selectedUser.mfa_enabled}
                  onCheckedChange={(checked) => setSelectedUser({
                    ...selectedUser,
                    mfa_enabled: checked
                  })}
                />
                <Label htmlFor="mfa">Multi-Factor Authentication</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateUser(selectedUser)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};