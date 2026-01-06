import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Play,
  Clock,
  Coins,
  Star,
  CheckCircle2,
  TrendingUp,
  Filter,
  ArrowLeft,
  Send,
  X,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

const Quests = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [questAnswers, setQuestAnswers] = useState<Record<string, string>>({});

  // Helper function to convert Google Drive links to direct image URLs
  const getDirectImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return url;

    // If already a direct UC link, return as is
    if (url.includes('drive.google.com/uc?')) {
      return url;
    }

    // Handle sharing links: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    // Handle old open links: https://drive.google.com/open?id=FILE_ID
    if (url.includes('drive.google.com/open?id=')) {
      const fileIdMatch = url.match(/id=([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    // Handle direct file links: https://drive.google.com/file/d/FILE_ID
    if (url.includes('drive.google.com/file/d/') && !url.includes('/view')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    return url;
  };

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const activeQuests = useQuery(api.quests.getActiveQuests);
  const userQuests = useQuery(
    api.quests.getUserQuests,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const startQuest = useMutation(api.quests.startQuest);
  const updateProgress = useMutation(api.quests.updateQuestProgress);
  const verifyAnswer = useMutation(api.quests.verifyQuestAnswer);
  const removeCompletedQuest = useMutation(api.quests.removeCompletedQuest);

  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-neon-green/20 text-neon-green border-neon-green/30";
      case "Medium":
        return "bg-neon-orange/20 text-neon-orange border-neon-orange/30";
      case "Hard":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getQuestStatus = (questId: Id<"quests">) => {
    if (!userQuests) return null;
    return userQuests.find((uq) => uq.questId === questId);
  };

  const handleStartQuest = async (questId: Id<"quests">, questTitle: string) => {
    if (!dbUser) return;

    try {
      await startQuest({
        userId: dbUser._id,
        questId: questId,
      });
      toast.success(`Started quest: ${questTitle}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start quest");
    }
  };

  const handleCompleteQuest = async (questId: Id<"quests">, questTitle: string) => {
    if (!dbUser) return;

    try {
      await updateProgress({
        userId: dbUser._id,
        questId: questId,
        progress: 100,
      });
      toast.success(`Completed quest: ${questTitle}! Rewards claimed!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete quest");
    }
  };

  const handleSubmitAnswer = async (questId: Id<"quests">, questTitle: string) => {
    if (!dbUser) return;

    const answer = questAnswers[questId] || "";
    if (!answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      const result = await verifyAnswer({
        userId: dbUser._id,
        questId: questId,
        answer: answer,
      });

      toast.success(`Correct! Quest "${questTitle}" completed! +${result.xp} XP, +${result.points} points!`);

      // Clear the answer input
      setQuestAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[questId];
        return newAnswers;
      });
    } catch (error: any) {
      toast.error(error.message || "Incorrect answer. Try again!");
    }
  };

  const handleRemoveQuest = async (questId: Id<"quests">, questTitle: string) => {
    if (!dbUser) return;

    try {
      await removeCompletedQuest({
        userId: dbUser._id,
        questId: questId,
      });
      toast.success(`Removed "${questTitle}" from your quest list`);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove quest");
    }
  };

  const filteredQuests =
    selectedDifficulty === "All"
      ? activeQuests
      : activeQuests?.filter((q) => q.difficulty === selectedDifficulty);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Background Effects */}
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="mb-4 font-cyber"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-gaming font-bold mb-2">
                  <span className="text-foreground">QUEST </span>
                  <span className="text-gradient">BOARD</span>
                </h1>
                <p className="text-muted-foreground font-cyber text-sm sm:text-base md:text-lg">
                  Complete challenges and earn epic rewards
                </p>
              </div>

              {/* Stats Summary */}
              <div className="flex gap-3 sm:gap-4">
                <div className="gaming-card p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-gaming font-bold text-primary">
                    {userQuests?.filter((uq) => uq.status === "completed").length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">
                    Completed
                  </div>
                </div>
                <div className="gaming-card p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-gaming font-bold text-accent">
                    {userQuests?.filter((uq) => uq.status === "in_progress").length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">
                    In Progress
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Difficulty Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-center gap-4 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <span className="text-sm font-gaming text-foreground">Filter:</span>
            </div>
            {difficulties.map((diff) => (
              <Button
                key={diff}
                variant={selectedDifficulty === diff ? "neon" : "ghost"}
                size="sm"
                onClick={() => setSelectedDifficulty(diff)}
                className="font-cyber"
              >
                {diff}
              </Button>
            ))}
          </motion.div>

          {/* Quests Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredQuests?.map((quest, index) => {
                const status = getQuestStatus(quest._id);
                const isCompleted = status?.status === "completed";
                const isInProgress = status?.status === "in_progress";

                return (
                  <motion.div
                    key={quest._id}
                    variants={itemVariants}
                    layout
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      x: -100,
                      transition: {
                        duration: 0.3,
                        ease: "easeInOut"
                      }
                    }}
                    whileHover={{ y: -8 }}
                    className={`gaming-card overflow-hidden ${
                      isCompleted ? "opacity-75" : ""
                    }`}
                  >
                    {/* Thumbnail Header */}
                    <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                      {quest.thumbnail && quest.thumbnail.startsWith('http') ? (
                        <img
                          src={getDirectImageUrl(quest.thumbnail)}
                          alt={quest.title}
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            // Check if image loaded successfully (naturalWidth > 0)
                            if (e.currentTarget.naturalWidth === 0) {
                              // Fallback to emoji if not a valid image
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-6xl">🎮</div>';
                            }
                          }}
                          onError={(e) => {
                            // Fallback for network errors
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="text-6xl">🎮</div>';
                          }}
                        />
                      ) : (
                        <div className="text-6xl">🎮</div>
                      )}
                      {isCompleted && (
                        <>
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-6 w-6 text-neon-green" />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 left-2 h-7 w-7 bg-destructive/20 hover:bg-destructive/40 text-destructive border border-destructive/30"
                            onClick={() => handleRemoveQuest(quest._id, quest.title)}
                            title="Remove from list"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <div className="absolute bottom-2 right-2">
                        <Badge
                          className={`${getDifficultyColor(
                            quest.difficulty
                          )} font-cyber text-xs`}
                        >
                          {quest.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-gaming font-semibold text-foreground mb-2">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-cyber mb-4">
                        {quest.description}
                      </p>

                      {/* Progress Bar and Question for In Progress Quests */}
                      {isInProgress && status && (
                        <div className="mb-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-cyber text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-xs font-gaming text-primary">
                                {status.progress}%
                              </span>
                            </div>
                            <Progress value={status.progress} className="h-2" />
                          </div>

                          {/* Question and Answer Input */}
                          {quest.question && (
                            <div className="space-y-2">
                              <div className="text-sm font-cyber text-foreground bg-primary/10 p-3 rounded-md border border-primary/20">
                                <span className="text-primary font-semibold">Q: </span>
                                {quest.question}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter your answer..."
                                  value={questAnswers[quest._id] || ""}
                                  onChange={(e) =>
                                    setQuestAnswers((prev) => ({
                                      ...prev,
                                      [quest._id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSubmitAnswer(quest._id, quest.title);
                                    }
                                  }}
                                  className="font-cyber text-sm"
                                />
                                <Button
                                  variant="neon"
                                  size="sm"
                                  onClick={() => handleSubmitAnswer(quest._id, quest.title)}
                                  className="font-gaming"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-cyber text-foreground">
                            {quest.reward}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent" />
                          <span className="font-cyber text-foreground">{quest.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-cyber text-muted-foreground">
                            {quest.duration}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {isCompleted ? (
                        <Button
                          variant="ghost"
                          className="w-full font-gaming"
                          disabled
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Completed
                        </Button>
                      ) : isInProgress ? (
                        // Only show Complete Quest button if there's no question
                        !quest.question ? (
                          <Button
                            variant="neon"
                            className="w-full font-gaming"
                            onClick={() => handleCompleteQuest(quest._id, quest.title)}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Complete Quest
                          </Button>
                        ) : null
                      ) : (
                        <Button
                          variant="cyber"
                          className="w-full font-gaming"
                          onClick={() => handleStartQuest(quest._id, quest.title)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Quest
                        </Button>
                      )}

                      {/* Quest Link Button */}
                      {quest.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full font-cyber mt-2"
                          onClick={() => window.open(quest.link, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Visit Quest Link
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {filteredQuests && filteredQuests.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-gaming text-foreground mb-2">
                No quests found
              </h3>
              <p className="text-muted-foreground font-cyber">
                Try a different difficulty filter
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};

export default Quests;
