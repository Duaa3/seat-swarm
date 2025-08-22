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

  console.log('SeatingMap Debug:', {
    day,
    assignmentsCount: Object.keys(assignments || {}).length,
    assignments: assignments,
    seatsCount: seats.length,
    employeesCount: employees.length,
    floors
  });

  const renderFloor = (floor: number) => {
    const floorSeats = seats.filter((s) => s.floor === floor);
    const assignedSeats = Object.entries(assignments || {}).filter(([, seatId]) => {
      const seat = seats.find(s => s.id === seatId);
      return seat?.floor === floor;
    });

    console.log(`Floor ${floor} Debug:`, {
      floorSeatsCount: floorSeats.length,
      assignedSeatsCount: assignedSeats.length,
      sampleFloorSeats: floorSeats.slice(0, 3),
      sampleAssignments: assignedSeats.slice(0, 3)
    });

    return (
      <Card key={floor} className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {floorTitle(floor)}
            <Badge variant="outline">{assignedSeats.length}/{floorSeats.length} occupied</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2 min-h-[200px]">
            {floorSeats.map((seat) => {
              const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
              const emp = empId ? empById[empId] : null;
              
              const seatLabel = seat.id.includes('-') ? seat.id.split("-")[1] || seat.id.slice(-2) : seat.id.slice(-2);
              
              return (
                <div
                  key={seat.id}
                  className={`aspect-square rounded-lg border-2 p-1 text-xs flex items-center justify-center text-center transition-all hover:scale-105 ${
                    emp 
                      ? `${teamColor(emp.team)} text-white border-transparent shadow-md` 
                      : "bg-muted border-border hover:bg-muted/80"
                  }`}
                  title={emp ? `${emp.name} (${emp.team}) - Seat ${seatLabel}` : `Seat ${seatLabel} - Available`}
                >
                  {emp ? emp.name.split(" ")[0] : seatLabel}
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
      
      {floors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">No seating data available</div>
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(assignments || {}).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">No seat assignments for {day}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {floors.map(renderFloor)}
        </div>
      )}
    </div>
  );
};

export default SeatingMap;