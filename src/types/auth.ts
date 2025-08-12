export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  employee_id?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}