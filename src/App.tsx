import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SchedulePage from "./pages/Schedule";
import SeatingMapPage from "./pages/SeatingMap";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Constraints from "./pages/Constraints";
import NotFound from "./pages/NotFound";
import EmployeePortal from "./pages/EmployeePortal";
import MyProfile from "./pages/MyProfile";
import { useAuth } from "./hooks/useAuth";
import { RoleBasedRoute } from "./components/RoleBasedRoute";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <RoleBasedRoute allowedRoles={["admin", "manager", "employee"]}>
          <Layout>
            <Dashboard />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/my-profile" element={
        <RoleBasedRoute allowedRoles={["employee"]}>
          <Layout>
            <EmployeePortal />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/schedule" element={
        <RoleBasedRoute allowedRoles={["admin", "manager"]}>
          <Layout>
            <SchedulePage />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/seating" element={
        <RoleBasedRoute allowedRoles={["admin", "manager"]}>
          <Layout>
            <SeatingMapPage />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/analytics" element={
        <RoleBasedRoute allowedRoles={["admin", "manager"]}>
          <Layout>
            <Analytics />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/employee-portal" element={
        <RoleBasedRoute allowedRoles={["employee"]}>
          <Layout>
            <EmployeePortal />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/constraints" element={
        <RoleBasedRoute allowedRoles={["admin"]}>
          <Layout>
            <Constraints />
          </Layout>
        </RoleBasedRoute>
      } />
      
      <Route path="/settings" element={
        <RoleBasedRoute allowedRoles={["admin"]}>
          <Layout>
            <Settings />
          </Layout>
        </RoleBasedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;