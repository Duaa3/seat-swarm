// ============= Assignment Results Component =============

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Assignment, Employee, Seat } from "@/data/mock";
import { 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface AssignmentResultsProps {
  assignments: Assignment[];
  unassigned: string[];
  unusedSeats: string[];
  employees: Employee[];
  seats: Seat[];
  meta?: {
    solver: string;
    assigned_count: number;
    total_employees: number;
    total_seats: number;
    execution_time_ms?: number;
  };
}

const AssignmentResults: React.FC<AssignmentResultsProps> = ({
  assignments,
  unassigned,
  unusedSeats,
  employees,
  seats,
  meta,
}) => {
  const [expandedAssignment, setExpandedAssignment] = React.useState<string | null>(null);

  // Create lookup maps
  const employeeMap = React.useMemo(
    () => new Map(employees.map(emp => [emp.id, emp])),
    [employees]
  );
  
  const seatMap = React.useMemo(
    () => new Map(seats.map(seat => [seat.id, seat])),
    [seats]
  );

  // Calculate statistics
  const stats = React.useMemo(() => {
    const avgScore = assignments.length > 0 
      ? assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length 
      : 0;
    
    const utilization = (assignments.length / seats.length) * 100;
    const assignmentRate = (assignments.length / employees.length) * 100;
    
    const violations = unassigned.length > 0 || unusedSeats.length > 0;
    
    return {
      avgScore,
      utilization,
      assignmentRate,
      violations,
    };
  }, [assignments, unassigned, unusedSeats, seats.length, employees.length]);

  // Get team color class
  const getTeamColorClass = (team: string) => {
    const teams = ["Network", "CoreOps", "Design", "Sales", "Ops", "Data", "QA"];
    const index = teams.indexOf(team);
    return `team-bg-${(index % 8) + 1}`;
  };

  // Render score breakdown
  const renderScoreBreakdown = (assignment: Assignment) => {
    const { reasons } = assignment;
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span>Satisfaction:</span>
          <span className="font-mono">{(reasons.p_satisfaction * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Onsite Ratio:</span>
          <span className="font-mono">{(reasons.p_onsite_ratio * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Projects:</span>
          <span className="font-mono">{reasons.project_load}</span>
        </div>
        <div className="flex justify-between">
          <span>Window:</span>
          <span className="font-mono">{reasons.window_match ? "✓" : "✗"}</span>
        </div>
        <div className="flex justify-between">
          <span>Accessible:</span>
          <span className="font-mono">{reasons.accessible_match ? "✓" : "✗"}</span>
        </div>
        <div className="flex justify-between">
          <span>Zone:</span>
          <span className="font-mono">{reasons.zone_match ? "✓" : "✗"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <Progress value={stats.assignmentRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.assignmentRate.toFixed(1)}% of employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">optimization score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilization.toFixed(1)}%</div>
            <Progress value={stats.utilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {assignments.length}/{seats.length} seats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meta?.execution_time_ms ? `${meta.execution_time_ms.toFixed(0)}ms` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {meta?.solver || "unknown"} solver
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issues & Warnings */}
      {(unassigned.length > 0 || unusedSeats.length > 0) && (
        <Card className={unusedSeats.length > seats.length * 0.5 ? "border-blue-200 bg-blue-50/50" : "border-orange-200 bg-orange-50/50"}>
          <CardHeader>
            <CardTitle className={`text-sm flex items-center gap-2 ${unusedSeats.length > seats.length * 0.5 ? "text-blue-700" : "text-orange-700"}`}>
              {unusedSeats.length > seats.length * 0.5 ? (
                <Info className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {unusedSeats.length > seats.length * 0.5 ? "Capacity Status" : "Issues Found"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unassigned.length > 0 && (
              <div>
                <Badge variant="destructive" className="mb-2">
                  {unassigned.length} Unassigned Employees
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {unassigned.slice(0, 5).map(empId => {
                    const employee = employeeMap.get(empId);
                    return (
                      <Badge key={empId} variant="outline" className="text-xs">
                        {employee?.full_name || empId}
                      </Badge>
                    );
                  })}
                  {unassigned.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{unassigned.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {unusedSeats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={unusedSeats.length > seats.length * 0.5 ? "default" : "secondary"} className="mb-0">
                    {unusedSeats.length} Unused Seats
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({((seats.length - unusedSeats.length) / seats.length * 100).toFixed(1)}% utilization)
                  </span>
                </div>
                {unusedSeats.length > seats.length * 0.5 && (
                  <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                    💡 This is normal - having unused seats provides flexibility for growth and preferences
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {unusedSeats.slice(0, 8).map(seatId => (
                    <Badge key={seatId} variant="outline" className="text-xs">
                      {seatId}
                    </Badge>
                  ))}
                  {unusedSeats.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{unusedSeats.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignment Details
            <Badge variant="secondary">{assignments.length} assignments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {assignments
              .sort((a, b) => b.score - a.score)
              .map((assignment) => {
                const employee = employeeMap.get(assignment.employee_id);
                const seat = seatMap.get(assignment.seat_id);
                const isExpanded = expandedAssignment === assignment.employee_id;
                
                return (
                  <Collapsible 
                    key={assignment.employee_id}
                    open={isExpanded}
                    onOpenChange={(open) => 
                      setExpandedAssignment(open ? assignment.employee_id : null)
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-3 h-auto"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-4 h-4 rounded ${employee ? getTeamColorClass(employee.team) : "bg-gray-400"}`}
                          />
                          <div className="text-left">
                            <div className="font-medium">
                              {employee?.full_name || assignment.employee_id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.seat_id} • Score: {assignment.score.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pb-3">
                      <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                        {employee && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Team: {employee.team}</div>
                            <div>Department: {employee.department}</div>
                            <div>Onsite Ratio: {(employee.onsite_ratio * 100).toFixed(0)}%</div>
                            <div>Projects: {employee.project_count}</div>
                          </div>
                        )}
                        
                        {seat && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Floor: {seat.floor}</div>
                            <div>Zone: {seat.zone}</div>
                            <div className="flex items-center gap-1">
                              Window: {seat.is_window ? "✓" : "✗"}
                            </div>
                            <div className="flex items-center gap-1">
                              Accessible: {seat.is_accessible ? "✓" : "✗"}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Score Breakdown:</div>
                          {renderScoreBreakdown(assignment)}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentResults;