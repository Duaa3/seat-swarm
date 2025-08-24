import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  team: string | null;
  avatar_url: string | null;
}

export interface UserRole {
  role: 'admin' | 'manager' | 'employee';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        console.log('useAuth: Initial session check', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Keep loading true while fetching profile and role
          await Promise.all([
            fetchUserProfile(session.user.id),
            fetchUserRole(session.user.id)
          ]);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('useAuth: Auth state changed', event, !!session);
        
        // Set loading to true when auth state changes
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and role data before setting loading to false
          try {
            await Promise.all([
              fetchUserProfile(session.user.id),
              fetchUserRole(session.user.id)
            ]);
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('useAuth: Fetching user role for', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        // If no role found, try to get from auth metadata as fallback
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.role) {
          console.log('useAuth: Using role from auth metadata:', user.user_metadata.role);
          setUserRole({ role: user.user_metadata.role });
        } else {
          // Default to employee role if no role is found
          console.log('useAuth: No role found, defaulting to employee');
          setUserRole({ role: 'employee' });
        }
        return;
      }

      console.log('useAuth: Role fetched:', data);
      if (data) {
        setUserRole(data);
      } else {
        // No role found in database, default to employee
        console.log('useAuth: No role data found, defaulting to employee');
        setUserRole({ role: 'employee' });
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Fallback to employee role on error
      setUserRole({ role: 'employee' });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    return { error: null };
  };

  const hasRole = (role: 'admin' | 'manager' | 'employee'): boolean => {
    return userRole?.role === role;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isManager = (): boolean => hasRole('manager') || hasRole('admin');
  const isEmployee = (): boolean => !!userRole?.role;

  return {
    user,
    session,
    profile,
    userRole,
    loading,
    signOut,
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
    fetchUserProfile,
    fetchUserRole
  };
};