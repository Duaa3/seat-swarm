import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAYS, DayKey, Schedule, Employee } from "@/types/planner";
import React from "react";

interface CalendarViewProps {
  schedule: Schedule;
  employees: Employee[];
  teamColor: (team: string) => string; // returns className e.g., team-bg-1
  selectedDay?: DayKey;
}

const CalendarView: React.FC<CalendarViewProps> = ({ schedule, employees, teamColor, selectedDay }) => {
  const empById = React.useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle>Schedule by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-5">
          {DAYS.map((day) => (
            <div key={day} className={`rounded-lg border p-3 ${selectedDay === day ? "ring-2 ring-ring" : ""}`}>
              <h4 className="text-sm font-medium mb-2">{day}</h4>
              <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                {schedule[day]?.length ? (
                  schedule[day].map((id) => {
                    const emp = empById[id];
                    if (!emp) return null;
                    return (
                      <div key={id} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block size-2 rounded-full ${teamColor(emp.team)}`} />
                          <span className="text-sm">{emp.name}</span>
                        </div>
                        <Badge variant="secondary">{emp.team}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No one scheduled</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
