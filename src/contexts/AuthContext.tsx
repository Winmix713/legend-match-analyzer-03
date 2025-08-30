import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: Error }>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ROLE_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'manage_settings'],
  user: ['read', 'write', 'view_analytics'],
  viewer: ['read']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile from user metadata (since we don't have user_profiles table)
  const loadUserProfile = async (authUser: User) => {
    try {
      // Create profile from user metadata and auth user data
      const defaultProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        role: (authUser.user_metadata?.role as UserRole) || 'user',
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: authUser.updated_at || new Date().toISOString()
      };

      setProfile(defaultProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Email or password is incorrect. Please check your credentials and try again.';
        } else if (error.message === 'Email not confirmed') {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        }
        
        toast({
          title: 'Sign In Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });

      return { error: undefined };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Sign In Failed',
        description: authError.message,
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        let errorMessage = error.message;
        
        // Provide more user-friendly error messages  
        if (error.message === 'User already registered') {
          errorMessage = 'An account with this email already exists. Please try signing in instead.';
        }
        
        toast({
          title: 'Sign Up Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account.',
      });

      return { error: undefined };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Sign Up Failed',
        description: authError.message,
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Signed Out',
        description: 'Successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'There was an error signing out.',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      return { error: new Error('No user logged in') };
    }

    try {
      // Update user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          role: updates.role,
        }
      });

      if (error) throw error;

      // Update local profile state
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setProfile(updatedProfile);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });

      return { error: undefined };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'There was an error updating your profile.',
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (!profile) return false;
    
    // Admin has all permissions
    if (profile.role === 'admin') return true;
    
    // Check if user has the specific role or higher
    const roleHierarchy: UserRole[] = ['viewer', 'user', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(profile.role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    
    const userPermissions = ROLE_PERMISSIONS[profile.role] || [];
    return userPermissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};