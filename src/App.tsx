import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SchedulePage from "./pages/Schedule";
import SeatingMapPage from "./pages/SeatingMap";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import EmployeePortal from "./pages/EmployeePortal";
import NotFound from "./pages/NotFound";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <div className="p-6 text-center">Access denied. Insufficient permissions.</div>;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  if (user?.role === 'employee') {
    return <EmployeePortal />;
  }
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path="/seating" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SeatingMapPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;