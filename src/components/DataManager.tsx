import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearAllData, getDataStats, bulkCreateEmployees, bulkCreateSeats } from '@/lib/supabase-api';
import { MOCK_EMPLOYEES, MOCK_SEATS } from '@/data/mock';
import { Users, MapPin, Calendar, Database, Loader2, AlertTriangle, Zap, Cloud } from 'lucide-react';

export function DataManager() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState({ employees: 0, seats: 0, scheduleAssignments: 0 });
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [apiLoading, setApiLoading] = React.useState(false);
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

  const loadEmployeesFromDatabase = async () => {
    try {
      setApiLoading(true);
      
      const employees = await bulkCreateEmployees(MOCK_EMPLOYEES);
      
      toast({
        title: "Success",
        description: `Created ${employees.length} employees in database`,
      });
      await fetchStats(); // Refresh stats
    } catch (error) {
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to create employees",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const loadSeatsFromDatabase = async () => {
    try {
      setApiLoading(true);
      
      const seats = await bulkCreateSeats(MOCK_SEATS);
      
      toast({
        title: "Success", 
        description: `Created ${seats.length} seats in database`,
      });
      await fetchStats(); // Refresh stats
    } catch (error) {
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to create seats",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const generateSampleData = async () => {
    try {
      setApiLoading(true);
      
      // Create both employees and seats
      const [employees, seats] = await Promise.all([
        bulkCreateEmployees(MOCK_EMPLOYEES),
        bulkCreateSeats(MOCK_SEATS)
      ]);
      
      toast({
        title: "Sample Data Created",
        description: `Created ${employees.length} employees and ${seats.length} seats`,
      });
      await fetchStats(); // Refresh stats
    } catch (error) {
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to create sample data",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const loadAllDataFromDatabase = async () => {
    try {
      setApiLoading(true);
      
      // Load employees and seats in parallel
      const [employees, seats] = await Promise.all([
        bulkCreateEmployees(MOCK_EMPLOYEES),
        bulkCreateSeats(MOCK_SEATS)
      ]);
      
      toast({
        title: "Database Populated",
        description: `Created ${employees.length} employees and ${seats.length} seats`,
      });
      await fetchStats(); // Refresh stats
    } catch (error) {
      toast({
        title: "Database Error",
        description: "Failed to populate database",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const clearAllAppData = async () => {
    try {
      setClearingData(true);
      await clearAllData();
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
  }, []);

  const isLoading = loadingStats || apiLoading || clearingData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Database Management</h2>
        <p className="text-muted-foreground">Manage data directly in the Supabase database</p>
      </div>

      {/* Database Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      {/* Database Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Quick Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Populate database with sample data for testing.
            </p>
            <Button 
              onClick={loadAllDataFromDatabase} 
              disabled={isLoading} 
              className="w-full"
              variant="default"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Load Sample Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Individual Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={loadEmployeesFromDatabase} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Create Employees
            </Button>
            <Button 
              onClick={loadSeatsFromDatabase} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Create Seats
            </Button>
            <Button 
              onClick={generateSampleData} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
              Create Sample Data
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
              <span>Database Type:</span>
              <Badge variant="default">Supabase PostgreSQL</Badge>
            </div>
            <div className="flex justify-between">
              <span>Data Loaded:</span>
              <Badge variant={stats.employees > 0 && stats.seats > 0 ? "default" : "secondary"}>
                {stats.employees > 0 && stats.seats > 0 ? "Complete" : "Partial"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>System Ready:</span>
              <Badge variant={stats.employees > 0 && stats.seats > 0 && stats.scheduleAssignments > 0 ? "default" : "secondary"}>
                {stats.employees > 0 && stats.seats > 0 && stats.scheduleAssignments > 0 ? "Fully Operational" : "Setup Required"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}