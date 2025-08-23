import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeamConstraints } from "@/hooks/useConstraints";
import { useEmployees } from "@/hooks/useEmployees";
import { Loader2, Plus, Edit, Trash2, Users } from "lucide-react";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function TeamConstraintsManager() {
  const { constraints, loading, createConstraints, updateConstraints, deleteConstraints } = useTeamConstraints();
  const { employees } = useEmployees();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingConstraint, setEditingConstraint] = React.useState<any>(null);

  const availableTeams = [...new Set(employees.map(emp => emp.team))];

  const [formData, setFormData] = React.useState({
    team_name: '',
    prefer_same_floor: true,
    prefer_adjacent_seats: true,
    preferred_days: [] as string[],
    min_copresence_ratio: 0.8,
    max_members_per_day: undefined as number | undefined
  });

  const resetForm = () => {
    setFormData({
      team_name: '',
      prefer_same_floor: true,
      prefer_adjacent_seats: true,
      preferred_days: [],
      min_copresence_ratio: 0.8,
      max_members_per_day: undefined
    });
    setEditingConstraint(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingConstraint) {
        await updateConstraints(editingConstraint.id, formData);
      } else {
        await createConstraints(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEdit = (constraint: any) => {
    setEditingConstraint(constraint);
    setFormData({
      team_name: constraint.team_name,
      prefer_same_floor: constraint.prefer_same_floor,
      prefer_adjacent_seats: constraint.prefer_adjacent_seats,
      preferred_days: constraint.preferred_days || [],
      min_copresence_ratio: constraint.min_copresence_ratio,
      max_members_per_day: constraint.max_members_per_day
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team constraint?')) {
      await deleteConstraints(id);
    }
  };

  const getTeamMemberCount = (teamName: string) => {
    return employees.filter(emp => emp.team === teamName).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading team constraints...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Constraints
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Constraint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConstraint ? 'Edit Team Constraint' : 'Create Team Constraint'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="team_name">Team</Label>
                  <Select 
                    value={formData.team_name} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, team_name: value }))}
                    disabled={!!editingConstraint}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map(team => (
                        <SelectItem key={team} value={team}>
                          {team} ({getTeamMemberCount(team)} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prefer Same Floor</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.prefer_same_floor}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          prefer_same_floor: checked 
                        }))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.prefer_same_floor ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prefer Adjacent Seats</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.prefer_adjacent_seats}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          prefer_adjacent_seats: checked 
                        }))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.prefer_adjacent_seats ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <Button
                        key={day}
                        type="button"
                        variant={formData.preferred_days.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            preferred_days: prev.preferred_days.includes(day)
                              ? prev.preferred_days.filter(d => d !== day)
                              : [...prev.preferred_days, day]
                          }));
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Co-presence Ratio</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[formData.min_copresence_ratio]}
                      onValueChange={([value]) => setFormData(prev => ({ 
                        ...prev, 
                        min_copresence_ratio: value 
                      }))}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground">
                      {Math.round(formData.min_copresence_ratio * 100)}% of team members should be in office together
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_members">Max Members Per Day (Optional)</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={formData.max_members_per_day || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_members_per_day: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="No limit"
                    min={1}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.team_name}>
                    {editingConstraint ? 'Update' : 'Create'} Constraint
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {constraints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No team constraints configured. Add constraints to control team seating preferences.
          </div>
        ) : (
          <div className="space-y-4">
            {constraints.map(constraint => (
              <div key={constraint.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-medium">{constraint.team_name}</h3>
                    <Badge variant="secondary">
                      {getTeamMemberCount(constraint.team_name)} members
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(constraint)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(constraint.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Same Floor:</span>
                    <div className="font-medium">
                      {constraint.prefer_same_floor ? 'Preferred' : 'No preference'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Adjacent Seats:</span>
                    <div className="font-medium">
                      {constraint.prefer_adjacent_seats ? 'Preferred' : 'No preference'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Co-presence:</span>
                    <div className="font-medium">
                      {Math.round(constraint.min_copresence_ratio * 100)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Per Day:</span>
                    <div className="font-medium">
                      {constraint.max_members_per_day || 'No limit'}
                    </div>
                  </div>
                </div>

                {constraint.preferred_days && constraint.preferred_days.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Preferred Days:</span>
                    <div className="flex gap-1 mt-1">
                      {constraint.preferred_days.map(day => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}