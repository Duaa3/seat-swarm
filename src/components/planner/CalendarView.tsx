import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DayKey, Schedule, LegacyEmployee } from "@/types/planner";
import { DAYS } from "@/types/planner";

interface CalendarViewProps {
  schedule: Schedule;
  employees: LegacyEmployee[];
  teamColor: (team: string) => string;
  selectedDay?: DayKey;
}

const CalendarView: React.FC<CalendarViewProps> = ({ schedule, employees, teamColor, selectedDay }) => {
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
                        className={`${teamColor(emp.team)} text-white border-0 text-xs`}
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