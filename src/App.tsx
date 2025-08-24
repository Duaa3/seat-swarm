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
import { useAuth } from "./hooks/useAuth";

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
        user ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/schedule" element={
        user ? (
          <Layout>
            <SchedulePage />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/seating" element={
        user ? (
          <Layout>
            <SeatingMapPage />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/analytics" element={
        user ? (
          <Layout>
            <Analytics />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/settings" element={
        user ? (
          <Layout>
            <Settings />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/constraints" element={
        user ? (
          <Layout>
            <Constraints />
          </Layout>
        ) : (
          <Auth />
        )
      } />
      <Route path="/employee-portal" element={
        user ? (
          <Layout>
            <EmployeePortal />
          </Layout>
        ) : (
          <Auth />
        )
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