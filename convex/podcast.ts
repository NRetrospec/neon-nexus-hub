/**
 * PODCAST FEATURE — episodes feed, per-episode discourse, and the CastForm
 * likeness release flow.
 *
 * LEGAL CRITICALITY: MAXIMUM (release flow)
 *
 * The CastForm enable/disable switch lives in the castFormAvailability table
 * and is enforced SERVER-SIDE in submitCastForm — a tampered client cannot
 * submit while the form is disabled. Signature rows are immutable evidence:
 * only email delivery bookkeeping fields are ever patched.
 */

import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import {
  checkRateLimit,
  userRateLimitId,
  validateComment,
  validateUrl,
  sanitizeString,
  ValidationError,
} from "./security";
import {
  PODCAST_RELEASE_VERSION,
  PODCAST_RELEASE_TEXT,
  DEFAULT_CONFIRMATION_PHRASE,
  sha256Hex,
  computeAcceptanceChecksum,
  buildReleaseEmailHtml,
  buildReleaseEmailSubject,
  validateSignatureImage,
  PODCAST_RELEASE_BCC,
} from "./podcastRelease";

// ==================== QUERIES ====================

/**
 * Get active podcast episodes, newest first
 * SECURITY: Results limited to prevent data exfiltration
 */
export const getEpisodes = query({
  args: {},
  handler: async (ctx) => {
    const episodes = await ctx.db
      .query("podcastEpisodes")
      .withIndex("by_active_and_published", (q) => q.eq("isActive", true))
      .order("desc")
      .take(50);

    return episodes;
  },
});

/**
 * Get comments for an episode (oldest first, chat-like)
 * SECURITY: Results limited to prevent data exfiltration
 */
export const getCommentsByEpisode = query({
  args: { episodeId: v.id("podcastEpisodes") },
  handler: async (ctx, args) => {
    // SECURITY: Limit comments to 200 per episode
    const comments = await ctx.db
      .query("podcastEpisodeComments")
      .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
      .take(200);

    // Enrich comments with user data (same denormalization as social posts)
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
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

    return enrichedComments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Get the current CastForm availability + everything the modal needs.
 * The release text is served from the server-side constant so the client
 * displays exactly the text the server will hash on submission.
 */
export const getCastFormAvailability = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("castFormAvailability")
      .order("desc")
      .first();

    // SECURITY: Default-deny — no config row means CastForm is unavailable
    const isEnabled = config?.isEnabled === true;
    const requireTypedConfirmation = config?.requireTypedConfirmation === true;

    return {
      isEnabled,
      releaseVersion: PODCAST_RELEASE_VERSION,
      releaseText: PODCAST_RELEASE_TEXT,
      requireTypedConfirmation,
      confirmationPhrase: requireTypedConfirmation
        ? config?.confirmationPhrase || DEFAULT_CONFIRMATION_PHRASE
        : null,
      updatedAt: config?.updatedAt ?? null,
    };
  },
});

/**
 * Get the current user's signature for the active release version (if any).
 * PRIVACY: Returns only what the UI needs — never IP address or user agent.
 */
export const getMySignature = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const signature = await ctx.db
      .query("podcastReleaseSignatures")
      .withIndex("by_user_and_version", (q) =>
        q.eq("userId", args.userId).eq("releaseVersion", PODCAST_RELEASE_VERSION)
      )
      .order("desc")
      .first();

    if (!signature) return null;

    return {
      _id: signature._id,
      releaseVersion: signature.releaseVersion,
      acceptedAt: signature.acceptedAt,
      acceptanceChecksum: signature.acceptanceChecksum,
      emailStatus: signature.emailStatus,
    };
  },
});

// ==================== MUTATIONS ====================

/**
 * Add a comment to an episode
 * SECURITY: Rate limited, episode must exist and be active, content sanitized
 */
