// ============= Enhanced Seating Map Component =============

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Employee, Seat, Assignment } from "@/data/mock";
import { Building, Users, MapPin, Eye, EyeOff } from "lucide-react";

interface SeatMapProps {
  seats: Seat[];
  assignments: Assignment[];
  employees: Employee[];
  onSeatClick?: (seat: Seat) => void;
  showGrid?: boolean;
  showLabels?: boolean;
}

const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  assignments,
  employees,
  onSeatClick,
  showGrid = true,
  showLabels = true,
}) => {
  // Create lookup maps for efficiency
  const employeeMap = React.useMemo(
    () => new Map(employees.map(emp => [emp.employee_id, emp])),
    [employees]
  );
  
  const assignmentMap = React.useMemo(
    () => new Map(assignments.map(assign => [assign.seat_id, assign])),
    [assignments]
  );

  // Group seats by floor for organization
  const seatsByFloor = React.useMemo(
    () => seats.reduce((acc, seat) => {
      acc[seat.floor] = acc[seat.floor] || [];
      acc[seat.floor].push(seat);
      return acc;
    }, {} as Record<number, Seat[]>),
    [seats]
  );

  // Get team color class
  const getTeamColorClass = (team: string) => {
    const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
    const index = teams.indexOf(team);
    return `team-bg-${(index % 8) + 1}`;
  };

  // Calculate grid dimensions for each floor
  const getGridDimensions = (floorSeats: Seat[]) => {
    const maxX = Math.max(...floorSeats.map(s => s.x));
    const maxY = Math.max(...floorSeats.map(s => s.y));
    return { cols: maxX, rows: maxY };
  };

  // Render individual seat
  const renderSeat = (seat: Seat) => {
    const assignment = assignmentMap.get(seat.seat_id);
    const employee = assignment ? employeeMap.get(assignment.employee_id) : null;
    
    const seatClasses = [
      "relative w-12 h-12 rounded-lg border-2 transition-all duration-200 cursor-pointer",
      "hover:scale-110 hover:shadow-md",
      assignment 
        ? `${employee ? getTeamColorClass(employee.team) : "bg-primary"} border-primary-foreground text-white` 
        : "bg-muted border-border hover:bg-muted/80",
      seat.is_window ? "ring-2 ring-yellow-400/50" : "",
      seat.is_accessible ? "ring-2 ring-blue-400/50" : "",
    ].join(" ");

    return (
      <Tooltip key={seat.seat_id}>
        <TooltipTrigger asChild>
          <div
            className={seatClasses}
            onClick={() => onSeatClick?.(seat)}
            style={{
              gridColumn: seat.x,
              gridRow: seat.y,
            }}
          >
            {/* Seat ID */}
            {showLabels && (
              <div className="absolute top-0 left-0 text-[8px] font-mono opacity-70 p-0.5">
                {seat.seat_id.split('-')[1]}
              </div>
            )}
            
            {/* Center content */}
            <div className="flex items-center justify-center h-full">
              {assignment ? (
                <div className="text-center">
                  <div className="text-[10px] font-semibold truncate">
                    {employee?.full_name.split(' ')[0] || assignment.employee_id}
                  </div>
                  <div className="text-[8px] opacity-80">
                    {assignment.score.toFixed(1)}
                  </div>
                </div>
              ) : (
                <div className="w-6 h-6 rounded border border-current opacity-40" />
              )}
            </div>

            {/* Accessibility indicator */}
            {seat.is_accessible && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            
            {/* Window indicator */}
            {seat.is_window && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold">{seat.seat_id}</div>
            <div className="text-sm">Zone: {seat.zone}</div>
            <div className="text-xs flex gap-2">
              {seat.is_window && <Badge variant="secondary" className="text-xs">Window</Badge>}
              {seat.is_accessible && <Badge variant="secondary" className="text-xs">Accessible</Badge>}
            </div>
            {assignment && employee && (
              <div className="border-t pt-1 mt-1">
                <div className="font-medium">{employee.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {employee.team} • {employee.department}
                </div>
                <div className="text-xs">Score: {assignment.score.toFixed(2)}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Render floor grid
  const renderFloor = (floor: number, floorSeats: Seat[]) => {
    const { cols, rows } = getGridDimensions(floorSeats);
    const assignedCount = floorSeats.filter(s => assignmentMap.has(s.seat_id)).length;
    
    return (
      <Card key={floor} className="shadow-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Floor {floor}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              {assignedCount}/{floorSeats.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="grid gap-1 p-4 bg-muted/20 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {floorSeats.map(renderSeat)}
          </div>
          
          {/* Floor legend */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Window</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Accessible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted border border-border rounded"></div>
              <span>Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Seating Layout</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {assignments.length} assigned of {seats.length} seats
          </Badge>
        </div>
      </div>

      {/* Floor grids */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(seatsByFloor)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([floor, floorSeats]) => renderFloor(Number(floor), floorSeats))}
      </div>

      {/* Zone summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Zone Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {["ZoneA", "ZoneB", "ZoneC"].map(zone => {
              const zoneSeats = seats.filter(s => s.zone === zone);
              const zoneAssigned = zoneSeats.filter(s => assignmentMap.has(s.seat_id)).length;
              return (
                <div key={zone} className="text-center">
                  <div className="text-lg font-semibold">{zoneAssigned}/{zoneSeats.length}</div>
                  <div className="text-xs text-muted-foreground">{zone}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatMap;