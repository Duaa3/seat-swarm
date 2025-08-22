import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchEmployees, 
  generateEmployees, 
  fetchSeats, 
  generateSeats,
  generateScheduleAPI,
  checkApiHealth 
} from '@/lib/api-client';
import { clearAllData, getDataStats } from '@/lib/supabase-api';
import { Users, MapPin, Calendar, Database, Loader2, AlertTriangle, Zap, Cloud } from 'lucide-react';

export function DataManager() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState({ employees: 0, seats: 0, scheduleAssignments: 0 });
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [apiLoading, setApiLoading] = React.useState(false);
  const [clearingData, setClearingData] = React.useState(false);
  const [apiHealth, setApiHealth] = React.useState({ employees: false, seats: false, schedule: false });

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const [newStats, healthCheck] = await Promise.all([
        getDataStats(),
        checkApiHealth()
      ]);
      setStats(newStats);
      setApiHealth(healthCheck);
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

  const loadEmployeesFromApi = async () => {
    try {
      setApiLoading(true);
      
      const result = await generateEmployees(350);
      
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Generated ${result.data.count} employees via API`,
        });
        await fetchStats(); // Refresh stats
      } else {
        throw new Error(result.error || 'Unknown API error');
      }
    } catch (error) {
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to generate employees",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const loadSeatsFromApi = async () => {
    try {
      setApiLoading(true);
      
      const result = await generateSeats(2, 50); // 2 floors, 50 seats each
      
      if (result.success && result.data) {
        toast({
          title: "Success", 
          description: `Generated ${result.data.count} seats via API`,
        });
        await fetchStats(); // Refresh stats
      } else {
        throw new Error(result.error || 'Unknown API error');
      }
    } catch (error) {
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to generate seats",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const generateScheduleFromApi = async () => {
    try {
      setApiLoading(true);
      
      const result = await generateScheduleAPI({
        dayCapacities: { Mon: 90, Tue: 90, Wed: 90, Thu: 90, Fri: 90 },
        deptCapacity: 60,
        teamClusters: []
      });
      
      if (result.success && result.data) {
        toast({
          title: "Schedule Generated",
          description: `Created ${result.data.assignments} assignments for week starting ${result.data.weekStartDate}`,
        });
        await fetchStats(); // Refresh stats
      } else {
        throw new Error(result.error || 'Unknown API error');
      }
    } catch (error) {
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to generate schedule",
        variant: "destructive"
      });
    } finally {
      setApiLoading(false);
    }
  };

  const loadAllDataFromApi = async () => {
    try {
      setApiLoading(true);
      
      // Load employees and seats in parallel
      const [employeesResult, seatsResult] = await Promise.all([
        generateEmployees(350),
        generateSeats(2, 50)
      ]);
      
      let successCount = 0;
      if (employeesResult.success) successCount++;
      if (seatsResult.success) successCount++;
      
      if (successCount > 0) {
        toast({
          title: "API Data Loaded",
          description: `Successfully loaded ${successCount}/2 datasets from API`,
        });
        await fetchStats(); // Refresh stats
      } else {
        throw new Error('All API calls failed');
      }
    } catch (error) {
      toast({
        title: "API Error",
        description: "Failed to load data from APIs",
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
        <h2 className="text-2xl font-bold tracking-tight">API-Driven Data Management</h2>
        <p className="text-muted-foreground">Load data automatically through intelligent APIs</p>
      </div>

      {/* API Health Status */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant={apiHealth.employees ? "default" : "secondary"}>
                Employees API {apiHealth.employees ? "✓" : "?"}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant={apiHealth.seats ? "default" : "secondary"}>
                Seats API {apiHealth.seats ? "✓" : "?"}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant={apiHealth.schedule ? "default" : "secondary"}>
                Schedule API {apiHealth.schedule ? "✓" : "?"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* API Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Quick Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Load all data automatically with intelligent APIs.
            </p>
            <Button 
              onClick={loadAllDataFromApi} 
              disabled={isLoading} 
              className="w-full"
              variant="default"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Load All Data via API
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Individual APIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={loadEmployeesFromApi} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Generate Employees
            </Button>
            <Button 
              onClick={loadSeatsFromApi} 
              disabled={isLoading} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Generate Seats
            </Button>
            <Button 
              onClick={generateScheduleFromApi} 
              disabled={isLoading || stats.employees === 0 || stats.seats === 0} 
              className="w-full"
              variant="outline"
              size="sm"
            >
              {apiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
              Generate Schedule
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
              <span>API Endpoints:</span>
              <Badge variant={Object.values(apiHealth).every(Boolean) ? "default" : "secondary"}>
                {Object.values(apiHealth).filter(Boolean).length}/3 Active
              </Badge>
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