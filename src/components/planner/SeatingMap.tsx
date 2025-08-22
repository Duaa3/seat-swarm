import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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

  // Define zones for each floor based on the layout in the image
  const getZoneForSeat = (seatId: string, floor: number): string => {
    const seatNum = parseInt(seatId.replace(/[^0-9]/g, ''));
    if (floor === 1) {
      if (seatNum >= 1 && seatNum <= 16) return 'ZoneA';
      if (seatNum >= 17 && seatNum <= 32) return 'ZoneB'; 
      return 'ZoneC';
    } else {
      if (seatNum >= 1 && seatNum <= 17) return 'ZoneA';
      if (seatNum >= 18 && seatNum <= 33) return 'ZoneB';
      return 'ZoneC';
    }
  };

  const getZoneColor = (zone: string): string => {
    switch (zone) {
      case 'ZoneA': return 'border-teal-300 bg-teal-50/20';
      case 'ZoneB': return 'border-gray-300 bg-gray-50/20';
      case 'ZoneC': return 'border-yellow-300 bg-yellow-50/20';
      default: return 'border-gray-300 bg-gray-50/20';
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
    const occupancyPercent = floorSeats.length > 0 ? Math.round((assignedSeats.length / floorSeats.length) * 100) : 0;

    // Arrange seats in rows for the layout
    const seatsPerRow = 8;
    const rows = [];
    for (let i = 0; i < floorSeats.length; i += seatsPerRow) {
      rows.push(floorSeats.slice(i, i + seatsPerRow));
    }

    // Group rows into zones
    const getRowZone = (rowIndex: number): string => {
      if (rowIndex < 2) return 'ZoneA';
      if (rowIndex < 4) return 'ZoneB';
      return 'ZoneC';
    };

    const zoneRows = [
      { zone: 'ZoneA', rows: rows.slice(0, 2) },
      { zone: 'ZoneB', rows: rows.slice(2, 4) },
      { zone: 'ZoneC', rows: rows.slice(4) }
    ].filter(zone => zone.rows.length > 0);

    return (
      <div key={floor} className="bg-gray-50 rounded-xl p-6 space-y-4">
        {/* Floor Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">🏢</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Floor {floor}</h3>
              <p className="text-sm text-gray-600">{floorTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">👥 {assignedSeats.length}/{floorSeats.length}</span>
            <span className="text-sm text-gray-600">{occupancyPercent}% occupied</span>
          </div>
        </div>

        {/* Seating Layout */}
        <div className="space-y-4">
          {zoneRows.map(({ zone, rows: zoneRowData }) => (
            <div key={zone} className={`rounded-xl p-4 border-2 ${getZoneColor(zone)}`}>
              <div className="space-y-3">
                {zoneRowData.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-2">
                    {row.map((seat) => {
                      const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
                      const emp = empId ? empById[empId] : null;
                      const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
                      const isWindow = windowSeats.includes(seat);
                      const isAccessible = accessibleSeats.includes(seat);
                      
                      return (
                        <div key={seat.id} className="relative flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">
                            S{seatNum.toString().padStart(2, '0')}
                          </div>
                          <div
                            className={`w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs font-medium transition-all hover:scale-105 relative ${
                              emp 
                                ? `${teamColor(emp.team)} text-white border-solid shadow-md` 
                                : "bg-white hover:bg-gray-50"
                            }`}
                            title={emp ? `${emp.name} (${emp.team})` : `Available`}
                          >
                            {emp ? emp.name.charAt(0) : ''}
                            
                            {/* Feature indicators */}
                            <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                              {isWindow && (
                                <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Window seat" />
                              )}
                              {isAccessible && (
                                <div className="w-3 h-3 bg-teal-500 rounded-full" title="Accessible seat" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Floor Statistics */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">FEATURES</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span>Window ({windowSeats.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full" />
                <span>Accessible ({accessibleSeats.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                <span>Available ({floorSeats.length - assignedSeats.length})</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-700">ZONES</h4>
            <div className="space-y-1 text-sm">
              {['ZoneA', 'ZoneB', 'ZoneC'].map((zone) => {
                const zoneSeats = floorSeats.filter(seat => getZoneForSeat(seat.id, floor) === zone);
                const zoneAssigned = assignedSeats.filter(([, seatId]) => {
                  const seat = seats.find(s => s.id === seatId);
                  return seat && getZoneForSeat(seat.id, floor) === zone;
                }).length;
                
                return (
                  <div key={zone}>
                    {zone}: {zoneAssigned}/{zoneSeats.length}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Seating Map - {day}</h2>
        <Badge variant="outline" className="text-sm">
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