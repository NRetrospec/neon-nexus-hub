import { Badge } from "@/components/ui/badge";

interface LetterGradeBadgeProps {
  grade: string;
  score?: number;
  size?: "sm" | "md" | "lg";
}

/**
 * Get color classes based on letter grade
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-green-500/20 text-green-400 border-green-400/30";
    case "B":
      return "bg-primary/20 text-primary border-primary/30";
    case "C":
      return "bg-orange-500/20 text-orange-400 border-orange-400/30";
    case "D":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "F":
      return "bg-destructive/40 text-destructive border-destructive";
    default:
      return "bg-muted/20 text-muted-foreground border-muted/30";
  }
}

export default function LetterGradeBadge({
  grade,
  score,
  size = "md",
}: LetterGradeBadgeProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-lg px-3 py-1",
    lg: "text-3xl px-4 py-2",
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`font-gaming ${getGradeColor(grade)} ${sizeClasses[size]}`}
      >
        {grade}
      </Badge>
      {score !== undefined && (
        <span className="text-sm text-muted-foreground font-cyber">
          ({score}/100)
        </span>
      )}
    </div>
  );
}
