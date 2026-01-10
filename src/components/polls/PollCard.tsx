import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Lock } from "lucide-react";
import LetterGradeBadge from "./LetterGradeBadge";
import { motion } from "framer-motion";

interface PollCardProps {
  poll: {
    _id: string;
    title: string;
    imageUrl: string | null;
    status: "open" | "closed";
    voteCount: number;
    averageTotalScore?: number;
    creator: {
      username: string;
      phreshTeam?: boolean;
    } | null;
    createdAt: number;
  };
  onClick: () => void;
}

/**
 * Calculate letter grade from score
 */
function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Format timestamp to relative time
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function PollCard({ poll, onClick }: PollCardProps) {
  const grade = poll.averageTotalScore
    ? calculateGrade(poll.averageTotalScore)
    : "?";

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="gaming-card cursor-pointer"
      onClick={onClick}
    >
      {/* Poll Image */}
      <div className="relative h-40 overflow-hidden">
        {poll.imageUrl ? (
          <img
            src={poll.imageUrl}
            alt={poll.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/600x400/1a1a1a/888?text=No+Image";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <div className="text-6xl">🎮</div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {poll.status === "closed" ? (
            <Badge className="bg-destructive/80 text-destructive-foreground border-destructive">
              <Lock className="h-3 w-3 mr-1" />
              Closed
            </Badge>
          ) : (
            <Badge className="bg-green-500/80 text-white border-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Open
            </Badge>
          )}
        </div>

        {/* PhreshTeam Badge */}
        {poll.creator?.phreshTeam && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary/80 text-primary-foreground border-primary neon-glow">
              PhreshTeam
            </Badge>
          </div>
        )}
      </div>

      {/* Poll Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-gaming font-semibold text-foreground line-clamp-2">
          {poll.title}
        </h3>

        {/* Creator */}
        <p className="text-sm text-muted-foreground font-cyber">
          by @{poll.creator?.username || "Unknown"}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4">
            {/* Vote Count */}
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-cyber text-muted-foreground">
                {poll.voteCount} vote{poll.voteCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Time */}
            <span className="text-xs text-muted-foreground font-cyber">
              {formatTimeAgo(poll.createdAt)}
            </span>
          </div>

          {/* Grade */}
          {poll.averageTotalScore !== undefined && (
            <LetterGradeBadge
              grade={grade}
              score={Math.round(poll.averageTotalScore)}
              size="sm"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
