import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DayKey, Schedule, LegacyEmployee } from "@/types/planner";
import { DAYS } from "@/types/planner";
import { toast } from "@/hooks/use-toast";
import { GripVertical, ArrowRight } from "lucide-react";

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
    "Support": "team-bg-8",
    // Legacy teams - map to existing colors
    "Security": "team-bg-1",
    "DevOps": "team-bg-2",
    "Product": "team-bg-3",
  };
  return teamMapping[team] || "team-bg-8";
};

interface DragDropCalendarProps {
  schedule: Schedule;
  employees: LegacyEmployee[];
  selectedDay?: DayKey;
  onScheduleChange: (newSchedule: Schedule) => void;
  readOnly?: boolean;
}

const DragDropCalendar: React.FC<DragDropCalendarProps> = ({ 
  schedule, 
  employees, 
  selectedDay,
  onScheduleChange,
  readOnly = false
}) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const [draggedEmployee, setDraggedEmployee] = React.useState<string | null>(null);
  const [draggedFromDay, setDraggedFromDay] = React.useState<DayKey | null>(null);

  const handleDragStart = (e: React.DragEvent, empId: string, fromDay: DayKey) => {
    if (readOnly) return;
    
    setDraggedEmployee(empId);
    setDraggedFromDay(fromDay);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', empId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toDay: DayKey) => {
    if (readOnly) return;
    
    e.preventDefault();
    const empId = e.dataTransfer.getData('text/plain');
    
    if (!empId || !draggedFromDay || draggedFromDay === toDay) {
      setDraggedEmployee(null);
      setDraggedFromDay(null);
      return;
    }

    // Create new schedule with employee moved
    const newSchedule = { ...schedule };
    
    // Remove from source day
    newSchedule[draggedFromDay] = newSchedule[draggedFromDay].filter(id => id !== empId);
    
    // Add to target day (avoid duplicates)
    if (!newSchedule[toDay].includes(empId)) {
      newSchedule[toDay] = [...newSchedule[toDay], empId];
    }

    onScheduleChange(newSchedule);
    
    const employee = empById[empId];
    toast({
      title: "Employee Moved",
      description: `${employee?.name || empId} moved from ${draggedFromDay} to ${toDay}`,
    });

    setDraggedEmployee(null);
    setDraggedFromDay(null);
  };

  const moveEmployeeToUnscheduled = (empId: string, fromDay: DayKey) => {
    if (readOnly) return;
    
    const newSchedule = { ...schedule };
    newSchedule[fromDay] = newSchedule[fromDay].filter(id => id !== empId);
    onScheduleChange(newSchedule);
    
    const employee = empById[empId];
    toast({
      title: "Employee Unscheduled",
      description: `${employee?.name || empId} removed from ${fromDay}`,
    });
  };

  // Get unscheduled employees
  const scheduledIds = new Set(DAYS.flatMap(day => schedule[day] || []));
  const unscheduledEmployees = employees.filter(emp => !scheduledIds.has(emp.id));

  const addEmployeeToDay = (empId: string, day: DayKey) => {
    if (readOnly) return;
    
    const newSchedule = { ...schedule };
    if (!newSchedule[day].includes(empId)) {
      newSchedule[day] = [...newSchedule[day], empId];
      onScheduleChange(newSchedule);
      
      const employee = empById[empId];
      toast({
        title: "Employee Scheduled",
        description: `${employee?.name || empId} added to ${day}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Interactive Schedule Editor
            {readOnly && <Badge variant="secondary">Read Only</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const employeeIds = schedule[day] || [];
            const isSelected = selectedDay === day;
            const isDragTarget = draggedEmployee && draggedFromDay !== day;
            
            return (
              <div 
                key={day} 
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : isDragTarget
                    ? "border-dashed border-green-400 bg-green-50/50"
                    : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isSelected ? "text-primary" : ""}`}>{day}</h3>
                  <Badge variant={isSelected ? "default" : "secondary"}>
                    {employeeIds.length} scheduled
                  </Badge>
                </div>
                
                {employeeIds.length === 0 ? (
                  <div className="h-16 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      {readOnly ? "No employees scheduled" : "Drop employees here or click + to add"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {employeeIds.map((empId) => {
                      const emp = empById[empId];
                      if (!emp) return null;
                      
                      return (
                        <div
                          key={empId}
                          draggable={!readOnly}
                          onDragStart={(e) => handleDragStart(e, empId, day)}
                          className={`group relative ${getTeamColorClass(emp.team)} border-0 text-xs hover:scale-105 transition-all shadow-sm rounded-lg px-3 py-2 ${
                            !readOnly ? 'cursor-move' : 'cursor-default'
                          } ${draggedEmployee === empId ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            {!readOnly && <GripVertical className="h-3 w-3 opacity-60" />}
                            <span className="font-medium">{emp.name}</span>
                            {!readOnly && (
                              <button
                                onClick={() => moveEmployeeToUnscheduled(empId, day)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-white/80 hover:text-white"
                                title="Remove from schedule"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Unscheduled Employees */}
      {unscheduledEmployees.length > 0 && !readOnly && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                {unscheduledEmployees.length}
              </Badge>
              Unscheduled Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unscheduledEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getTeamColorClass(emp.team)}`}></div>
                    <span className="text-sm font-medium">{emp.name}</span>
                    <Badge variant="outline" className="text-xs">{emp.team}</Badge>
                  </div>
                  <div className="flex gap-1">
                    {DAYS.map((day) => (
                      <Button
                        key={day}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-8 text-xs p-0"
                        onClick={() => addEmployeeToDay(emp.id, day)}
                        title={`Add to ${day}`}
                      >
                        {day[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {!readOnly && (
        <Card className="bg-blue-50/30 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span>Drag employees between days</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <span>Click × to unschedule</span>
              <ArrowRight className="h-4 w-4" />
              <span>Click day letters to add unscheduled employees</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DragDropCalendar;