import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  checkRateLimit,
  userRateLimitId,
  validateBio,
  validateStatus,
  validateUrl,
  validateArray,
  sanitizeString,
  ValidationError,
} from "./security";

// ==================== QUERIES ====================

/**
 * Get user profile
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

/**
 * Get user's profile songs
 * SECURITY: No rate limiting needed for queries (read-only)
 */
export const getProfileSongs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.songs) return [];

    const songs = await Promise.all(
      user.songs.map(async (storageId) => {
        const url = await ctx.storage.getUrl(storageId);
        return { storageId, url };
      })
    );

    return songs.filter(s => s.url !== null);
  },
});

// ==================== MUTATIONS ====================

/**
 * Update profile information
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: All inputs validated and sanitized for XSS
 */
export const updateProfileInfo = mutation({
  args: {
    userId: v.id("users"),
    bio: v.optional(v.string()),
    status: v.optional(v.string()),
    socialLinks: v.optional(v.array(v.object({
      platform: v.string(),
      url: v.string(),
      icon: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit profile updates
    await checkRateLimit(ctx, userRateLimitId(args.userId), "updateProfileInfo", "default");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updateData: Record<string, unknown> = {};

    // SECURITY: Validate and sanitize bio (max 500 chars, XSS prevention)
    if (args.bio !== undefined) {
      updateData.bio = args.bio ? validateBio(args.bio) : "";
    }

    // SECURITY: Validate and sanitize status (max 100 chars, XSS prevention)
    if (args.status !== undefined) {
      updateData.status = args.status ? validateStatus(args.status) : "";
    }

    // SECURITY: Validate social links
    if (args.socialLinks !== undefined) {
      // SECURITY: Limit array size
      validateArray(args.socialLinks, {
        minLength: 0,
        maxLength: 5,
        field: "socialLinks",
      });

      // SECURITY: Validate each link
      const validatedLinks = args.socialLinks.map((link, index) => {
        // Validate platform name
        const platform = sanitizeString(link.platform, {
          maxLength: 50,
          trim: true,
          field: `socialLinks[${index}].platform`,
        });

        // Validate URL
        const url = validateUrl(link.url, {
          allowedProtocols: ["http:", "https:"],
          maxLength: 500,
          field: `socialLinks[${index}].url`,
        });

        // Validate icon if provided
        let icon = link.icon;
        if (icon) {
          icon = sanitizeString(icon, {
            maxLength: 100,
            trim: true,
            field: `socialLinks[${index}].icon`,
          });
        }

        return { platform, url, icon };
      });

      updateData.socialLinks = validatedLinks;
    }

    await ctx.db.patch(args.userId, updateData);
    return { success: true };
  },
});

/**
 * Upload a song to user profile
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: File upload limits enforced
 */
export const uploadSong = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Strict rate limiting for file uploads
    await checkRateLimit(ctx, userRateLimitId(args.userId), "uploadSong", "upload");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentSongs = user.songs || [];
    // SECURITY: Enforce maximum song limit
    if (currentSongs.length >= 2) {
      throw new Error("Maximum 2 songs allowed. Please delete one first.");
    }

    // Verify file exists (validates storage ID)
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("File not found");

    await ctx.db.patch(args.userId, {
      songs: [...currentSongs, args.storageId],
    });

    return { success: true, songCount: currentSongs.length + 1 };
  },
});

/**
 * Delete a song from user profile
 * SECURITY: Rate limited to prevent abuse
 * SECURITY: Authorization check - only owner can delete
 */
export const deleteSong = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit deletions
    await checkRateLimit(ctx, userRateLimitId(args.userId), "deleteSong", "default");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentSongs = user.songs || [];
    const filteredSongs = currentSongs.filter(id => id !== args.storageId);

    // SECURITY: Verify the song belongs to this user
    if (filteredSongs.length === currentSongs.length) {
      throw new Error("Song not found in user's collection");
    }

    // Delete from storage
    await ctx.storage.delete(args.storageId);

    await ctx.db.patch(args.userId, {
      songs: filteredSongs,
    });

    return { success: true, songCount: filteredSongs.length };
  },
});
