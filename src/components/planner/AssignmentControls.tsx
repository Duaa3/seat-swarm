// ============= Assignment Controls Component =============

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Weights, WEIGHT_PRESETS, allTeams, allDepartments } from "@/data/mock";
import { Settings, Play, RotateCcw, Save, Upload } from "lucide-react";

interface AssignmentControlsProps {
  weights: Weights;
  onWeightsChange: (weights: Weights) => void;
  solver: "greedy" | "hungarian";
  onSolverChange: (solver: "greedy" | "hungarian") => void;
  teamClusters: string[];
  onTeamClustersChange: (teams: string[]) => void;
  deptCapacity: number;
  onDeptCapacityChange: (value: number) => void;
  maxAssignments?: number;
  onMaxAssignmentsChange: (value: number | undefined) => void;
  onAssign: () => void;
  onReset: () => void;
  onSave: () => void;
  onLoadCsv: () => void;
  loading?: boolean;
}

const AssignmentControls: React.FC<AssignmentControlsProps> = ({
  weights,
  onWeightsChange,
  solver,
  onSolverChange,
  teamClusters,
  onTeamClustersChange,
  deptCapacity,
  onDeptCapacityChange,
  maxAssignments,
  onMaxAssignmentsChange,
  onAssign,
  onReset,
  onSave,
  onLoadCsv,
  loading = false,
}) => {
  const handleTeamToggle = (team: string, checked: boolean) => {
    const newClusters = checked 
      ? [...teamClusters, team]
      : teamClusters.filter(t => t !== team);
    onTeamClustersChange(newClusters);
  };

  const handlePresetChange = (presetName: string) => {
    if (presetName && WEIGHT_PRESETS[presetName as keyof typeof WEIGHT_PRESETS]) {
      onWeightsChange(WEIGHT_PRESETS[presetName as keyof typeof WEIGHT_PRESETS]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Assignment Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Button 
              onClick={onAssign} 
              disabled={loading}
              variant="hero"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {loading ? "Assigning..." : "Assign Seats"}
            </Button>
            <Button 
              onClick={onReset} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={onSave} 
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              onClick={onLoadCsv} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Load CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weight Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weight Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a preset..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(WEIGHT_PRESETS).map(preset => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Optimization Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["w_seat_satisfaction", "Seat Satisfaction", "How much employees like their assigned seat"],
            ["w_onsite_ratio", "Onsite Preference", "Preference for employees' desired office frequency"],
            ["w_project_penalty", "Project Load Penalty", "Penalty for high project workload"],
            ["w_window", "Window Preference", "Preference for window seats"],
            ["w_accessible", "Accessibility Match", "Priority for accessibility requirements"],
            ["w_zone", "Zone Preference", "Preference for specific zones"],
          ].map(([key, label, description]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Badge variant="secondary">
                  {weights[key as keyof Weights].toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[weights[key as keyof Weights]]}
                onValueChange={(value) => 
                  onWeightsChange({ ...weights, [key]: Number(value[0].toFixed(1)) })
                }
                min={key === "w_project_penalty" ? -1 : 0}
                max={key === "w_project_penalty" ? 0 : 5}
                step={0.1}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Solver Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Algorithm Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Solver Algorithm</Label>
              <p className="text-xs text-muted-foreground">
                Greedy is faster, Hungarian finds optimal solutions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${solver === "greedy" ? "font-semibold" : "text-muted-foreground"}`}>
                Greedy
              </span>
              <Switch 
                checked={solver === "hungarian"} 
                onCheckedChange={(checked) => onSolverChange(checked ? "hungarian" : "greedy")}
              />
              <span className={`text-xs ${solver === "hungarian" ? "font-semibold" : "text-muted-foreground"}`}>
                Hungarian
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Max Assignments</Label>
              <Badge variant="outline">
                {maxAssignments || "No limit"}
              </Badge>
            </div>
            <Slider
              value={[maxAssignments || 50]}
              onValueChange={(value) => 
                onMaxAssignmentsChange(value[0] === 50 ? undefined : value[0])
              }
              min={1}
              max={50}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Constraints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Department Capacity Limit</Label>
              <Badge variant="outline">{deptCapacity}% max per day</Badge>
            </div>
            <Slider
              value={[deptCapacity]}
              onValueChange={(value) => onDeptCapacityChange(value[0])}
              min={20}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Maximum percentage of any department that can be in office on same day
            </p>
          </div>

          <div className="space-y-2">
            <Label>Team Clustering</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Teams that should be seated together
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allTeams.map(team => (
                <label key={team} className="flex items-center gap-2 p-2 rounded border">
                  <Checkbox
                    checked={teamClusters.includes(team)}
                    onCheckedChange={(checked) => handleTeamToggle(team, !!checked)}
                  />
                  <span className="text-sm">{team}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentControls;