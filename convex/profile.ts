import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

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
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // VALIDATION
    if (args.bio && args.bio.length > 500) {
      throw new Error("Bio must be 500 characters or less");
    }
    if (args.status && args.status.length > 100) {
      throw new Error("Status must be 100 characters or less");
    }
    if (args.socialLinks && args.socialLinks.length > 5) {
      throw new Error("Maximum 5 social links allowed");
    }

    // URL validation for social links
    if (args.socialLinks) {
      for (const link of args.socialLinks) {
        if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
          throw new Error("Social links must be valid URLs starting with http:// or https://");
        }
      }
    }

    const updateData: any = {};
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.socialLinks !== undefined) updateData.socialLinks = args.socialLinks;

    await ctx.db.patch(args.userId, updateData);
    return { success: true };
  },
});

export const uploadSong = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentSongs = user.songs || [];
    if (currentSongs.length >= 2) {
      throw new Error("Maximum 2 songs allowed. Please delete one first.");
    }

    // Verify file exists
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("File not found");

    await ctx.db.patch(args.userId, {
      songs: [...currentSongs, args.storageId],
    });

    return { success: true, songCount: currentSongs.length + 1 };
  },
});

export const deleteSong = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentSongs = user.songs || [];
    const filteredSongs = currentSongs.filter(id => id !== args.storageId);

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
