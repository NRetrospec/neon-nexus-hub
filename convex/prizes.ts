import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkRateLimit, userRateLimitId, sanitizeString } from "./security";

// ==================== QUERIES ====================

/**
 * Get all available prizes
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getAllPrizes = query({
  handler: async (ctx) => {
    // SECURITY: Limit results
    const prizes = await ctx.db
      .query("prizes")
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .order("desc")
      .take(100);
    return prizes;
  },
});

// Get prizes by category
export const getPrizesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const prizes = await ctx.db
      .query("prizes")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect();
    return prizes;
  },
});

// Get featured prizes
export const getFeaturedPrizes = query({
  handler: async (ctx) => {
    const prizes = await ctx.db
      .query("prizes")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect();
    return prizes;
  },
});

// ==================== MUTATIONS ====================

/**
 * Redeem a prize
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Validates user has sufficient points and prize is in stock
 */
export const redeemPrize = mutation({
  args: {
    userId: v.id("users"),
    prizeId: v.id("prizes"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit redemptions to prevent abuse
    await checkRateLimit(ctx, userRateLimitId(args.userId), "redeemPrize", "sensitive");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const prize = await ctx.db.get(args.prizeId);
    if (!prize) throw new Error("Prize not found");

    // SECURITY: Check if prize is available
    if (!prize.isAvailable) {
      throw new Error("This prize is no longer available");
    }

    // SECURITY: Check if prize is in stock
    if (prize.stock <= 0) {
      throw new Error("This prize is out of stock");
    }

    // SECURITY: Check if user has enough points
    if (user.points < prize.pointCost) {
      throw new Error("Insufficient points");
    }

    // Deduct points from user
    await ctx.db.patch(args.userId, {
      points: user.points - prize.pointCost,
    });

    // Reduce stock
    await ctx.db.patch(args.prizeId, {
      stock: prize.stock - 1,
      isAvailable: prize.stock - 1 > 0,
    });

    // Create redemption record
    const redemptionId = await ctx.db.insert("redemptions", {
      userId: args.userId,
      prizeId: args.prizeId,
      status: "pending",
      pointsSpent: prize.pointCost,
      redeemedAt: Date.now(),
    });

    return {
      success: true,
      redemptionId,
      remainingPoints: user.points - prize.pointCost,
    };
  },
});

/**
 * Get user's redemptions
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getUserRedemptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // SECURITY: Limit results
    const redemptions = await ctx.db
      .query("redemptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    // Fetch prize details for each redemption
    const redemptionsWithPrizes = await Promise.all(
      redemptions.map(async (redemption) => {
        const prize = await ctx.db.get(redemption.prizeId);
        return {
          ...redemption,
          prize,
        };
      })
    );

    return redemptionsWithPrizes;
  },
});

/**
 * Update redemption status (admin function)
 * SECURITY: Rate limited - admin operation
 * SECURITY: Delivery info is sanitized
 * NOTE: In production, this should require admin authentication
 */
export const updateRedemptionStatus = mutation({
  args: {
    redemptionId: v.id("redemptions"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    deliveryInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit admin operations
    await checkRateLimit(ctx, `redemption:${args.redemptionId}`, "updateRedemptionStatus", "admin");

    const redemption = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");

    // TODO: SECURITY: In production, add admin role verification here

    // SECURITY: Sanitize delivery info if provided
    let deliveryInfo = args.deliveryInfo;
    if (deliveryInfo) {
      deliveryInfo = sanitizeString(deliveryInfo, {
        maxLength: 500,
        trim: true,
        field: "deliveryInfo",
      });
    }

    await ctx.db.patch(args.redemptionId, {
      status: args.status,
      deliveryInfo,
    });

    return { success: true };
  },
});

// Initialize sample prizes (run once to populate database)
export const initializeSamplePrizes = mutation({
  handler: async (ctx) => {
    const samplePrizes = [
      {
        name: "$50 Gift Card",
        description: "Redeemable gift card for your favorite gaming platform",
        image: "💳",
        pointCost: 3000,
        category: "Gift Cards",
        stock: 50,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "TBA Prize",
        description: "To be announced - exciting prize coming soon!",
        image: "🎁",
        pointCost: 6000,
        category: "Special",
        stock: 10,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "TBA Prize",
        description: "To be announced - exciting prize coming soon!",
        image: "🎁",
        pointCost: 9000,
        category: "Special",
        stock: 5,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "TBA Prize",
        description: "To be announced - exciting prize coming soon!",
        image: "🎁",
        pointCost: 15000,
        category: "Special",
        stock: 3,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
    ];

    const existingPrizes = await ctx.db.query("prizes").collect();
    if (existingPrizes.length > 0) {
      return { message: "Prizes already initialized", count: existingPrizes.length };
    }

    for (const prize of samplePrizes) {
      await ctx.db.insert("prizes", prize);
    }

    return { message: "Sample prizes initialized successfully", count: samplePrizes.length };
  },
});
