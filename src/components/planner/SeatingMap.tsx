import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, Seat, DayKey } from "@/types/planner";
import React from "react";

interface SeatingMapProps {
  day: DayKey;
  assignments: Record<string, string> | undefined; // employeeId -> seatId
  seats: Seat[];
  employees: Employee[];
  teamColor: (team: string) => string;
}

const floorTitle = (f: number) => (f === 1 ? "Floor 1" : "Floor 2");

const SeatingMap: React.FC<SeatingMapProps> = ({ day, assignments, seats, employees, teamColor }) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const seatById = React.useMemo(() => Object.fromEntries(seats.map((s) => [s.id, s])), [seats]);

  const floors = React.useMemo(() => Array.from(new Set(seats.map((s) => s.floor))).sort(), [seats]);

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle>Seating Map — {day}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {floors.map((f) => (
            <div key={f} className="rounded-lg border p-4">
              <div className="mb-3 text-sm font-medium">{floorTitle(f)}</div>
              <div className="relative h-[360px] rounded-lg border bg-muted/30 overflow-hidden">
                {seats.filter((s) => s.floor === f).map((s) => {
                  const empId = Object.entries(assignments ?? {}).find(([eid, sid]) => sid === s.id)?.[0];
                  const emp = empId ? empById[empId] : undefined;
                  return (
                    <div
                      key={s.id}
                      title={emp ? `${emp.name} • ${emp.team}` : s.id}
                      className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border ${emp ? teamColor(emp.team) : "bg-background"}`}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{assignments ? Object.values(assignments).filter((sid) => seatById[sid]?.floor === f).length : 0} assigned</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatingMap;
