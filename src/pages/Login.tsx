import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(email, password, activeTab)) {
      toast.success(`Welcome! Logged in as ${activeTab}`);
    } else {
      toast.error('Invalid credentials. Try: password');
    }
  };

  const setDemoCredentials = (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      setEmail('admin@company.com');
    } else {
      setEmail('aisha@company.com');
    }
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Smart Office Login</CardTitle>
          <CardDescription>
            Access your seating management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'admin' | 'employee')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="employee">Employee</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-4 mt-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Admin access to manage all seating arrangements
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login as Admin
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setDemoCredentials('admin')}
                >
                  Use Demo Credentials
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="employee" className="space-y-4 mt-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Employee access to view and update preferences
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login as Employee
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setDemoCredentials('employee')}
                >
                  Use Demo Credentials
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-xs text-center text-muted-foreground">
            Demo credentials: password for all users
          </div>
        </CardContent>
      </Card>
    </div>
  );
}