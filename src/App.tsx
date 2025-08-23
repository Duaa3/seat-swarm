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
import Auth from "./pages/Auth";
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
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Auth />;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <div className="p-6 text-center">Access denied. Insufficient permissions.</div>;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      {!isAuthenticated ? (
        <Route path="*" element={<Auth />} />
      ) : user?.role === 'employee' ? (
        <Route path="*" element={<EmployeePortal />} />
      ) : (
        <>
          <Route path="/" element={
            <Layout>
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/schedule" element={
            <Layout>
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SchedulePage />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/seating" element={
            <Layout>
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SeatingMapPage />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/analytics" element={
            <Layout>
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Analytics />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/settings" element={
            <Layout>
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
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
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;