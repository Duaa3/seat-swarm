import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeeConstraints } from "@/hooks/useConstraints";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Settings, 
  Save, 
  Calendar, 
  MapPin,
  Clock,
  Building
} from "lucide-react";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const ZONES = ['A', 'B', 'C', 'D'] as const;

const MyProfile = () => {
  const { user, profile } = useAuth();
  const { employees, updateEmployee } = useEmployees();
  const { constraints, updateConstraints, createConstraints } = useEmployeeConstraints();
  
  const [saving, setSaving] = useState(false);
  
  // Find current employee data
  const currentEmployee = employees.find(emp => emp.id === user?.id);
  const currentConstraints = constraints.find(c => c.employee_id === user?.id);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    full_name: currentEmployee?.full_name || profile?.full_name || '',
    department: currentEmployee?.department || profile?.department || '',
    team: currentEmployee?.team || profile?.team || '',
    preferred_work_mode: currentEmployee?.preferred_work_mode || 'hybrid',
    
    // Preferences
    prefer_window: currentEmployee?.prefer_window || false,
    needs_accessible: currentEmployee?.needs_accessible || false,
    preferred_zone: currentEmployee?.preferred_zone || '',
    preferred_days: currentEmployee?.preferred_days || [],
    
    // Constraints
    max_weekly_office_days: currentConstraints?.max_weekly_office_days || 3,
    preferred_floor: currentConstraints?.preferred_floor || null,
    avoid_days: currentConstraints?.avoid_days || [],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string, isPreferred: boolean) => {
    const field = isPreferred ? 'preferred_days' : 'avoid_days';
    const currentDays = formData[field] as string[];
    
    setFormData(prev => ({
      ...prev,
      [field]: currentDays.includes(day) 
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Update employee data
      if (currentEmployee) {
        await updateEmployee(currentEmployee.id, {
          full_name: formData.full_name,
          department: formData.department,
          team: formData.team,
          preferred_work_mode: formData.preferred_work_mode,
          prefer_window: formData.prefer_window,
          needs_accessible: formData.needs_accessible,
          preferred_zone: formData.preferred_zone,
          preferred_days: formData.preferred_days,
        });
      }

      // Update or create constraints
      const constraintsData = {
        employee_id: user.id,
        max_weekly_office_days: formData.max_weekly_office_days,
        preferred_floor: formData.preferred_floor,
        avoid_days: formData.avoid_days,
        preferred_days: formData.preferred_days,
        preferred_zone: formData.preferred_zone,
        needs_accessible_seat: formData.needs_accessible,
      };

      if (currentConstraints) {
        await updateConstraints(currentConstraints.id, constraintsData);
      } else {
        await createConstraints(constraintsData);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department,
          team: formData.team,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and workspace preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Enter your department"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                placeholder="Enter your team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_mode">Preferred Work Mode</Label>
              <Select value={formData.preferred_work_mode} onValueChange={(value) => handleInputChange('preferred_work_mode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Workspace Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="prefer_window">Window Seat Preference</Label>
                  <p className="text-sm text-muted-foreground">I prefer seats near windows</p>
                </div>
                <Switch
                  id="prefer_window"
                  checked={formData.prefer_window}
                  onCheckedChange={(checked) => handleInputChange('prefer_window', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="needs_accessible">Accessibility Requirements</Label>
                  <p className="text-sm text-muted-foreground">I need accessible seating</p>
                </div>
                <Switch
                  id="needs_accessible"
                  checked={formData.needs_accessible}
                  onCheckedChange={(checked) => handleInputChange('needs_accessible', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Zone</Label>
                <Select value={formData.preferred_zone || "no-preference"} onValueChange={(value) => handleInputChange('preferred_zone', value === "no-preference" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    {ZONES.map(zone => (
                      <SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Floor</Label>
                <Select 
                  value={formData.preferred_floor?.toString() || "no-preference"} 
                  onValueChange={(value) => handleInputChange('preferred_floor', value === "no-preference" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="1">Floor 1</SelectItem>
                    <SelectItem value="2">Floor 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Maximum Office Days Per Week</Label>
            <Select 
              value={formData.max_weekly_office_days.toString()} 
              onValueChange={(value) => handleInputChange('max_weekly_office_days', parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'day' : 'days'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preferred Days</Label>
              <p className="text-sm text-muted-foreground mb-3">Days when you prefer to work in the office</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`preferred-${day}`}
                      checked={formData.preferred_days.includes(day)}
                      onCheckedChange={() => handleDayToggle(day, true)}
                    />
                    <Label htmlFor={`preferred-${day}`} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Days to Avoid</Label>
              <p className="text-sm text-muted-foreground mb-3">Days when you prefer to work remotely</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`avoid-${day}`}
                      checked={formData.avoid_days.includes(day)}
                      onCheckedChange={() => handleDayToggle(day, false)}
                    />
                    <Label htmlFor={`avoid-${day}`} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferences Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.prefer_window && (
              <Badge variant="outline">🪟 Window seats</Badge>
            )}
            {formData.needs_accessible && (
              <Badge variant="outline">♿ Accessible</Badge>
            )}
            {formData.preferred_zone && (
              <Badge variant="outline">📍 Zone {formData.preferred_zone}</Badge>
            )}
            {formData.preferred_floor && (
              <Badge variant="outline">🏢 Floor {formData.preferred_floor}</Badge>
            )}
            <Badge variant="outline">
              📅 Max {formData.max_weekly_office_days} office days/week
            </Badge>
            {formData.preferred_days.length > 0 && (
              <Badge variant="outline">
                ✅ Prefers: {formData.preferred_days.join(', ')}
              </Badge>
            )}
            {formData.avoid_days.length > 0 && (
              <Badge variant="outline">
                ❌ Avoids: {formData.avoid_days.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;