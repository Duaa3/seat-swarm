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

const SeatingMap: React.FC<SeatingMapProps> = ({ day, assignments, seats, employees, teamColor }) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  
  const floors = React.useMemo(() => Array.from(new Set(seats.map((s) => s.floor))).sort(), [seats]);

  // Define zones for each floor
  const getZoneForSeat = (seatId: string, floor: number): string => {
    const seatNum = parseInt(seatId.replace(/[^0-9]/g, ''));
    if (floor === 1) {
      if (seatNum >= 1 && seatNum <= 16) return 'A';
      if (seatNum >= 17 && seatNum <= 32) return 'B'; 
      return 'C';
    } else {
      if (seatNum >= 1 && seatNum <= 20) return 'A';
      if (seatNum >= 21 && seatNum <= 40) return 'B';
      return 'C';
    }
  };

  const getZoneColor = (zone: string): string => {
    switch (zone) {
      case 'A': return 'border-teal-400 bg-teal-50/50';
      case 'B': return 'border-orange-400 bg-orange-50/50';
      case 'C': return 'border-yellow-400 bg-yellow-50/50';
      default: return 'border-gray-300 bg-gray-50/50';
    }
  };

  const renderFloor = (floor: number) => {
    const floorSeats = seats.filter((s) => s.floor === floor).sort((a, b) => {
      const aNum = parseInt(a.id.replace(/[^0-9]/g, ''));
      const bNum = parseInt(b.id.replace(/[^0-9]/g, ''));
      return aNum - bNum;
    });
    
    const assignedSeats = Object.entries(assignments || {}).filter(([, seatId]) => {
      const seat = seats.find(s => s.id === seatId);
      return seat?.floor === floor;
    });

    // Group seats by zones
    const zones = ['A', 'B', 'C'];
    const seatsByZone = zones.map(zone => ({
      zone,
      seats: floorSeats.filter(seat => getZoneForSeat(seat.id, floor) === zone),
      color: getZoneColor(zone)
    }));

    // Calculate features
    const windowSeats = floorSeats.filter(seat => {
      const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
      return seatNum % 8 === 0 || seatNum % 8 === 1; // End seats are windows
    });
    
    const accessibleSeats = floorSeats.filter(seat => {
      const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
      return seatNum % 10 === 2; // Every 10th seat starting at 2
    });

    const floorTitle = floor === 1 ? "Main workspace" : "Executive & meetings";

    return (
      <Card key={floor} className="p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold">■</span>
              </div>
              <div>
                <CardTitle className="text-xl">FLOOR {floor}</CardTitle>
                <p className="text-sm text-muted-foreground">{floorTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{assignedSeats.length}/{floorSeats.length}</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((assignedSeats.length / floorSeats.length) * 100)}% occupied
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {seatsByZone.map(({ zone, seats: zoneSeats, color }) => (
            <div key={zone} className={`rounded-lg border-2 p-4 ${color}`}>
              <div className="grid grid-cols-8 gap-3">
                {zoneSeats.map((seat) => {
                  const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
                  const emp = empId ? empById[empId] : null;
                  const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
                  const isWindow = windowSeats.includes(seat);
                  const isAccessible = accessibleSeats.includes(seat);
                  
                  return (
                    <div key={seat.id} className="relative">
                      <div
                        className={`w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${
                          emp 
                            ? `${teamColor(emp.team)} text-white border-solid shadow-md` 
                            : "bg-white hover:bg-gray-50"
                        }`}
                        title={emp ? `${emp.name} (${emp.team}) - S${seatNum.toString().padStart(2, '0')}` : `S${seatNum.toString().padStart(2, '0')} - Available`}
                      >
                        {emp ? emp.name.charAt(0) : seatNum}
                      </div>
                      
                      {/* Feature indicators */}
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                        {isWindow && (
                          <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Window seat" />
                        )}
                        {isAccessible && (
                          <div className="w-3 h-3 bg-green-500 rounded-full" title="Accessible seat" />
                        )}
                      </div>
                      
                      {/* Seat number label */}
                      <div className="text-center text-xs text-gray-500 mt-1">
                        S{seatNum.toString().padStart(2, '0')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Floor Features & Zones Legend */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
            <div>
              <h4 className="font-semibold text-sm mb-2">FEATURES</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span>Window ({windowSeats.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Accessible ({accessibleSeats.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span>Available ({floorSeats.length - assignedSeats.length})</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">ZONES</h4>
              <div className="space-y-1 text-sm">
                {seatsByZone.map(({ zone, seats: zoneSeats }) => {
                  const zoneAssigned = assignedSeats.filter(([, seatId]) => {
                    const seat = seats.find(s => s.id === seatId);
                    return seat && getZoneForSeat(seat.id, floor) === zone;
                  }).length;
                  
                  return (
                    <div key={zone}>
                      Zone {zone}: {zoneAssigned}/{zoneSeats.length}
                    </div>
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