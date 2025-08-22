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
    
    // Fix: Count unique seat assignments for this floor only
    const floorSeatIds = new Set(floorSeats.map(s => s.id));
    const assignedSeats = Object.entries(assignments || {}).filter(([, seatId]) => 
      floorSeatIds.has(seatId)
    );

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
    const totalSeats = floorSeats.length;
    const assignedCount = assignedSeats.length;
    const occupancyPercent = totalSeats > 0 ? Math.round((assignedCount / totalSeats) * 100) : 0;

    // Create a grid of seats (10 seats per row for better layout)
    const seatsPerRow = 10;
    const seatGrid = [];
    for (let i = 0; i < floorSeats.length; i += seatsPerRow) {
      seatGrid.push(floorSeats.slice(i, i + seatsPerRow));
    }

    return (
      <div key={floor} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Floor Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <span className="text-violet-600 font-bold text-lg">🏢</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Floor {floor}</h3>
                <p className="text-sm text-gray-500">{floorTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg font-bold text-gray-900">👥 {assignedCount}/{totalSeats}</span>
              </div>
              <p className="text-xs text-gray-500">{occupancyPercent}% occupied</p>
            </div>
          </div>
        </div>

        {/* Seating Grid */}
        <div className="p-6">
          <div className="space-y-4">
            {seatGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-3 flex-wrap">
                {row.map((seat) => {
                  const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
                  const emp = empId ? empById[empId] : null;
                  const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
                  const isWindow = windowSeats.includes(seat);
                  const isAccessible = accessibleSeats.includes(seat);
                  const zone = getZoneForSeat(seat.id, floor);
                  
                  return (
                    <div key={seat.id} className="relative">
                      <div className="text-center mb-1">
                        <span className="text-xs font-medium text-gray-400">
                          S{seatNum.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div
                        className={`relative w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center font-bold text-sm transition-all hover:scale-105 cursor-pointer ${
                          emp 
                            ? `${teamColor(emp.team)} text-white border-solid shadow-lg transform hover:shadow-xl` 
                            : "bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                        }`}
                        title={emp ? `${emp.name} (${emp.team}) - ${zone}` : `Available - ${zone}`}
                      >
                        {emp ? emp.name.charAt(0).toUpperCase() : ''}
                        
                        {/* Feature indicators */}
                        <div className="absolute -top-1.5 -right-1.5 flex flex-col gap-1">
                          {isWindow && (
                            <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm" title="Window seat" />
                          )}
                          {isAccessible && (
                            <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Accessible seat" />
                          )}
                        </div>
                      </div>
                      
                      {/* Zone indicator */}
                      <div className="text-center mt-1">
                        <span className="text-xs text-gray-400">{zone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Floor Statistics */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700 uppercase tracking-wide">Features</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                    <span>Window</span>
                  </div>
                  <span className="text-sm font-medium">{windowSeats.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                    <span>Accessible</span>
                  </div>
                  <span className="text-sm font-medium">{accessibleSeats.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-gray-300 rounded-full" />
                    <span>Available</span>
                  </div>
                  <span className="text-sm font-medium">{totalSeats - assignedCount}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700 uppercase tracking-wide">Zones</h4>
              <div className="space-y-2">
                {['ZoneA', 'ZoneB', 'ZoneC'].map((zone) => {
                  const zoneSeats = floorSeats.filter(seat => getZoneForSeat(seat.id, floor) === zone);
                  const zoneAssigned = assignedSeats.filter(([, seatId]) => {
                    const seat = seats.find(s => s.id === seatId);
                    return seat && getZoneForSeat(seat.id, floor) === zone;
                  }).length;
                  
                  return (
                    <div key={zone} className="flex items-center justify-between text-sm">
                      <span>{zone}</span>
                      <span className="font-medium">{zoneAssigned}/{zoneSeats.length}</span>
                    </div>
                  );
                })}
              </div>
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
        <div className="text-center py-8 text-muted-foreground">
          No seating data available
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {floors.map(renderFloor)}
        </div>
      )}
    </div>
  );
};

export default SeatingMap;