export const addComment = mutation({
  args: {
    userId: v.id("users"),
    episodeId: v.id("podcastEpisodes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // SECURITY: Rate limit comment creation to prevent spam
    await checkRateLimit(
      ctx,
      userRateLimitId(args.userId),
      "podcastAddComment",
      "create"
    );

    const episode = await ctx.db.get(args.episodeId);
    if (!episode || !episode.isActive) throw new Error("Episode not found");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // SECURITY: Validate and sanitize comment content (max 1000 chars, XSS prevention)
    const content = validateComment(args.content);
    if (content.length === 0) {
      throw new ValidationError("content", "Comment content is required", "REQUIRED");
    }

    const commentId = await ctx.db.insert("podcastEpisodeComments", {
      episodeId: args.episodeId,
      userId: args.userId,
      content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * Log CastForm funnel events (viewed / started) for the audit trail
 */
export const logCastFormEvent = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    eventType: v.union(
      v.literal("podcast_release_viewed"),
      v.literal("podcast_release_started")
    ),
    ipAddress: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    await checkRateLimit(
      ctx,
      userRateLimitId(args.userId),
      "podcastLogCastFormEvent",
      "default"
    );

    // SECURITY: The claimed clerkId must match the user row
    const user = await ctx.db.get(args.userId);
    if (!user || user.clerkId !== args.clerkId) {
      throw new Error("User identity mismatch");
    }

    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType: args.eventType,
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      documentVersion: PODCAST_RELEASE_VERSION,
    });
  },
});

/**
 * Submit the CastForm release
 *
 * LEGAL CRITICALITY: MAXIMUM
 * - Re-checks isEnabled server-side (authoritative; client state is irrelevant)
 * - Verifies the submitting user's identity (userId/clerkId must match)
 * - Computes and stores a cryptographic acceptance checksum
 * - Persists an immutable signature row + audit log entry
 * - Schedules the Resend confirmation email (async, with status tracking)
 */
export const submitCastForm = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    episodeId: v.optional(v.id("podcastEpisodes")),
    ipAddress: v.string(),
    userAgent: v.string(),
    country: v.optional(v.string()),
    consents: v.object({
      likenessConsent: v.boolean(),
      recordingConsent: v.boolean(),
      distributionConsent: v.boolean(),
    }),
    // Full legal name typed by the signer (binding under ESIGN/UETA)
    signatureName: v.string(),
    // Whether the user drew or typed their signature in the UI
    signatureMethod: v.union(v.literal("drawn"), v.literal("typed")),
    // Base64 PNG data URL of the handwritten signature (required when drawn)
    signatureImage: v.optional(v.string()),
    typedConfirmation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Very strict rate limit on this sensitive legal endpoint
    await checkRateLimit(
      ctx,
      userRateLimitId(args.userId),
      "submitCastForm",
      "sensitive"
    );

    // SECURITY: Only the user themselves can submit their signature
    const user = await ctx.db.get(args.userId);
    if (!user || user.clerkId !== args.clerkId) {
      throw new Error("User identity mismatch");
    }

    // AUTHORITATIVE ENABLE CHECK — the client's UI state is never trusted.
    const config = await ctx.db
      .query("castFormAvailability")
      .order("desc")
      .first();

    if (config?.isEnabled !== true) {
      // Audit the blocked attempt (a disabled form receiving a submission
      // implies a tampered or stale client)
      await ctx.db.insert("consentAuditLog", {
        userId: args.userId,
        clerkId: args.clerkId,
        eventType: "podcast_release_blocked",
        timestamp: Date.now(),
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        documentVersion: PODCAST_RELEASE_VERSION,
        eventData: JSON.stringify({ reason: "castform_disabled" }),
      });
      throw new Error("CastForm is currently unavailable");
    }

    // All consents are REQUIRED — partial consent is not a signature
    if (
      !args.consents.likenessConsent ||
      !args.consents.recordingConsent ||
      !args.consents.distributionConsent
    ) {
      throw new ValidationError(
        "consents",
        "All required consents must be accepted",
        "REQUIRED"
      );
    }

    // Validate and sanitize the full legal name (the binding e-signature)
    const signatureName = sanitizeString(args.signatureName, {
      maxLength: 200,
      field: "signatureName",
    });
    if (signatureName.trim().length < 2) {
      throw new ValidationError(
        "signatureName",
        "Full legal name is required (minimum 2 characters)",
        "REQUIRED"
      );
    }

    // A drawn signature must include the actual canvas image — the whole
    // point of "drawn" is that it isn't just typed text.
    const signatureImage =
      args.signatureMethod === "drawn"
        ? validateSignatureImage(args.signatureImage ?? "")
        : undefined;

    // Typed confirmation (configurable via castFormAvailability)
    let typedConfirmation: string | undefined;
    if (config.requireTypedConfirmation) {
      const expected = config.confirmationPhrase || DEFAULT_CONFIRMATION_PHRASE;
      const provided = sanitizeString(args.typedConfirmation ?? "", {
        maxLength: 100,
        field: "typedConfirmation",
      });
      if (provided !== expected) {
        throw new ValidationError(
          "typedConfirmation",
          `Please type "${expected}" exactly to confirm`,
          "CONFIRMATION_MISMATCH"
        );
      }
      typedConfirmation = provided;
    }

    // Validate episode reference if the release is tied to an episode
    if (args.episodeId) {
      const episode = await ctx.db.get(args.episodeId);
      if (!episode) throw new Error("Episode not found");
    }

    // Idempotency: one signature per user per release version
    const existing = await ctx.db
      .query("podcastReleaseSignatures")
      .withIndex("by_user_and_version", (q) =>
        q.eq("userId", args.userId).eq("releaseVersion", PODCAST_RELEASE_VERSION)
      )
      .first();

    if (existing) {
      return {
        signatureId: existing._id,
        releaseVersion: existing.releaseVersion,
        acceptedAt: existing.acceptedAt,
        acceptanceChecksum: existing.acceptanceChecksum,
        alreadySigned: true,
      };
    }

    const acceptedAt = Date.now();
    const consentFields = {
      likenessConsent: args.consents.likenessConsent,
      recordingConsent: args.consents.recordingConsent,
      distributionConsent: args.consents.distributionConsent,
      signatureName,
      signatureMethod: args.signatureMethod,
      signatureImage,
      typedConfirmation,
    };

    // Hash the SERVER's copy of the release text — never client input
    const releaseTextChecksum = sha256Hex(PODCAST_RELEASE_TEXT);
    const acceptanceChecksum = computeAcceptanceChecksum({
      releaseVersion: PODCAST_RELEASE_VERSION,
      releaseTextChecksum,
      userId: args.userId,
      clerkId: args.clerkId,
      acceptedAt,
      signatureName,
      consentFields,
    });

    // Insert signature record (IMMUTABLE legal evidence)
    const signatureId = await ctx.db.insert("podcastReleaseSignatures", {
      userId: args.userId,
      clerkId: args.clerkId,
      episodeId: args.episodeId,
      releaseVersion: PODCAST_RELEASE_VERSION,
      releaseTextChecksum,
      acceptedAt,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      country: args.country,
      consentFields,
      acceptanceChecksum,
      emailStatus: "pending",
      emailAttempts: 0,
      createdAt: acceptedAt,
    });

    // Audit the acceptance (PRIVACY: we log the method and ref, not the raw name)
    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType: "podcast_release_submitted",
      timestamp: acceptedAt,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      documentVersion: PODCAST_RELEASE_VERSION,
      eventData: JSON.stringify({
        signatureId,
        acceptanceChecksum,
        signatureMethod: args.signatureMethod,
        episodeId: args.episodeId ?? null,
      }),
    });

    // Send confirmation email via Resend (async action; result is persisted)
    await ctx.scheduler.runAfter(0, internal.podcast.sendReleaseEmail, {
      signatureId,
    });

    return {
      signatureId,
      releaseVersion: PODCAST_RELEASE_VERSION,
      acceptedAt,
      acceptanceChecksum,
      alreadySigned: false,
    };
  },
});

