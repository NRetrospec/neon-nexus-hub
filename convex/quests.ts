import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all active quests
export const getActiveQuests = query({
  args: {},
  handler: async (ctx) => {
    const quests = await ctx.db
      .query("quests")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return quests;
  },
});

// Get user's quest progress
export const getUserQuestProgress = query({
  args: { userId: v.id("users"), questId: v.id("quests") },
  handler: async (ctx, args) => {
    const userQuest = await ctx.db
      .query("userQuests")
      .withIndex("by_user_and_quest", (q) =>
        q.eq("userId", args.userId).eq("questId", args.questId)
      )
      .first();
    return userQuest;
  },
});

// Get all user's quests with progress
export const getUserQuests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userQuests = await ctx.db
      .query("userQuests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const questsWithDetails = await Promise.all(
      userQuests.map(async (uq) => {
        const quest = await ctx.db.get(uq.questId);
        return {
          ...uq,
          quest,
        };
      })
    );

    return questsWithDetails;
  },
});

// Start a quest
export const startQuest = mutation({
  args: {
    userId: v.id("users"),
    questId: v.id("quests"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userQuests")
      .withIndex("by_user_and_quest", (q) =>
        q.eq("userId", args.userId).eq("questId", args.questId)
      )
      .first();

    if (existing) {
      if (existing.status === "completed") {
        throw new Error("Quest already completed");
      }
      return existing._id;
    }

    const userQuestId = await ctx.db.insert("userQuests", {
      userId: args.userId,
      questId: args.questId,
      progress: 0,
      status: "in_progress",
      startedAt: Date.now(),
    });

    return userQuestId;
  },
});

// Update quest progress
export const updateQuestProgress = mutation({
  args: {
    userId: v.id("users"),
    questId: v.id("quests"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const userQuest = await ctx.db
      .query("userQuests")
      .withIndex("by_user_and_quest", (q) =>
        q.eq("userId", args.userId).eq("questId", args.questId)
      )
      .first();

    if (!userQuest) {
      throw new Error("User quest not found. Start the quest first.");
    }

    await ctx.db.patch(userQuest._id, {
      progress: Math.min(args.progress, 100),
      status: args.progress >= 100 ? "completed" : "in_progress",
      completedAt: args.progress >= 100 ? Date.now() : undefined,
    });

    if (args.progress >= 100) {
      const quest = await ctx.db.get(args.questId);
      const user = await ctx.db.get(args.userId);

      if (quest && user) {
        const newXp = user.xp + quest.xp;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const newPoints = user.points + quest.reward;

        await ctx.db.patch(args.userId, {
          xp: newXp,
          level: newLevel,
          points: newPoints,
          completedQuests: [...user.completedQuests, args.questId],
        });
      }
    }
  },
});

// Verify quest answer
export const verifyQuestAnswer = mutation({
  args: {
    userId: v.id("users"),
    questId: v.id("quests"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const userQuest = await ctx.db
      .query("userQuests")
      .withIndex("by_user_and_quest", (q) =>
        q.eq("userId", args.userId).eq("questId", args.questId)
      )
      .first();

    if (!userQuest) {
      throw new Error("User quest not found. Start the quest first.");
    }

    if (userQuest.status === "completed") {
      throw new Error("Quest already completed");
    }

    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Check if quest has answers configured
    if (!quest.acceptedAnswers || quest.acceptedAnswers.length === 0) {
      // If no answers configured, mark as completed directly
      await ctx.db.patch(userQuest._id, {
        progress: 100,
        status: "completed",
        completedAt: Date.now(),
      });
    } else {
      // Verify answer (case-insensitive, trimmed)
      const normalizedAnswer = args.answer.trim().toLowerCase();
      const isCorrect = quest.acceptedAnswers.some(
        (acceptedAnswer) => acceptedAnswer.toLowerCase() === normalizedAnswer
      );

      if (!isCorrect) {
        throw new Error("Incorrect answer. Try again!");
      }

      // Mark quest as completed
      await ctx.db.patch(userQuest._id, {
        progress: 100,
        status: "completed",
        completedAt: Date.now(),
      });
    }

    // Award rewards
    const user = await ctx.db.get(args.userId);
    if (user) {
      const newXp = user.xp + quest.xp;
      const newLevel = Math.floor(newXp / 1000) + 1;
      const newPoints = user.points + quest.reward;

      await ctx.db.patch(args.userId, {
        xp: newXp,
        level: newLevel,
        points: newPoints,
        completedQuests: [...user.completedQuests, args.questId],
      });
    }

    return { success: true, xp: quest.xp, points: quest.reward };
  },
});

// Seed initial quests (call this once to populate database)
export const seedQuests = mutation({
  args: {},
  handler: async (ctx) => {
    const existingQuests = await ctx.db.query("quests").collect();
    if (existingQuests.length > 0) {
      return { message: "Quests already seeded" };
    }

    const quests = [
      {
        title: "Speed Run Challenge",
        description: "Complete the tutorial level in under 2 minutes",
        thumbnail: "🎮",
        difficulty: "Easy" as const,
        reward: 500,
        xp: 150,
        duration: "15 min",
        category: "Gaming",
        isActive: true,
        question: "What is the main objective in a speed run?",
        acceptedAnswers: ["speed", "time", "fast", "quick", "fastest time", "complete fast", "finish quickly"],
        createdAt: Date.now(),
      },
      {
        title: "Social Butterfly",
        description: "Follow 10 new gamers and engage with their posts",
        thumbnail: "🦋",
        difficulty: "Medium" as const,
        reward: 750,
        xp: 200,
        duration: "30 min",
        category: "Social",
        isActive: true,
        question: "What is the key to building a gaming community?",
        acceptedAnswers: ["engagement", "interaction", "communication", "connect", "engage", "socialize", "participate"],
        createdAt: Date.now(),
      },
      {
        title: "Content Creator",
        description: "Share 5 gaming moments with the community",
        thumbnail: "📸",
        difficulty: "Hard" as const,
        reward: 1000,
        xp: 300,
        duration: "1 hour",
        category: "Content",
        isActive: true,
        question: "What makes gaming content shareable?",
        acceptedAnswers: ["entertaining", "exciting", "funny", "amazing", "epic", "memorable", "interesting", "engaging"],
        createdAt: Date.now(),
      },
      {
        title: "First Victory",
        description: "Win your first multiplayer match",
        thumbnail: "🏆",
        difficulty: "Easy" as const,
        reward: 400,
        xp: 100,
        duration: "20 min",
        category: "Gaming",
        isActive: true,
        question: "What do you achieve when you win?",
        acceptedAnswers: ["victory", "win", "success", "triumph", "champion", "winner", "first place"],
        createdAt: Date.now(),
      },
      {
        title: "Team Player",
        description: "Complete 3 team-based challenges",
        thumbnail: "👥",
        difficulty: "Medium" as const,
        reward: 800,
        xp: 250,
        duration: "45 min",
        category: "Gaming",
        isActive: true,
        question: "What is essential for team success?",
        acceptedAnswers: ["teamwork", "cooperation", "collaboration", "communication", "unity", "together", "coordinate"],
        createdAt: Date.now(),
      },
      {
        title: "Legendary Status",
        description: "Reach level 10 and unlock all badges",
        thumbnail: "⭐",
        difficulty: "Hard" as const,
        reward: 2000,
        xp: 500,
        duration: "2 hours",
        category: "Achievement",
        isActive: true,
        question: "What does it take to become legendary?",
        acceptedAnswers: ["dedication", "persistence", "practice", "commitment", "effort", "hard work", "determination", "skill"],
        createdAt: Date.now(),
      },
    ];

    for (const quest of quests) {
      await ctx.db.insert("quests", quest);
    }

    return { message: "Quests seeded successfully", count: quests.length };
  },
});
