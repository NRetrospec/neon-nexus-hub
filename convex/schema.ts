import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    xp: v.number(),
    level: v.number(),
    points: v.number(),
    completedQuests: v.array(v.string()),
    badges: v.array(v.string()),
    phreshTeam: v.optional(v.boolean()),
    createdAt: v.number(),
    // Profile customization fields
    bio: v.optional(v.string()),
    status: v.optional(v.string()),
    socialLinks: v.optional(v.array(v.object({
      platform: v.string(),
      url: v.string(),
      icon: v.optional(v.string()),
    }))),
    songs: v.optional(v.array(v.id("_storage"))),
    theme: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_xp", ["xp"]),

  quests: defineTable({
    title: v.string(),
    description: v.string(),
    thumbnail: v.string(),
    difficulty: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")),
    reward: v.number(),
    xp: v.number(),
    duration: v.string(),
    category: v.string(),
    isActive: v.boolean(),
    requirements: v.optional(v.string()),
    question: v.optional(v.string()),
    acceptedAnswers: v.optional(v.array(v.string())),
    link: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_active", ["isActive"]),

  userQuests: defineTable({
    userId: v.id("users"),
    questId: v.id("quests"),
    progress: v.number(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_quest", ["questId"])
    .index("by_user_and_quest", ["userId", "questId"]),

  leaderboard: defineTable({
    userId: v.id("users"),
    rank: v.number(),
    xp: v.number(),
    weeklyXp: v.number(),
    trend: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_rank", ["rank"])
    .index("by_user", ["userId"])
    .index("by_xp", ["xp"]),

  socialPosts: defineTable({
    userId: v.id("users"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    channel: v.union(v.literal("General"), v.literal("PhreshTeam")),
    likes: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_channel", ["channel", "createdAt"]),

  postLikes: defineTable({
    postId: v.id("socialPosts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  postComments: defineTable({
    postId: v.id("socialPosts"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  achievements: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    badge: v.string(),
    earnedAt: v.number(),
  }).index("by_user", ["userId"]),

  friendRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_status", ["status"]),

  friends: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),

  chatRooms: defineTable({
    name: v.optional(v.string()),
    type: v.union(v.literal("direct"), v.literal("group")),
    participants: v.array(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_last_message", ["lastMessageAt"]),

  chatMessages: defineTable({
    roomId: v.id("chatRooms"),
    senderId: v.id("users"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    createdAt: v.number(),
    readBy: v.array(v.id("users")),
  })
    .index("by_room", ["roomId", "createdAt"])
    .index("by_sender", ["senderId"]),

  prizes: defineTable({
    name: v.string(),
    description: v.string(),
    image: v.string(),
    pointCost: v.number(),
    category: v.string(),
    stock: v.number(),
    isAvailable: v.boolean(),
    featured: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_available", ["isAvailable"])
    .index("by_featured", ["featured"]),

  redemptions: defineTable({
    userId: v.id("users"),
    prizeId: v.id("prizes"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    pointsSpent: v.number(),
    redeemedAt: v.number(),
    deliveryInfo: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_prize", ["prizeId"])
    .index("by_status", ["status"]),

  // ==================== LEGAL CONSENT SYSTEM ====================

  // Legal Documents (Terms of Service, Privacy Policy)
  legalDocuments: defineTable({
    documentType: v.union(v.literal("terms_of_service"), v.literal("privacy_policy")),
    version: v.string(), // e.g., "1.0.0", "2.0.0"
    content: v.string(), // Full document text (markdown supported)
    effectiveDate: v.number(), // When this version takes effect
    materialChange: v.boolean(), // Requires re-acceptance if true
    changesSummary: v.optional(v.string()), // Human-readable summary of changes
    createdAt: v.number(),
    createdBy: v.optional(v.string()), // Admin user who published
    isActive: v.boolean(), // Only one active version per document type
  })
    .index("by_type_and_active", ["documentType", "isActive"])
    .index("by_version", ["version"])
    .index("by_type_and_version", ["documentType", "version"]),

  // User Legal Consents (IMMUTABLE - never update, only insert)
  userLegalConsents: defineTable({
    userId: v.id("users"),
    clerkId: v.string(), // Redundant for audit purposes
    termsVersion: v.string(),
    privacyPolicyVersion: v.string(),
    acceptedAt: v.number(), // UTC timestamp (milliseconds)
    ipAddress: v.string(), // For jurisdiction determination
    userAgent: v.string(), // Device/browser fingerprint
    country: v.optional(v.string()), // ISO country code (if available)
    region: v.optional(v.string()), // State/province (for US: CA, NY, etc.)

    // Age verification metadata
    ageVerified: v.boolean(),
    isMinor: v.boolean(), // Under 18
    requiresParentalConsent: v.boolean(), // Under 13

    // Consent method tracking
    consentMethod: v.union(
      v.literal("clickwrap"),
      v.literal("browsewrap"),
      v.literal("api")
    ),
    scrollDepthPercent: v.optional(v.number()), // How much of terms user scrolled
    timeSpentSeconds: v.optional(v.number()), // Time spent viewing terms

    // Legal flags
    marketingConsent: v.optional(v.boolean()),
    dataProcessingConsent: v.boolean(),
    dataSaleOptOut: v.optional(v.boolean()), // CCPA compliance

    // Audit metadata
    acceptanceChecksum: v.optional(v.string()), // Hash of accepted content
    sessionId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_and_version", ["userId", "termsVersion"])
    .index("by_accepted_at", ["acceptedAt"]),

  // Age Verifications (COPPA Compliance)
  ageVerifications: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    dateOfBirth: v.string(), // Encrypted, format: YYYY-MM-DD
    ageAtVerification: v.number(),
    verifiedAt: v.number(),
    verificationType: v.union(
      v.literal("self_reported"),
      v.literal("parent_verified"),
      v.literal("id_verified"),
      v.literal("credit_card_verified")
    ),

    // Minor-specific fields
    isMinor: v.boolean(),
    requiresParentalConsent: v.boolean(),
    parentalConsentRecorded: v.optional(v.boolean()),
    guardianEmail: v.optional(v.string()),
    guardianConsentDate: v.optional(v.number()),
    guardianIpAddress: v.optional(v.string()),

    // Re-verification tracking
    needsReverification: v.boolean(), // True if minor turns 18
    nextVerificationDate: v.optional(v.number()),

    // Privacy protection
    dataEncrypted: v.boolean(),
    encryptionKeyId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_needs_reverification", ["needsReverification"]),

  // Consent Audit Log (Complete event stream)
  consentAuditLog: defineTable({
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    eventType: v.union(
      v.literal("terms_viewed"),
      v.literal("terms_accepted"),
      v.literal("terms_rejected"),
      v.literal("privacy_viewed"),
      v.literal("age_verified"),
      v.literal("consent_revoked"),
      v.literal("data_deletion_requested"),
      v.literal("opt_out_recorded"),
      v.literal("version_updated"),
      v.literal("re_acceptance_required"),
      v.literal("re_acceptance_completed")
    ),
    eventData: v.optional(v.string()), // JSON-encoded event details
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),

    // Contextual data
    documentVersion: v.optional(v.string()),
    previousVersion: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"]),
});