/**
 * Retry the confirmation email for a failed send.
 * Safe to expose: it only re-sends the user's own confirmation email and
 * never modifies the legal evidence fields of the signature.
 */
export const retryReleaseEmail = mutation({
  args: {
    userId: v.id("users"),
    signatureId: v.id("podcastReleaseSignatures"),
  },
  handler: async (ctx, args) => {
    await checkRateLimit(
      ctx,
      userRateLimitId(args.userId),
      "retryReleaseEmail",
      "sensitive"
    );

    const signature = await ctx.db.get(args.signatureId);
    if (!signature) throw new Error("Signature not found");

    // SECURITY: Only the owner can trigger a re-send
    if (signature.userId !== args.userId) {
      throw new Error("You can only resend your own confirmation email");
    }

    if (signature.emailStatus !== "failed") {
      throw new Error("Email is not in a failed state");
    }

    await ctx.db.patch(args.signatureId, { emailStatus: "pending" });
    await ctx.scheduler.runAfter(0, internal.podcast.sendReleaseEmail, {
      signatureId: args.signatureId,
    });

    return { queued: true };
  },
});

// ==================== ADMIN MUTATIONS ====================
// (Follows the same admin pattern as legal.publishLegalDocument)

/**
 * Enable/disable the CastForm and configure the confirmation requirement.
 * This is THE switch — submitCastForm reads it on every submission.
 */
export const setCastFormAvailability = mutation({
  args: {
    isEnabled: v.boolean(),
    requireTypedConfirmation: v.optional(v.boolean()),
    confirmationPhrase: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("castFormAvailability")
      .order("desc")
      .first();

    const fields = {
      isEnabled: args.isEnabled,
      releaseVersion: PODCAST_RELEASE_VERSION,
      requireTypedConfirmation:
        args.requireTypedConfirmation ??
        existing?.requireTypedConfirmation ??
        false,
      confirmationPhrase:
        args.confirmationPhrase ?? existing?.confirmationPhrase,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("castFormAvailability", fields);
  },
});

/**
 * Create a podcast episode (admin)
 */
export const createEpisode = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const title = sanitizeString(args.title, { maxLength: 200, field: "title" });
    const description = sanitizeString(args.description, {
      maxLength: 5000,
      field: "description",
    });
    if (title.length === 0) {
      throw new ValidationError("title", "Title is required", "REQUIRED");
    }

    const videoUrl = validateUrl(args.videoUrl, { field: "videoUrl" });
    const thumbnailUrl = args.thumbnailUrl
      ? validateUrl(args.thumbnailUrl, { field: "thumbnailUrl" })
      : undefined;

    return await ctx.db.insert("podcastEpisodes", {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      publishedAt: args.publishedAt ?? Date.now(),
      createdAt: Date.now(),
      isActive: args.isActive ?? true,
    });
  },
});

