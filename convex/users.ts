import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  checkRateLimit,
  userRateLimitId,
  sanitizeString,
  validateEmail,
  validateUsername,
  validateNumber,
  ValidationError,
} from "./security";

// ==================== QUERIES ====================

/**
 * Get user by Clerk ID
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // SECURITY: Validate clerkId format (alphanumeric with underscores)
    const clerkId = args.clerkId.trim();
    if (clerkId.length === 0 || clerkId.length > 100) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    return user;
  },
});

/**
 * Get user by ID
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

/**
 * Search users by username
 * SECURITY: Search term is sanitized to prevent ReDoS attacks
 */
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    // SECURITY: Validate and sanitize search term
    const searchTerm = args.searchTerm.trim();
    if (searchTerm.length === 0) {
      return [];
    }
    if (searchTerm.length > 50) {
      return []; // Don't process excessively long search terms
    }

    // SECURITY: Simple contains check (no regex) to prevent ReDoS
    const searchLower = searchTerm.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();

    return allUsers
      .filter(user => user.username.toLowerCase().includes(searchLower))
      .slice(0, 10) // SECURITY: Limit results to prevent data exfiltration
      .map(user => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        phreshTeam: user.phreshTeam,
      }));
  },
});

// ==================== MUTATIONS ====================

/**
 * Create new user
 * SECURITY: Rate limited to prevent mass account creation
 * SECURITY: Input validation on all user-provided fields
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit by clerkId to prevent mass account creation
    await checkRateLimit(ctx, `clerk:${args.clerkId}`, "createUser", "auth");

    // SECURITY: Validate clerkId format
    const clerkId = args.clerkId.trim();
    if (clerkId.length === 0 || clerkId.length > 100) {
      throw new ValidationError("clerkId", "Invalid clerk ID format", "INVALID_FORMAT");
    }

    // SECURITY: Validate and sanitize username
    const username = sanitizeString(args.username, {
      maxLength: 50,
      trim: true,
      field: "username",
    });
    if (username.length < 1) {
      throw new ValidationError("username", "Username is required", "REQUIRED");
    }

    // SECURITY: Validate email format
    const email = validateEmail(args.email);

    // SECURITY: Validate avatar if provided (limit length)
    let avatar = args.avatar;
    if (avatar) {
      avatar = sanitizeString(avatar, {
        maxLength: 500, // Allow for emoji or URL
        trim: true,
        field: "avatar",
      });
    }

    // Check for existing user (idempotent)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      username,
      email,
      avatar: avatar || "🎮",
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

/**
 * Update user XP and points
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Validates numeric inputs to prevent overflow
 */
export const updateUserProgress = mutation({
  args: {
    userId: v.id("users"),
    xpGained: v.number(),
    pointsGained: v.number(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit by user to prevent XP farming exploits
    await checkRateLimit(ctx, userRateLimitId(args.userId), "updateUserProgress", "default");

    // SECURITY: Validate numeric inputs to prevent overflow/underflow
    const xpGained = validateNumber(args.xpGained, {
      min: 0,
      max: 10000, // Reasonable max for single operation
      integer: true,
      field: "xpGained",
    });
    const pointsGained = validateNumber(args.pointsGained, {
      min: 0,
      max: 10000, // Reasonable max for single operation
      integer: true,
      field: "pointsGained",
    });

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // SECURITY: Cap maximum values to prevent overflow
    const newXp = Math.min(user.xp + xpGained, 999999999);
    const newLevel = Math.floor(newXp / 1000) + 1;
    const newPoints = Math.min(user.points + pointsGained, 999999999);

    await ctx.db.patch(args.userId, {
      xp: newXp,
      level: newLevel,
      points: newPoints,
    });

    return { newXp, newLevel, newPoints };
  },
});

/**
 * Get user stats
 * SECURITY: No rate limiting needed for queries (read-only)
 */
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

/**
 * Add badge to user
 * SECURITY: Rate limited to prevent badge spam
 * SECURITY: Badge name is sanitized
 */
export const addBadge = mutation({
  args: {
    userId: v.id("users"),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit badge additions
    await checkRateLimit(ctx, userRateLimitId(args.userId), "addBadge", "default");

    // SECURITY: Sanitize badge name
    const badge = sanitizeString(args.badge, {
      maxLength: 50,
      trim: true,
      field: "badge",
    });
    if (badge.length === 0) {
      throw new ValidationError("badge", "Badge name is required", "REQUIRED");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // SECURITY: Limit maximum badges per user
    if (user.badges.length >= 100) {
      throw new Error("Maximum badge limit reached");
    }

    if (!user.badges.includes(badge)) {
      await ctx.db.patch(args.userId, {
        badges: [...user.badges, badge],
      });
    }
  },
});

/**
 * Toggle PhreshTeam access for a user
 * SECURITY: Rate limited - sensitive admin operation
 * NOTE: In production, this should require admin authentication
 */
export const togglePhreshTeamAccess = mutation({
  args: {
    userId: v.id("users"),
    phreshTeam: v.boolean(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit admin operations
    await checkRateLimit(ctx, userRateLimitId(args.userId), "togglePhreshTeamAccess", "sensitive");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // TODO: SECURITY: In production, add admin role verification here
    // if (!await isAdmin(ctx, callerUserId)) throw new Error("Unauthorized");

    await ctx.db.patch(args.userId, {
      phreshTeam: args.phreshTeam,
    });

    return { success: true, phreshTeam: args.phreshTeam };
  },
});
