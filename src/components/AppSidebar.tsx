import React from "react";
import { CalendarDays, Settings, MapPin, BarChart3, Home, Sliders, User, LogOut } from "lucide-react";
import { NotificationSystem } from "@/components/ui/notification-system";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const getNavigationItems = (userRole: string | undefined) => {
  const baseItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["admin", "manager", "employee"] },
    { title: "My Profile", url: "/my-profile", icon: User, roles: ["employee"] },
    { title: "Schedule", url: "/schedule", icon: CalendarDays, roles: ["admin", "manager"] },
    { title: "Seating Map", url: "/seating", icon: MapPin, roles: ["admin", "manager"] },
    { title: "Employee Portal", url: "/employee-portal", icon: User, roles: ["admin", "manager"] },
    { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin", "manager"] },
    { title: "Constraints", url: "/constraints", icon: Sliders, roles: ["admin"] },
    { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
  ];

  return baseItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  
  const navigationItems = getNavigationItems(userRole?.role);

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary">
              <MapPin className="size-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1">
                <h2 className="text-sm font-semibold">Office Planner</h2>
                <p className="text-xs text-muted-foreground">Smart Seating</p>
              </div>
            )}
            {!collapsed && <NotificationSystem />}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleSignOut}
                    className="hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-2 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span>Sign Out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}