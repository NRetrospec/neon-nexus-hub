import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Lock, CheckCircle } from "lucide-react";
import CategoryScoreInputs, { POLL_CATEGORIES } from "./CategoryScoreInputs";
import LetterGradeBadge from "./LetterGradeBadge";

interface VoteFormProps {
  pollId: string;
  userId: string;
  pollStatus: "open" | "closed";
  hasVoted: boolean;
  onVoteSuccess?: () => void;
}

/**
 * Calculate letter grade from total score
 */
function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export default function VoteForm({
  pollId,
  userId,
  pollStatus,
  hasVoted,
  onVoteSuccess,
}: VoteFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    POLL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.key]: 0 }), {})
  );
  const [submitting, setSubmitting] = useState(false);

  const submitVote = useMutation(api.polls.submitVote);

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const letterGrade = calculateGrade(totalScore);

  // Handle score change
  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  // Handle submission
  const handleSubmit = async () => {
    if (totalScore === 0) {
      toast.error("Please rate at least one category");
      return;
    }

    try {
      setSubmitting(true);

      await submitVote({
        userId: userId as any,
        pollId: pollId as any,
        categoryGraphics: scores.categoryGraphics,
        categoryGameplay: scores.categoryGameplay,
        categoryFun: scores.categoryFun,
        categoryStory: scores.categoryStory,
        categorySound: scores.categorySound,
        categoryPerformance: scores.categoryPerformance,
        categoryInnovation: scores.categoryInnovation,
        categoryContent: scores.categoryContent,
        categoryUI: scores.categoryUI,
        categoryWorld: scores.categoryWorld,
      });

      toast.success("Vote submitted successfully!");

      // Call success callback
      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error: any) {
      console.error("Submit vote error:", error);
      toast.error(error.message || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  // Show closed message
  if (pollStatus === "closed") {
    return (
      <div className="text-center py-12">
        <Lock className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h3 className="text-xl font-gaming text-foreground mb-2">
          Poll Closed
        </h3>
        <p className="text-muted-foreground font-cyber">
          This poll is no longer accepting votes
        </p>
      </div>
    );
  }

  // Show already voted message
  if (hasVoted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-gaming text-foreground mb-2">
          Already Voted
        </h3>
        <p className="text-muted-foreground font-cyber">
          You have already submitted your vote for this poll
        </p>
        <p className="text-sm text-muted-foreground font-cyber mt-2">
          Check the Results tab to see the community ratings
        </p>
      </div>
    );
  }

  // Show voting form
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-gaming text-foreground mb-2">
          Submit Your Rating
        </h3>
        <p className="text-sm text-muted-foreground font-cyber">
          Rate each category from 0-10 based on your experience
        </p>
      </div>

      <Separator />

      {/* Total Score Display */}
      <div className="flex justify-between items-center p-4 bg-card border border-border rounded-lg">
        <span className="font-cyber text-foreground">Your Total Score:</span>
        <LetterGradeBadge grade={letterGrade} score={totalScore} size="md" />
      </div>

      {/* Category Inputs */}
      <CategoryScoreInputs
        scores={scores}
        onChange={handleScoreChange}
        disabled={submitting}
      />

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          variant="neon"
          onClick={handleSubmit}
          disabled={submitting || totalScore === 0}
          className="w-full sm:w-auto"
        >
          {submitting ? "Submitting..." : "Submit Vote"}
        </Button>
      </div>
    </div>
  );
}
