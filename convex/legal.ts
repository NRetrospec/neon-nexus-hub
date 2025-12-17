import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== LEGAL DOCUMENT MANAGEMENT ====================

/**
 * Get the currently active legal document by type
 * Used to display current terms to users
 */
export const getActiveDocument = query({
  args: {
    documentType: v.union(
      v.literal("terms_of_service"),
      v.literal("privacy_policy")
    ),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", args.documentType).eq("isActive", true)
      )
      .first();

    return document;
  },
});

/**
 * Get all versions of a document type (for admin/audit purposes)
 */
export const getDocumentHistory = query({
  args: {
    documentType: v.union(
      v.literal("terms_of_service"),
      v.literal("privacy_policy")
    ),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", args.documentType)
      )
      .order("desc")
      .collect();

    return documents;
  },
});

/**
 * Publish a new version of a legal document
 * CRITICAL: This deactivates previous version and requires re-acceptance if materialChange=true
 */
export const publishLegalDocument = mutation({
  args: {
    documentType: v.union(
      v.literal("terms_of_service"),
      v.literal("privacy_policy")
    ),
    version: v.string(),
    content: v.string(),
    materialChange: v.boolean(),
    changesSummary: v.optional(v.string()),
    effectiveDate: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deactivate current active version
    const currentActive = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", args.documentType).eq("isActive", true)
      )
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false });
    }

    // Insert new version
    const documentId = await ctx.db.insert("legalDocuments", {
      documentType: args.documentType,
      version: args.version,
      content: args.content,
      effectiveDate: args.effectiveDate || Date.now(),
      materialChange: args.materialChange,
      changesSummary: args.changesSummary,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      isActive: true,
    });

    // Log the version update
    await ctx.db.insert("consentAuditLog", {
      eventType: "version_updated",
      timestamp: Date.now(),
      documentVersion: args.version,
      previousVersion: currentActive?.version,
      eventData: JSON.stringify({
        documentType: args.documentType,
        materialChange: args.materialChange,
        changesSummary: args.changesSummary,
      }),
    });

    return { documentId, version: args.version };
  },
});

// ==================== CONSENT MANAGEMENT ====================

/**
 * Check if user has valid consent for current terms version
 * This is called by route guards to determine access
 */
export const checkConsentStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get current active versions
    const activeTerms = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "terms_of_service").eq("isActive", true)
      )
      .first();

    const activePrivacy = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "privacy_policy").eq("isActive", true)
      )
      .first();

    if (!activeTerms || !activePrivacy) {
      throw new Error("No active legal documents found");
    }

    // Get user's age verification
    const ageVerification = await ctx.db
      .query("ageVerifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get user's latest consent
    const latestConsent = await ctx.db
      .query("userLegalConsents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    // Determine consent validity
    const needsAgeVerification = !ageVerification;
    const needsTermsAcceptance =
      !latestConsent ||
      latestConsent.termsVersion !== activeTerms.version ||
      latestConsent.privacyPolicyVersion !== activePrivacy.version;

    return {
      ageVerified: !!ageVerification,
      needsAgeVerification,
      termsAccepted: !!latestConsent,
      needsTermsAcceptance,
      needsReacceptance:
        !!latestConsent &&
        (latestConsent.termsVersion !== activeTerms.version ||
          latestConsent.privacyPolicyVersion !== activePrivacy.version),
      currentTermsVersion: activeTerms.version,
      currentPrivacyVersion: activePrivacy.version,
      userTermsVersion: latestConsent?.termsVersion,
      userPrivacyVersion: latestConsent?.privacyPolicyVersion,
      isMinor: ageVerification?.isMinor || false,
      requiresParentalConsent:
        ageVerification?.requiresParentalConsent || false,
    };
  },
});

/**
 * Get user's consent history (for user profile/settings)
 */
export const getUserConsentHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const consents = await ctx.db
      .query("userLegalConsents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return consents;
  },
});

/**
 * Record age verification
 * CRITICAL: COPPA compliance - must be called before any data collection
 */
