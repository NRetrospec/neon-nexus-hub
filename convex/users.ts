import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get or create user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

// Search users by username
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchTerm.toLowerCase();

    return allUsers
      .filter(user => user.username.toLowerCase().includes(searchLower))
      .slice(0, 10)
      .map(user => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        phreshTeam: user.phreshTeam,
      }));
  },
});

// Create new user
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      email: args.email,
      avatar: args.avatar || "🎮",
      xp: 0,
      level: 1,
      points: 0,
      completedQuests: [],
      badges: [],
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user XP and points
export const updateUserProgress = mutation({
  args: {
    userId: v.id("users"),
    xpGained: v.number(),
    pointsGained: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const newXp = user.xp + args.xpGained;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const newPoints = user.points + args.pointsGained;

    await ctx.db.patch(args.userId, {
      xp: newXp,
      level: newLevel,
      points: newPoints,
    });

    return { newXp, newLevel, newPoints };
  },
});

// Get user stats
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const completedQuestsCount = user.completedQuests.length;
    const totalQuests = await ctx.db.query("quests").collect();
    const activeTotalQuests = totalQuests.filter((q) => q.isActive).length;

    return {
      ...user,
      completedQuestsCount,
      totalAvailableQuests: activeTotalQuests,
      progressPercentage:
        activeTotalQuests > 0
          ? Math.round((completedQuestsCount / activeTotalQuests) * 100)
          : 0,
    };
  },
});

// Add badge to user
export const addBadge = mutation({
  args: {
    userId: v.id("users"),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (!user.badges.includes(args.badge)) {
      await ctx.db.patch(args.userId, {
        badges: [...user.badges, args.badge],
      });
    }
  },
});

// Toggle PhreshTeam access for a user
export const togglePhreshTeamAccess = mutation({
  args: {
    userId: v.id("users"),
    phreshTeam: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      phreshTeam: args.phreshTeam,
    });

    return { success: true, phreshTeam: args.phreshTeam };
  },
});
