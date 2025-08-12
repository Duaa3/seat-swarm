import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DayKey, LegacyEmployee, LegacySeat } from "@/types/planner";

interface SeatingMapProps {
  day: DayKey;
  assignments: Record<string, string>;
  seats: LegacySeat[];
  employees: LegacyEmployee[];
  teamColor: (team: string) => string;
}

const floorTitle = (f: number) => (f === 1 ? "Floor 1" : "Floor 2");

const SeatingMap: React.FC<SeatingMapProps> = ({ day, assignments, seats, employees, teamColor }) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const seatById = React.useMemo(() => Object.fromEntries(seats.map((s) => [s.id, s])), [seats]);

  const floors = React.useMemo(() => Array.from(new Set(seats.map((s) => s.floor))).sort(), [seats]);

  const renderFloor = (floor: number) => {
    const floorSeats = seats.filter((s) => s.floor === floor);
    const assignedSeats = Object.entries(assignments || {}).filter(([, seatId]) => seatById[seatId]?.floor === floor);

    return (
      <Card key={floor} className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {floorTitle(floor)}
            <Badge variant="outline">{assignedSeats.length}/{floorSeats.length} occupied</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {floorSeats.map((seat) => {
              const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
              const emp = empId ? empById[empId] : null;
              
              return (
                <div
                  key={seat.id}
                  className={`aspect-square rounded border-2 p-1 text-xs flex items-center justify-center text-center ${
                    emp 
                      ? `${teamColor(emp.team)} text-white border-transparent` 
                      : "bg-muted border-border hover:bg-muted/80"
                  }`}
                  title={emp ? `${emp.name} (${emp.team})` : `Seat ${seat.id}`}
                >
                  {emp ? emp.name.split(" ")[0] : seat.id.split("-")[1]}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Seating Map - {day}</h2>
        <Badge variant="outline">
          {Object.keys(assignments || {}).length} total assignments
        </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {floors.map(renderFloor)}
      </div>
    </div>
  );
};

export default SeatingMap;