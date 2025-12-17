import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all available prizes
export const getAllPrizes = query({
  handler: async (ctx) => {
    const prizes = await ctx.db
      .query("prizes")
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .order("desc")
      .collect();
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

// Redeem a prize
export const redeemPrize = mutation({
  args: {
    userId: v.id("users"),
    prizeId: v.id("prizes"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const prize = await ctx.db.get(args.prizeId);
    if (!prize) throw new Error("Prize not found");

    // Check if prize is available
    if (!prize.isAvailable) {
      throw new Error("This prize is no longer available");
    }

    // Check if prize is in stock
    if (prize.stock <= 0) {
      throw new Error("This prize is out of stock");
    }

    // Check if user has enough points
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

// Get user's redemptions
export const getUserRedemptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const redemptions = await ctx.db
      .query("redemptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

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

// Update redemption status (admin function)
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
    const redemption = await ctx.db.get(args.redemptionId);
    if (!redemption) throw new Error("Redemption not found");

    await ctx.db.patch(args.redemptionId, {
      status: args.status,
      deliveryInfo: args.deliveryInfo,
    });

    return { success: true };
  },
});

// Initialize sample prizes (run once to populate database)
export const initializeSamplePrizes = mutation({
  handler: async (ctx) => {
    const samplePrizes = [
      {
        name: "Gaming Headset Pro",
        description: "Premium wireless gaming headset with 7.1 surround sound and RGB lighting",
        image: "🎧",
        pointCost: 5000,
        category: "Gaming Gear",
        stock: 10,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with custom switches and programmable keys",
        image: "⌨️",
        pointCost: 7500,
        category: "Gaming Gear",
        stock: 8,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "Gaming Mouse Elite",
        description: "Precision gaming mouse with 16000 DPI and customizable buttons",
        image: "🖱️",
        pointCost: 3500,
        category: "Gaming Gear",
        stock: 15,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "Gift Card $50",
        description: "Steam gift card - redeem for your favorite games",
        image: "💳",
        pointCost: 4000,
        category: "Gift Cards",
        stock: 50,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "Gift Card $25",
        description: "PlayStation Store gift card - expand your game library",
        image: "🎮",
        pointCost: 2000,
        category: "Gift Cards",
        stock: 50,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "Gaming Chair",
        description: "Ergonomic gaming chair with lumbar support and adjustable armrests",
        image: "💺",
        pointCost: 12000,
        category: "Gaming Gear",
        stock: 5,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "4K Gaming Monitor",
        description: "27-inch 4K monitor with 144Hz refresh rate and HDR support",
        image: "🖥️",
        pointCost: 15000,
        category: "Gaming Gear",
        stock: 3,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "VIP Discord Role",
        description: "Exclusive VIP role with special perks and access to private channels",
        image: "👑",
        pointCost: 1000,
        category: "Digital Perks",
        stock: 100,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "Custom Avatar",
        description: "Professional custom avatar design created just for you",
        image: "🎨",
        pointCost: 2500,
        category: "Digital Perks",
        stock: 20,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "Gaming Bundle",
        description: "Complete gaming setup including mousepad, wrist rest, and cable organizer",
        image: "📦",
        pointCost: 6000,
        category: "Bundles",
        stock: 10,
        isAvailable: true,
        featured: true,
        createdAt: Date.now(),
      },
      {
        name: "Premium Subscription",
        description: "3-month premium subscription with exclusive features and benefits",
        image: "⭐",
        pointCost: 3000,
        category: "Subscriptions",
        stock: 100,
        isAvailable: true,
        featured: false,
        createdAt: Date.now(),
      },
      {
        name: "Game Key Bundle",
        description: "Mystery bundle of 3 indie game keys for Steam",
        image: "🔑",
        pointCost: 4500,
        category: "Gift Cards",
        stock: 30,
        isAvailable: true,
        featured: false,
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
