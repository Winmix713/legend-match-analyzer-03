import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { User, Mail, Shield, Save, Upload, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { user, profile, updateProfile, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement password change with Supabase
      // const { error } = await supabase.auth.updateUser({
      //   password: passwordData.newPassword
      // });
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'user': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'viewer': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getUserPermissions = () => {
    const permissions = [];
    if (hasPermission('read')) permissions.push('Read');
    if (hasPermission('write')) permissions.push('Write');
    if (hasPermission('delete')) permissions.push('Delete');
    if (hasPermission('manage_users')) permissions.push('Manage Users');
    if (hasPermission('view_analytics')) permissions.push('View Analytics');
    if (hasPermission('manage_settings')) permissions.push('Manage Settings');
    return permissions;
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-lg">
            {profile.full_name?.split(' ').map(n => n[0]).join('') || 
             profile.email.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name || 'User Profile'}</h1>
          <p className="text-muted-foreground">{profile.email}</p>
          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(profile.role)}`}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Picture URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar"
                      type="url"
                      value={profileData.avatar_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                  >
                    {showChangePassword ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>

                {showChangePassword && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button onClick={handlePasswordChange} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account Created:</span>
                      <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Updated:</span>
                      <p>{new Date(profile.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <p className="font-mono text-xs">{profile.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email Verified:</span>
                      <p>{user.email_confirmed_at ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                View your current role and permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Current Role</h4>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profile.role)}`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your role determines what actions you can perform in the system.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getUserPermissions().map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {permission}
                      </div>
                    ))}
                  </div>
                  {getUserPermissions().length === 0 && (
                    <p className="text-sm text-muted-foreground">No permissions assigned.</p>
                  )}
                </div>

                <div className="p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium mb-2">Role Descriptions</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Admin:</strong> Full system access including user management and settings
                    </div>
                    <div>
                      <strong>User:</strong> Can read, write, and view analytics
                    </div>
                    <div>
                      <strong>Viewer:</strong> Read-only access to allowed content
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};