export const recordAgeVerification = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    dateOfBirth: v.string(), // Format: YYYY-MM-DD
    ipAddress: v.string(),
    userAgent: v.string(),
    guardianEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate age
    const birthDate = new Date(args.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // COPPA Compliance: Block users under 13
    if (age < 13) {
      throw new Error(
        "You must be at least 13 years old to use this service. If you are under 13, please have a parent or guardian contact us."
      );
    }

    const isMinor = age < 18;
    const requiresParentalConsent = age < 13; // This should never be true due to above check

    // Check if verification already exists
    const existingVerification = await ctx.db
      .query("ageVerifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingVerification) {
      throw new Error("Age already verified for this user");
    }

    // Insert age verification record
    const verificationId = await ctx.db.insert("ageVerifications", {
      userId: args.userId,
      clerkId: args.clerkId,
      dateOfBirth: args.dateOfBirth, // In production, encrypt this
      ageAtVerification: age,
      verifiedAt: Date.now(),
      verificationType: "self_reported",
      isMinor,
      requiresParentalConsent,
      parentalConsentRecorded: false,
      guardianEmail: args.guardianEmail,
      needsReverification: false,
      dataEncrypted: false, // TODO: Implement encryption
    });

    // Log the verification
    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType: "age_verified",
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      eventData: JSON.stringify({
        age,
        isMinor,
        verificationType: "self_reported",
      }),
    });

    return {
      verificationId,
      age,
      isMinor,
      requiresParentalConsent,
    };
  },
});

/**
 * Record user's acceptance of terms
 * CRITICAL: This is the core clickwrap consent function
 */
export const recordConsent = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    scrollDepthPercent: v.optional(v.number()),
    timeSpentSeconds: v.optional(v.number()),
    marketingConsent: v.optional(v.boolean()),
    dataSaleOptOut: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify age verification exists
    const ageVerification = await ctx.db
      .query("ageVerifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!ageVerification) {
      throw new Error("Age verification required before accepting terms");
    }

    // Get current active document versions
    const activeTerms = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "terms_of_service").eq("isActive", true)
      )
      .first();

    const activePrivacy = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "privacy_policy").eq("isActive", true)
      )
      .first();

    if (!activeTerms || !activePrivacy) {
      throw new Error("No active legal documents found");
    }

    // Check if user already accepted this version
    const existingConsent = await ctx.db
      .query("userLegalConsents")
      .withIndex("by_user_and_version", (q) =>
        q.eq("userId", args.userId).eq("termsVersion", activeTerms.version)
      )
      .first();

    if (existingConsent) {
      // User already accepted this version, but we allow the action (idempotent)
      return { consentId: existingConsent._id, alreadyAccepted: true };
    }

    // Insert consent record (IMMUTABLE - never updated)
    const consentId = await ctx.db.insert("userLegalConsents", {
      userId: args.userId,
      clerkId: args.clerkId,
      termsVersion: activeTerms.version,
      privacyPolicyVersion: activePrivacy.version,
      acceptedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      country: args.country,
      region: args.region,
      ageVerified: true,
      isMinor: ageVerification.isMinor,
      requiresParentalConsent: ageVerification.requiresParentalConsent,
      consentMethod: "clickwrap",
      scrollDepthPercent: args.scrollDepthPercent,
      timeSpentSeconds: args.timeSpentSeconds,
      marketingConsent: args.marketingConsent,
      dataProcessingConsent: true, // Required for service operation
      dataSaleOptOut: args.dataSaleOptOut,
      acceptanceChecksum: `${activeTerms.version}-${activePrivacy.version}`,
    });

    // Log the acceptance
    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType: "terms_accepted",
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      documentVersion: activeTerms.version,
      eventData: JSON.stringify({
        termsVersion: activeTerms.version,
        privacyVersion: activePrivacy.version,
        scrollDepth: args.scrollDepthPercent,
        timeSpent: args.timeSpentSeconds,
      }),
    });

    return { consentId, alreadyAccepted: false };
  },
});

/**
 * Log when user views terms (for audit trail)
 */
export const logTermsView = mutation({
  args: {
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    documentType: v.union(
      v.literal("terms_of_service"),
      v.literal("privacy_policy")
    ),
    ipAddress: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", args.documentType).eq("isActive", true)
      )
      .first();

    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType:
        args.documentType === "terms_of_service"
          ? "terms_viewed"
          : "privacy_viewed",
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      documentVersion: document?.version,
    });
  },
});

/**
 * Record CCPA opt-out
 */
