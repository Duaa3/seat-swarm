import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useGlobalConstraints } from "@/hooks/useConstraints";
import { Loader2, Save, RefreshCw } from "lucide-react";

export function GlobalConstraintsForm() {
  const { constraints, loading, updateConstraints, refetch } = useGlobalConstraints();
  const [formData, setFormData] = React.useState({
    min_client_site_ratio: 0.50,
    max_client_site_ratio: 0.60,
    max_consecutive_office_days: 3,
    allow_team_splitting: false,
    floor_1_capacity: 48,
    floor_2_capacity: 50
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (constraints) {
      setFormData({
        min_client_site_ratio: constraints.min_client_site_ratio,
        max_client_site_ratio: constraints.max_client_site_ratio,
        max_consecutive_office_days: constraints.max_consecutive_office_days,
        allow_team_splitting: constraints.allow_team_splitting,
        floor_1_capacity: constraints.floor_1_capacity,
        floor_2_capacity: constraints.floor_2_capacity
      });
    }
  }, [constraints]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConstraints(formData);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading global constraints...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Global Constraints
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Site Ratios */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Client Site Ratios</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_client_ratio">Minimum Client Site Ratio</Label>
              <div className="space-y-2">
                <Slider
                  value={[formData.min_client_site_ratio]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, min_client_site_ratio: value }))}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {Math.round(formData.min_client_site_ratio * 100)}% of staff at client sites
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_client_ratio">Maximum Client Site Ratio</Label>
              <div className="space-y-2">
                <Slider
                  value={[formData.max_client_site_ratio]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, max_client_site_ratio: value }))}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {Math.round(formData.max_client_site_ratio * 100)}% of staff at client sites
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Office Constraints */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Office Constraints</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_consecutive">Max Consecutive Office Days</Label>
              <Input
                id="max_consecutive"
                type="number"
                value={formData.max_consecutive_office_days}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_consecutive_office_days: parseInt(e.target.value) || 3 
                }))}
                min={1}
                max={7}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allow_splitting">Allow Team Splitting</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_splitting"
                  checked={formData.allow_team_splitting}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    allow_team_splitting: checked 
                  }))}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.allow_team_splitting ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floor Capacities */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Floor Capacities</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor_1_capacity">Floor 1 Capacity</Label>
              <Input
                id="floor_1_capacity"
                type="number"
                value={formData.floor_1_capacity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  floor_1_capacity: parseInt(e.target.value) || 48 
                }))}
                min={1}
                max={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor_2_capacity">Floor 2 Capacity</Label>
              <Input
                id="floor_2_capacity"
                type="number"
                value={formData.floor_2_capacity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  floor_2_capacity: parseInt(e.target.value) || 50 
                }))}
                min={1}
                max={200}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Total office capacity: {formData.floor_1_capacity + formData.floor_2_capacity} seats
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Global Constraints
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}