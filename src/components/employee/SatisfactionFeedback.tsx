import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { useSatisfactionFeedback } from '@/hooks/useSatisfactionFeedback';

interface SatisfactionFeedbackProps {
  employeeId: string;
  assignmentDate: string;
  seatId: string;
  seatInfo?: any;
  onClose?: () => void;
}

const SatisfactionFeedback: React.FC<SatisfactionFeedbackProps> = ({
  employeeId,
  assignmentDate,
  seatId,
  seatInfo,
  onClose
}) => {
  const { submitFeedback, getFeedbackForAssignment, loading } = useSatisfactionFeedback(employeeId);
  const existingFeedback = getFeedbackForAssignment(assignmentDate, seatId);
  
  const [formData, setFormData] = useState({
    satisfaction_score: existingFeedback?.satisfaction_score || 5,
    comfort_rating: existingFeedback?.comfort_rating || 5,
    location_rating: existingFeedback?.location_rating || 5,
    amenities_rating: existingFeedback?.amenities_rating || 5,
    feedback_text: existingFeedback?.feedback_text || '',
    would_recommend: existingFeedback?.would_recommend ?? true
  });

  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (field: string, rating: number) => {
    setFormData(prev => ({ ...prev, [field]: rating }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitFeedback({
        employee_id: employeeId,
        assignment_date: assignmentDate,
        seat_id: seatId,
        ...formData
      });

      if (result.success && onClose) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ label, value, onChange }: { label: string; value: number; onChange: (rating: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-lg mx-auto shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Rate Your Seating Experience
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Seat {seatId} • {assignmentDate}
          {seatInfo && (
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Floor {seatInfo.floor}</Badge>
              {seatInfo.is_window && <Badge variant="outline" className="text-xs">🪟 Window</Badge>}
              {seatInfo.is_accessible && <Badge variant="outline" className="text-xs">♿ Accessible</Badge>}
              <Badge variant="outline" className="text-xs">Zone {seatInfo.zone}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Satisfaction */}
        <StarRating
          label="Overall Satisfaction"
          value={formData.satisfaction_score}
          onChange={(rating) => handleRatingChange('satisfaction_score', rating)}
        />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 gap-4">
          <StarRating
            label="Comfort"
            value={formData.comfort_rating}
            onChange={(rating) => handleRatingChange('comfort_rating', rating)}
          />
          
          <StarRating
            label="Location"
            value={formData.location_rating}
            onChange={(rating) => handleRatingChange('location_rating', rating)}
          />
          
          <StarRating
            label="Amenities & Features"
            value={formData.amenities_rating}
            onChange={(rating) => handleRatingChange('amenities_rating', rating)}
          />
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Would you recommend this seat to others?</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.would_recommend ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, would_recommend: true }))}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Yes
            </Button>
            <Button
              type="button"
              variant={!formData.would_recommend ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, would_recommend: false }))}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              No
            </Button>
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback_text" className="text-sm font-medium">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback_text"
            placeholder="Tell us more about your experience with this seat..."
            value={formData.feedback_text}
            onChange={(e) => setFormData(prev => ({ ...prev, feedback_text: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 pt-4">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex-1"
          >
            {submitting ? "Submitting..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatisfactionFeedback;