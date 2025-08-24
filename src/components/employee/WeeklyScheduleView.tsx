import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle2, Star, MessageSquare } from "lucide-react";
import { DayKey, DAYS } from "@/types/planner";
import SatisfactionFeedback from './SatisfactionFeedback';
import { useSatisfactionFeedback } from '@/hooks/useSatisfactionFeedback';

interface WeeklyScheduleViewProps {
  employeeId: string;
  employeeSchedule: Record<DayKey, { scheduled: boolean; seatId?: string; seatInfo?: any }>;
  employeeName: string;
}

const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  employeeId,
  employeeSchedule,
  employeeName
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<{
    date: string;
    seatId: string;
    seatInfo?: any;
  } | null>(null);
  
  const { getFeedbackForAssignment } = useSatisfactionFeedback(employeeId);

  const getCurrentWeekStart = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    return weekStart;
  };

  const getDateForDay = (day: DayKey) => {
    const weekStart = getCurrentWeekStart();
    const dayIndex = DAYS.indexOf(day);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  };

  const getSeatFeatures = (seatInfo: any) => {
    const features = [];
    if (seatInfo?.is_window) features.push({ icon: "🪟", label: "Window" });
    if (seatInfo?.is_accessible) features.push({ icon: "♿", label: "Accessible" });
    if (seatInfo?.zone) features.push({ icon: "📍", label: seatInfo.zone });
    return features;
  };

  const getFeedbackSummary = (assignmentDate: string, seatId: string) => {
    const feedback = getFeedbackForAssignment(assignmentDate, seatId);
    if (!feedback) return null;

    return {
      score: feedback.satisfaction_score,
      hasText: !!feedback.feedback_text,
      wouldRecommend: feedback.would_recommend
    };
  };

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Weekly Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your seating assignments for this week • Click on assigned seats to rate your experience
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {DAYS.map(day => {
            const dayData = employeeSchedule[day];
            const features = dayData.seatInfo ? getSeatFeatures(dayData.seatInfo) : [];
            const assignmentDate = getDateForDay(day);
            const feedbackSummary = dayData.seatId ? getFeedbackSummary(assignmentDate, dayData.seatId) : null;
            
            return (
              <div 
                key={day} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  dayData.scheduled 
                    ? dayData.seatId 
                      ? "border-green-200 bg-green-50/30 hover:bg-green-50/50" 
                      : "border-yellow-200 bg-yellow-50/30"
                    : "border-gray-200 bg-gray-50/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{day}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(assignmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {dayData.scheduled ? (
                        dayData.seatId ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    {dayData.scheduled && (
                      <Badge variant={dayData.seatId ? "default" : "secondary"}>
                        {dayData.seatId ? "Seat Assigned" : "Pending Assignment"}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Feedback Summary */}
                    {feedbackSummary && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${feedbackSummary.score >= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{feedbackSummary.score}/5</span>
                        </div>
                        {feedbackSummary.hasText && (
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    )}

                    {/* Seat Information */}
                    {dayData.seatId && (
                      <div className="text-right">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Seat {dayData.seatId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Floor {dayData.seatInfo?.floor || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {dayData.scheduled && (
                  <div className="mt-3">
                    {dayData.seatId ? (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature.icon} {feature.label}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Rate Experience Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant={feedbackSummary ? "outline" : "default"}
                              size="sm"
                              className="gap-2"
                            >
                              <Star className="w-4 h-4" />
                              {feedbackSummary ? "Update Rating" : "Rate Experience"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <SatisfactionFeedback
                              employeeId={employeeId}
                              assignmentDate={assignmentDate}
                              seatId={dayData.seatId}
                              seatInfo={dayData.seatInfo}
                              onClose={() => setSelectedFeedback(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-700">
                        You're scheduled for office but seat assignment is pending
                      </p>
                    )}
                  </div>
                )}
                
                {!dayData.scheduled && (
                  <p className="text-sm text-gray-600 mt-2">
                    Working remotely today
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Week Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">This Week Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Office Days:</span>
              <div className="font-semibold">{Object.values(employeeSchedule).filter(d => d.scheduled).length}/5</div>
            </div>
            <div>
              <span className="text-muted-foreground">Seats Assigned:</span>
              <div className="font-semibold">{Object.values(employeeSchedule).filter(d => d.seatId).length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Window Seats:</span>
              <div className="font-semibold">{Object.values(employeeSchedule).filter(d => d.seatInfo?.is_window).length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Accessibility:</span>
              <div className="font-semibold">{Object.values(employeeSchedule).filter(d => d.seatInfo?.is_accessible).length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyScheduleView;