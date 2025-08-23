import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DayKey, LegacyEmployee, LegacySeat } from "@/types/planner";
import { MapPin, Users, Star, Eye, ExternalLink, UserCheck } from "lucide-react";

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
      case 'ZoneA': return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20';
      case 'ZoneB': return 'bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20';
      case 'ZoneC': return 'bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20';
      default: return 'bg-gradient-to-br from-muted/5 to-muted/10 border-border/20';
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
      <Card key={floor} className="shadow-glow border-primary/10 overflow-hidden">
        {/* Floor Header */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">F{floor}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {occupancyPercent}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Floor {floor}</h3>
                <p className="text-sm text-muted-foreground font-medium">{floorTitle}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Occupied: {assignedCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-border rounded-full"></div>
                    <span>Available: {totalSeats - assignedCount}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                <div className="text-2xl font-bold text-foreground">{assignedCount}<span className="text-muted-foreground text-lg">/{totalSeats}</span></div>
                <p className="text-xs text-muted-foreground">seats assigned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Grid Layout */}
        <div className="p-6 bg-gradient-to-br from-background to-muted/20">
          {/* Zone-based organization */}
          <div className="space-y-6">
            {['ZoneA', 'ZoneB', 'ZoneC'].map((zoneName) => {
              const zoneSeats = floorSeats.filter(seat => getZoneForSeat(seat.id, floor) === zoneName);
              if (zoneSeats.length === 0) return null;
              
              const zoneAssigned = zoneSeats.filter(seat => 
                Object.values(assignments || {}).includes(seat.id)
              ).length;

              return (
                <div key={zoneName} className={`rounded-2xl border-2 border-dashed p-4 ${getZoneColor(zoneName)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50">
                        <span className="text-sm font-semibold text-foreground">{zoneName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {zoneAssigned}/{zoneSeats.length} occupied
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Seats in this zone */}
                  <div className="grid grid-cols-8 gap-3">
                    {zoneSeats.map((seat) => {
                      const empId = Object.keys(assignments || {}).find((eid) => assignments[eid] === seat.id);
                      const emp = empId ? empById[empId] : null;
                      const seatNum = parseInt(seat.id.replace(/[^0-9]/g, ''));
                      const isWindow = windowSeats.includes(seat);
                      const isAccessible = accessibleSeats.includes(seat);
                      
                      return (
                        <TooltipProvider key={seat.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="group relative">
                                <div className="text-center mb-1">
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {seatNum.toString().padStart(2, '0')}
                                  </span>
                                </div>
                                <div
                                  className={`relative w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 cursor-pointer ${
                                    emp 
                                      ? `${teamColor(emp.team)} text-white border-white/30 shadow-lg hover:shadow-xl hover:scale-105 seat-occupied` 
                                      : "bg-gradient-to-br from-background to-muted/40 border-border/50 hover:from-muted/60 hover:to-muted/20 hover:border-primary/30 seat-available"
                                  }`}
                                >
                                  {emp ? (
                                    <div className="text-center">
                                      <div className="text-sm font-bold">{emp.name.charAt(0).toUpperCase()}</div>
                                      <div className="text-[8px] opacity-80 font-medium">{emp.team.slice(0, 3).toUpperCase()}</div>
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg border-2 border-dashed border-current opacity-30"></div>
                                  )}
                                  
                                  {/* Enhanced feature indicators */}
                                  <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                                    {isWindow && (
                                      <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full border-2 border-white shadow-md flex items-center justify-center" title="Window seat">
                                        <ExternalLink className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                    {isAccessible && (
                                      <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center" title="Accessible seat">
                                        <UserCheck className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm p-4 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg">
                              <div className="space-y-3">
                                {/* Seat Info */}
                                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <div>
                                    <div className="font-semibold text-foreground">Seat {seatNum.toString().padStart(2, '0')}</div>
                                    <div className="text-xs text-muted-foreground">Floor {floor} • {zoneName}</div>
                                  </div>
                                </div>

                                {/* Employee Info */}
                                {emp ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-accent" />
                                      <div>
                                        <div className="font-medium text-foreground">{emp.name}</div>
                                        <div className="text-xs text-muted-foreground">{emp.team} Team</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Star className="w-3 h-3 text-yellow-500" />
                                      <span className="text-xs text-muted-foreground">Assignment Score: 8.5/10</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <div className="text-sm font-medium text-muted-foreground">Available Seat</div>
                                    <div className="text-xs text-muted-foreground">Click to assign employee</div>
                                  </div>
                                )}

                                {/* Features */}
                                {(isWindow || isAccessible) && (
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</div>
                                    <div className="flex gap-2">
                                      {isWindow && (
                                        <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          Window View
                                        </Badge>
                                      )}
                                      {isAccessible && (
                                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                          <UserCheck className="w-3 h-3 mr-1" />
                                          Accessible
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Floor Statistics */}
        <div className="px-6 pb-6 bg-gradient-to-r from-muted/20 to-transparent">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🪟</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Window Seats</div>
                  <div className="text-xs text-muted-foreground">{windowSeats.length} available</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">♿</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Accessible</div>
                  <div className="text-xs text-muted-foreground">{accessibleSeats.length} available</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted-foreground rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">📍</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Available</div>
                  <div className="text-xs text-muted-foreground">{totalSeats - assignedCount} seats</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">🗺️</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Seating Map
            </h2>
            <p className="text-muted-foreground">Visual layout for {day}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="px-4 py-2 text-sm bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            📊 {Object.keys(assignments || {}).length} total assignments
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
            🏢 {floors.length} floors
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm bg-gradient-to-r from-secondary/5 to-secondary/10 border-secondary/20">
            👥 {employees.length} employees
          </Badge>
        </div>
      </div>
      
      {floors.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">No seating data available</h3>
                <p className="text-muted-foreground">Upload seat data to visualize the office layout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {floors.map(renderFloor)}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default SeatingMap;