import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import LetterGradeBadge from "./LetterGradeBadge";
import { POLL_CATEGORIES } from "./CategoryScoreInputs";

interface CreatorScoreAsideProps {
  creatorVote: any;
  creatorName: string;
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

export default function CreatorScoreAside({
  creatorVote,
  creatorName,
}: CreatorScoreAsideProps) {
  if (!creatorVote) return null;

  const creatorGrade = calculateGrade(creatorVote.totalScore);

  return (
    <aside className="gaming-card p-4 sm:p-6 border-2 border-primary/30 bg-primary/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-gaming text-primary text-lg">Creator's Score</h3>
          <p className="text-xs text-muted-foreground font-cyber">
            @{creatorName}
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          PhreshTeam
        </Badge>
      </div>

      <Separator className="mb-4" />

      {/* Category Scores */}
      <div className="space-y-2 mb-4">
        {POLL_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="flex justify-between items-center text-sm"
          >
            <span className="font-cyber text-muted-foreground">
              {cat.label}
            </span>
            <span className="font-gaming text-primary">
              {creatorVote[cat.key]}/10
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Total Score */}
      <div className="flex justify-between items-center">
        <span className="font-gaming text-foreground">Total Score</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-gaming text-primary">
            {creatorVote.totalScore}/100
          </span>
          <LetterGradeBadge grade={creatorGrade} size="md" />
        </div>
      </div>
    </aside>
  );
}
