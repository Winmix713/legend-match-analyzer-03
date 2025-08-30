import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield } from 'lucide-react';

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return null;
  }

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'user': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'viewer': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback>
              {profile.full_name?.split(' ').map(n => n[0]).join('') || 
               profile.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {profile.full_name || 'User'}
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${getRoleBadgeColor(profile.role)}`}
              >
                {profile.role}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {profile.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Panel</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};