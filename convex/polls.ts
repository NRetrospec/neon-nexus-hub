import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate letter grade based on total score
 * A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59
 */
function calculateLetterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Calculate average scores across all categories from votes
 */
function calculateAverageScores(votes: any[]) {
  if (votes.length === 0) return null;

  const categories = [
    "categoryGraphics",
    "categoryGameplay",
    "categoryFun",
    "categoryStory",
    "categorySound",
    "categoryPerformance",
    "categoryInnovation",
    "categoryContent",
    "categoryUI",
    "categoryWorld",
  ];

  const averages: any = {};

  categories.forEach((cat) => {
    const sum = votes.reduce((acc, vote) => acc + vote[cat], 0);
    averages[cat] = Math.round((sum / votes.length) * 10) / 10; // Round to 1 decimal
  });

  // Calculate total average
  const totalSum = votes.reduce((acc, vote) => acc + vote.totalScore, 0);
  averages.total = Math.round((totalSum / votes.length) * 10) / 10;

  return averages;
}

// ==================== MUTATIONS ====================

/**
 * Create a new poll (PhreshTeam only)
 */
export const createPoll = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    imageStorageId: v.id("_storage"),
    categoryGraphics: v.number(),
    categoryGameplay: v.number(),
    categoryFun: v.number(),
    categoryStory: v.number(),
    categorySound: v.number(),
    categoryPerformance: v.number(),
    categoryInnovation: v.number(),
    categoryContent: v.number(),
    categoryUI: v.number(),
    categoryWorld: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user exists and is PhreshTeam
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.phreshTeam) {
      throw new Error("Only PhreshTeam members can create polls");
    }

    // Validate scores (0-10)
    const scores = [
      args.categoryGraphics,
      args.categoryGameplay,
      args.categoryFun,
      args.categoryStory,
      args.categorySound,
      args.categoryPerformance,
      args.categoryInnovation,
      args.categoryContent,
      args.categoryUI,
      args.categoryWorld,
    ];

    if (scores.some((s) => s < 0 || s > 10 || !Number.isInteger(s))) {
      throw new Error("All scores must be integers between 0 and 10");
    }

    // Calculate total score
    const totalScore = scores.reduce((a, b) => a + b, 0);

    if (totalScore > 100) {
      throw new Error("Total score cannot exceed 100");
    }

    // Validate title
    if (!args.title || args.title.trim().length === 0) {
      throw new Error("Poll title is required");
    }
    if (args.title.length > 100) {
      throw new Error("Poll title must be 100 characters or less");
    }

    // Create poll
    const pollId = await ctx.db.insert("polls", {
      creatorId: args.userId,
      title: args.title.trim(),
      image: args.imageStorageId,
      categoryGraphics: args.categoryGraphics,
      categoryGameplay: args.categoryGameplay,
      categoryFun: args.categoryFun,
      categoryStory: args.categoryStory,
      categorySound: args.categorySound,
      categoryPerformance: args.categoryPerformance,
      categoryInnovation: args.categoryInnovation,
      categoryContent: args.categoryContent,
      categoryUI: args.categoryUI,
      categoryWorld: args.categoryWorld,
      totalScore,
      voteCount: 1, // Creator's vote counts
      averageTotalScore: totalScore,
      status: "open",
      createdAt: Date.now(),
    });

    // Auto-create creator's vote
    await ctx.db.insert("pollVotes", {
      pollId,
      userId: args.userId,
      categoryGraphics: args.categoryGraphics,
      categoryGameplay: args.categoryGameplay,
      categoryFun: args.categoryFun,
      categoryStory: args.categoryStory,
      categorySound: args.categorySound,
      categoryPerformance: args.categoryPerformance,
      categoryInnovation: args.categoryInnovation,
      categoryContent: args.categoryContent,
      categoryUI: args.categoryUI,
      categoryWorld: args.categoryWorld,
      totalScore,
      createdAt: Date.now(),
    });

    return { pollId, success: true };
  },
});

/**
 * Submit a vote on a poll (all authenticated users, once per poll)
 */
export const submitVote = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
    categoryGraphics: v.number(),
    categoryGameplay: v.number(),
    categoryFun: v.number(),
    categoryStory: v.number(),
    categorySound: v.number(),
    categoryPerformance: v.number(),
    categoryInnovation: v.number(),
    categoryContent: v.number(),
    categoryUI: v.number(),
    categoryWorld: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify poll exists
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Check if poll is open
    if (poll.status === "closed") {
      throw new Error("This poll is closed and no longer accepting votes");
    }

    // Check for existing vote
    const existingVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", args.userId)
      )
      .first();

    if (existingVote) {
      throw new Error("You have already voted on this poll");
    }

    // Validate scores (0-10)
    const scores = [
      args.categoryGraphics,
      args.categoryGameplay,
      args.categoryFun,
      args.categoryStory,
      args.categorySound,
      args.categoryPerformance,
      args.categoryInnovation,
      args.categoryContent,
      args.categoryUI,
      args.categoryWorld,
    ];

    if (scores.some((s) => s < 0 || s > 10 || !Number.isInteger(s))) {
      throw new Error("All scores must be integers between 0 and 10");
    }

    // Calculate total score
    const totalScore = scores.reduce((a, b) => a + b, 0);

    if (totalScore > 100) {
      throw new Error("Total score cannot exceed 100");
    }

    // Create new vote
    await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      userId: args.userId,
      categoryGraphics: args.categoryGraphics,
      categoryGameplay: args.categoryGameplay,
      categoryFun: args.categoryFun,
      categoryStory: args.categoryStory,
      categorySound: args.categorySound,
      categoryPerformance: args.categoryPerformance,
      categoryInnovation: args.categoryInnovation,
      categoryContent: args.categoryContent,
      categoryUI: args.categoryUI,
      categoryWorld: args.categoryWorld,
      totalScore,
      createdAt: Date.now(),
    });

    // Increment vote count
    await ctx.db.patch(args.pollId, {
      voteCount: poll.voteCount + 1,
    });

    // Recalculate average total score
    const allVotes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const avgScores = calculateAverageScores(allVotes);
    if (avgScores) {
      await ctx.db.patch(args.pollId, {
        averageTotalScore: avgScores.total,
      });
    }

    return { success: true };
  },
});

