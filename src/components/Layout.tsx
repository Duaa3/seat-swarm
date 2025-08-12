import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">Smart Office Seating Planner</h1>
                <span className="text-sm text-muted-foreground">({user?.role})</span>
              </div>
            </div>
            <div className="px-4">
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}