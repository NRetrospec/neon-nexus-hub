import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Lock, TrendingUp, Trash2, Lock as LockOpen, AlertCircle, ArrowLeft } from "lucide-react";
import VoteForm from "./VoteForm";
import ResultsChart from "./ResultsChart";
import CreatorScoreAside from "./CreatorScoreAside";
import VotersTable from "./VotersTable";
import LetterGradeBadge from "./LetterGradeBadge";

interface PollDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string | null;
  userId: string;
}

export default function PollDetailsDialog({
  open,
  onOpenChange,
  pollId,
  userId,
}: PollDetailsDialogProps) {
  // Queries
  const pollDetails = useQuery(
    api.polls.getPollDetails,
    pollId ? { pollId: pollId as any } : "skip"
  );

  const hasVoted = useQuery(
    api.polls.hasUserVoted,
    pollId && userId
      ? { pollId: pollId as any, userId: userId as any }
      : "skip"
  );

  // Mutations
  const closePoll = useMutation(api.polls.closePoll);
  const reopenPoll = useMutation(api.polls.reopenPoll);
  const deletePoll = useMutation(api.polls.deletePoll);

  if (!pollDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-cyber">Loading poll...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isCreator = pollDetails.creatorId === userId;
  const creatorVote = pollDetails.votes?.find(
    (v: any) => v.userId === pollDetails.creatorId
  );

  // Handle close/reopen poll
  const handleTogglePollStatus = async () => {
    try {
      if (pollDetails.status === "open") {
        await closePoll({
          userId: userId as any,
          pollId: pollId as any,
        });
        toast.success("Poll closed successfully");
      } else {
        await reopenPoll({
          userId: userId as any,
          pollId: pollId as any,
        });
        toast.success("Poll reopened successfully");
      }
    } catch (error: any) {
      console.error("Toggle poll status error:", error);
      toast.error(error.message || "Failed to update poll status");
    }
  };

  // Handle delete poll
  const handleDeletePoll = async () => {
    if (!confirm("Are you sure you want to delete this poll? This cannot be undone.")) {
      return;
    }

    try {
      await deletePoll({
        userId: userId as any,
        pollId: pollId as any,
      });
      toast.success("Poll deleted successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Delete poll error:", error);
      toast.error(error.message || "Failed to delete poll");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Poll Image Header */}
        <div className="relative -mx-6 -mt-6 mb-4 h-48 overflow-hidden">
          {pollDetails.imageUrl ? (
            <img
              src={pollDetails.imageUrl}
              alt={pollDetails.title}
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
          <div className="absolute top-4 right-4">
            {pollDetails.status === "closed" ? (
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
        </div>

        {/* Poll Header */}
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming text-foreground">
            {pollDetails.title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-cyber">
            <span>Created by @{pollDetails.creator?.username || "Unknown"}</span>
            {pollDetails.creator?.phreshTeam && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                PhreshTeam
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Creator Actions */}
        {isCreator && (
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTogglePollStatus}
            >
              {pollDetails.status === "open" ? (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  Close Poll
                </>
              ) : (
                <>
                  <LockOpen className="h-4 w-4 mr-1" />
                  Reopen Poll
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeletePoll}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vote">Vote</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="gaming-card p-4">
              <h3 className="font-gaming text-lg mb-2">Poll Information</h3>
              <div className="space-y-2 text-sm font-cyber">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Votes:</span>
                  <span className="font-semibold">{pollDetails.voteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold capitalize">
                    {pollDetails.status}
                  </span>
                </div>
                {pollDetails.averageScores && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Community Score:
                    </span>
                    <LetterGradeBadge
                      grade={pollDetails.letterGrade}
                      score={Math.round(pollDetails.averageScores.total)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {hasVoted?.hasVoted ? (
              <div className="gaming-card p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-2 text-green-400">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-cyber">
                    You have voted on this poll. Check the Results tab!
                  </p>
                </div>
              </div>
            ) : pollDetails.status === "open" ? (
              <div className="gaming-card p-4 bg-primary/10 border-primary/30">
                <div className="flex items-center gap-2 text-primary">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-cyber">
                    This poll is open! Head to the Vote tab to submit your rating.
                  </p>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* Vote Tab */}
          <TabsContent value="vote" className="mt-4">
            <VoteForm
              pollId={pollId!}
              userId={userId}
              pollStatus={pollDetails.status}
              hasVoted={hasVoted?.hasVoted || false}
              onVoteSuccess={() => {
                // Refresh will happen automatically via Convex reactivity
              }}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6 mt-4">
            {pollDetails.voteCount > 0 ? (
              <>
                {/* Community Score */}
                <div className="text-center">
                  <h3 className="text-lg font-gaming text-foreground mb-2">
                    Community Score
                  </h3>
                  <LetterGradeBadge
                    grade={pollDetails.letterGrade}
                    score={Math.round(pollDetails.averageScores?.total || 0)}
                    size="lg"
                  />
                </div>

                <Separator />

                {/* Chart and Creator Score - Side by side on desktop, stacked on mobile */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-gaming text-foreground mb-4">
                      Category Breakdown
                    </h3>
                    <ResultsChart
                      averageScores={pollDetails.averageScores}
                      creatorScore={creatorVote}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <CreatorScoreAside
                      creatorVote={creatorVote}
                      creatorName={pollDetails.creator?.username || "Unknown"}
                    />
                  </div>
                </div>

                <Separator />

                {/* Voters Table */}
                <div>
                  <h3 className="text-lg font-gaming text-foreground mb-4">
                    All Voters ({pollDetails.voteCount})
                  </h3>
                  <VotersTable
                    votes={pollDetails.votes}
                    creatorId={pollDetails.creatorId}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-cyber">
                  No votes yet. Be the first to rate this poll!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
