import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAYS, DayKey } from "@/types/planner";
import { allTeams } from "@/data/mock";
import React from "react";

export type Weights = {
  seatSatisfaction: number;
  onsite: number;
  projectPenalty: number;
  zone: number;
};

interface PlannerControlsProps {
  dayCaps: Record<DayKey, number>;
  onDayCapChange: (day: DayKey, value: number) => void;
  deptCap: number;
  onDeptCapChange: (value: number) => void;
  clusterTeams: string[];
  onClusterTeamsChange: (teams: string[]) => void;
  solver: "greedy" | "hungarian";
  onSolverChange: (solver: "greedy" | "hungarian") => void;
  weights: Weights;
  onWeightsChange: (w: Weights) => void;
  onGenerate: () => void;
  onAssignDay: () => void;
  selectedDay: DayKey;
  onSelectedDayChange: (d: DayKey) => void;
}

const percent = (v: number) => `${v}%`;

const PlannerControls: React.FC<PlannerControlsProps> = ({
  dayCaps,
  onDayCapChange,
  deptCap,
  onDeptCapChange,
  clusterTeams,
  onClusterTeamsChange,
  solver,
  onSolverChange,
  weights,
  onWeightsChange,
  onGenerate,
  onAssignDay,
  selectedDay,
  onSelectedDayChange,
}) => {
  const handleTeamToggle = (team: string, checked: boolean) => {
    const next = new Set(clusterTeams);
    if (checked) next.add(team);
    else next.delete(team);
    onClusterTeamsChange(Array.from(next));
  };

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle>Planner Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Capacity per day</h3>
            <span className="text-xs text-muted-foreground">Max % of seats</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {DAYS.map((d) => (
              <div key={d} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`cap-${d}`}>{d}</Label>
                  <span className="text-sm text-muted-foreground">{percent(dayCaps[d])}</span>
                </div>
                <Slider id={`cap-${d}`} value={[dayCaps[d]]} onValueChange={(v) => onDayCapChange(d, v[0])} min={10} max={100} step={5} />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dept-cap">Department cap</Label>
              <span className="text-sm text-muted-foreground">{percent(deptCap)}</span>
            </div>
            <Slider id="dept-cap" value={[deptCap]} onValueChange={(v) => onDeptCapChange(v[0])} min={20} max={100} step={5} />
            <p className="text-xs text-muted-foreground">No more than {deptCap}% of a department on the same day.</p>
          </div>

          <div className="space-y-2">
            <Label>Solver</Label>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${solver === "greedy" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Greedy</span>
              <Switch checked={solver === "hungarian"} onCheckedChange={(c) => onSolverChange(c ? "hungarian" : "greedy")} />
              <span className={`text-xs ${solver === "hungarian" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Hungarian</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <Label>Team clusters</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allTeams.map((t) => (
              <label key={t} className="flex items-center gap-2 rounded-md border p-2">
                <Checkbox
                  checked={clusterTeams.includes(t)}
                  onCheckedChange={(c) => handleTeamToggle(t, Boolean(c))}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Label>Weights</Label>
          {(
            [
              ["seatSatisfaction", "Seat satisfaction"],
              ["onsite", "Onsite preference"],
              ["projectPenalty", "Project penalty"],
              ["zone", "Zone preference"],
            ] as [keyof Weights, string][]
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{weights[key].toFixed(1)}</span>
              </div>
              <Slider
                value={[weights[key]]}
                onValueChange={(v) => onWeightsChange({ ...weights, [key]: Number(v[0].toFixed(1)) })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Active day</Label>
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <Button key={d} variant={selectedDay === d ? "default" : "outline"} size="sm" onClick={() => onSelectedDayChange(d)}>
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-end gap-3">
            <Button variant="hero" onClick={onGenerate}>Generate Schedule</Button>
            <Button variant="secondary" onClick={onAssignDay}>Assign Seats for Selected Day</Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default PlannerControls;