/**
 * Close a poll (creator only)
 */
export const closePoll = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Verify ownership
    if (poll.creatorId !== args.userId) {
      throw new Error("Only the poll creator can close this poll");
    }

    // Update status
    await ctx.db.patch(args.pollId, {
      status: "closed",
      closedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reopen a closed poll (creator only)
 */
export const reopenPoll = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Verify ownership
    if (poll.creatorId !== args.userId) {
      throw new Error("Only the poll creator can reopen this poll");
    }

    // Update status
    await ctx.db.patch(args.pollId, {
      status: "open",
      closedAt: undefined,
    });

    return { success: true };
  },
});

/**
 * Delete a poll (creator only)
 */
export const deletePoll = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Verify ownership
    if (poll.creatorId !== args.userId) {
      throw new Error("Only the poll creator can delete this poll");
    }

    // Delete all votes
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete poll
    await ctx.db.delete(args.pollId);

    return { success: true };
  },
});

// ==================== QUERIES ====================

/**
 * Get all polls with enriched data (paginated)
 */
export const getAllPolls = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_created_at")
      .order("desc")
      .take(50);

    // Enrich with creator info and image URL
    const enrichedPolls = await Promise.all(
      polls.map(async (poll) => {
        const creator = await ctx.db.get(poll.creatorId) as Doc<"users"> | null;
        const imageUrl = await ctx.storage.getUrl(poll.image);

        return {
          ...poll,
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatar,
                level: creator.level,
                phreshTeam: creator.phreshTeam,
              }
            : null,
          imageUrl,
        };
      })
    );

    return enrichedPolls;
  },
});

/**
 * Get single poll with detailed results and all votes
 */
export const getPollDetails = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const creator = await ctx.db.get(poll.creatorId) as Doc<"users"> | null;
    const imageUrl = await ctx.storage.getUrl(poll.image);

    // Get all votes with user data
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const enrichedVotes = await Promise.all(
      votes.map(async (vote) => {
        const user = await ctx.db.get(vote.userId) as Doc<"users"> | null;
        return {
          ...vote,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                level: user.level,
              }
            : null,
        };
      })
    );

    // Calculate average scores per category
    const avgScores = calculateAverageScores(enrichedVotes);
    const letterGrade = avgScores ? calculateLetterGrade(avgScores.total) : "F";

    return {
      ...poll,
      creator: creator
        ? {
            _id: creator._id,
            username: creator.username,
            avatar: creator.avatar,
            level: creator.level,
            phreshTeam: creator.phreshTeam,
          }
        : null,
      imageUrl,
      votes: enrichedVotes,
      averageScores: avgScores,
      letterGrade,
    };
  },
});

/**
 * Check if user has voted on a poll
 */
export const hasUserVoted = query({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", args.userId)
      )
      .first();

    return vote ? { hasVoted: true, vote } : { hasVoted: false, vote: null };
  },
});

/**
 * Check if user has PhreshTeam access
 */
export const hasPhreshTeamAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.phreshTeam || false;
  },
});

/**
 * Get polls by status filter
 */
export const getPollsByStatus = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    let polls;

    if (args.status) {
      polls = await ctx.db
        .query("polls")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(50);
    } else {
      polls = await ctx.db
        .query("polls")
        .withIndex("by_created_at")
        .order("desc")
        .take(50);
    }

    // Enrich with creator info and image URL
    const enrichedPolls = await Promise.all(
      polls.map(async (poll) => {
        const creator = await ctx.db.get(poll.creatorId) as Doc<"users"> | null;
        const imageUrl = await ctx.storage.getUrl(poll.image);

        return {
          ...poll,
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatar,
                level: creator.level,
                phreshTeam: creator.phreshTeam,
              }
            : null,
          imageUrl,
        };
      })
    );

    return enrichedPolls;
  },
});

/**
 * Get polls created by a specific user
 */
export const getUserPolls = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .order("desc")
      .collect();

    // Enrich with creator info and image URL
    const enrichedPolls = await Promise.all(
      polls.map(async (poll) => {
        const creator = await ctx.db.get(poll.creatorId);
        const imageUrl = await ctx.storage.getUrl(poll.image);

        return {
          ...poll,
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatar,
                level: creator.level,
                phreshTeam: creator.phreshTeam,
              }
            : null,
          imageUrl,
        };
      })
    );

    return enrichedPolls;
  },
});

/**
 * Get polls where user has voted
 */
export const getUserVotedPolls = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all votes by user
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get poll details for each vote
    const polls = await Promise.all(
      votes.map(async (vote) => {
        const poll = await ctx.db.get(vote.pollId);
        if (!poll) return null;

        const creator = await ctx.db.get(poll.creatorId);
        const imageUrl = await ctx.storage.getUrl(poll.image);

        return {
          ...poll,
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatar,
                level: creator.level,
                phreshTeam: creator.phreshTeam,
              }
            : null,
          imageUrl,
        };
      })
    );

    // Filter out null values (deleted polls)
    return polls.filter((p) => p !== null);
  },
});