// ==================== RESEND EMAIL PIPELINE (internal) ====================

/**
 * Everything the email action needs, in one transactional read
 * PRIVACY: Only the fields needed to build and address the email
 */
export const getReleaseEmailContext = internalQuery({
  args: { signatureId: v.id("podcastReleaseSignatures") },
  handler: async (ctx, args) => {
    const signature = await ctx.db.get(args.signatureId);
    if (!signature) return null;

    const user = await ctx.db.get(signature.userId);
    if (!user || !user.email) return null;

    return {
      email: user.email,
      username: user.username,
      releaseVersion: signature.releaseVersion,
      acceptedAt: signature.acceptedAt,
      acceptanceChecksum: signature.acceptanceChecksum,
      emailStatus: signature.emailStatus,
      signatureName: signature.consentFields.signatureName,
      signatureMethod: signature.consentFields.signatureMethod,
      signatureImage: signature.consentFields.signatureImage,
    };
  },
});

/**
 * Persist the outcome of an email attempt + audit it.
 * NOTE: Only email bookkeeping fields are patched — the consent evidence
 * (version, checksum, timestamps, consent fields) is never modified.
 */
export const recordEmailResult = internalMutation({
  args: {
    signatureId: v.id("podcastReleaseSignatures"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    resendMessageId: v.optional(v.string()),
    errorSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const signature = await ctx.db.get(args.signatureId);
    if (!signature) return;

    await ctx.db.patch(args.signatureId, {
      emailStatus: args.status,
      resendMessageId: args.resendMessageId,
      emailError: args.errorSummary,
      emailAttempts: signature.emailAttempts + 1,
      lastEmailAttemptAt: Date.now(),
    });

    await ctx.db.insert("consentAuditLog", {
      userId: signature.userId,
      clerkId: signature.clerkId,
      eventType:
        args.status === "sent"
          ? "podcast_release_email_sent"
          : "podcast_release_email_failed",
      timestamp: Date.now(),
      documentVersion: signature.releaseVersion,
      eventData: JSON.stringify({
        signatureId: args.signatureId,
        resendMessageId: args.resendMessageId ?? null,
        // PRIVACY: short error summary only — never full payloads/PII
        error: args.errorSummary ?? null,
      }),
    });
  },
});

/**
 * Send the confirmation email (with a copy of the signed release) via Resend.
 * Requires the RESEND_API_KEY environment variable on the Convex deployment
 * (optionally RESEND_FROM_EMAIL, defaults to Resend's onboarding sender).
 */
export const sendReleaseEmail = internalAction({
  args: { signatureId: v.id("podcastReleaseSignatures") },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.podcast.getReleaseEmailContext, {
      signatureId: args.signatureId,
    });

    if (!context) {
      // Signature or user/email missing — nothing to send
      return;
    }
    if (context.emailStatus === "sent") {
      // Already delivered (duplicate schedule) — never double-send
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.podcast.recordEmailResult, {
        signatureId: args.signatureId,
        status: "failed",
        errorSummary: "RESEND_API_KEY is not configured",
      });
      return;
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "PhreshTeam <onboarding@resend.dev>";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [context.email],
          bcc: [PODCAST_RELEASE_BCC],
          subject: buildReleaseEmailSubject(context.releaseVersion),
          html: buildReleaseEmailHtml({
            username: context.username,
            releaseVersion: context.releaseVersion,
            acceptedAtIso: new Date(context.acceptedAt).toISOString(),
            signatureReference: args.signatureId,
            acceptanceChecksum: context.acceptanceChecksum,
            releaseText: PODCAST_RELEASE_TEXT,
            signatureName: context.signatureName,
            signatureMethod: context.signatureMethod,
            signatureImage: context.signatureImage,
          }),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        await ctx.runMutation(internal.podcast.recordEmailResult, {
          signatureId: args.signatureId,
          status: "failed",
          errorSummary: `Resend ${response.status}: ${
            result?.message ?? "unknown error"
          }`.slice(0, 500),
        });
        return;
      }

      await ctx.runMutation(internal.podcast.recordEmailResult, {
        signatureId: args.signatureId,
        status: "sent",
        resendMessageId: result?.id,
      });
    } catch (error) {
      await ctx.runMutation(internal.podcast.recordEmailResult, {
        signatureId: args.signatureId,
        status: "failed",
        errorSummary: (error instanceof Error ? error.message : "Network error").slice(0, 500),
      });
    }
  },
});
