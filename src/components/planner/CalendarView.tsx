import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DayKey, Schedule, LegacyEmployee } from "@/types/planner";
import { DAYS } from "@/types/planner";

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
    "Security": "team-bg-8",
    "DevOps": "team-bg-1",
    "Product": "team-bg-2",
    "Support": "team-bg-3",
  };
  return teamMapping[team] || "team-bg-8";
};

interface CalendarViewProps {
  schedule: Schedule;
  employees: LegacyEmployee[];
  selectedDay?: DayKey;
}

const CalendarView: React.FC<CalendarViewProps> = ({ schedule, employees, selectedDay }) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle>Schedule by Day</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const employeeIds = schedule[day] || [];
          const isSelected = selectedDay === day;
          return (
            <div key={day} className={`p-4 rounded-lg border ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isSelected ? "text-primary" : ""}`}>{day}</h3>
                <Badge variant={isSelected ? "default" : "secondary"}>
                  {employeeIds.length} scheduled
                </Badge>
              </div>
              
              {employeeIds.length === 0 ? (
                <p className="text-muted-foreground text-sm">No employees scheduled</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {employeeIds.map((empId) => {
                    const emp = empById[empId];
                    if (!emp) return null;
                    return (
                      <Badge
                        key={empId}
                        variant="secondary"
                        className={`${getTeamColorClass(emp.team)} text-white border-0 text-xs hover:scale-105 transition-transform shadow-sm`}
                      >
                        {emp.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CalendarView;