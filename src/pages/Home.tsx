import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Gamepad2,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Star,
  Award,
  ArrowRight,
  Flame,
  Crown,
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
  const renderAvatar = (avatar: string | undefined, size: "small" | "medium" = "medium") => {
    if (!avatar) return "🎮";

    // Check if avatar is a URL (from Clerk)
    const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");

    if (isUrl) {
      const sizeClasses = {
        small: "w-8 h-8",
        medium: "w-10 h-10"
      };
      return (
        <img
          src={avatar}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-lg object-cover`}
        />
      );
    }

    // It's an emoji/text
    return <span className="text-2xl">{avatar}</span>;
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

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const stats = [
    {
      icon: Star,
      label: "Level",
      value: userStats?.level || 1,
      color: "text-yellow-400",
      bgColor: "from-yellow-500/20 to-orange-500/20",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: userStats?.xp.toLocaleString() || "0",
      color: "text-primary",
      bgColor: "from-primary/20 to-accent/20",
    },
    {
      icon: Trophy,
      label: "Points",
      value: userStats?.points.toLocaleString() || "0",
      color: "text-accent",
      bgColor: "from-accent/20 to-purple-500/20",
    },
    {
      icon: Target,
      label: "Quests Done",
      value: `${userStats?.completedQuestsCount || 0}/${userStats?.totalAvailableQuests || 0}`,
      color: "text-neon-blue",
      bgColor: "from-blue-500/20 to-cyan-500/20",
    },
  ];

  const quickActions = [
    {
      icon: Gamepad2,
      title: "Browse Quests",
      description: "Complete challenges & earn rewards",
      color: "neon-pink",
      path: "/quests",
    },
    {
      icon: Trophy,
      title: "Leaderboard",
      description: "Compete with top players",
      color: "neon-orange",
      path: "/leaderboard",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Background Effects */}
        <div className="fixed inset-0 animated-gradient opacity-30 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
              >
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
                <span className="text-xs sm:text-sm font-gaming text-primary">WELCOME BACK</span>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-gaming font-bold mb-4 px-4">
                <span className="text-foreground">Hey, </span>
                <span className="text-gradient">
                  {user?.firstName || user?.username || "Player"}
                </span>
                <span className="text-foreground">!</span>
              </h1>
              <p className="text-muted-foreground font-cyber text-base sm:text-lg px-4">
                Ready to dominate today's challenges?
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="gaming-card p-4 sm:p-6 text-center"
                >
                  <motion.div
                    variants={pulseVariants}
                    initial="initial"
                    animate="animate"
                    className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br ${stat.bgColor} border border-border flex items-center justify-center`}
                  >
                    <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
                  </motion.div>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-gaming font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-cyber">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* XP Progress Bar */}
            <motion.div variants={itemVariants} className="gaming-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-gaming font-semibold text-foreground mb-1">
                    Level Progress
                  </h3>
                  <p className="text-sm text-muted-foreground font-cyber">
                    {((userStats?.xp || 0) % 1000)} / 1000 XP to Level{" "}
                    {(userStats?.level || 1) + 1}
                  </p>
                </div>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center"
                >
                  <TrendingUp className="h-6 w-6 text-primary" />
                </motion.div>
              </div>
              <Progress
                value={((userStats?.xp || 0) % 1000) / 10}
                className="h-4"
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-gaming font-bold text-foreground mb-6 flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => navigate(action.path)}
                    className="gaming-card p-6 cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${action.color}/20 to-${action.color}/10 border border-${action.color}/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-gaming font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-cyber mb-4">
                          {action.description}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-cyber gap-2 group-hover:text-primary"
                        >
                          Explore
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity & Top Players */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Active Quests Preview */}
              <motion.div variants={itemVariants} className="gaming-card p-6">
                <h3 className="text-xl font-gaming font-bold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Available Quests
                </h3>
                <div className="space-y-3">
                  {activeQuests?.slice(0, 3).map((quest, index) => (
                    <motion.div
                      key={quest._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
                        {quest.thumbnail && quest.thumbnail.startsWith('http') ? (
                          <img
                            src={getDirectImageUrl(quest.thumbnail)}
                            alt={quest.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-2xl">🎮</div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="text-2xl">{quest.thumbnail || '🎮'}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-gaming font-semibold text-foreground truncate">
                          {quest.title}
                        </div>
                        <div className="text-xs text-muted-foreground font-cyber">
                          +{quest.xp} XP • {quest.reward} pts
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="cyber"
                  className="w-full mt-4 font-gaming"
                  onClick={() => navigate("/quests")}
                >
                  View All Quests
                </Button>
              </motion.div>

              {/* Top Players Preview */}
              <motion.div variants={itemVariants} className="gaming-card p-6">
                <h3 className="text-xl font-gaming font-bold text-foreground mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  Top Players
                </h3>
                <div className="space-y-3">
                  {topPlayers?.slice(0, 3).map((player, index) => (
                    <motion.div
                      key={player.userId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-card/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-gaming font-bold ${
                          index === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : index === 1
                            ? "bg-gray-400/20 text-gray-400"
                            : "bg-amber-600/20 text-amber-600"
                        }`}
                      >
                        {player.rank}
                      </div>
                      <div className="flex items-center justify-center overflow-hidden">
                        {renderAvatar(player.avatar, "small")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-gaming font-semibold text-foreground truncate">
                          {player.username}
                        </div>
                        <div className="text-xs text-muted-foreground font-cyber">
                          {player.xp.toLocaleString()} XP
                        </div>
                      </div>
                      {index === 0 && <Award className="h-5 w-5 text-yellow-400" />}
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="glow"
                  className="w-full mt-4 font-gaming"
                  onClick={() => navigate("/leaderboard")}
                >
                  View Full Leaderboard
                </Button>
              </motion.div>
            </div>
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
