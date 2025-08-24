import React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RefreshCw, Download, Upload, Bell, Shield, Globe, Building } from "lucide-react";
import { useSettings, type SystemSettings } from "@/hooks/useSettings";

const Settings = () => {
  const { settings, loading, updating, updateSettings, resetToDefaults, exportSettings, importSettings } = useSettings();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<Partial<SystemSettings>>({
    defaultValues: settings || undefined,
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  // Watch form values for real-time updates
  const watchedValues = watch();

  const onSubmit = async (data: Partial<SystemSettings>) => {
    await updateSettings(data);
  };

  const handleReset = async () => {
    await resetToDefaults();
  };

  const handleExport = () => {
    exportSettings();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importSettings(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleWorkingDay = (day: string) => {
    const currentDays = watchedValues.working_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setValue('working_days', newDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system preferences and optimization parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleReset} disabled={updating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={handleExport} disabled={!settings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button type="button" variant="outline" onClick={handleImport} disabled={updating}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button type="submit" variant="hero" disabled={updating}>
            {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
              <Input 
                id="company-name" 
                placeholder="Enter company name" 
                {...register("company_name")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={watchedValues.timezone} onValueChange={(value) => setValue("timezone", value)}>
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
                  <Badge 
                    key={day} 
                    variant={watchedValues.working_days?.includes(day) ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => toggleWorkingDay(day)}
                  >
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
              <Switch 
                checked={watchedValues.email_notifications || false} 
                onCheckedChange={(checked) => setValue("email_notifications", checked)} 
              />
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
            <div className="space-y-2">
              <Label htmlFor="office-hours">Office Hours</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="9:00 AM" 
                  {...register("office_start_time")}
                />
                <Input 
                  placeholder="5:00 PM" 
                  {...register("office_end_time")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special-zones">Special Zones</Label>
              <Textarea 
                id="special-zones" 
                placeholder="Meeting rooms, break areas, collaboration spaces..."
                rows={3}
                {...register("special_zones")}
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
              <Select 
                value={watchedValues.algorithm_type} 
                onValueChange={(value) => setValue("algorithm_type", value)}
              >
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
              <Switch 
                checked={watchedValues.auto_assign_seats || false} 
                onCheckedChange={(checked) => setValue("auto_assign_seats", checked)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-iterations">Max Optimization Iterations</Label>
              <Input 
                id="max-iterations" 
                type="number" 
                {...register("max_optimization_iterations", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraint-penalty">Constraint Violation Penalty</Label>
              <Input 
                id="constraint-penalty" 
                type="number" 
                step="0.1" 
                {...register("constraint_violation_penalty", { valueAsNumber: true })}
              />
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
                <Switch 
                  checked={watchedValues.schedule_conflict_alerts || false}
                  onCheckedChange={(checked) => setValue("schedule_conflict_alerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Team Clustering Violations</Label>
                  <p className="text-sm text-muted-foreground">Notify when teams are separated</p>
                </div>
                <Switch 
                  checked={watchedValues.team_clustering_alerts || false}
                  onCheckedChange={(checked) => setValue("team_clustering_alerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summaries</Label>
                  <p className="text-sm text-muted-foreground">Send utilization reports weekly</p>
                </div>
                <Switch 
                  checked={watchedValues.weekly_summaries || false}
                  onCheckedChange={(checked) => setValue("weekly_summaries", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Optimization Suggestions</Label>
                  <p className="text-sm text-muted-foreground">AI-powered improvement recommendations</p>
                </div>
                <Switch 
                  checked={watchedValues.optimization_suggestions || false}
                  onCheckedChange={(checked) => setValue("optimization_suggestions", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="text-xs text-muted-foreground pt-6">
          <p>
            <strong>Note:</strong> Changes to optimization algorithms and office configuration will affect future 
            schedule generations. Existing schedules remain unchanged until regenerated. Settings are automatically 
            saved and synchronized across all system components in real-time.
          </p>
        </CardContent>
      </Card>
    </form>
  );
};

export default Settings;