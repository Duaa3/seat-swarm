import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, LogOut } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallback 
}) => {
  const { user, userRole, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!userRole || !allowedRoles.includes(userRole.role)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <Alert>
            <ShieldX className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page. Contact your administrator for access.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};