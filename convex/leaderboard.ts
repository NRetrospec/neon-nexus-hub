import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get top players from leaderboard
export const getTopPlayers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all users sorted by XP
    const users = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .order("desc")
      .take(limit);

    // Format with rank and additional info
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      username: user.username,
      avatar: user.avatar || "🎮",
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      trend: "+5", // This could be calculated from weekly data
    }));

    return leaderboard;
  },
});

// Get user's rank
export const getUserRank = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get all users with higher XP
    const usersAbove = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .filter((q) => q.gt(q.field("xp"), user.xp))
      .collect();

    const rank = usersAbove.length + 1;

    return {
      rank,
      totalUsers: (await ctx.db.query("users").collect()).length,
      xp: user.xp,
      level: user.level,
    };
  },
});

// Get leaderboard with user context (shows user's position)
export const getLeaderboardWithUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const topPlayers = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .order("desc")
      .take(10);

    const user = await ctx.db.get(args.userId);
    if (!user) return { topPlayers: [], userPosition: null };

    const allUsers = await ctx.db.query("users").collect();
    const sortedUsers = allUsers.sort((a, b) => b.xp - a.xp);
    const userRank = sortedUsers.findIndex((u) => u._id === args.userId) + 1;

    const leaderboard = topPlayers.map((player, index) => ({
      rank: index + 1,
      userId: player._id,
      username: player.username,
      avatar: player.avatar || "🎮",
      xp: player.xp,
      level: player.level,
      badges: player.badges,
      isCurrentUser: player._id === args.userId,
    }));

    const userPosition = {
      rank: userRank,
      username: user.username,
      avatar: user.avatar || "🎮",
      xp: user.xp,
      level: user.level,
    };

    return {
      topPlayers: leaderboard,
      userPosition: userRank > 10 ? userPosition : null,
    };
  },
});

// Update weekly rankings (could be called by a cron job)
export const updateWeeklyRankings = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_xp")
      .order("desc")
      .collect();

    // Clear existing leaderboard entries
    const existingEntries = await ctx.db.query("leaderboard").collect();
    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }

    // Create new leaderboard entries
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      await ctx.db.insert("leaderboard", {
        userId: user._id,
        rank: i + 1,
        xp: user.xp,
        weeklyXp: 0, // Would track weekly gains in production
        trend: i < 5 ? `+${Math.floor(Math.random() * 15) + 1}` : "+0",
        lastUpdated: Date.now(),
      });
    }

    return { message: "Leaderboard updated", count: users.length };
  },
});
