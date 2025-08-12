import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw, Download, Upload, Bell, Shield, Globe, Building } from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [autoAssign, setAutoAssign] = React.useState(false);
  const [algorithm, setAlgorithm] = React.useState<"greedy" | "hungarian">("greedy");
  const [timezone, setTimezone] = React.useState("America/New_York");

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated successfully." });
  };

  const handleReset = () => {
    setNotifications(true);
    setAutoAssign(false);
    setAlgorithm("greedy");
    setTimezone("America/New_York");
    toast({ title: "Settings reset", description: "All settings have been reset to defaults." });
  };

  const handleExport = () => {
    toast({ title: "Configuration exported", description: "Settings exported to JSON file." });
  };

  const handleImport = () => {
    toast({ title: "Configuration imported", description: "Settings imported successfully." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system preferences and optimization parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="hero" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Enter company name" defaultValue="Smart Office Corporation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-days">Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => (
                  <Badge key={day} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive schedule updates via email</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Office Configuration */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Office Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor1-seats">Floor 1 Seats</Label>
                <Input id="floor1-seats" type="number" defaultValue="48" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor2-seats">Floor 2 Seats</Label>
                <Input id="floor2-seats" type="number" defaultValue="50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office-hours">Office Hours</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="9:00 AM" defaultValue="9:00 AM" />
                <Input placeholder="5:00 PM" defaultValue="5:00 PM" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="break-rooms">Special Zones</Label>
              <Textarea 
                id="break-rooms" 
                placeholder="Meeting rooms, break areas, collaboration spaces..."
                defaultValue="Meeting Room A, Meeting Room B, Break Area North, Break Area South"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Settings */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Optimization Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Algorithm Type</Label>
              <Select value={algorithm} onValueChange={(value: "greedy" | "hungarian") => setAlgorithm(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greedy">Greedy (Fast)</SelectItem>
                  <SelectItem value="hungarian">Hungarian (Optimal)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Greedy is faster, Hungarian provides optimal solutions
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-assign Seats</Label>
                <p className="text-sm text-muted-foreground">Automatically assign seats when generating schedules</p>
              </div>
              <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-iterations">Max Optimization Iterations</Label>
              <Input id="max-iterations" type="number" defaultValue="1000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraint-penalty">Constraint Violation Penalty</Label>
              <Input id="constraint-penalty" type="number" step="0.1" defaultValue="10.0" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Schedule Conflicts</Label>
                  <p className="text-sm text-muted-foreground">Alert when capacity is exceeded</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Team Clustering Violations</Label>
                  <p className="text-sm text-muted-foreground">Notify when teams are separated</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summaries</Label>
                  <p className="text-sm text-muted-foreground">Send utilization reports weekly</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Optimization Suggestions</Label>
                  <p className="text-sm text-muted-foreground">AI-powered improvement recommendations</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardContent className="text-xs text-muted-foreground pt-6">
          <p>
            <strong>Note:</strong> Changes to optimization algorithms and office configuration will affect future 
            schedule generations. Existing schedules remain unchanged until regenerated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;