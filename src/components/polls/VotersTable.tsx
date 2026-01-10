import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import LetterGradeBadge from "./LetterGradeBadge";
import { POLL_CATEGORIES } from "./CategoryScoreInputs";

interface VotersTableProps {
  votes: any[];
  creatorId: string;
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

export default function VotersTable({ votes, creatorId }: VotersTableProps) {
  const [expandedVote, setExpandedVote] = useState<string | null>(null);

  // Sort votes by total score descending
  const sortedVotes = [...votes].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  if (votes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground font-cyber">No votes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-gaming">Voter</TableHead>
              <TableHead className="font-gaming">Level</TableHead>
              <TableHead className="font-gaming">Total Score</TableHead>
              <TableHead className="font-gaming">Grade</TableHead>
              <TableHead className="font-gaming">Voted</TableHead>
              <TableHead className="font-gaming w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVotes.map((vote) => {
              const isCreator = vote.userId === creatorId;
              const isExpanded = expandedVote === vote._id;
              const grade = calculateGrade(vote.totalScore);

              return (
                <>
                  <TableRow
                    key={vote._id}
                    className={`cursor-pointer ${
                      isCreator ? "bg-primary/5 border-primary/30" : ""
                    }`}
                    onClick={() =>
                      setExpandedVote(isExpanded ? null : vote._id)
                    }
                  >
                    <TableCell className="font-cyber">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={vote.user?.avatar} />
                          <AvatarFallback>
                            {vote.user?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            @{vote.user?.username || "Unknown"}
                          </p>
                          {isCreator && (
                            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                              Creator
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-cyber">
                      {vote.user?.level || 0}
                    </TableCell>
                    <TableCell className="font-gaming text-lg">
                      {vote.totalScore}/100
                    </TableCell>
                    <TableCell>
                      <LetterGradeBadge grade={grade} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-cyber">
                      {formatTimeAgo(vote.createdAt)}
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Category Breakdown */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-card/50">
                        <div className="py-4 px-2">
                          <h4 className="font-gaming text-sm mb-3">
                            Category Breakdown
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {POLL_CATEGORIES.map((cat) => (
                              <div
                                key={cat.key}
                                className="flex justify-between text-sm"
                              >
                                <span className="font-cyber text-muted-foreground">
                                  {cat.label}
                                </span>
                                <span className="font-gaming text-primary">
                                  {vote[cat.key]}/10
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedVotes.map((vote) => {
          const isCreator = vote.userId === creatorId;
          const isExpanded = expandedVote === vote._id;
          const grade = calculateGrade(vote.totalScore);

          return (
            <div
              key={vote._id}
              className={`gaming-card p-4 cursor-pointer ${
                isCreator ? "border-2 border-primary/30 bg-primary/5" : ""
              }`}
              onClick={() => setExpandedVote(isExpanded ? null : vote._id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={vote.user?.avatar} />
                    <AvatarFallback>
                      {vote.user?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-cyber font-semibold">
                      @{vote.user?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground font-cyber">
                      Level {vote.user?.level || 0} · {formatTimeAgo(vote.createdAt)}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>

              {/* Score */}
              <div className="flex justify-between items-center">
                <span className="font-cyber text-muted-foreground">
                  Total Score:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-gaming text-primary">
                    {vote.totalScore}/100
                  </span>
                  <LetterGradeBadge grade={grade} size="sm" />
                </div>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {POLL_CATEGORIES.map((cat) => (
                    <div
                      key={cat.key}
                      className="flex justify-between text-sm"
                    >
                      <span className="font-cyber text-muted-foreground">
                        {cat.label}
                      </span>
                      <span className="font-gaming text-primary">
                        {vote[cat.key]}/10
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isCreator && (
                <Badge className="mt-3 bg-primary/20 text-primary border-primary/30">
                  Creator
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
