import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        
        
        if (session?.user) {
          // Fetch user profile with role
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            const user: User = {
              id: profile.id,
              name: profile.full_name || session.user.email || '',
              email: session.user.email || '',
              role: profile.role as 'admin' | 'manager' | 'employee',
              employee_id: undefined
            };
            console.log('Setting user state:', user);
            setAuthState({ user, isAuthenticated: true });
          } else {
            console.log('No profile found, creating one...');
            // If no profile exists, create one with default employee role
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  full_name: session.user.email,
                  role: 'employee'
                }
              ])
              .select()
              .single();

            if (!createError && newProfile) {
              const user: User = {
                id: newProfile.id,
                name: newProfile.full_name || session.user.email || '',
                email: session.user.email || '',
                role: newProfile.role as 'admin' | 'manager' | 'employee',
                employee_id: undefined
              };
              console.log('Created new profile, setting user state:', user);
              setAuthState({ user, isAuthenticated: true });
            } else {
              console.log('Failed to create profile:', createError);
              // Still set authenticated to avoid infinite loading
              setAuthState({ 
                user: {
                  id: session.user.id,
                  name: session.user.email || '',
                  email: session.user.email || '',
                  role: 'employee',
                  employee_id: undefined
                }, 
                isAuthenticated: true 
              });
            }
          }
        } else {
          setAuthState({ user: null, isAuthenticated: false });
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Initial session will be handled by the auth state change listener
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string): Promise<{ error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};