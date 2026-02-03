import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkRateLimit, userRateLimitId } from "./security";

// ==================== MUTATIONS ====================

/**
 * Send friend request
 * SECURITY: Rate limited to prevent spam
 * SECURITY: Prevents self-friending and duplicate requests
 */
export const sendFriendRequest = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit friend requests to prevent spam
    await checkRateLimit(ctx, userRateLimitId(args.senderId), "sendFriendRequest", "create");

    // SECURITY: Prevent self-friending
    if (args.senderId === args.receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if users are already friends
    const existingFriendship = await ctx.db
      .query("friends")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("user1Id"), args.senderId),
            q.eq(q.field("user2Id"), args.receiverId)
          ),
          q.and(
            q.eq(q.field("user1Id"), args.receiverId),
            q.eq(q.field("user2Id"), args.senderId)
          )
        )
      )
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    // Check if request already exists (in either direction)
    const existingRequest = await ctx.db
      .query("friendRequests")
      .filter((q) =>
        q.and(
          q.or(
            q.and(
              q.eq(q.field("senderId"), args.senderId),
              q.eq(q.field("receiverId"), args.receiverId)
            ),
            q.and(
              q.eq(q.field("senderId"), args.receiverId),
              q.eq(q.field("receiverId"), args.senderId)
            )
          ),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    const requestId = await ctx.db.insert("friendRequests", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: Date.now(),
    });

    return requestId;
  },
});

// ==================== QUERIES ====================

/**
 * Get pending friend requests for a user
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getPendingFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // SECURITY: Limit to 100 pending requests
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(100);

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);
        return {
          ...request,
          sender,
        };
      })
    );

    return requestsWithUsers;
  },
});

/**
 * Accept friend request
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Authorization - only receiver can accept
 */
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // SECURITY: Rate limit
    await checkRateLimit(ctx, userRateLimitId(request.receiverId), "acceptFriendRequest", "default");

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.requestId, { status: "accepted" });

    // Create friendship
    await ctx.db.insert("friends", {
      user1Id: request.senderId,
      user2Id: request.receiverId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reject friend request
 * SECURITY: Rate limited to prevent abuse
 */
export const rejectFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    // SECURITY: Rate limit
    await checkRateLimit(ctx, userRateLimitId(request.receiverId), "rejectFriendRequest", "default");

    await ctx.db.patch(args.requestId, { status: "rejected" });

    return { success: true };
  },
});

/**
 * Get all friends for a user
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // SECURITY: Limit to 500 friends
    const friendships = await ctx.db
      .query("friends")
      .filter((q) =>
        q.or(
          q.eq(q.field("user1Id"), args.userId),
          q.eq(q.field("user2Id"), args.userId)
        )
      )
      .take(500);

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId =
          friendship.user1Id === args.userId
            ? friendship.user2Id
            : friendship.user1Id;
        const friend = await ctx.db.get(friendId);
        return friend;
      })
    );

    return friends;
  },
});

/**
 * Check if users are friends
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const areFriends = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query("friends")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("user1Id"), args.userId1),
            q.eq(q.field("user2Id"), args.userId2)
          ),
          q.and(
            q.eq(q.field("user1Id"), args.userId2),
            q.eq(q.field("user2Id"), args.userId1)
          )
        )
      )
      .first();

    return !!friendship;
  },
});
