// ============= Data Manager Component =============

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmployees } from '@/hooks/useEmployees';
import { useSeats } from '@/hooks/useSeats';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useToast } from '@/hooks/use-toast';
import { clearAllData, getDataStats } from '@/lib/supabase-api';
import { MOCK_EMPLOYEES, MOCK_SEATS } from '@/data/mock';
import { Users, MapPin, Calendar, Database, Loader2, AlertTriangle } from 'lucide-react';

export function DataManager() {
  const { employees, addEmployees, loading: employeesLoading } = useEmployees();
  const { seats, addSeats, loading: seatsLoading } = useSeats();
  const { clearSchedule } = useScheduleData();
  const { toast } = useToast();
  const [stats, setStats] = React.useState({ employees: 0, seats: 0, scheduleAssignments: 0, trainingRecords: 0 });
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [clearingData, setClearingData] = React.useState(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const newStats = await getDataStats();
      setStats(newStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch database statistics",
        variant: "destructive"
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadMockData = async () => {
    try {
      // Load employees
      const employeesToLoad = MOCK_EMPLOYEES.map(emp => ({
        full_name: emp.full_name,
        team: emp.team,
        department: emp.department,
        preferred_work_mode: emp.preferred_work_mode,
        needs_accessible: emp.needs_accessible,
        prefer_window: emp.prefer_window,
        preferred_zone: emp.preferred_zone,
        onsite_ratio: emp.onsite_ratio,
        project_count: emp.project_count,
        preferred_days: emp.preferred_days
      }));

      // Load seats
      const seatsToLoad = MOCK_SEATS.map(seat => ({
        floor: seat.floor,
        zone: seat.zone,
        is_accessible: seat.is_accessible,
        is_window: seat.is_window,
        x: seat.x,
        y: seat.y
      }));

      await Promise.all([
        addEmployees(employeesToLoad),
        addSeats(seatsToLoad)
      ]);

      await fetchStats();

      toast({
        title: "Success",
        description: "Mock data loaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to load mock data",
        variant: "destructive"
      });
    }
  };

  const clearAllAppData = async () => {
    try {
      setClearingData(true);
      await clearAllData();
      clearSchedule();
      await fetchStats();
      
      toast({
        title: "Success",
        description: "All data cleared successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive"
      });
    } finally {
      setClearingData(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [employees, seats]);

  const isLoading = employeesLoading || seatsLoading || loadingStats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
        <p className="text-muted-foreground">Manage employees, seats, and schedule data</p>
      </div>

      {/* Database Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.employees}
            </div>
            <Badge variant={stats.employees > 0 ? "default" : "secondary"} className="mt-2">
              {stats.employees > 0 ? "Active" : "Empty"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seats</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.seats}
            </div>
            <Badge variant={stats.seats > 0 ? "default" : "secondary"} className="mt-2">
              {stats.seats > 0 ? "Available" : "Empty"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.scheduleAssignments}
            </div>
            <Badge variant={stats.scheduleAssignments > 0 ? "default" : "secondary"} className="mt-2">
              {stats.scheduleAssignments > 0 ? "Recorded" : "None"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Data</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.trainingRecords}
            </div>
            <Badge variant={stats.trainingRecords > 0 ? "default" : "secondary"} className="mt-2">
              {stats.trainingRecords > 0 ? "Available" : "None"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Load Sample Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Load sample employees and seats to get started with the system.
            </p>
            <Button 
              onClick={loadMockData} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Load Mock Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clear all data from the database. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              onClick={clearAllAppData} 
              disabled={clearingData || isLoading}
              className="w-full"
            >
              {clearingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Database Connection:</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex justify-between">
              <span>Data Loaded:</span>
              <Badge variant={stats.employees > 0 && stats.seats > 0 ? "default" : "secondary"}>
                {stats.employees > 0 && stats.seats > 0 ? "Yes" : "Partial"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Ready for Scheduling:</span>
              <Badge variant={stats.employees > 0 && stats.seats > 0 ? "default" : "destructive"}>
                {stats.employees > 0 && stats.seats > 0 ? "Ready" : "Need Data"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}