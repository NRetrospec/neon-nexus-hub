import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  checkRateLimit,
  userRateLimitId,
  validatePostContent,
  validateComment,
  validateUrl,
  ValidationError,
} from "./security";

// ==================== QUERIES ====================

/**
 * Get posts by channel
 * SECURITY: No rate limiting needed for queries (read-only)
 * SECURITY: Results are limited to prevent data exfiltration
 */
export const getPostsByChannel = query({
  args: {
    channel: v.union(v.literal("General"), v.literal("PhreshTeam")),
  },
  handler: async (ctx, args) => {
    // SECURITY: Limit results to 50 posts
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_channel", (q) => q.eq("channel", args.channel))
      .order("desc")
      .take(50);

    // Enrich posts with user data, like status, and comment count
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        const comments = await ctx.db
          .query("postComments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          user: user ? {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            level: user.level,
          } : null,
          commentCount: comments.length,
        };
      })
    );

    return enrichedPosts;
  },
});

// ==================== MUTATIONS ====================

/**
 * Create a new post
 * SECURITY: Rate limited to prevent spam
 * SECURITY: Content is validated and sanitized for XSS
 */
export const createPost = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    channel: v.union(v.literal("General"), v.literal("PhreshTeam")),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit post creation to prevent spam
    await checkRateLimit(ctx, userRateLimitId(args.userId), "createPost", "create");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // SECURITY: Check PhreshTeam access
    if (args.channel === "PhreshTeam" && !user.phreshTeam) {
      throw new Error("You don't have access to the PhreshTeam channel");
    }

    // SECURITY: Validate and sanitize post content (max 5000 chars, XSS prevention)
    const content = validatePostContent(args.content);
    if (content.length === 0) {
      throw new ValidationError("content", "Post content is required", "REQUIRED");
    }

    // SECURITY: Validate media URL if provided
    let mediaUrl = args.mediaUrl;
    if (mediaUrl) {
      mediaUrl = validateUrl(mediaUrl, {
        allowedProtocols: ["http:", "https:"],
        maxLength: 2048,
        field: "mediaUrl",
      });
    }

    const postId = await ctx.db.insert("socialPosts", {
      userId: args.userId,
      content,
      channel: args.channel,
      mediaUrl,
      likes: 0,
      createdAt: Date.now(),
    });

    return postId;
  },
});

/**
 * Toggle like on a post
 * SECURITY: Rate limited to prevent like manipulation
 */
export const toggleLike = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit like toggling to prevent manipulation
    await checkRateLimit(ctx, userRateLimitId(args.userId), "toggleLike", "default");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user already liked the post
    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likes: Math.max(0, post.likes - 1),
      });
      return { liked: false, likes: Math.max(0, post.likes - 1) };
    } else {
      // Like
      await ctx.db.insert("postLikes", {
        postId: args.postId,
        userId: args.userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        likes: post.likes + 1,
      });
      return { liked: true, likes: post.likes + 1 };
    }
  },
});

/**
 * Check if user liked a post
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const hasUserLikedPost = query({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("postLikes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();
    return !!like;
  },
});

/**
 * Get comments for a post
 * SECURITY: No rate limiting needed for queries (read-only)
 * SECURITY: Results are limited to prevent data exfiltration
 */
export const getComments = query({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    // SECURITY: Limit comments to 200 per post
    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .take(200);

    // Enrich comments with user data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user ? {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            level: user.level,
          } : null,
        };
      })
    );

    return enrichedComments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Add a comment to a post
 * SECURITY: Rate limited to prevent comment spam
 * SECURITY: Content is validated and sanitized for XSS
 */
export const addComment = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit comment creation to prevent spam
    await checkRateLimit(ctx, userRateLimitId(args.userId), "addComment", "create");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // SECURITY: Validate and sanitize comment content (max 1000 chars, XSS prevention)
    const content = validateComment(args.content);
    if (content.length === 0) {
      throw new ValidationError("content", "Comment content is required", "REQUIRED");
    }

    const commentId = await ctx.db.insert("postComments", {
      postId: args.postId,
      userId: args.userId,
      content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * Delete a post (only by the author)
 * SECURITY: Rate limited to prevent mass deletion
 * SECURITY: Authorization check ensures only author can delete
 */
export const deletePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit deletions
    await checkRateLimit(ctx, userRateLimitId(args.userId), "deletePost", "default");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // SECURITY: Authorization check - only author can delete
    if (post.userId !== args.userId) {
      throw new Error("You can only delete your own posts");
    }

    // Delete associated likes and comments
    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.postId);
  },
});

/**
 * Check user's PhreshTeam access
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const hasPhreshTeamAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.phreshTeam || false;
  },
});
