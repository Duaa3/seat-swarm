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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl"></div>
          <div className="relative bg-card/80 backdrop-blur-sm border rounded-2xl p-8 shadow-glow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Configure system preferences, optimization parameters, and customize your workspace experience
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleReset} className="hover:scale-105 transition-transform">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={handleExport} className="hover:scale-105 transition-transform">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={handleImport} className="hover:scale-105 transition-transform">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* General Settings */}
          <Card className="group hover:shadow-glow transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
                <Input 
                  id="company-name" 
                  placeholder="Enter company name" 
                  defaultValue="Smart Office Corporation" 
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-background/50 border-border/50">
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

              <div className="space-y-3">
                <Label htmlFor="work-days" className="text-sm font-medium">Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => (
                    <Badge 
                      key={day} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive schedule updates via email</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </CardContent>
          </Card>

          {/* Office Configuration */}
          <Card className="group hover:shadow-glow transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
                  <Building className="h-5 w-5 text-accent" />
                </div>
                Office Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="floor1-seats" className="text-sm font-medium">Floor 1 Seats</Label>
                  <Input 
                    id="floor1-seats" 
                    type="number" 
                    defaultValue="48" 
                    className="bg-background/50 border-border/50 focus:border-accent/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="floor2-seats" className="text-sm font-medium">Floor 2 Seats</Label>
                  <Input 
                    id="floor2-seats" 
                    type="number" 
                    defaultValue="50" 
                    className="bg-background/50 border-border/50 focus:border-accent/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="office-hours" className="text-sm font-medium">Office Hours</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="9:00 AM" 
                    defaultValue="9:00 AM" 
                    className="bg-background/50 border-border/50 focus:border-accent/50"
                  />
                  <Input 
                    placeholder="5:00 PM" 
                    defaultValue="5:00 PM" 
                    className="bg-background/50 border-border/50 focus:border-accent/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="break-rooms" className="text-sm font-medium">Special Zones</Label>
                <Textarea 
                  id="break-rooms" 
                  placeholder="Meeting rooms, break areas, collaboration spaces..."
                  defaultValue="Meeting Room A, Meeting Room B, Break Area North, Break Area South"
                  rows={3}
                  className="bg-background/50 border-border/50 focus:border-accent/50 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Optimization Settings */}
          <Card className="group hover:shadow-glow transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                Optimization Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Algorithm Type</Label>
                <Select value={algorithm} onValueChange={(value: "greedy" | "hungarian") => setAlgorithm(value)}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greedy">Greedy (Fast)</SelectItem>
                    <SelectItem value="hungarian">Hungarian (Optimal)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                  Greedy is faster, Hungarian provides optimal solutions
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Auto-assign Seats</Label>
                  <p className="text-xs text-muted-foreground">Automatically assign seats when generating schedules</p>
                </div>
                <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="max-iterations" className="text-sm font-medium">Max Iterations</Label>
                  <Input 
                    id="max-iterations" 
                    type="number" 
                    defaultValue="1000" 
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="constraint-penalty" className="text-sm font-medium">Penalty Score</Label>
                  <Input 
                    id="constraint-penalty" 
                    type="number" 
                    step="0.1" 
                    defaultValue="10.0" 
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="group hover:shadow-glow transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
                  <Bell className="h-5 w-5 text-accent" />
                </div>
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Schedule Conflicts</Label>
                    <p className="text-xs text-muted-foreground">Alert when capacity is exceeded</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Team Clustering Violations</Label>
                    <p className="text-xs text-muted-foreground">Notify when teams are separated</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Weekly Summaries</Label>
                    <p className="text-xs text-muted-foreground">Send utilization reports weekly</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Optimization Suggestions</Label>
                    <p className="text-xs text-muted-foreground">AI-powered improvement recommendations</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <Card className="bg-muted/20 border-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/20 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Changes to optimization algorithms and office configuration will affect future 
                schedule generations. Existing schedules remain unchanged until regenerated.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;