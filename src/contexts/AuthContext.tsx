import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: 'admin' | 'employee') => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin'
  },
  {
    id: 'emp1',
    name: 'Aisha Johnson',
    email: 'aisha@company.com',
    role: 'employee',
    employee_id: 'E001'
  },
  {
    id: 'emp2',
    name: 'Hilal Ahmed',
    email: 'hilal@company.com',
    role: 'employee',
    employee_id: 'E002'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setAuthState({ user, isAuthenticated: true });
    }
  }, []);

  const login = (email: string, password: string, role: 'admin' | 'employee'): boolean => {
    // Mock login - in real app this would call an API
    const user = MOCK_USERS.find(u => u.email === email && u.role === role);
    
    if (user && password === 'password') { // Simple mock password
      setAuthState({ user, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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