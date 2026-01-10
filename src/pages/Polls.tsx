import { useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lock, Plus, TrendingUp, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import PollCard from "@/components/polls/PollCard";
import CreatePollDialog from "@/components/polls/CreatePollDialog";
import PollDetailsDialog from "@/components/polls/PollDetailsDialog";

export default function Polls() {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Get current user from database
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Check PhreshTeam access
  const hasPhreshTeamAccess = useQuery(
    api.polls.hasPhreshTeamAccess,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // Fetch polls
  const allPolls = useQuery(api.polls.getAllPolls);
  const userPolls = useQuery(
    api.polls.getUserPolls,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const votedPolls = useQuery(
    api.polls.getUserVotedPolls,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // Filter polls by status
  const openPolls = useMemo(() => {
    return allPolls?.filter((poll) => poll.status === "open") || [];
  }, [allPolls]);

  const closedPolls = useMemo(() => {
    return allPolls?.filter((poll) => poll.status === "closed") || [];
  }, [allPolls]);

  // Current polls to display based on active tab
  const currentPolls = useMemo(() => {
    switch (activeTab) {
      case "open":
        return openPolls;
      case "closed":
        return closedPolls;
      case "my-polls":
        return userPolls || [];
      case "my-votes":
        return votedPolls || [];
      default:
        return allPolls || [];
    }
  }, [activeTab, openPolls, closedPolls, allPolls, userPolls, votedPolls]);

  // Loading state
  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-cyber">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="animated-gradient fixed inset-0 opacity-30" />
      <div className="cyber-grid fixed inset-0 opacity-20" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/home')}
            className="gap-2 hover:bg-primary/10 neon-border"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-gaming">Back to Home</span>
          </Button>
        </motion.div>

        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-gaming font-bold text-primary neon-text mb-2"
          >
            Game Polls & Ratings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground font-cyber"
          >
            Rate games and see what the community thinks
          </motion.p>
        </div>

        {/* Create Poll Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          {hasPhreshTeamAccess ? (
            <Button
              variant="neon"
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Poll
            </Button>
          ) : (
            <div className="gaming-card p-6 border-2 border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Lock className="h-6 w-6" />
                <div>
                  <p className="font-cyber font-semibold text-foreground">
                    PhreshTeam Members Only
                  </p>
                  <p className="text-sm font-cyber">
                    Only PhreshTeam members can create polls
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="gaming-card p-4 text-center">
            <p className="text-2xl font-gaming text-primary">
              {allPolls?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground font-cyber">
              Total Polls
            </p>
          </div>
          <div className="gaming-card p-4 text-center">
            <p className="text-2xl font-gaming text-green-400">
              {openPolls.length}
            </p>
            <p className="text-sm text-muted-foreground font-cyber">
              Open Polls
            </p>
          </div>
          <div className="gaming-card p-4 text-center">
            <p className="text-2xl font-gaming text-accent">
              {userPolls?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground font-cyber">
              My Polls
            </p>
          </div>
          <div className="gaming-card p-4 text-center">
            <p className="text-2xl font-gaming text-foreground">
              {votedPolls?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground font-cyber">
              My Votes
            </p>
          </div>
        </motion.div>

        {/* Polls Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
              <TabsTrigger value="all">All Polls</TabsTrigger>
              <TabsTrigger value="open">
                <TrendingUp className="h-4 w-4 mr-1" />
                Open
              </TabsTrigger>
              <TabsTrigger value="closed">
                <Lock className="h-4 w-4 mr-1" />
                Closed
              </TabsTrigger>
              <TabsTrigger value="my-polls">My Polls</TabsTrigger>
              <TabsTrigger value="my-votes">My Votes</TabsTrigger>
            </TabsList>

            {/* All Tabs Content */}
            <TabsContent value={activeTab}>
              {currentPolls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPolls.map((poll, index) => (
                    <motion.div
                      key={poll._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PollCard
                        poll={poll}
                        onClick={() => setSelectedPollId(poll._id)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-gaming text-foreground mb-2">
                    No Polls Found
                  </h3>
                  <p className="text-muted-foreground font-cyber">
                    {activeTab === "my-polls" &&
                      "You haven't created any polls yet"}
                    {activeTab === "my-votes" &&
                      "You haven't voted on any polls yet"}
                    {activeTab === "open" && "No open polls at the moment"}
                    {activeTab === "closed" && "No closed polls"}
                    {activeTab === "all" && "No polls available"}
                  </p>
                  {hasPhreshTeamAccess && activeTab === "my-polls" && (
                    <Button
                      variant="neon"
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Poll
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Dialogs */}
      <CreatePollDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={dbUser._id}
      />

      <PollDetailsDialog
        open={selectedPollId !== null}
        onOpenChange={(open) => !open && setSelectedPollId(null)}
        pollId={selectedPollId}
        userId={dbUser._id}
      />
    </div>
  );
}
