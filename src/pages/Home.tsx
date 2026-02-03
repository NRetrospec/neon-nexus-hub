import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XPProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Skeleton,
} from "@/components/ui/skeleton";
import {
  Trophy,
  Target,
  Zap,
  Star,
  ArrowRight,
  Flame,
  Crown,
  Play,
  TrendingUp,
  ChevronUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Id } from "../../convex/_generated/dataModel";

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);
  const userStats = useQuery(
    api.users.getUserStats,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // Get user's rank
  const userRank = useQuery(
    api.leaderboard.getUserRank,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  // Get user's quests (for in-progress detection)
  const userQuests = useQuery(
    api.quests.getUserQuests,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const topPlayers = useQuery(api.leaderboard.getTopPlayers, { limit: 5 });
  const activeQuests = useQuery(api.quests.getActiveQuests);

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

  // Helper to render avatar (emoji or image)
  const renderAvatar = (avatar: string | undefined, size: "small" | "medium" | "large" = "medium") => {
    if (!avatar) return "🎮";
    const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");
    if (isUrl) {
      const sizeClasses = {
        small: "w-8 h-8",
        medium: "w-12 h-12",
        large: "w-16 h-16"
      };
      return (
        <img
          src={avatar}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-lg object-cover`}
        />
      );
    }
    const textSizes = { small: "text-xl", medium: "text-3xl", large: "text-4xl" };
    return <span className={textSizes[size]}>{avatar}</span>;
  };

  useEffect(() => {
    if (user && !dbUser) {
      createUser({
        clerkId: user.id,
        username: user.username || user.firstName || "Player",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl || "🎮",
      });
    }
  }, [user, dbUser, createUser]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // Get in-progress quests
  const inProgressQuests = userQuests?.filter(uq => uq.status === "in_progress") || [];
  const continueQuest = inProgressQuests[0];

  // Get recommended quest (first available quest user hasn't started)
  const startedQuestIds = userQuests?.map(uq => uq.questId) || [];
  const recommendedQuest = activeQuests?.find(q => !startedQuestIds.includes(q._id));

  // Calculate XP to next level
  const currentXP = (userStats?.xp || 0) % 1000;
  const xpToNextLevel = 1000 - currentXP;
  const isNearLevelUp = currentXP >= 800;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        {/* Background Effects */}
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-5 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ==================== PROGRESSION HUB ==================== */}
            <motion.div
              variants={itemVariants}
              className="gaming-card p-4 sm:p-6"
            >
              {!userStats ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-6" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-48 h-3" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + Level */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-card border-2 border-yellow-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_20px_hsl(45_100%_50%/0.15)]">
                        {renderAvatar(userStats.avatar, "large")}
                      </div>
                      {/* Level Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-950 text-xs font-gaming font-bold px-1.5 py-0.5 rounded-md shadow-lg">
                        {userStats.level}
                      </div>
                    </div>

                    {/* Name + Rank */}
                    <div className="sm:hidden">
                      <h1 className="text-xl font-gaming font-bold text-foreground">
                        {user?.firstName || user?.username || "Player"}
                      </h1>
                      {userRank && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-cyber">
                          <span>Rank</span>
                          <span className="text-primary font-bold">#{userRank.rank}</span>
                          <ChevronUp className="h-3 w-3 text-neon-green" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* XP Progress Section */}
                  <div className="flex-1 space-y-2">
                    {/* Top Row: Name + Rank (desktop) + Stats */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="hidden sm:flex items-center gap-3">
                        <h1 className="text-xl font-gaming font-bold text-foreground">
                          {user?.firstName || user?.username || "Player"}
                        </h1>
                        {userRank && (
                          <Badge variant="outline" className="font-cyber text-xs gap-1">
                            <Crown className="h-3 w-3 text-yellow-400" />
                            Rank #{userRank.rank}
                            <ChevronUp className="h-3 w-3 text-neon-green" />
                          </Badge>
                        )}
                      </div>

                      {/* Momentum Stats */}
                      <div className="flex items-center gap-3 text-xs font-cyber">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          <span>5-day streak</span>
                        </div>
                        {isNearLevelUp && (
                          <Badge variant="glow" className="text-[10px] gap-1 animate-pulse">
                            <Sparkles className="h-3 w-3" />
                            {xpToNextLevel} XP to level up!
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* XP Bar */}
                    <XPProgress
                      currentXP={currentXP}
                      xpForNextLevel={1000}
                      currentLevel={userStats.level}
                      showLabels={true}
                    />

                    {/* Bottom Stats Row */}
                    <div className="flex items-center gap-4 text-xs font-cyber text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-foreground font-medium">{userStats.xp.toLocaleString()}</span> total XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-accent" />
                        <span className="text-foreground font-medium">{userStats.points.toLocaleString()}</span> points
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-neon-blue" />
                        <span className="text-foreground font-medium">{userStats.completedQuestsCount}/{userStats.totalAvailableQuests}</span> quests
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ==================== SMART ACTIONS ==================== */}
            <motion.div variants={itemVariants}>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Continue Quest */}
                <div
                  onClick={() => continueQuest ? navigate("/quests") : null}
                  className={`gaming-card p-4 ${continueQuest ? 'cursor-pointer group' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="text-xs font-cyber uppercase tracking-wider text-muted-foreground">
                      {continueQuest ? "Continue Quest" : "No Quest In Progress"}
                    </span>
                  </div>

                  {continueQuest && continueQuest.quest ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                          {continueQuest.quest.thumbnail?.startsWith('http') ? (
                            <img
                              src={getDirectImageUrl(continueQuest.quest.thumbnail)}
                              alt={continueQuest.quest.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">{continueQuest.quest.thumbnail || '🎮'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-gaming font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {continueQuest.quest.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-cyber">
                            <span>+{continueQuest.quest.xp} XP</span>
                            <span>•</span>
                            <span>{continueQuest.quest.reward} pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-cyber">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary font-medium">{continueQuest.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                            style={{ width: `${continueQuest.progress}%` }}
                          />
                        </div>
                      </div>

                      <Button variant="default" size="sm" className="w-full gap-2">
                        Resume
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground font-cyber mb-3">
                        Start a quest to track your progress
                      </p>
                      <Button variant="secondary" size="sm" onClick={() => navigate("/quests")}>
                        Browse Quests
                      </Button>
                    </div>
                  )}
                </div>

                {/* Recommended Quest */}
                <div
                  onClick={() => recommendedQuest ? navigate("/quests") : null}
                  className={`gaming-card p-4 ${recommendedQuest ? 'cursor-pointer group' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-cyber uppercase tracking-wider text-muted-foreground">
                      Recommended
                    </span>
                    {recommendedQuest && (
                      <Badge variant="success" className="text-[10px] ml-auto">New</Badge>
                    )}
                  </div>

                  {recommendedQuest ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                          {recommendedQuest.thumbnail?.startsWith('http') ? (
                            <img
                              src={getDirectImageUrl(recommendedQuest.thumbnail)}
                              alt={recommendedQuest.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">{recommendedQuest.thumbnail || '🎮'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-gaming font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {recommendedQuest.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-cyber">
                            <span>+{recommendedQuest.xp} XP</span>
                            <span>•</span>
                            <span>{recommendedQuest.reward} pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Quest Info */}
                      <div className="flex items-center gap-3 text-xs font-cyber">
                        <Badge
                          variant={
                            recommendedQuest.difficulty === "Easy" ? "success" :
                            recommendedQuest.difficulty === "Medium" ? "warning" : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {recommendedQuest.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {recommendedQuest.duration}
                        </span>
                      </div>

                      <Button variant="default" size="sm" className="w-full gap-2">
                        Start Quest
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground font-cyber">
                        All quests completed!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ==================== STATS + LEADERBOARD ==================== */}
            <motion.div variants={itemVariants}>
              <div className="grid lg:grid-cols-5 gap-4">
                {/* Your Stats - Compact */}
                <div className="lg:col-span-2 gaming-card p-4">
                  <h3 className="text-sm font-gaming font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Your Progress
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Completed Quests */}
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-gaming font-bold text-neon-blue">
                        {userStats?.completedQuestsCount || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-cyber uppercase">
                        Completed
                      </div>
                    </div>

                    {/* In Progress */}
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-gaming font-bold text-accent">
                        {inProgressQuests.length}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-cyber uppercase">
                        In Progress
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-gaming font-bold text-yellow-400">
                        {userStats?.badges?.length || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-cyber uppercase">
                        Badges
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Snapshot */}
                <div className="lg:col-span-3 gaming-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-gaming font-semibold text-foreground flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      Leaderboard
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/leaderboard")}
                      className="text-xs font-cyber h-7 px-2"
                    >
                      View All
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {!topPlayers ? (
                      <>
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                      </>
                    ) : (
                      <>
                        {/* Top 3 */}
                        {topPlayers.slice(0, 3).map((player, index) => {
                          const isCurrentUser = player.userId === dbUser?._id;
                          return (
                            <div
                              key={player.userId}
                              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                                isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-gaming font-bold ${
                                  index === 0 ? "bg-yellow-400/20 text-yellow-400" :
                                  index === 1 ? "bg-gray-400/20 text-gray-400" :
                                  "bg-amber-600/20 text-amber-600"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center bg-card border border-border/50">
                                {renderAvatar(player.avatar, "small")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-gaming font-medium text-foreground truncate block">
                                  {player.username}
                                  {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                                </span>
                              </div>
                              <div className="text-sm font-gaming font-bold text-primary">
                                {player.xp.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}

                        {/* Separator if user not in top 3 */}
                        {userRank && userRank.rank > 3 && (
                          <>
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex-1 h-px bg-border/50" />
                              <span className="text-[10px] text-muted-foreground font-cyber">...</span>
                              <div className="flex-1 h-px bg-border/50" />
                            </div>

                            {/* Current User Position */}
                            <div className="flex items-center gap-3 p-2 rounded-md bg-primary/10 border border-primary/30">
                              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-gaming font-bold text-muted-foreground bg-muted/50">
                                {userRank.rank}
                              </div>
                              <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center bg-card border border-border/50">
                                {renderAvatar(userStats?.avatar, "small")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-gaming font-medium text-foreground truncate block">
                                  {user?.firstName || user?.username || "You"}
                                  <span className="text-primary ml-1">(You)</span>
                                </span>
                              </div>
                              <div className="text-sm font-gaming font-bold text-primary">
                                {userStats?.xp.toLocaleString()}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ==================== AVAILABLE QUESTS ==================== */}
            <motion.div variants={itemVariants} className="gaming-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-gaming font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Available Quests
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/quests")}
                  className="text-xs font-cyber h-7 px-2"
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {!activeQuests ? (
                  <>
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </>
                ) : (
                  activeQuests.slice(0, 4).map((quest) => {
                    const questStatus = userQuests?.find(uq => uq.questId === quest._id);
                    const isCompleted = questStatus?.status === "completed";
                    const isInProgress = questStatus?.status === "in_progress";

                    if (isCompleted) return null;

                    return (
                      <div
                        key={quest._id}
                        onClick={() => navigate("/quests")}
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                            {quest.thumbnail?.startsWith('http') ? (
                              <img
                                src={getDirectImageUrl(quest.thumbnail)}
                                alt={quest.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">{quest.thumbnail || '🎮'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-gaming font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {quest.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-primary font-cyber">+{quest.xp} XP</span>
                              {isInProgress && (
                                <Badge variant="warning" className="text-[8px] px-1 py-0">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