export const recordDataSaleOptOut = mutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    optOut: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get latest consent record
    const latestConsent = await ctx.db
      .query("userLegalConsents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    if (!latestConsent) {
      throw new Error("No consent record found");
    }

    // NOTE: We don't update the existing consent (immutable)
    // Instead, we log the opt-out event
    await ctx.db.insert("consentAuditLog", {
      userId: args.userId,
      clerkId: args.clerkId,
      eventType: "opt_out_recorded",
      timestamp: Date.now(),
      eventData: JSON.stringify({
        dataSaleOptOut: args.optOut,
        previousOptOut: latestConsent.dataSaleOptOut,
      }),
    });

    // For operational purposes, we need to track current opt-out status
    // This could be stored in the user record or a separate preferences table
    // For now, we return success and the application can query the audit log

    return { success: true, optOut: args.optOut };
  },
});

// ==================== ADMIN / REPORTING FUNCTIONS ====================

/**
 * Get consent statistics (for admin dashboard)
 */
export const getConsentStatistics = query({
  args: {},
  handler: async (ctx) => {
    const allConsents = await ctx.db.query("userLegalConsents").collect();
    const allAgeVerifications = await ctx.db.query("ageVerifications").collect();

    const activeTerms = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "terms_of_service").eq("isActive", true)
      )
      .first();

    const currentVersionConsents = allConsents.filter(
      (c) => c.termsVersion === activeTerms?.version
    );

    const minorConsents = allConsents.filter((c) => c.isMinor);
    const optOuts = allConsents.filter((c) => c.dataSaleOptOut);

    return {
      totalConsents: allConsents.length,
      currentVersionConsents: currentVersionConsents.length,
      ageVerifications: allAgeVerifications.length,
      minorUsers: minorConsents.length,
      optOutUsers: optOuts.length,
      currentTermsVersion: activeTerms?.version,
      consentCoveragePercent:
        allAgeVerifications.length > 0
          ? Math.round(
              (currentVersionConsents.length / allAgeVerifications.length) * 100
            )
          : 0,
    };
  },
});

/**
 * Export consent data for due diligence (admin only)
 * Returns data suitable for legal review / acquisition
 */
export const exportConsentData = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let consentsQuery = ctx.db.query("userLegalConsents");

    if (args.startDate) {
      consentsQuery = consentsQuery.filter((q) =>
        q.gte(q.field("acceptedAt"), args.startDate!)
      );
    }

    if (args.endDate) {
      consentsQuery = consentsQuery.filter((q) =>
        q.lte(q.field("acceptedAt"), args.endDate!)
      );
    }

    const consents = await consentsQuery.collect();

    // Get age verifications
    const ageVerifications = await ctx.db.query("ageVerifications").collect();

    // Get document versions
    const documents = await ctx.db.query("legalDocuments").collect();

    return {
      consents: consents.map((c) => ({
        userId: c.userId,
        termsVersion: c.termsVersion,
        privacyVersion: c.privacyPolicyVersion,
        acceptedAt: new Date(c.acceptedAt).toISOString(),
        country: c.country,
        isMinor: c.isMinor,
        consentMethod: c.consentMethod,
      })),
      ageVerifications: ageVerifications.length,
      documentVersions: documents.map((d) => ({
        type: d.documentType,
        version: d.version,
        effectiveDate: new Date(d.effectiveDate).toISOString(),
        isActive: d.isActive,
      })),
      exportedAt: new Date().toISOString(),
      totalRecords: consents.length,
    };
  },
});

/**
 * Get users who need to re-accept terms (for notification system)
 */
export const getUsersNeedingReacceptance = query({
  args: {},
  handler: async (ctx) => {
    const activeTerms = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "terms_of_service").eq("isActive", true)
      )
      .first();

    if (!activeTerms) {
      return [];
    }

    // Get all consents
    const allConsents = await ctx.db.query("userLegalConsents").collect();

    // Group by user, get latest
    const latestConsentsByUser = new Map<string, typeof allConsents[0]>();
    for (const consent of allConsents) {
      const existing = latestConsentsByUser.get(consent.userId);
      if (!existing || consent.acceptedAt > existing.acceptedAt) {
        latestConsentsByUser.set(consent.userId, consent);
      }
    }

    // Filter for outdated versions
    const usersNeedingReacceptance = Array.from(
      latestConsentsByUser.values()
    ).filter((consent) => consent.termsVersion !== activeTerms.version);

    return usersNeedingReacceptance.map((c) => ({
      userId: c.userId,
      clerkId: c.clerkId,
      currentVersion: c.termsVersion,
      requiredVersion: activeTerms.version,
      lastAcceptedAt: c.acceptedAt,
    }));
  },
});
