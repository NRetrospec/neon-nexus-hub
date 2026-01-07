import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Medal,
  TrendingUp,
  ArrowLeft,
  Trophy,
  Zap,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

const Leaderboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [viewingUserId, setViewingUserId] = useState<Id<"users"> | null>(null);

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const leaderboardData = useQuery(
    api.leaderboard.getLeaderboardWithUser,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const getOrCreateDirectChat = useMutation(api.chat.getOrCreateDirectChat);

  const handleSendFriendRequest = async (receiverId: Id<"users">) => {
    if (!dbUser) return;

    try {
      await sendFriendRequest({
        senderId: dbUser._id,
        receiverId,
      });
      toast.success("Friend request sent!");
      setViewingUserId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
    }
  };

  const handleStartChat = async (friendId: Id<"users">) => {
    if (!dbUser) return;

    try {
      await getOrCreateDirectChat({
        user1Id: dbUser._id,
        user2Id: friendId,
      });
      toast.success("Chat started! Redirecting to Social Hub...");
      setViewingUserId(null);
      // Navigate to social page where they can see the chat
      setTimeout(() => navigate("/social"), 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-gaming">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "rank-gold";
      case 2:
        return "rank-silver";
      case 3:
        return "rank-bronze";
      default:
        return "text-muted-foreground";
    }
  };

  // Helper to render avatar (emoji or image)
  const renderAvatar = (avatar: string | undefined, size: "small" | "medium" | "large" = "medium") => {
    if (!avatar) return "🎮";

    // Check if avatar is a URL (from Clerk)
    const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");

    if (isUrl) {
      const sizeClasses = {
        small: "w-10 h-10",
        medium: "w-12 h-12",
        large: "w-24 h-24"
      };
      return (
        <img
          src={avatar}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-xl object-cover`}
        />
      );
    }

    // It's an emoji/text
    return <span>{avatar}</span>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
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

            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
              >
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-gaming text-yellow-400">
                  GLOBAL RANKINGS
                </span>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-gaming font-bold mb-4 px-4">
                <span className="text-foreground">TOP </span>
                <span className="text-gradient">PLAYERS</span>
              </h1>
              <p className="text-muted-foreground font-cyber text-sm sm:text-base md:text-lg px-4">
                Compete with the best gamers worldwide
              </p>
            </div>
          </motion.div>

          {/* Top 3 Podium */}
          {leaderboardData && leaderboardData.topPlayers.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto">
                {/* 2nd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center pt-4 sm:pt-8"
                >
                  <button
                    onClick={() =>
                      leaderboardData.topPlayers[1]?.userId &&
                      leaderboardData.topPlayers[1]?.userId !== dbUser?._id &&
                      setViewingUserId(leaderboardData.topPlayers[1].userId)
                    }
                    disabled={leaderboardData.topPlayers[1]?.userId === dbUser?._id}
                    className={`gaming-card p-3 sm:p-6 text-center w-full transition-all duration-300 ${
                      leaderboardData.topPlayers[1]?.userId !== dbUser?._id
                        ? "hover:scale-105 hover:border-primary/50 cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50 flex items-center justify-center text-2xl sm:text-4xl shadow-[0_0_30px_hsl(var(--muted-foreground)/0.3)] overflow-hidden">
                      {renderAvatar(leaderboardData.topPlayers[1]?.avatar, "medium")}
                    </div>
                    <Medal className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                    <h3 className="font-gaming font-bold text-foreground mb-1 truncate text-xs sm:text-base">
                      {leaderboardData.topPlayers[1]?.username}
                    </h3>
                    <div className="text-[10px] sm:text-sm text-gray-400 font-cyber mb-1 sm:mb-2">
                      #{leaderboardData.topPlayers[1]?.rank}
                    </div>
                    <div className="text-sm sm:text-xl font-gaming font-bold text-primary">
                      {leaderboardData.topPlayers[1]?.xp.toLocaleString()} XP
                    </div>
                  </button>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={() =>
                      leaderboardData.topPlayers[0]?.userId &&
                      leaderboardData.topPlayers[0]?.userId !== dbUser?._id &&
                      setViewingUserId(leaderboardData.topPlayers[0].userId)
                    }
                    disabled={leaderboardData.topPlayers[0]?.userId === dbUser?._id}
                    className={`gaming-card p-4 sm:p-8 text-center w-full neon-border relative overflow-hidden transition-all duration-300 ${
                      leaderboardData.topPlayers[0]?.userId !== dbUser?._id
                        ? "hover:scale-105 cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 animate-pulse" />
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400/70 flex items-center justify-center text-3xl sm:text-5xl shadow-[0_0_40px_hsl(45_100%_60%/0.5)] animate-pulse-glow overflow-hidden">
                        {renderAvatar(leaderboardData.topPlayers[0]?.avatar, "large")}
                      </div>
                      <Crown className="h-7 w-7 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-1 sm:mb-2 animate-float" />
                      <h3 className="font-gaming font-bold text-foreground mb-1 truncate text-sm sm:text-lg">
                        {leaderboardData.topPlayers[0]?.username}
                      </h3>
                      <div className="text-xs sm:text-sm text-yellow-400 font-cyber mb-1 sm:mb-2">
                        CHAMPION
                      </div>
                      <div className="text-lg sm:text-2xl font-gaming font-bold text-gradient">
                        {leaderboardData.topPlayers[0]?.xp.toLocaleString()} XP
                      </div>
                    </div>
                  </button>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center pt-4 sm:pt-8"
                >
                  <button
                    onClick={() =>
                      leaderboardData.topPlayers[2]?.userId &&
                      leaderboardData.topPlayers[2]?.userId !== dbUser?._id &&
                      setViewingUserId(leaderboardData.topPlayers[2].userId)
                    }
                    disabled={leaderboardData.topPlayers[2]?.userId === dbUser?._id}
                    className={`gaming-card p-3 sm:p-6 text-center w-full transition-all duration-300 ${
                      leaderboardData.topPlayers[2]?.userId !== dbUser?._id
                        ? "hover:scale-105 hover:border-primary/50 cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-700/20 border-2 border-amber-600/50 flex items-center justify-center text-2xl sm:text-4xl shadow-[0_0_30px_hsl(30_60%_50%/0.3)] overflow-hidden">
                      {renderAvatar(leaderboardData.topPlayers[2]?.avatar, "medium")}
                    </div>
                    <Medal className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 mx-auto mb-1 sm:mb-2" />
                    <h3 className="font-gaming font-bold text-foreground mb-1 truncate text-xs sm:text-base">
                      {leaderboardData.topPlayers[2]?.username}
                    </h3>
                    <div className="text-[10px] sm:text-sm text-amber-600 font-cyber mb-1 sm:mb-2">
                      #{leaderboardData.topPlayers[2]?.rank}
                    </div>
                    <div className="text-sm sm:text-xl font-gaming font-bold text-primary">
                      {leaderboardData.topPlayers[2]?.xp.toLocaleString()} XP
                    </div>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Full Leaderboard */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            <div className="gaming-card overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-gaming text-sm uppercase tracking-wider">
                      Global Leaderboard
                    </span>
                  </div>
                  <Badge variant="outline" className="font-cyber">
                    Live Rankings
                  </Badge>
                </div>
              </div>

              {/* Players List */}
              <div className="divide-y divide-border">
                {leaderboardData?.topPlayers.map((player, index) => (
                  <motion.button
                    key={player.userId}
                    variants={itemVariants}
                    onClick={() =>
                      player.userId &&
                      player.userId !== dbUser?._id &&
                      setViewingUserId(player.userId)
                    }
                    disabled={player.userId === dbUser?._id}
                    className={`
                      w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 text-left
                      ${
                        player.userId !== dbUser?._id
                          ? "hover:bg-primary/5 group cursor-pointer"
                          : "cursor-default"
                      }
                      ${player.rank === 1 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : ""}
                      ${player.isCurrentUser ? "bg-primary/10 border-l-4 border-primary" : ""}
                    `}
                  >
                    {/* Rank */}
                    <div className={`w-10 text-center ${getRankStyle(player.rank)}`}>
                      {getRankIcon(player.rank)}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                        bg-gradient-to-br from-primary/20 to-accent/20 border border-border
                        group-hover:border-primary/50 transition-colors overflow-hidden
                        ${player.rank === 1 ? "neon-border" : ""}
                      `}
                    >
                      {renderAvatar(player.avatar, "small")}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-gaming font-semibold text-foreground truncate">
                          {player.username}
                        </span>
                        {player.isCurrentUser && (
                          <Badge variant="outline" className="text-xs font-cyber">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-cyber">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Level {player.level}
                        </span>
                        {player.badges.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {player.badges.length} Badges
                          </span>
                        )}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <div className="font-gaming font-bold text-primary">
                        {player.xp.toLocaleString()} XP
                      </div>
                      <div className="text-xs text-neon-green font-cyber flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{Math.floor(Math.random() * 20) + 1}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* User Position (if not in top 10) */}
              {leaderboardData?.userPosition && (
                <div className="px-6 py-4 bg-card/50 border-t-2 border-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center font-gaming text-muted-foreground">
                        #{leaderboardData.userPosition.rank}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl overflow-hidden">
                        {renderAvatar(leaderboardData.userPosition.avatar, "small")}
                      </div>
                      <div>
                        <div className="font-gaming font-semibold text-foreground flex items-center gap-2">
                          {leaderboardData.userPosition.username}
                          <Badge variant="outline" className="text-xs font-cyber">
                            You
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground font-cyber">
                          Your Position
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-gaming font-bold text-primary">
                        {leaderboardData.userPosition.xp.toLocaleString()} XP
                      </div>
                      <div className="text-xs text-muted-foreground font-cyber">
                        Level {leaderboardData.userPosition.level}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>

      <UserProfileModal
        userId={viewingUserId}
        open={!!viewingUserId}
        onOpenChange={(open) => !open && setViewingUserId(null)}
        onSendFriendRequest={handleSendFriendRequest}
        onStartChat={handleStartChat}
      />
    </div>
  );
};

export default Leaderboard;
