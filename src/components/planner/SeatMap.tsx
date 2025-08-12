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

  // Enhanced team color mapping with consistent assignment
  const getTeamColorClass = (team: string) => {
    const teamMapping: Record<string, string> = {
      "Network": "team-bg-1",
      "CoreOps": "team-bg-2", 
      "Design": "team-bg-3",
      "Sales": "team-bg-4",
      "Ops": "team-bg-5",
      "Data": "team-bg-6",
      "QA": "team-bg-7",
    };
    return teamMapping[team] || "team-bg-8";
  };

  // Calculate grid dimensions for each floor
  const getGridDimensions = (floorSeats: Seat[]) => {
    const maxX = Math.max(...floorSeats.map(s => s.x));
    const maxY = Math.max(...floorSeats.map(s => s.y));
    return { cols: maxX, rows: maxY };
  };

  // Enhanced seat rendering with better visual feedback
  const renderSeat = (seat: Seat) => {
    const assignment = assignmentMap.get(seat.seat_id);
    const employee = assignment ? employeeMap.get(assignment.employee_id) : null;
    
    const baseClasses = "relative w-14 h-14 rounded-xl border-2 cursor-pointer overflow-hidden";
    const interactionClasses = assignment ? "seat-occupied" : "seat-available";
    const teamClasses = assignment 
      ? `${employee ? getTeamColorClass(employee.team) : "bg-gradient-primary"} border-white/20 text-white shadow-lg` 
      : "bg-gradient-to-br from-muted to-muted/60 border-border/40 hover:from-muted/80 hover:to-muted/40";
    
    const specialClasses = [
      seat.is_window ? "ring-2 ring-amber-400/60" : "",
      seat.is_accessible ? "ring-2 ring-emerald-400/60" : "",
      assignment && assignment.score > 8 ? "ring-2 ring-white/40" : "",
    ].filter(Boolean).join(" ");

    const seatClasses = `${baseClasses} ${interactionClasses} ${teamClasses} ${specialClasses}`;

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
            {/* Seat ID Badge */}
            {showLabels && (
              <div className="absolute -top-1 -left-1 bg-background/90 text-foreground text-[8px] font-mono px-1 py-0.5 rounded border">
                {seat.seat_id.split('-')[1]}
              </div>
            )}
            
            {/* Center content */}
            <div className="flex flex-col items-center justify-center h-full p-1">
              {assignment && employee ? (
                <>
                  <div className="text-[9px] font-semibold leading-tight text-center truncate w-full">
                    {employee.full_name.split(' ')[0]}
                  </div>
                  <div className="text-[7px] opacity-90 font-medium">
                    ★ {assignment.score.toFixed(1)}
                  </div>
                  <div className="text-[6px] opacity-75 uppercase tracking-wider">
                    {employee.team.slice(0, 3)}
                  </div>
                </>
              ) : assignment ? (
                <div className="text-[8px] font-semibold">
                  {assignment.employee_id.slice(0, 4)}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-current opacity-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                </div>
              )}
            </div>

            {/* Enhanced feature indicators */}
            <div className="absolute top-1 right-1 flex flex-col gap-0.5">
              {seat.is_window && (
                <div className="w-2 h-2 bg-amber-400 rounded-full shadow-sm border border-amber-300" title="Window seat"></div>
              )}
              {seat.is_accessible && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm border border-emerald-300" title="Accessible"></div>
              )}
            </div>

            {/* High score indicator */}
            {assignment && assignment.score > 8.5 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                <div className="text-[6px] text-white font-bold">★</div>
              </div>
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

  // Enhanced floor rendering with better organization and stats
  const renderFloor = (floor: number, floorSeats: Seat[]) => {
    const { cols, rows } = getGridDimensions(floorSeats);
    const assignedCount = floorSeats.filter(s => assignmentMap.has(s.seat_id)).length;
    const utilization = Math.round((assignedCount / floorSeats.length) * 100);
    const averageScore = floorSeats
      .map(s => assignmentMap.get(s.seat_id)?.score)
      .filter(Boolean)
      .reduce((sum, score, _, arr) => sum + (score || 0) / arr.length, 0);
    
    return (
      <Card key={floor} className="shadow-glow border-primary/10">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Floor {floor}</div>
                <div className="text-xs text-muted-foreground">
                  {floor === 1 ? "Main workspace" : "Executive & meetings"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-3 w-3" />
                <span className="font-medium">{assignedCount}/{floorSeats.length}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {utilization}% occupied
                {averageScore > 0 && ` • ★${averageScore.toFixed(1)} avg`}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div 
            className="grid gap-2 p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {floorSeats.map(renderSeat)}
          </div>
          
          {/* Enhanced floor legend with stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-amber-400 rounded-full shadow-sm"></div>
                  <span>Window ({floorSeats.filter(s => s.is_window).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
                  <span>Accessible ({floorSeats.filter(s => s.is_accessible).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-muted border border-border rounded"></div>
                  <span>Available ({floorSeats.length - assignedCount})</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zones</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["ZoneA", "ZoneB", "ZoneC"].map(zone => {
                  const zoneSeats = floorSeats.filter(s => s.zone === zone);
                  const zoneAssigned = zoneSeats.filter(s => assignmentMap.has(s.seat_id)).length;
                  return (
                    <Badge key={zone} variant="outline" className="text-xs">
                      {zone}: {zoneAssigned}/{zoneSeats.length}
                    </Badge>
                  );
                })}
              </div>
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