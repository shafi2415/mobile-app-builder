import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRateLimit } from "@/hooks/useRateLimit";
import { feedbackSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";

interface FeedbackFormProps {
  complaintId: string;
  onSuccess?: () => void;
}

export const FeedbackForm = ({ complaintId, onSuccess }: FeedbackFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { checkRateLimit, incrementAttempts } = useRateLimit("feedback");

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Check rate limit
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      toast.error(`Too many feedback submissions. Please wait ${rateCheck.remainingTime} minutes.`);
      return;
    }

    // Validate feedback
    const result = feedbackSchema.safeParse({
      rating,
      comment: comment.trim() || undefined,
      is_anonymous: isAnonymous,
    });

    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Please fix the form errors");
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedComment = comment.trim() ? sanitizeText(comment.trim()) : null;
      
      const { error } = await supabase.from("complaint_feedback").insert({
        complaint_id: complaintId,
        user_id: user.id,
        rating,
        comment: sanitizedComment,
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      incrementAttempts();
      toast.success("Thank you for your feedback!");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">Rate Your Experience</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How satisfied are you with the resolution of your complaint?
        </p>

        <div className="flex gap-2 mb-4">
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            return (
              <button
                key={index}
                type="button"
                className="transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(starValue)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(starValue)}
              >
                <Star
                  className={`h-8 w-8 ${
                    starValue <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Additional Comments (Optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the support experience..."
          rows={4}
          maxLength={500}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
        />
        <Label
          htmlFor="anonymous"
          className="text-sm font-normal cursor-pointer"
        >
          Submit feedback anonymously (your name will be hidden from admins)
        </Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};