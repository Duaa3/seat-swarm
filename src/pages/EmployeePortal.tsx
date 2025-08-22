import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calendar, MapPin, Settings, User } from 'lucide-react';
import { MOCK_EMPLOYEES, MOCK_SEATS } from '@/data/mock';
import type { Employee } from '@/types/planner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ZONES = ['ZoneA', 'ZoneB', 'ZoneC'];

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [preferences, setPreferences] = useState({
    prefer_window: false,
    needs_accessible: false,
    preferred_zone: '',
    preferred_days: [] as string[]
  });

  useEffect(() => {
    if (user?.employee_id) {
      const emp = MOCK_EMPLOYEES.find(e => e.id === user.employee_id);
      if (emp) {
        setEmployee(emp);
        setPreferences({
          prefer_window: emp.prefer_window,
          needs_accessible: emp.needs_accessible,
          preferred_zone: emp.preferred_zone,
          preferred_days: emp.preferred_days
        });
      }
    }
  }, [user]);

  const handleDayToggle = (day: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter(d => d !== day)
        : [...prev.preferred_days, day]
    }));
  };

  const savePreferences = () => {
    // In real app, this would save to backend
    toast.success('Preferences saved successfully!');
  };

  // Mock current assignment
  const currentSeat = MOCK_SEATS[0]; // Simplified for demo

  if (!employee) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <div>
              <h1 className="font-semibold">Employee Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Current Seating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Seating Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{currentSeat.id}</p>
                <p className="text-sm text-muted-foreground">
                  Floor {currentSeat.floor} • {currentSeat.zone}
                </p>
                <div className="flex gap-2 mt-2">
                  {currentSeat.is_window && <Badge variant="secondary">Window</Badge>}
                  {currentSeat.is_accessible && <Badge variant="secondary">Accessible</Badge>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Onsite Ratio</p>
                <p className="text-2xl font-bold text-primary">{Math.round(employee.onsite_ratio * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Seating Preferences
            </CardTitle>
            <CardDescription>
              Update your seating preferences to improve future assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="window" className="text-sm font-medium">
                  Prefer Window Seat
                </Label>
                <Switch
                  id="window"
                  checked={preferences.prefer_window}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, prefer_window: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="accessible" className="text-sm font-medium">
                  Need Accessible Seat
                </Label>
                <Switch
                  id="accessible"
                  checked={preferences.needs_accessible}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, needs_accessible: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Zone Preference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred Zone</Label>
              <Select 
                value={preferences.preferred_zone} 
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, preferred_zone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred zone" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Preferred Days */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preferred Office Days
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Switch
                      id={day}
                      checked={preferences.preferred_days.includes(day.substring(0, 3))}
                      onCheckedChange={() => handleDayToggle(day.substring(0, 3))}
                    />
                    <Label htmlFor={day} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={savePreferences} className="w-full">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-medium">{employee.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Team</p>
                <p className="font-medium">{employee.team}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Projects</p>
                <p className="font-medium">{employee.project_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}