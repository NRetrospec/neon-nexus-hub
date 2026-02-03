import { mutation } from "./_generated/server";

/**
 * Generate a file upload URL
 * SECURITY: Convex handles file upload security, including:
 * - Signed URLs that expire
 * - Size limits enforced by Convex
 * - File type restrictions configurable in Convex dashboard
 *
 * NOTE: In production, consider adding:
 * - Rate limiting per user
 * - File type validation on upload completion
 * - Virus scanning integration
 */
export const generateUploadUrl = mutation(async (ctx) => {
  // SECURITY: Convex generates a secure, signed, time-limited upload URL
  return await ctx.storage.generateUploadUrl();
});
