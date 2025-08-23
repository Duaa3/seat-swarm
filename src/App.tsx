import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SchedulePage from "./pages/Schedule";
import SeatingMapPage from "./pages/SeatingMap";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
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

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout>
          <Index />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/schedule" element={
        <Layout>
          <SchedulePage />
        </Layout>
      } />
      <Route path="/seating" element={
        <Layout>
          <SeatingMapPage />
        </Layout>
      } />
      <Route path="/analytics" element={
        <Layout>
          <Analytics />
        </Layout>
      } />
      <Route path="/settings" element={
        <Layout>
          <Settings />
        </Layout>
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